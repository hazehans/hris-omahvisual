"""
daily_report/views.py — Daily Report Views

Endpoints:
    POST /api/v1/daily-report/          → Submit laporan harian
    GET  /api/v1/daily-report/          → Riwayat laporan milik user sendiri
    GET  /api/v1/daily-report/admin/    → Admin only: semua laporan hari ini (log book)
"""

from datetime import date

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import DailyReport
from .serializers import (
    DailyReportSubmitSerializer,
    DailyReportSerializer,
    DailyReportAdminSerializer,
)
from attendance.models import AttendanceLog
from employees.permissions import IsAdminHR


class DailyReportView(APIView):
    """
    POST /api/v1/daily-report/  → Submit laporan harian
    GET  /api/v1/daily-report/  → Riwayat laporan user sendiri

    Rules (PRD §4):
        - Semua role kecuali CREW_GUDANG wajib submit daily report.
        - Satu laporan per karyawan per hari.
        - Jika sudah ada laporan hari ini → update content (tidak duplikat).
        - Otomatis link ke AttendanceLog hari ini jika ada.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Submit atau update laporan harian."""
        try:
            employee = request.user._employee
        except Exception:
            return Response(
                {'status': 'error', 'code': 'NO_EMPLOYEE_PROFILE',
                 'message': 'Akun tidak memiliki profil karyawan.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Crew Gudang tidak perlu daily report (PRD §4.3)
        if employee.role == 'CREW_GUDANG':
            return Response(
                {'status': 'error', 'code': 'NOT_REQUIRED',
                 'message': 'Crew Gudang tidak diwajibkan mengisi daily report.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DailyReportSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        today = date.today()
        content = serializer.validated_data['content']

        # Cari attendance log hari ini untuk di-link (jika ada)
        attendance_log = AttendanceLog.objects.filter(
            employee=employee,
            date=today
        ).first()

        # Cek apakah sudah ada laporan hari ini → update
        report, created = DailyReport.objects.update_or_create(
            employee=employee,
            date=today,
            defaults={
                'content': content,
                'attendance_log': attendance_log,
            }
        )

        response_serializer = DailyReportSerializer(report, context={'request': request})
        return Response(
            {
                'message': 'Laporan harian berhasil disimpan.' if created else 'Laporan harian berhasil diperbarui.',
                'report': response_serializer.data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def get(self, request):
        """Riwayat laporan harian milik user sendiri."""
        try:
            employee = request.user._employee
        except Exception:
            return Response(
                {'status': 'error', 'code': 'NO_EMPLOYEE_PROFILE',
                 'message': 'Akun tidak memiliki profil karyawan.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Filter opsional by month & year
        today = date.today()
        month = request.query_params.get('month')
        year  = request.query_params.get('year')

        reports = DailyReport.objects.filter(employee=employee)

        if month and year:
            reports = reports.filter(date__month=int(month), date__year=int(year))
        elif year:
            reports = reports.filter(date__year=int(year))
        else:
            # Default: tampilkan bulan ini
            reports = reports.filter(date__month=today.month, date__year=today.year)

        reports = reports.order_by('-date')
        serializer = DailyReportSerializer(reports, many=True, context={'request': request})

        return Response({
            'total': reports.count(),
            'reports': serializer.data,
        })


class AdminDailyReportView(APIView):
    """
    GET /api/v1/daily-report/admin/

    Admin only: Log book monitor — semua laporan harian hari ini.
    Query params: ?date=YYYY-MM-DD (opsional, default: hari ini)
    """
    permission_classes = [IsAuthenticated, IsAdminHR]

    def get(self, request):
        from employees.models import Employee

        # Default: hari ini, atau tanggal dari query param
        query_date_str = request.query_params.get('date')
        if query_date_str:
            try:
                from datetime import datetime
                query_date = datetime.strptime(query_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'status': 'error', 'code': 'INVALID_DATE',
                     'message': 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            query_date = date.today()

        reports = DailyReport.objects.filter(
            date=query_date
        ).select_related('employee').order_by('employee__full_name')

        # Karyawan yang wajib report tapi belum submit
        all_required = Employee.objects.filter(
            is_active=True
        ).exclude(role__in=['CREW_GUDANG', 'ADMIN_HR'])

        submitted_ids = set(reports.values_list('employee_id', flat=True))
        not_submitted = all_required.exclude(id__in=submitted_ids).values(
            'id', 'full_name', 'role', 'department'
        )

        serializer = DailyReportAdminSerializer(reports, many=True, context={'request': request})

        return Response({
            'date': query_date.isoformat(),
            'total_submitted': reports.count(),
            'total_not_submitted': not_submitted.count(),
            'not_submitted_employees': list(not_submitted),
            'reports': serializer.data,
        })
