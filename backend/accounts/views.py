"""
accounts/views.py — Auth Views

Endpoint:
    POST /api/v1/auth/login/
    POST /api/v1/auth/token/refresh/
    POST /api/v1/auth/logout/
    PATCH /api/v1/auth/reset-device/<employee_id>/
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import LoginSerializer, LogoutSerializer


class LoginView(APIView):
    """
    POST /api/v1/auth/login/

    Autentikasi karyawan dengan username, password, dan device_id.
    - Jika device_id belum terdaftar → ikat ke akun user.
    - Jika device_id berbeda → tolak dengan HTTP 403.
    - Return: access token, refresh token, dan data profil ringkas.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        device_id = serializer.validated_data['device_id']

        # Bind device_id jika belum ada
        if not user.device_id:
            user.device_id = device_id
            user.save(update_fields=['device_id'])

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Ambil data employee untuk response
        employee_data = None
        try:
            emp = user._employee
            employee_data = {
                'id': emp.id,
                'full_name': emp.full_name,
                'role': emp.role,
                'department': emp.department,
                'photo': emp.photo.url if emp.photo else None,
            }
        except Exception:
            pass

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'employee': employee_data,
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/

    Blacklist refresh token agar tidak dapat dipakai lagi.
    Payload: {"refresh": "<refresh_token>"}
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            token.blacklist()
        except TokenError:
            return Response(
                {
                    'status': 'error',
                    'code': 'TOKEN_INVALID',
                    'message': 'Token tidak valid atau sudah kadaluarsa.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'message': 'Logout berhasil.'},
            status=status.HTTP_200_OK
        )


class ResetDeviceView(APIView):
    """
    PATCH /api/v1/auth/reset-device/<employee_id>/

    Admin only: reset device_id karyawan ke null.
    Setelah di-reset, karyawan dapat login dari device baru (device_id akan otomatis terikat kembali).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, employee_id):
        # Cek apakah user adalah Admin HR
        if not request.user.is_admin_hr():
            return Response(
                {
                    'status': 'error',
                    'code': 'PERMISSION_DENIED',
                    'message': 'Hanya Admin HR yang dapat me-reset Device ID.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Import di sini untuk menghindari circular import
        from employees.models import Employee

        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {
                    'status': 'error',
                    'code': 'NOT_FOUND',
                    'message': f'Karyawan dengan ID {employee_id} tidak ditemukan.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Reset device_id di model User
        employee.user.device_id = None
        employee.user.save(update_fields=['device_id'])

        return Response(
            {
                'message': f'Device ID karyawan {employee.full_name} berhasil di-reset.'
            },
            status=status.HTTP_200_OK
        )
