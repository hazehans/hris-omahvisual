"""
attendance/services.py — Business Logic Layer

Berisi semua logika bisnis kompleks untuk modul attendance:
  1. Haversine geofencing (pure Python, tanpa PostGIS)
  2. Validasi geofence per role
  3. Kalkulasi keterlambatan (is_late)
  4. Kalkulasi overtime
  5. Cek hari libur karyawan
"""

import math
from datetime import datetime, time, date as date_type
from django.utils import timezone
from django.conf import settings


# ======================================================
# Konfigurasi Jam Kerja (WIB)
# Default bisa di-override di settings.py jika diperlukan
# ======================================================
WORK_START_HOUR   = getattr(settings, 'WORK_START_HOUR',   8)   # 08:00
WORK_START_MINUTE = getattr(settings, 'WORK_START_MINUTE', 0)
WORK_END_HOUR     = getattr(settings, 'WORK_END_HOUR',     17)  # 17:00
WORK_END_MINUTE   = getattr(settings, 'WORK_END_MINUTE',   0)

WORK_START = time(WORK_START_HOUR, WORK_START_MINUTE)  # 08:00
WORK_END   = time(WORK_END_HOUR,   WORK_END_MINUTE)    # 17:00

# Toleransi keterlambatan (menit) — misal: 15 menit grace period
LATE_TOLERANCE_MINUTES = getattr(settings, 'LATE_TOLERANCE_MINUTES', 15)


# ======================================================
# 1. Haversine Distance Formula
# ======================================================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Hitung jarak antara dua titik koordinat menggunakan rumus Haversine.

    Args:
        lat1, lon1: Koordinat titik 1 (karyawan)
        lat2, lon2: Koordinat titik 2 (kantor/lokasi referensi)

    Returns:
        Jarak dalam meter (float)
    """
    # Radius bumi dalam meter
    R = 6_371_000

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lon2 - lon1)

    a = (math.sin(d_phi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


# ======================================================
# 2. Validasi Geofence Per Role
# ======================================================

def validate_geofence(lat: float, lon: float, employee) -> dict:
    """
    Validasi apakah koordinat karyawan berada dalam radius yang valid,
    sesuai dengan role-nya.

    Args:
        lat: Latitude karyawan
        lon: Longitude karyawan
        employee: Instance Employee

    Returns:
        dict:
            - valid (bool): True jika dalam radius
            - nearest_location (str): Nama lokasi terdekat
            - distance_meter (float): Jarak ke lokasi terdekat
            - message (str): Pesan deskriptif

    Business Rules (PRD §5):
        - CV_* & LED_* (REGULAR): Validasi ke CompanyLocation type=CV_LED
        - RENTAL_*: Validasi ke CompanyLocation type=RENTAL
        - CREW_GUDANG: Tidak ada validasi (selalu valid)
        - LED_INSTALLATION mode: Skip (ditangani di view)
    """
    from employees.models import CompanyLocation, RoleChoices, CV_LED_ROLES, RENTAL_ROLES
    from employees.models import CompanyLocation

    role = employee.role

    # Crew Gudang: tidak ada validasi geolokasi
    if role == RoleChoices.CREW_GUDANG:
        return {
            'valid': True,
            'nearest_location': 'N/A (Crew Gudang)',
            'distance_meter': 0,
            'message': 'Crew Gudang tidak memerlukan validasi geolokasi.',
        }

    # Tentukan tipe lokasi yang relevan berdasarkan role
    if role in CV_LED_ROLES:
        location_type = CompanyLocation.LocationType.CV_LED
    elif role in RENTAL_ROLES:
        location_type = CompanyLocation.LocationType.RENTAL
    else:
        # Admin HR: tidak perlu absen via app
        return {
            'valid': True,
            'nearest_location': 'N/A (Admin HR)',
            'distance_meter': 0,
            'message': 'Admin HR tidak memerlukan validasi geolokasi.',
        }

    # Ambil semua lokasi yang relevan dan aktif
    locations = CompanyLocation.objects.filter(
        location_type=location_type,
        is_active=True
    )

    if not locations.exists():
        # Jika belum ada lokasi dikonfigurasi → warning tapi izinkan
        return {
            'valid': True,
            'nearest_location': 'Belum dikonfigurasi',
            'distance_meter': 0,
            'message': 'Lokasi perusahaan belum dikonfigurasi. Hubungi Admin.',
        }

    # Cari lokasi dengan jarak terdekat
    nearest = None
    nearest_distance = float('inf')

    for loc in locations:
        dist = haversine_distance(lat, lon, loc.latitude, loc.longitude)
        if dist < nearest_distance:
            nearest_distance = dist
            nearest = loc

    is_valid = nearest_distance <= nearest.radius_meter

    return {
        'valid': is_valid,
        'nearest_location': nearest.name,
        'distance_meter': round(nearest_distance, 2),
        'message': (
            f'Dalam radius {nearest.name} ({nearest_distance:.0f}m dari {nearest.radius_meter}m).'
            if is_valid
            else f'Di luar radius! Jarak ke {nearest.name}: {nearest_distance:.0f}m (maks {nearest.radius_meter}m).'
        ),
    }


# ======================================================
# 3. Cek Keterlambatan
# ======================================================

def check_is_late(clock_in_time: time) -> bool:
    """
    Cek apakah karyawan terlambat berdasarkan jam masuk.

    Args:
        clock_in_time: Jam masuk karyawan (time object)

    Returns:
        True jika terlambat (melebihi WORK_START + toleransi)
    """
    from datetime import timedelta

    # Hitung batas toleransi
    dt_work_start = datetime.combine(date_type.today(), WORK_START)
    dt_tolerance  = dt_work_start + timedelta(minutes=LATE_TOLERANCE_MINUTES)
    dt_clock_in   = datetime.combine(date_type.today(), clock_in_time)

    return dt_clock_in > dt_tolerance


# ======================================================
# 4. Cek Apakah Hari Libur Karyawan
# ======================================================

def check_is_day_off(employee, check_date: date_type) -> bool:
    """
    Cek apakah tanggal tertentu adalah hari libur karyawan.
    Pertama cek HolidayOverride, lalu WorkSchedule default.

    Args:
        employee: Instance Employee
        check_date: Tanggal yang ingin dicek

    Returns:
        True jika tanggal tersebut adalah hari libur karyawan
    """
    from roster.models import WorkSchedule, HolidayOverride

    # Cek override khusus untuk minggu ini
    override = HolidayOverride.objects.filter(
        employee=employee,
        new_day_off_date=check_date
    ).first()
    if override:
        return True

    # Cek apakah ada override yang memindahkan hari libur DARI tanggal ini
    # (artinya hari ini bukan lagi hari libur, sudah dipindah)
    moved_away = HolidayOverride.objects.filter(
        employee=employee,
        original_date=check_date
    ).first()
    if moved_away:
        return False

    # Cek jadwal default (WorkSchedule)
    schedule = WorkSchedule.objects.filter(
        employee=employee,
        effective_date__lte=check_date
    ).order_by('-effective_date').first()

    if schedule:
        # day_off disimpan sebagai integer: 0=Senin, 1=Selasa, ..., 6=Minggu
        return check_date.weekday() == schedule.day_off_weekday

    # Default: Rabu (weekday=2) jika belum ada schedule
    return check_date.weekday() == 2


# ======================================================
# 5. Kalkulasi Overtime
# ======================================================

def calculate_overtime(clock_out_time: time, employee, attendance_date: date_type) -> dict:
    """
    Hitung apakah karyawan lembur dan durasi lemburnya.

    Business Rules (PRD §5):
        - Jika clock_out > jam operasional selesai (17:00) → overtime
        - Jika karyawan masuk di hari liburnya → SELURUH durasi kerja = overtime

    Args:
        clock_out_time: Jam pulang karyawan
        employee: Instance Employee
        attendance_date: Tanggal absensi

    Returns:
        dict:
            - is_overtime (bool)
            - overtime_minutes (int): Durasi lembur dalam menit
    """
    # Cek apakah ini hari libur karyawan
    is_day_off = check_is_day_off(employee, attendance_date)

    if is_day_off:
        # Seluruh durasi kerja dihitung sebagai overtime
        # (durasi sebenarnya dihitung di property work_duration_minutes)
        return {
            'is_overtime': True,
            'is_day_off_attendance': True,
            'overtime_minutes': 0,  # Akan di-update setelah clock_out jika clock_in tersedia
        }

    # Hitung overtime dari selisih clock_out vs jam operasional selesai
    dt_work_end  = datetime.combine(attendance_date, WORK_END)
    dt_clock_out = datetime.combine(attendance_date, clock_out_time)

    if dt_clock_out > dt_work_end:
        diff = dt_clock_out - dt_work_end
        overtime_minutes = int(diff.total_seconds() / 60)
        return {
            'is_overtime': True,
            'is_day_off_attendance': False,
            'overtime_minutes': overtime_minutes,
        }

    return {
        'is_overtime': False,
        'is_day_off_attendance': False,
        'overtime_minutes': 0,
    }


# ======================================================
# 6. Validasi Role → Aturan Foto & Geofence
# ======================================================

def get_attendance_rules(employee, mode: str) -> dict:
    """
    Kembalikan aturan yang berlaku untuk employee berdasarkan role dan mode absensi.

    Returns:
        dict:
            - requires_photo (bool)
            - requires_geofence (bool)
            - requires_daily_report (bool) — reminder, enforcement di view lain
    """
    from employees.models import RoleChoices, CV_LED_ROLES, RENTAL_ROLES

    role = employee.role

    if mode == 'LED_INSTALLATION':
        # Mode Pemasangan LED: foto wajib, geofence skip
        return {
            'requires_photo': True,
            'requires_geofence': False,
            'requires_daily_report': True,
        }

    if role in CV_LED_ROLES:
        # Mode Reguler CV/LED: foto opsional, geofence wajib
        return {
            'requires_photo': False,
            'requires_geofence': True,
            'requires_daily_report': True,
        }

    if role in RENTAL_ROLES:
        # Rental: foto wajib, geofence wajib
        return {
            'requires_photo': True,
            'requires_geofence': True,
            'requires_daily_report': True,
        }

    if role == RoleChoices.CREW_GUDANG:
        # Crew Gudang: foto wajib, no geofence, no daily report
        return {
            'requires_photo': True,
            'requires_geofence': False,
            'requires_daily_report': False,
        }

    # Admin HR: tidak perlu absen
    return {
        'requires_photo': False,
        'requires_geofence': False,
        'requires_daily_report': False,
    }

