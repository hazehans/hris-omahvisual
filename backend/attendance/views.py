from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import AttendanceLog
from employees.models import Employee
from .kpi_calculator import calculate_daily_kpi

class HikvisionWebhookView(APIView):
    # Dimatikan sementara untuk kemudahan testing alat (bisa dinyalakan pakai Token IoT nanti)
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        """
        Endpoint ini akan 'ditembak' oleh mesin Hikvision setiap ada karyawan yang menempelkan wajah.
        Contoh Payload dari mesin (JSON):
        {
            "hikvision_id": "101",
            "timestamp": "2026-09-21T08:00:00Z",
            "punch_type": "IN"  // atau "OUT"
        }
        """
        data = request.data
        hikvision_id = data.get('hikvision_id')
        punch_type = data.get('punch_type', 'IN').upper()
        
        # 1. Cari siapa Karyawan yang punya wajah/ID mesin ini
        try:
            employee = Employee.objects.get(hikvision_id=hikvision_id)
        except Employee.DoesNotExist:
            return Response(
                {"error": f"Karyawan dengan ID Mesin {hikvision_id} tidak ditemukan di database."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Gunakan waktu dari alat, atau waktu server sekarang jika alat tidak mengirim waktu
        punch_time = data.get('timestamp')
        if punch_time:
            punch_time = timezone.datetime.fromisoformat(punch_time.replace('Z', '+00:00'))
        else:
            punch_time = timezone.now()

        today_date = punch_time.date()

        # 2. Ambil atau Buat Log Absensi Hari Ini
        attendance, created = AttendanceLog.objects.get_or_create(
            employee=employee,
            date=today_date,
            defaults={'source': 'HIKVISION_MACHINE'}
        )

        # 3. Masukkan Waktu ke Kolom yang Benar (Masuk atau Pulang)
        if punch_type == 'IN':
            # Jika belum ada jam masuk, isi. Jika sudah ada, jangan ditimpa (ambil yang paling pagi)
            if not attendance.clock_in:
                attendance.clock_in = punch_time
        
        elif punch_type == 'OUT':
            # Selalu timpa jam pulang dengan jam yang paling terakhir alat menembak
            attendance.clock_out = punch_time

        attendance.save()
        
        # (Opsional) Langsung update hitungan poin KPI tiap kali dia absen
        # Meski idealnya ini dijalankan malam hari pakai Celery, kita bisa panggil di sini
        # agar HR bisa melihat poin secara real-time.
        calculate_daily_kpi(employee, today_date)

        return Response({
            "message": "Log Absensi berhasil disimpan.",
            "employee_name": employee.full_name,
            "punch_type": punch_type,
            "time": punch_time
        }, status=status.HTTP_200_OK)


class TodayAttendanceAPIView(APIView):
    authentication_classes = []
    permission_classes = []
    
    def get(self, request):
        today = timezone.now().date()
        logs = AttendanceLog.objects.filter(date=today).order_by('-clock_in')
        
        data = []
        for log in logs:
            data.append({
                'name': log.employee.full_name,
                'nik': log.employee.nik,
                'clock_in': log.clock_in.strftime('%H:%M:%S') if log.clock_in else '-',
                'clock_out': log.clock_out.strftime('%H:%M:%S') if log.clock_out else '-',
                'is_late': log.is_late,
                'kpi_score': log.kpi_score if log.kpi_score is not None else 'Belum Dihitung'
            })
            
        return Response(data, status=status.HTTP_200_OK)
