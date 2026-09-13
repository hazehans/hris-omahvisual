"""
dashboard/views.py — HR Dashboard Aggregat View

Endpoint:
    GET /api/v1/dashboard/  → Admin only: aggregasi semua data untuk HR dashboard

Menggabungkan data dari semua app untuk satu response komprehensif:
  - Statistik karyawan aktif
  - Live attendance hari ini (hadir, terlambat, proyek luar, belum absen)
  - Notifikasi HR yang belum dibaca (kontrak hampir habis & ulang tahun)
  - Log book monitor (daily report hari ini)
  - Action center (pengajuan cuti PENDING)
"""

from datetime import date

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from employees.permissions import IsAdminHR
from employees.models import Employee
from attendance.models import AttendanceLog, AttendanceMode
from daily_report.models import DailyReport
from leave.models import LeaveRequest, LeaveStatus
from contracts.models import HRNotification, Contract


class HRDashboardView(APIView):
    """
    GET /api/v1/dashboard/

    Admin only: agregasi data untuk HR Dashboard.
    Satu endpoint, satu request → semua data yang dibutuhkan dashboard HR.

    Sections:
        1. overview       — Statistik total karyawan per role
        2. live_attendance — Status kehadiran hari ini
        3. notifications  — Notifikasi HR belum dibaca (kontrak & ulang tahun)
        4. logbook        — Daily report hari ini (ringkas)
        5. action_center  — Pengajuan cuti/izin yang perlu direspons
        6. contract_alerts — Kontrak yang akan habis dalam 30 hari
    """
    permission_classes = [IsAuthenticated, IsAdminHR]

    def get(self, request):
        today = date.today()

        # ─────────────────────────────────────────
        # 1. OVERVIEW: Statistik Karyawan
        # ─────────────────────────────────────────
        all_active = Employee.objects.filter(is_active=True).exclude(role='ADMIN_HR')
        total_active = all_active.count()

        # Breakdown per role group
        role_breakdown = {}
        for emp in all_active.values('role'):
            role = emp['role']
            role_breakdown[role] = role_breakdown.get(role, 0) + 1

        # ─────────────────────────────────────────
        # 2. LIVE ATTENDANCE: Hari Ini
        # ─────────────────────────────────────────
        today_logs = AttendanceLog.objects.filter(
            date=today,
            employee__is_active=True
        ).exclude(employee__role='ADMIN_HR')

        present_ids = set(today_logs.values_list('employee_id', flat=True))
        absent_count = total_active - len(present_ids)

        live_attendance = {
            'total_employees': total_active,
            'present': today_logs.count(),
            'absent': absent_count,
            'late': today_logs.filter(is_late=True).count(),
            'on_time': today_logs.filter(is_late=False).count(),
            'led_installation': today_logs.filter(mode=AttendanceMode.LED_INSTALLATION).count(),
            'still_working': today_logs.filter(clock_out__isnull=True).count(),
            'already_clockout': today_logs.filter(clock_out__isnull=False).count(),
        }

        # Daftar karyawan yang belum absen (ringkas)
        absent_employees = list(
            all_active.exclude(id__in=present_ids).values(
                'id', 'full_name', 'role', 'department'
            )[:10]  # Limit 10 untuk performa
        )
        live_attendance['absent_employees_sample'] = absent_employees

        # ─────────────────────────────────────────
        # 3. NOTIFICATIONS: Belum Dibaca
        # ─────────────────────────────────────────
        unread_notifs = HRNotification.objects.filter(
            is_read=False
        ).select_related('employee').order_by('-created_at')[:20]

        notifications = [
            {
                'id': n.id,
                'type': n.notification_type,
                'type_display': n.get_notification_type_display(),
                'employee_name': n.employee.full_name,
                'message': n.message,
                'created_at': n.created_at.isoformat(),
            }
            for n in unread_notifs
        ]

        # ─────────────────────────────────────────
        # 4. LOGBOOK: Daily Report Hari Ini
        # ─────────────────────────────────────────
        today_reports = DailyReport.objects.filter(
            date=today
        ).select_related('employee').order_by('employee__full_name')

        logbook = [
            {
                'employee_id': r.employee.id,
                'employee_name': r.employee.full_name,
                'role': r.employee.role,
                'department': r.employee.department,
                'submitted_at': r.submitted_at.isoformat(),
                'content_preview': r.content[:100] + '...' if len(r.content) > 100 else r.content,
            }
            for r in today_reports
        ]

        # Karyawan wajib report yang belum submit
        required_reporter_ids = set(
            all_active.exclude(role__in=['CREW_GUDANG']).values_list('id', flat=True)
        )
        submitted_ids = set(today_reports.values_list('employee_id', flat=True))
        not_reported_count = len(required_reporter_ids - submitted_ids)

        # ─────────────────────────────────────────
        # 5. ACTION CENTER: Cuti PENDING
        # ─────────────────────────────────────────
        pending_leaves = LeaveRequest.objects.filter(
            status=LeaveStatus.PENDING
        ).select_related('employee').order_by('start_date')

        action_center = [
            {
                'id': lr.id,
                'employee_name': lr.employee.full_name,
                'leave_type': lr.get_leave_type_display(),
                'start_date': lr.start_date.isoformat(),
                'end_date': lr.end_date.isoformat(),
                'duration_days': lr.duration_days,
                'reason': lr.reason,
                'submitted_at': lr.created_at.isoformat(),
            }
            for lr in pending_leaves
        ]

        # ─────────────────────────────────────────
        # 6. CONTRACT ALERTS: Kontrak Hampir Habis
        # ─────────────────────────────────────────
        from datetime import timedelta
        deadline = today + timedelta(days=30)

        expiring = Contract.objects.filter(
            end_date__gte=today,
            end_date__lte=deadline,
            employee__is_active=True,
        ).select_related('employee').order_by('end_date')

        contract_alerts = [
            {
                'employee_id': c.employee.id,
                'employee_name': c.employee.full_name,
                'contract_type': c.get_contract_type_display(),
                'end_date': c.end_date.isoformat(),
                'days_remaining': c.days_remaining,
            }
            for c in expiring
        ]

        # ─────────────────────────────────────────
        # COMPILE RESPONSE
        # ─────────────────────────────────────────
        return Response({
            'date': today.isoformat(),
            'overview': {
                'total_active_employees': total_active,
                'role_breakdown': role_breakdown,
            },
            'live_attendance': live_attendance,
            'notifications': {
                'unread_count': unread_notifs.count(),
                'items': notifications,
            },
            'logbook': {
                'total_submitted': len(logbook),
                'not_reported_count': not_reported_count,
                'reports': logbook,
            },
            'action_center': {
                'pending_leaves_count': len(action_center),
                'pending_leaves': action_center,
            },
            'contract_alerts': {
                'expiring_count': len(contract_alerts),
                'contracts': contract_alerts,
            },
        })
