"""
accounts/views.py – Auth Views
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, PasswordResetOTP
from .serializers import LoginSerializer, LogoutSerializer, ResetDeviceSerializer
from employees.models import Employee
from audit.utils import log_action


# ─── Helpers ─────────────────────────────────────────────────────────────────

def build_user_info(user: User, request=None) -> dict:
    """Build response user info dict (reused by Login & CurrentUser)."""
    if user.is_superuser:
        role = 'SUPERUSER'
    elif user.is_staff:
        role = 'HR'
    else:
        role = 'EMPLOYEE'

    try:
        emp = user.employee_profile
        
        # Build photo_url jika ada
        photo_url = None
        if hasattr(emp, 'photo') and emp.photo:
            # Gunakan MEDIA_URL standard
            from django.conf import settings
            if request:
                photo_url = request.build_absolute_uri(emp.photo.url)
            else:
                photo_url = f"{settings.MEDIA_URL}{emp.photo.name}"

        return {
            'role': role,
            'name': emp.full_name,
            'nik': emp.nik,
            'position': getattr(emp, 'role', ''),
            'employee_id': str(emp.id),
            'must_change_password': user.must_change_password,
            'photo_url': photo_url,
            'nickname': getattr(emp, 'nickname', ''),
        }
    except Exception:
        return {
            'role': role,
            'name': user.username,
            'nik': 'UNKNOWN',
            'must_change_password': user.must_change_password,
        }


# ─── Auth Views ───────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Body: { username, password, device_id }
    Returns: { access, refresh, user: { role, name, nik, must_change_password, ... } }

    Jika user login menggunakan OTP (password == 6-digit OTP yang valid),
    backend akan memberikan token TETAPI user.must_change_password = True,
    sehingga frontend wajib redirect ke halaman /reset-password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        device_id = request.data.get('device_id', 'web')

        if not username or not password:
            return Response(
                {'error': 'Username dan password wajib diisi.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Cek apakah ini login dengan OTP ──────────────────────────────────
        otp_login = False
        try:
            target_user = User.objects.get(username=username, is_active=True)
            # Cari OTP yang valid untuk user ini
            valid_otp = PasswordResetOTP.objects.filter(
                user=target_user, otp=password, used=False
            ).first()
            if valid_otp and valid_otp.is_valid():
                otp_login = True
                user = target_user
                # Tandai OTP sudah dipakai
                valid_otp.used = True
                valid_otp.save()
                # Wajibkan ganti password
                user.must_change_password = True
                user.save(update_fields=['must_change_password'])
        except User.DoesNotExist:
            pass

        # ── Login normal dengan password biasa ───────────────────────────────
        if not otp_login:
            serializer = LoginSerializer(
                data=request.data, context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']

        if not user.is_active:
            return Response(
                {'error': 'Akun tidak aktif. Hubungi Admin.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT
        refresh = RefreshToken.for_user(user)
        user_info = build_user_info(user)

        request.user = user
        log_action(
            request, 'LOGIN_OTP' if otp_login else 'LOGIN',
            'User', user.id, detail={'device_id': device_id}
        )

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_info,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """POST /api/v1/auth/logout/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            token.blacklist()
        except Exception:
            pass
        log_action(request, 'LOGOUT', 'User', request.user.id)
        return Response({'message': 'Berhasil logout.'}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """GET /api/v1/auth/me/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_user_info(request.user))


class ResetDeviceView(APIView):
    """DELETE /api/v1/auth/reset-device/<employee_id>/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, employee_id):
        if not request.user.is_superuser:
            return Response(
                {'error': 'Hanya Admin yang dapat mereset device.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            emp = Employee.objects.get(pk=employee_id)
            if emp.user:
                emp.user.device_id = None
                emp.user.save(update_fields=['device_id'])
            log_action(request, 'RESET_DEVICE', 'Employee', emp.id,
                       detail={'employee_name': emp.full_name})
            return Response({'message': f'Device ID untuk {emp.full_name} berhasil direset.'})
        except Employee.DoesNotExist:
            return Response({'error': 'Karyawan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)


# ─── OTP Password Reset Views ─────────────────────────────────────────────────

class GenerateOTPView(APIView):
    """
    POST /api/v1/auth/generate-otp/
    Body: { employee_id }
    HR / Superuser membuat OTP untuk karyawan. OTP valid 30 menit.
    Response: { otp: "847291", employee_name: "...", expires_in: "30 menit" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Hanya HR / Admin yang bisa generate OTP.'},
                status=status.HTTP_403_FORBIDDEN
            )

        employee_id = request.data.get('employee_id')
        if not employee_id:
            return Response(
                {'error': 'employee_id wajib diisi.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            emp = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            return Response({'error': 'Karyawan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        if not emp.user:
            return Response(
                {'error': f'Karyawan {emp.full_name} belum memiliki akun login.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp_obj = PasswordResetOTP.generate_for(emp.user)
        log_action(request, 'GENERATE_OTP', 'Employee', emp.id,
                   detail={'employee_name': emp.full_name})

        return Response({
            'otp': otp_obj.otp,
            'employee_name': emp.full_name,
            'username': emp.user.username,
            'expires_in': '30 menit',
            'message': f'OTP untuk {emp.full_name} berhasil dibuat. Berikan kode ini kepada karyawan.',
        }, status=status.HTTP_201_CREATED)


class SetNewPasswordView(APIView):
    """
    POST /api/v1/auth/set-password/
    Body: { new_password, confirm_password }
    Karyawan yang baru login via OTP (must_change_password=True) mengisi password baru.
    Setelah berhasil, must_change_password di-set False dan raw_password disimpan.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user: User = request.user
        new_password = request.data.get('new_password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()

        if not new_password or not confirm_password:
            return Response(
                {'error': 'Password baru dan konfirmasi wajib diisi.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'error': 'Password baru dan konfirmasi tidak cocok.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {'error': 'Password minimal 6 karakter.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set password (ter-hash oleh Django) + simpan raw_password
        user.set_password(new_password)
        user.raw_password = new_password   # plain text, hanya bisa dilihat Superuser
        user.must_change_password = False
        user.save(update_fields=['password', 'raw_password', 'must_change_password'])

        log_action(request, 'SET_NEW_PASSWORD', 'User', user.id)

        return Response({
            'message': 'Password berhasil diubah! Silakan login kembali dengan password baru Anda.',
        }, status=status.HTTP_200_OK)
