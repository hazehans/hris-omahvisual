"""
leave/views.py — Leave Request Views

Endpoints:
    POST  /api/v1/leave/request/              → Ajukan izin/cuti (validasi H-2)
    GET   /api/v1/leave/my-requests/          → Riwayat pengajuan milik user
    GET   /api/v1/leave/admin/pending/        → Admin only: daftar PENDING
    PATCH /api/v1/leave/admin/review/<id>/   → Admin only: approve atau reject
"""

from datetime import date, datetime

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import LeaveRequest, LeaveStatus
from .serializers import (
    LeaveRequestSubmitSerializer,
    LeaveRequestSerializer,
    LeaveReviewSerializer,
)
from employees.permissions import IsAdminHR


class LeaveRequestSubmitView(APIView):
    """
    POST /api/v1/leave/request/

    Ajukan izin atau cuti. Berlaku aturan H-2.
    Satu karyawan bisa punya banyak pengajuan, tapi tidak boleh overlap tanggal
    dengan pengajuan yang masih PENDING atau APPROVED.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            employee = request.user._employee
        except Exception:
            return Response(
                {'status': 'error', 'code': 'NO_EMPLOYEE_PROFILE',
                 'message': 'Akun tidak memiliki profil karyawan.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = LeaveRequestSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Cek overlap tanggal dengan pengajuan yang masih aktif
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=[LeaveStatus.PENDING, LeaveStatus.APPROVED],
            start_date__lte=data['end_date'],
            end_date__gte=data['start_date'],
        )
        if overlapping.exists():
            return Response(
                {
                    'status': 'error',
                    'code': 'DATE_OVERLAP',
                    'message': 'Tanggal yang dipilih bertabrakan dengan pengajuan yang sudah ada.',
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        leave = LeaveRequest.objects.create(
            employee=employee,
            **data
        )

        return Response(
            {
                'message': 'Pengajuan izin/cuti berhasil dikirim. Menunggu persetujuan Admin.',
                'leave': LeaveRequestSerializer(leave, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED
        )


class MyLeaveRequestsView(APIView):
    """
    GET /api/v1/leave/my-requests/

    Riwayat semua pengajuan milik user yang login.
    Query params: ?status=PENDING|APPROVED|REJECTED|AUTO_REJECTED
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            employee = request.user._employee
        except Exception:
            return Response(
                {'status': 'error', 'code': 'NO_EMPLOYEE_PROFILE',
                 'message': 'Akun tidak memiliki profil karyawan.'},
                status=status.HTTP_403_FORBIDDEN
            )

        requests_qs = LeaveRequest.objects.filter(employee=employee)

        # Filter opsional by status
        status_filter = request.query_params.get('status')
        if status_filter and status_filter in [s.value for s in LeaveStatus]:
            requests_qs = requests_qs.filter(status=status_filter)

        serializer = LeaveRequestSerializer(
            requests_qs, many=True, context={'request': request}
        )
        return Response({
            'total': requests_qs.count(),
            'requests': serializer.data,
        })


class AdminPendingLeavesView(APIView):
    """
    GET /api/v1/leave/admin/pending/

    Admin only: daftar semua pengajuan berstatus PENDING.
    Diurutkan berdasarkan start_date terdekat (yang mendesak duluan).
    """
    permission_classes = [IsAuthenticated, IsAdminHR]

    def get(self, request):
        pending = LeaveRequest.objects.filter(
            status=LeaveStatus.PENDING
        ).select_related('employee').order_by('start_date')

        serializer = LeaveRequestSerializer(pending, many=True, context={'request': request})
        return Response({
            'total_pending': pending.count(),
            'requests': serializer.data,
        })


class AdminLeaveReviewView(APIView):
    """
    PATCH /api/v1/leave/admin/review/<id>/

    Admin only: approve atau reject pengajuan izin/cuti.
    Payload: {"status": "APPROVED" | "REJECTED", "review_note": "..."}
    """
    permission_classes = [IsAuthenticated, IsAdminHR]

    def patch(self, request, leave_id):
        try:
            leave = LeaveRequest.objects.get(id=leave_id)
        except LeaveRequest.DoesNotExist:
            return Response(
                {'status': 'error', 'code': 'NOT_FOUND',
                 'message': 'Pengajuan tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Hanya bisa review yang masih PENDING
        if leave.status != LeaveStatus.PENDING:
            return Response(
                {
                    'status': 'error',
                    'code': 'ALREADY_REVIEWED',
                    'message': f'Pengajuan sudah berstatus {leave.get_status_display()}. '
                               f'Tidak dapat diubah lagi.',
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = LeaveReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            admin_employee = request.user._employee
        except Exception:
            admin_employee = None

        leave.status      = serializer.validated_data['status']
        leave.review_note = serializer.validated_data.get('review_note', '')
        leave.reviewed_by = admin_employee
        leave.reviewed_at = datetime.now()
        leave.save()

        action = 'disetujui' if leave.status == LeaveStatus.APPROVED else 'ditolak'

        return Response({
            'message': f'Pengajuan {leave.employee.full_name} berhasil {action}.',
            'leave': LeaveRequestSerializer(leave, context={'request': request}).data,
        })
