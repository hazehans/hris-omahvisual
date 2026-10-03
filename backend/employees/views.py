"""
employees/views.py — Employee CRUD + Password Management

Permission rules:
  - SUPERADMIN (is_superuser): Hard delete + toggle is_active siapapun
  - HR (is_staff): Hanya bisa soft-deactivate (is_active=False), TIDAK bisa delete & TIDAK bisa reaktivasi
  - Employee: Read-only (hanya profil sendiri)
"""
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
import random, string

from .models import Employee
from .serializers import EmployeeSerializer
from audit.utils import log_action

User = get_user_model()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _delete_from_hikvision(hikvision_id: str) -> bool:
    """
    Hapus karyawan dari mesin Hikvision via ISAPI.
    Returns True jika berhasil / tidak ada ID, False jika gagal.
    """
    if not hikvision_id:
        return True
    try:
        import os
        import requests
        from requests.auth import HTTPDigestAuth

        host = os.environ.get('HIKVISION_HOST', '172.16.12.89')
        user = os.environ.get('HIKVISION_USER', 'admin')
        password = os.environ.get('HIKVISION_PASS', 'OmviJosjis2026')

        url = f'http://{host}/ISAPI/AccessControl/UserInfo/Delete?format=json'
        payload = {
            "UserInfoDelCond": {
                "EmployeeNoList": [{"employeeNo": str(hikvision_id)}]
            }
        }
        resp = requests.put(
            url,
            json=payload,
            auth=HTTPDigestAuth(user, password),
            timeout=10
        )
        return resp.status_code in (200, 201)
    except Exception:
        return False


# ─── Employee List & Create ───────────────────────────────────────────────────

class EmployeeListAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Employee.objects.all().order_by('-is_active', 'full_name')
    serializer_class = EmployeeSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request, 'EMPLOYEE_CREATE', 'Employee', instance.id, detail={'name': instance.full_name})


# ─── Employee Detail: Retrieve / Update / Delete ─────────────────────────────

class EmployeeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request, 'EMPLOYEE_UPDATE', 'Employee', instance.id, detail={'name': instance.full_name})

    def perform_destroy(self, instance):
        """
        DELETE /api/v1/employees/{id}/
        - SUPERADMIN: Hard delete dari DB + hapus dari Hikvision
        - HR: Soft deactivate (is_active = False)
        - Others: 403
        """
        user = self.request.user

        is_hr_role = hasattr(user, 'employee_profile') and user.employee_profile.role and 'hr' in user.employee_profile.role.lower()
        if user.is_superuser:
            # Hard delete: hapus dari Hikvision dulu, lalu hapus dari DB
            hik_deleted = _delete_from_hikvision(instance.hikvision_id)
            name = instance.full_name
            pk = instance.id
            linked_user = instance.user
            instance.delete()  # benar-benar hapus dari database
            if linked_user:
                linked_user.delete() # hapus user-nya juga
            log_action(
                self.request, 'EMPLOYEE_HARD_DELETE', 'Employee', pk,
                detail={'name': name, 'hikvision_deleted': hik_deleted}
            )
        elif user.is_staff or is_hr_role:
            # HR: hanya nonaktifkan
            instance.is_active = False
            instance.save(update_fields=['is_active'])
            log_action(self.request, 'EMPLOYEE_DEACTIVATE', 'Employee', instance.id, detail={'name': instance.full_name})
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Anda tidak memiliki izin untuk melakukan operasi ini.")


# ─── Toggle Aktif / Nonaktif (Superadmin only) ───────────────────────────────

class EmployeeToggleActiveView(APIView):
    """
    PATCH /api/v1/employees/{id}/toggle-active/
    Hanya SUPERADMIN dan HR yang bisa mengaktifkan kembali karyawan.
    Body: { "is_active": true } atau { "is_active": false }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        is_hr_role = hasattr(request.user, 'employee_profile') and request.user.employee_profile.role and 'hr' in request.user.employee_profile.role.lower()
        if not (request.user.is_superuser or request.user.is_staff or is_hr_role):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Hanya Superadmin dan HR yang bisa mengubah status aktif karyawan.')
        try:
            emp = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response({'error': 'Karyawan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('is_active')
        if new_status is None:
            return Response({'error': 'Field is_active wajib diisi.'}, status=status.HTTP_400_BAD_REQUEST)

        emp.is_active = bool(new_status)
        emp.save(update_fields=['is_active'])

        action = 'EMPLOYEE_ACTIVATE' if emp.is_active else 'EMPLOYEE_DEACTIVATE'
        log_action(request, action, 'Employee', emp.id, detail={'name': emp.full_name})

        return Response({
            'message': f'Karyawan {emp.full_name} berhasil {"diaktifkan" if emp.is_active else "dinonaktifkan"}.',
            'is_active': emp.is_active,
        })


# ─── Upload Foto Karyawan ────────────────────────────────────────────────────

class EmployeePhotoUploadView(APIView):
    """
    PATCH /api/v1/employees/{id}/photo/
    HR / Superadmin bisa upload foto karyawan.
    Body: multipart/form-data, field: photo (file)
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, pk):
        is_owner = hasattr(request.user, 'employee_profile') and request.user.employee_profile.id == pk
        if not (request.user.is_staff or request.user.is_superuser or is_owner):
            return Response({'error': 'Anda tidak memiliki akses untuk mengubah foto ini.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            emp = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response({'error': 'Karyawan tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        photo = request.FILES.get('photo')
        if not photo:
            return Response({'error': 'File foto wajib diunggah.'}, status=status.HTTP_400_BAD_REQUEST)

        emp.photo = photo
        emp.save(update_fields=['photo'])

        log_action(request, 'EMPLOYEE_PHOTO_UPLOAD', 'Employee', emp.id, detail={'name': emp.full_name})

        return Response({
            'message': f'Foto {emp.full_name} berhasil diperbarui.',
            'photo_url': request.build_absolute_uri(emp.photo.url) if emp.photo else None,
        })


# ─── Password Management ─────────────────────────────────────────────────────

class EmployeePasswordResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            employee = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response({'error': 'Karyawan tidak ditemukan'}, status=404)

        if not (request.user.is_superuser):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Hanya Superadmin yang dapat mereset sandi')

        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'Password baru harus diisi'}, status=400)

        user = employee.user
        if not user:
            # Re-link existing user if it was left behind (zombie)
            if User.objects.filter(username=employee.nik).exists():
                user = User.objects.get(username=employee.nik)
            else:
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
