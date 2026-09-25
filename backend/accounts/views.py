"""
accounts/views.py — Auth Views
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, LogoutSerializer, ResetDeviceSerializer
from employees.models import Employee


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Body: { username, password, device_id }
    Returns: { access, refresh, user: { role, name, nik, ... } }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        device_id = serializer.validated_data['device_id']

        # Bind device jika belum terikat
        if not user.device_id:
            user.device_id = device_id
            user.save(update_fields=['device_id'])

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        # Build user info
        if user.is_superuser:
            user_info = {
                'role': 'admin',
                'name': 'HR Administrator',
                'nik': 'ADMIN',
            }
        else:
            try:
                emp = user.employee_profile
                user_info = {
                    'role': 'employee',
                    'name': emp.full_name,
                    'nik': emp.nik,
                    'position': emp.role,
                    'employee_id': str(emp.id),
                }
            except Exception:
                user_info = {
                    'role': 'unknown',
                    'name': user.username,
                    'nik': 'UNKNOWN',
                }

        return Response({
            'access': access,
            'refresh': str(refresh),
            'user': user_info,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Body: { refresh }
    Blacklists the refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            token.blacklist()
        except Exception:
            pass  # Already blacklisted or invalid — treat as success
        return Response({'message': 'Berhasil logout.'}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """
    GET /api/v1/auth/me/
    Returns current user info based on JWT.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_superuser:
            return Response({
                'role': 'admin',
                'name': 'HR Administrator',
                'nik': 'ADMIN',
            })

        try:
            emp = user.employee_profile
            return Response({
                'role': 'employee',
                'name': emp.full_name,
                'nik': emp.nik,
                'position': emp.role,
                'employee_id': str(emp.id),
            })
        except Exception:
            return Response({
                'role': 'unknown',
                'name': user.username,
                'nik': 'UNKNOWN',
            })


class ResetDeviceView(APIView):
    """
    DELETE /api/v1/auth/reset-device/<employee_id>/
    Admin only. Resets the device_id binding for the given employee's user account.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, employee_id):
        if not request.user.is_superuser:
            return Response(
                {'message': 'Hanya Admin yang dapat mereset device.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            emp = Employee.objects.get(pk=employee_id)
            if emp.user:
                emp.user.device_id = None
                emp.user.save(update_fields=['device_id'])
            return Response({'message': f'Device ID untuk {emp.full_name} berhasil direset.'})
        except Employee.DoesNotExist:
            return Response({'message': 'Karyawan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
