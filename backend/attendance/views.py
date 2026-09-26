from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime
from .models import AttendanceLog, HikvisionRawEvent
from employees.models import Employee
from .kpi_calculator import calculate_daily_kpi


class HikvisionWebhookView(APIView):
    """Endpoint lama — saat ini tidak dipakai karena kita pakai Pull (fetch), bukan Push."""
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        return Response({"message": "Webhook tidak aktif. Gunakan endpoint /fetch/ untuk pull data dari mesin."}, status=status.HTTP_200_OK)


class TodayAttendanceAPIView(APIView):
    """
    GET /api/v1/attendance/today/
    Menampilkan data absensi HARI INI dari database (bukan langsung dari mesin).
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Format tanggal tidak valid. Gunakan YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = timezone.now().date()

        logs = AttendanceLog.objects.filter(date=target_date).select_related('employee').order_by('clock_in')

        data = []
        for log in logs:
            data.append({
                'name': log.employee.full_name,
                'nik': log.employee.nik,
                'role': log.employee.role,
                'clock_in': log.clock_in.astimezone(timezone.get_current_timezone()).strftime('%H:%M:%S') if log.clock_in else '-',
                'clock_out': log.clock_out.astimezone(timezone.get_current_timezone()).strftime('%H:%M:%S') if log.clock_out else '-',
                'is_late': log.is_late,
                'kpi_score': log.kpi_score if log.kpi_score is not None else '-',
                'source': log.get_source_display(),
            })

        return Response(data, status=status.HTTP_200_OK)


class FetchHikvisionView(APIView):
    """
    POST /api/v1/attendance/fetch/
    Trigger fetch data dari mesin Hikvision secara manual dari frontend.

    Body (opsional):
    {
        "date": "2026-09-26"   // default: hari ini jika tidak dikirim
    }

    Response:
    {
        "date": "2026-09-26",
        "total_fetched": 144,
        "saved_raw": 20,
        "processed_attendance": 8,
        "errors": []
    }
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        from .hikvision_fetcher import fetch_events_from_device

        date_str = request.data.get('date')
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Format tanggal tidak valid. Gunakan YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = timezone.now().date()

        result = fetch_events_from_device(target_date)
        result['date'] = str(target_date)

        return Response(result, status=status.HTTP_200_OK)


class AttendanceHistoryAPIView(APIView):
    """
    GET /api/v1/attendance/history/?start=YYYY-MM-DD&end=YYYY-MM-DD&employee_id=...
    Menampilkan riwayat absensi untuk range tanggal tertentu.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        start_str = request.query_params.get('start')
        end_str   = request.query_params.get('end')
        emp_id    = request.query_params.get('employee_id')

        qs = AttendanceLog.objects.select_related('employee').all()

        if start_str:
            try:
                start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
                qs = qs.filter(date__gte=start_date)
            except ValueError:
                pass

        if end_str:
            try:
                end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
                qs = qs.filter(date__lte=end_date)
            except ValueError:
                pass

        if emp_id:
            qs = qs.filter(employee__id=emp_id)

        qs = qs.order_by('-date', 'clock_in')

        data = []
        for log in qs:
            tz = timezone.get_current_timezone()
            data.append({
                'id': str(log.id),
                'date': str(log.date),
                'employee_name': log.employee.full_name,
                'employee_nik': log.employee.nik,
                'employee_role': log.employee.role,
                'clock_in': log.clock_in.astimezone(tz).strftime('%H:%M:%S') if log.clock_in else '-',
                'clock_out': log.clock_out.astimezone(tz).strftime('%H:%M:%S') if log.clock_out else '-',
                'is_late': log.is_late,
                'kpi_score': log.kpi_score,
                'source': log.get_source_display(),
            })

        return Response(data, status=status.HTTP_200_OK)

class AttendanceAnalyticsAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        month = request.query_params.get('month', timezone.now().month)
        year = request.query_params.get('year', timezone.now().year)

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response({"error": "Invalid month or year"}, status=status.HTTP_400_BAD_REQUEST)

        logs = AttendanceLog.objects.filter(date__year=year, date__month=month)
        
        # Grafik Kehadiran Harian (Hadir vs Terlambat vs Absen)
        # Menghitung untuk setiap tanggal dalam bulan tersebut
        daily_stats = {}
        import calendar
        num_days = calendar.monthrange(year, month)[1]
        
        for day in range(1, num_days + 1):
            date_str = f"{year}-{month:02d}-{day:02d}"
            daily_stats[date_str] = {"date": date_str, "hadir": 0, "terlambat": 0}

        for log in logs:
            date_str = str(log.date)
            if date_str in daily_stats:
                if log.is_late:
                    daily_stats[date_str]["terlambat"] += 1
                else:
                    daily_stats[date_str]["hadir"] += 1

        chart_data = list(daily_stats.values())

        # Statistik Karyawan Paling Sering Terlambat
        late_logs = logs.filter(is_late=True)
        late_counts = {}
        for log in late_logs:
            name = log.employee.full_name
            late_counts[name] = late_counts.get(name, 0) + 1
        
        top_lates = [{"name": name, "late_count": count} for name, count in sorted(late_counts.items(), key=lambda item: item[1], reverse=True)[:5]]

        # Ringkasan Total Bulan Ini
        total_hadir = logs.count()
        total_terlambat = late_logs.count()

        return Response({
            "chart_data": chart_data,
            "top_lates": top_lates,
            "summary": {
                "total_hadir": total_hadir,
                "total_terlambat": total_terlambat
            }
        }, status=status.HTTP_200_OK)

class RawEventAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        events = HikvisionRawEvent.objects.all().order_by('-event_date', '-event_time_raw')[:100]
        data = [{
            'id': e.id,
            'serial_no': e.serial_no,
            'event_date': str(e.event_date),
            'event_time_raw': e.event_time_raw,
            'employee_no': e.employee_no,
            'name_on_device': e.name_on_device,
            'verify_mode': e.verify_mode,
            'major': e.major,
            'minor': e.minor
        } for e in events]
        return Response(data, status=status.HTTP_200_OK)
