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
from audit.utils import log_action


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

        # Bind device jika belum terikat - DISABLED AS PER USER REQUEST
        # if not user.device_id:
        #     user.device_id = device_id
        #     user.save(update_fields=['device_id'])

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        # Build user info
        
        # Determine logical role
        if user.is_superuser:
            role = 'SUPERUSER'
        elif user.is_staff:
            role = 'HR'
        else:
            role = 'EMPLOYEE'

        try:
            emp = user.employee_profile
            user_info = {
                'role': role,
                'name': emp.full_name,
                'nik': emp.nik,
                'position': getattr(emp, 'role', ''),
                'employee_id': str(emp.id),
            }
        except Exception:
            # Fallback if no employee profile exists
            user_info = {
                'role': role,
                'name': user.username,
                'nik': 'UNKNOWN',
            }
                
        # Manually attach user to request since LoginView is AllowAny and auth happens via serializer
        request.user = user
        log_action(request, 'LOGIN', 'User', user.id, detail={'device_id': device_id})

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
            
        log_action(request, 'LOGOUT', 'User', request.user.id)
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
            role = 'SUPERUSER'
        elif user.is_staff:
            role = 'HR'
        else:
            role = 'EMPLOYEE'

        try:
            emp = user.employee_profile
            return Response({
                'role': role,
                'name': emp.full_name,
                'nik': emp.nik,
                'position': getattr(emp, 'role', ''),
                'employee_id': str(emp.id),
            })
        except Exception:
            return Response({
                'role': role,
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
            log_action(request, 'RESET_DEVICE', 'Employee', emp.id, detail={'employee_name': emp.full_name})
            return Response({'message': f'Device ID untuk {emp.full_name} berhasil direset.'})
        except Employee.DoesNotExist:
            return Response({'message': 'Karyawan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
