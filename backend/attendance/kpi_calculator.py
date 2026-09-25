from .models import AttendanceLog
from leave.models import LeaveRequest
from datetime import date

def calculate_daily_kpi(employee, target_date: date):
    """
    Fungsi ini menghitung Poin KPI Absensi Harian untuk satu karyawan.
    Fungsi ini akan dijalankan otomatis oleh Task Scheduler (Celery) setiap malam.
    """
    # 1. Cek log absensi hari ini di mesin Hikvision / Web
    attendance = AttendanceLog.objects.filter(employee=employee, date=target_date).first()
    
    # 2. Cek apakah ada Izin/Sakit yang di-Approve HR hari ini
    has_approved_leave = LeaveRequest.objects.filter(
        employee=employee, 
        start_date__lte=target_date, 
        end_date__gte=target_date, 
        status='APPROVED'
    ).exists()

    # ==========================================
    # AREA RUMUS KPI - SILAKAN UBAH POIN DI SINI
    # ==========================================
    
    POIN_SEMPURNA = 100
    POIN_IZIN = 70
    POIN_ALPHA = -10
    
    POIN_LUPA_ABSEN_PULANG = 50   # Contoh: poin jika hanya ada jam masuk
    POIN_TERLAMBAT = 80           # Contoh: masuk telat, pulang tepat waktu
    POIN_PULANG_CEPAT = 80        # Contoh: masuk tepat, pulang cepat
    POIN_TELAT_DAN_CEPAT = 60     # Contoh: masuk telat, pulang juga cepat

    # ==========================================
    
    final_score = None

    # Kasus 1: Karyawan Tidak Ada Log Masuk Sama Sekali
    if not attendance or (not attendance.clock_in and not attendance.clock_out):
        if has_approved_leave:
            final_score = POIN_IZIN
        else:
            final_score = POIN_ALPHA
            
    # Kasus 2: Karyawan Masuk (Ada Log Absen)
    else:
        # Punya jam masuk dan jam pulang (Ada 2 Log)
        if attendance.clock_in and attendance.clock_out:
            if attendance.is_late:
                # Logika lebih lanjut jika telat / pulang cepat bisa ditambahkan di sini
                final_score = POIN_TERLAMBAT
            else:
                final_score = POIN_SEMPURNA
        
        # Hanya punya jam masuk, tidak ada jam pulang (Lupa absen pulang)
        elif attendance.clock_in and not attendance.clock_out:
            final_score = POIN_LUPA_ABSEN_PULANG

    # Simpan hasil perhitungan ke database
    if attendance:
        attendance.kpi_score = final_score
        attendance.save()
        
    return final_score

