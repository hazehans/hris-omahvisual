"""
roster/views.py — Roster & Jadwal Views

Endpoints:
    GET   /api/v1/roster/admin/calendar/               → Matriks kalender bulanan
    PATCH /api/v1/roster/admin/update-dayoff/<emp_id>/ → Update hari libur karyawan
    POST  /api/v1/roster/admin/holiday-override/       → Buat override hari libur spesifik
"""

import calendar
from datetime import date, timedelta

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import WorkSchedule, HolidayOverride
from .serializers import UpdateDayOffSerializer, HolidayOverrideSerializer
from employees.permissions import IsAdminHR
from attendance.services import check_is_day_off


class AdminCalendarView(APIView):
    """
    GET /api/v1/roster/admin/calendar/?month=9&year=2026

    Admin only: matriks kalender bulanan.
    Untuk setiap karyawan aktif, tampilkan setiap hari di bulan tsb:
        - is_day_off: apakah hari libur karyawan tersebut
        - has_attendance: apakah sudah absen
        - is_override: apakah ada holiday override di tanggal ini
    """
    permission_classes = [IsAuthenticated, IsAdminHR]

    def get(self, request):
        from employees.models import Employee
        from attendance.models import AttendanceLog

        today = date.today()
        month = int(request.query_params.get('month', today.month))
        year  = int(request.query_params.get('year', today.year))

        # Validasi bulan & tahun
        if not (1 <= month <= 12):
            return Response(
                {'status': 'error', 'code': 'INVALID_MONTH', 'message': 'Bulan harus 1–12.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buat daftar semua tanggal dalam bulan ini
        _, last_day = calendar.monthrange(year, month)
        all_dates = [date(year, month, d) for d in range(1, last_day + 1)]

        # Karyawan aktif (kecuali Admin HR)
        employees = Employee.objects.filter(
            is_active=True
        ).exclude(role='ADMIN_HR').order_by('full_name')

        # Ambil semua attendance bulan ini (batch query)
        attendance_map = {}
        logs = AttendanceLog.objects.filter(
            date__month=month, date__year=year,
            employee__in=employees
        ).values('employee_id', 'date')
        for log in logs:
            attendance_map[(log['employee_id'], log['date'])] = True

        # Ambil semua holiday overrides bulan ini (batch query)
        overrides = HolidayOverride.objects.filter(
            new_day_off_date__month=month,
            new_day_off_date__year=year,
            employee__in=employees
        ).values('employee_id', 'new_day_off_date')
        override_map = set()
        for o in overrides:
            override_map.add((o['employee_id'], o['new_day_off_date']))

        result = []
        for emp in employees:
            # Jadwal default terbaru
            schedule = WorkSchedule.objects.filter(
                employee=emp,
                effective_date__lte=date(year, month, last_day)
            ).order_by('-effective_date').first()

            day_off_weekday = schedule.day_off_weekday if schedule else 2  # Default: Rabu
            from .models import DayOfWeek
            day_off_label = DayOfWeek(day_off_weekday).label

            calendar_data = {}
            for d in all_dates:
                is_override = (emp.id, d) in override_map
                is_day_off  = check_is_day_off(emp, d)
                has_attendance = (emp.id, d) in attendance_map

                calendar_data[d.isoformat()] = {
                    'weekday': d.strftime('%A'),
                    'is_day_off': is_day_off,
                    'is_override': is_override,
                    'has_attendance': has_attendance,
                }

            result.append({
                'employee_id': emp.id,
                'employee_name': emp.full_name,
                'role': emp.role,
                'role_display': emp.get_role_display(),
                'department': emp.department,
                'day_off_label': day_off_label,
                'calendar': calendar_data,
            })

        return Response({
            'month': month,
            'year': year,
            'total_employees': len(result),
            'employees': result,
        })


class AdminUpdateDayOffView(APIView):
    """
    PATCH /api/v1/roster/admin/update-dayoff/<employee_id>/

    Admin only: ubah hari libur default karyawan (membuat WorkSchedule baru).
    """
    permission_classes = [IsAuthenticated, IsAdminHR]

    def patch(self, request, employee_id):
        from employees.models import Employee

        try:
            employee = Employee.objects.get(id=employee_id, is_active=True)
        except Employee.DoesNotExist:
            return Response(
                {'status': 'error', 'code': 'NOT_FOUND',
                 'message': 'Karyawan tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UpdateDayOffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        schedule = WorkSchedule.objects.create(
            employee=employee,
            day_off_weekday=data['day_off_weekday'],
            effective_date=data['effective_date'],
            notes=data.get('notes', ''),
        )

        from .models import DayOfWeek
        return Response({
            'message': (
                f"Hari libur {employee.full_name} diubah menjadi "
                f"{DayOfWeek(schedule.day_off_weekday).label} "
                f"mulai {schedule.effective_date}."
            ),
            'schedule': {
                'id': schedule.id,
                'employee_name': employee.full_name,
                'day_off': DayOfWeek(schedule.day_off_weekday).label,
                'effective_date': schedule.effective_date.isoformat(),
            }
        })


class AdminHolidayOverrideView(APIView):
    """
    POST /api/v1/roster/admin/holiday-override/

    Admin only: pindahkan hari libur karyawan untuk tanggal spesifik.
    Contoh: Libur Rabu 17 Sep dipindah ke Kamis 18 Sep minggu ini.
    """
    permission_classes = [IsAuthenticated, IsAdminHR]

    def post(self, request):
        serializer = HolidayOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            admin_employee = request.user._employee
        except Exception:
            admin_employee = None

        override = serializer.save(created_by=admin_employee)

        return Response(
            {
                'message': (
                    f"Hari libur {override.employee.full_name} "
                    f"dipindahkan dari {override.original_date} "
                    f"ke {override.new_day_off_date}."
                ),
                'override': HolidayOverrideSerializer(override).data,
            },
            status=status.HTTP_201_CREATED
        )
