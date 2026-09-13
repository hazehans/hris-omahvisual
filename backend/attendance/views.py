"""
attendance/views.py — Attendance Views

Endpoints:
    POST /api/v1/attendance/clock-in/        → Submit absensi masuk
    POST /api/v1/attendance/clock-out/       → Submit jam pulang
    GET  /api/v1/attendance/today/           → Status absensi hari ini (user sendiri)
    GET  /api/v1/attendance/history/         → Riwayat absensi (query: ?month=&year=)
    GET  /api/v1/attendance/admin/summary/   → Admin only: ringkasan hari ini
"""

from datetime import date, time as time_type, datetime

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import AttendanceLog, AttendanceMode
from .serializers import (
    ClockInSerializer,
    ClockOutSerializer,
    AttendanceLogSerializer,
    AttendanceTodaySerializer,
    AdminAttendanceSummarySerializer,
)
from .services import (
    validate_geofence,
    check_is_late,
    calculate_overtime,
    check_is_day_off,
    get_attendance_rules,
    WORK_START,
)
from employees.permissions import IsAdminHR


class ClockInView(APIView):
    """
    POST /api/v1/attendance/clock-in/

    Proses clock-in karyawan. Logika per role:
    - CV/LED REGULAR:        geofence wajib, foto opsional
    - CV/LED LED_INSTALL:    rekam koordinat saja, foto WAJIB
    - RENTAL:                geofence wajib, foto WAJIB
    - CREW_GUDANG:           foto WAJIB, no geofence

    Returns HTTP 400 jika:
        - Sudah clock-in hari ini
        - Di luar geofence radius (untuk role yang wajib)
        - Foto tidak ada (untuk role yang wajib)
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        # Pastikan user punya employee profile
        try:
            employee = request.user._employee
        except Exception:
            return Response(
                {'status': 'error', 'code': 'NO_EMPLOYEE_PROFILE',
                 'message': 'Akun tidak memiliki profil karyawan. Hubungi Admin.'},
                status=status.HTTP_403_FORBIDDEN
            )

        today = date.today()

        # Cek apakah sudah clock-in hari ini
        if AttendanceLog.objects.filter(employee=employee, date=today).exists():
            return Response(
                {'status': 'error', 'code': 'ALREADY_CLOCKED_IN',
                 'message': 'Anda sudah melakukan absen masuk hari ini.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ClockInSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        mode = data.get('mode', AttendanceMode.REGULAR)
        lat  = data.get('latitude')
        lon  = data.get('longitude')

        # Validasi & proses geofence
        geofence_valid  = False
        geofence_result = {}

        rules = get_attendance_rules(employee, mode)

        if rules['requires_geofence'] and lat is not None and lon is not None:
            geofence_result = validate_geofence(lat, lon, employee)
            geofence_valid  = geofence_result['valid']

            if not geofence_valid:
                return Response(
                    {
                        'status': 'error',
                        'code': 'GEOFENCE_INVALID',
                        'message': geofence_result['message'],
                        'data': {
                            'distance_meter': geofence_result['distance_meter'],
                            'nearest_location': geofence_result['nearest_location'],
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif not rules['requires_geofence']:
            # LED_INSTALLATION atau CREW_GUDANG: rekam koordinat tapi skip validasi
            geofence_valid = True

        # Cek apakah hari ini hari libur karyawan
        is_day_off = check_is_day_off(employee, today)

        # Waktu clock-in sekarang (timezone-aware → convert ke lokal)
        now_local   = datetime.now().time().replace(microsecond=0)
        is_late_flag = check_is_late(now_local)

        # Buat AttendanceLog
        log = AttendanceLog.objects.create(
            employee=employee,
            date=today,
            clock_in=now_local,
            mode=mode,
            latitude=lat,
            longitude=lon,
            geofence_valid=geofence_valid,
            photo=data.get('photo'),
            is_late=is_late_flag,
            is_day_off_attendance=is_day_off,
            notes=data.get('notes', ''),
        )

        return Response(
            {
                'message': 'Absen masuk berhasil.',
                'geofence': geofence_result if geofence_result else None,
                'log': AttendanceTodaySerializer(log, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED
        )


class ClockOutView(APIView):
    """
    POST /api/v1/attendance/clock-out/

    Proses clock-out karyawan. Menghitung overtime secara otomatis.

    Returns HTTP 400 jika:
        - Belum clock-in hari ini
        - Sudah clock-out hari ini
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        try:
            employee = request.user._employee
        except Exception:
            return Response(
                {'status': 'error', 'code': 'NO_EMPLOYEE_PROFILE',
                 'message': 'Akun tidak memiliki profil karyawan.'},
                status=status.HTTP_403_FORBIDDEN
            )

        today = date.today()

        # Cari log hari ini
        try:
            log = AttendanceLog.objects.get(employee=employee, date=today)
        except AttendanceLog.DoesNotExist:
            return Response(
                {'status': 'error', 'code': 'NOT_CLOCKED_IN',
                 'message': 'Anda belum melakukan absen masuk hari ini.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cek sudah clock-out
        if log.clock_out is not None:
            return Response(
                {'status': 'error', 'code': 'ALREADY_CLOCKED_OUT',
                 'message': 'Anda sudah melakukan absen pulang hari ini.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ClockOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        now_local = datetime.now().time().replace(microsecond=0)

        # Hitung overtime
        overtime_data = calculate_overtime(now_local, employee, today)

        # Jika hari libur → hitung overtime dari seluruh durasi kerja
        overtime_minutes = overtime_data['overtime_minutes']
        if overtime_data.get('is_day_off_attendance') and log.clock_in:
            dt_in  = datetime.combine(today, log.clock_in)
            dt_out = datetime.combine(today, now_local)
            overtime_minutes = int((dt_out - dt_in).total_seconds() / 60)

        # Update log
        log.clock_out         = now_local
        log.is_overtime       = overtime_data['is_overtime']
        log.overtime_minutes  = overtime_minutes
        log.is_day_off_attendance = overtime_data.get('is_day_off_attendance', log.is_day_off_attendance)

        notes = serializer.validated_data.get('notes', '')
        if notes:
            log.notes = (log.notes + '\n' + notes).strip()

        log.save()

        return Response(
            {
                'message': 'Absen pulang berhasil.',
                'log': AttendanceTodaySerializer(log, context={'request': request}).data,
            },
            status=status.HTTP_200_OK
        )


class TodayAttendanceView(APIView):
    """
    GET /api/v1/attendance/today/

    Status absensi hari ini milik user yang login.
    Jika belum clock-in, return data null dengan keterangan.
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

        today = date.today()
        try:
            log = AttendanceLog.objects.get(employee=employee, date=today)
            serializer = AttendanceTodaySerializer(log, context={'request': request})
            return Response(serializer.data)
        except AttendanceLog.DoesNotExist:
            return Response({
                'date': today.isoformat(),
                'has_clocked_in': False,
                'has_clocked_out': False,
                'message': 'Belum absen hari ini.',
            })


class AttendanceHistoryView(APIView):
    """
    GET /api/v1/attendance/history/?month=9&year=2026

    Riwayat absensi karyawan yang login. Filter by bulan dan tahun.
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

        today = date.today()
        month = int(request.query_params.get('month', today.month))
        year  = int(request.query_params.get('year', today.year))

        logs = AttendanceLog.objects.filter(
            employee=employee,
            date__month=month,
            date__year=year,
        ).order_by('date')

        serializer = AttendanceLogSerializer(logs, many=True, context={'request': request})

        # Hitung statistik ringkas bulan ini
        total = logs.count()
        late_count     = logs.filter(is_late=True).count()
        overtime_count = logs.filter(is_overtime=True).count()
        led_count      = logs.filter(mode=AttendanceMode.LED_INSTALLATION).count()

        return Response({
            'month': month,
            'year': year,
            'summary': {
                'total_days': total,
                'late_days': late_count,
                'overtime_days': overtime_count,
                'led_installation_days': led_count,
            },
            'logs': serializer.data,
        })


class AdminAttendanceSummaryView(APIView):
    """
    GET /api/v1/attendance/admin/summary/

    Admin only: ringkasan kehadiran semua karyawan hari ini.
    Termasuk jumlah: hadir, terlambat, LED proyek luar, belum absen.
    """
    permission_classes = [IsAuthenticated, IsAdminHR]

    def get(self, request):
        from employees.models import Employee

        today = date.today()

        # Semua karyawan aktif (kecuali Admin HR sendiri)
        all_employees = Employee.objects.filter(is_active=True).exclude(role='ADMIN_HR')
        total_active = all_employees.count()

        # Log hari ini
        today_logs = AttendanceLog.objects.filter(
            date=today,
            employee__is_active=True
        ).select_related('employee')

        present_ids = set(today_logs.values_list('employee_id', flat=True))
        absent_ids  = set(all_employees.values_list('id', flat=True)) - present_ids

        # Karyawan yang belum absen
        absent_employees = all_employees.filter(id__in=absent_ids).values(
            'id', 'full_name', 'role', 'department'
        )

        serializer = AdminAttendanceSummarySerializer(
            today_logs, many=True, context={'request': request}
        )

        return Response({
            'date': today.isoformat(),
            'total_active_employees': total_active,
            'present': today_logs.count(),
            'absent': len(absent_ids),
            'late': today_logs.filter(is_late=True).count(),
            'overtime': today_logs.filter(is_overtime=True).count(),
            'led_installation': today_logs.filter(mode=AttendanceMode.LED_INSTALLATION).count(),
            'still_working': today_logs.filter(clock_out__isnull=True).count(),
            'absent_employees': list(absent_employees),
            'attendance_logs': serializer.data,
        })
