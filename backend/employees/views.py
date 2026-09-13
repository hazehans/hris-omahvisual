"""
employees/views.py — Employee CRUD Views (Admin Only)

Endpoints:
    GET    /api/v1/employees/           → Daftar semua karyawan aktif
    POST   /api/v1/employees/           → Tambah karyawan baru
    GET    /api/v1/employees/<id>/      → Detail karyawan
    PUT    /api/v1/employees/<id>/      → Update data karyawan
    DELETE /api/v1/employees/<id>/      → Soft-delete (is_active=False)
    GET    /api/v1/employees/locations/ → Daftar lokasi perusahaan
    POST   /api/v1/employees/locations/ → Tambah lokasi
    PUT    /api/v1/employees/locations/<id>/ → Update lokasi
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Employee, CompanyLocation
from .permissions import IsAdminHR
from .serializers import (
    EmployeeListSerializer,
    EmployeeDetailSerializer,
    EmployeeCreateSerializer,
    CompanyLocationSerializer,
)


class EmployeeListCreateView(APIView):
    """GET & POST /api/v1/employees/"""
    permission_classes = [IsAuthenticated, IsAdminHR]

    def get(self, request):
        """Daftar semua karyawan aktif."""
        employees = Employee.objects.filter(is_active=True).select_related('user')
        serializer = EmployeeListSerializer(employees, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Tambah karyawan baru beserta akun user."""
        serializer = EmployeeCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        return Response(
            EmployeeDetailSerializer(employee, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class EmployeeDetailView(APIView):
    """GET, PUT, DELETE /api/v1/employees/<id>/"""
    permission_classes = [IsAuthenticated, IsAdminHR]

    def _get_employee(self, employee_id):
        try:
            return Employee.objects.select_related('user').get(id=employee_id)
        except Employee.DoesNotExist:
            return None

    def get(self, request, employee_id):
        employee = self._get_employee(employee_id)
        if not employee:
            return Response(
                {'status': 'error', 'code': 'NOT_FOUND', 'message': 'Karyawan tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = EmployeeDetailSerializer(employee, context={'request': request})
        return Response(serializer.data)

    def put(self, request, employee_id):
        employee = self._get_employee(employee_id)
        if not employee:
            return Response(
                {'status': 'error', 'code': 'NOT_FOUND', 'message': 'Karyawan tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = EmployeeDetailSerializer(
            employee, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, employee_id):
        """Soft-delete: set is_active=False."""
        employee = self._get_employee(employee_id)
        if not employee:
            return Response(
                {'status': 'error', 'code': 'NOT_FOUND', 'message': 'Karyawan tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )
        employee.is_active = False
        employee.save(update_fields=['is_active'])
        # Nonaktifkan juga akun user-nya
        employee.user.is_active = False
        employee.user.save(update_fields=['is_active'])
        return Response({'message': f'Karyawan {employee.full_name} berhasil dinonaktifkan.'})


class CompanyLocationListCreateView(APIView):
    """GET & POST /api/v1/employees/locations/"""
    permission_classes = [IsAuthenticated, IsAdminHR]

    def get(self, request):
        locations = CompanyLocation.objects.filter(is_active=True)
        serializer = CompanyLocationSerializer(locations, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CompanyLocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CompanyLocationDetailView(APIView):
    """PUT /api/v1/employees/locations/<id>/"""
    permission_classes = [IsAuthenticated, IsAdminHR]

    def put(self, request, location_id):
        try:
            location = CompanyLocation.objects.get(id=location_id)
        except CompanyLocation.DoesNotExist:
            return Response(
                {'status': 'error', 'code': 'NOT_FOUND', 'message': 'Lokasi tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CompanyLocationSerializer(location, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
