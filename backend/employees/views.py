from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Employee
from .serializers import EmployeeSerializer
from audit.utils import log_action

class EmployeeListAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Employee.objects.all().order_by('-is_active', 'full_name')
    serializer_class = EmployeeSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request, 'EMPLOYEE_CREATE', 'Employee', instance.id, detail={'name': instance.full_name})

class EmployeeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request, 'EMPLOYEE_UPDATE', 'Employee', instance.id, detail={'name': instance.full_name})

    # Saat di-delete, jangan dihapus dari database, tapi di-nonaktifkan saja (Soft Delete)
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
        log_action(self.request, 'EMPLOYEE_DEACTIVATE', 'Employee', instance.id, detail={'name': instance.full_name})

from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
import random
import string

User = get_user_model()

class EmployeePasswordResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            employee = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response({'error': 'Karyawan tidak ditemukan'}, status=404)

        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'Tidak memiliki akses'}, status=403)

        # Generate OTP if HR, or use provided password if Superuser
        if request.user.is_superuser:
            new_password = request.data.get('new_password')
            if not new_password:
                return Response({'error': 'Password baru harus diisi'}, status=400)
        else:
            # HR: Generate 6 digit OTP
            new_password = ''.join(random.choices(string.digits, k=6))

        # Check if user exists
        user = employee.user
        if not user:
            # Create user automatically, username = NIK
            if User.objects.filter(username=employee.nik).exists():
                return Response({'error': 'Username/NIK sudah dipakai user lain'}, status=400)
            user = User.objects.create_user(username=employee.nik)
            employee.user = user
            employee.save()

        user.set_password(new_password)
        user.raw_password = new_password
        user.save()

        log_action(request, 'EMPLOYEE_PASSWORD_RESET', 'Employee', employee.id, detail={'name': employee.full_name})

        return Response({
            'message': 'Password berhasil diubah',
            'username': user.username,
            'password': new_password
        })

class EmployeePasswordListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Akses ditolak'}, status=403)
        
        employees = Employee.objects.select_related('user').all()
        data = []
        for emp in employees:
            pwd = emp.user.raw_password if emp.user else None
            uname = emp.user.username if emp.user else None
            data.append({
                'employee_id': emp.id,
                'nik': emp.nik,
                'name': emp.full_name,
                'username': uname,
                'raw_password': pwd
            })
        return Response(data)
