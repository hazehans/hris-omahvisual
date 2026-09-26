"""
Hikvision ISAPI Fetcher
=======================
Menarik data event dari mesin HiView DS-K1T320MFWx menggunakan ISAPI (Digest Auth).
Menyimpan event mentah ke HikvisionRawEvent, lalu memprosesnya menjadi AttendanceLog.

Event yang relevan untuk absensi:
  major=5, minor=1  → Akses berhasil (swipe wajah/kartu sukses) — INI YANG KITA PAKAI
  major=5, minor=9  → Kartu/wajah ditolak (gagal)
  major=5, minor=21 → Pintu dibuka
  major=5, minor=22 → Pintu ditutup

Logika clock_in / clock_out:
  - Tap PERTAMA dalam satu hari = clock_in
  - Tap TERAKHIR dalam satu hari = clock_out
  - Jika hanya ada 1 tap, maka hanya clock_in (clock_out kosong)
"""

import requests
from requests.auth import HTTPDigestAuth
from django.utils import timezone
from django.conf import settings
from datetime import datetime, date
import pytz
import logging

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Konfigurasi Mesin (ambil dari settings / env)
# ─────────────────────────────────────────────
HIKVISION_HOST = getattr(settings, 'HIKVISION_HOST', '172.16.12.89')
HIKVISION_USER = getattr(settings, 'HIKVISION_USER', 'admin')
HIKVISION_PASS = getattr(settings, 'HIKVISION_PASS', 'OmviJosjis2026')
HIKVISION_URL  = f"http://{HIKVISION_HOST}/ISAPI/AccessControl/AcsEvent?format=json"

# Jam kerja normal (WIB)
WORK_START_HOUR = getattr(settings, 'WORK_START_HOUR', 8)   # 08:00
WORK_END_HOUR   = getattr(settings, 'WORK_END_HOUR', 17)    # 17:00
LATE_THRESHOLD_MINUTES = getattr(settings, 'LATE_THRESHOLD_MINUTES', 15)  # Toleransi 15 menit

WIB = pytz.timezone('Asia/Jakarta')


def fetch_events_from_device(target_date: date, max_pages: int = 20) -> dict:
    """
    Menarik SEMUA event dari mesin Hikvision untuk tanggal tertentu.
    Mesin hanya mengembalikan max 30 per request, jadi kita loop pakai searchResultPosition.

    Returns dict: {
        'total_fetched': int,
        'saved_raw': int,
        'processed_attendance': int,
        'errors': list[str]
    }
    """
    from .models import HikvisionRawEvent, AttendanceLog
    from employees.models import Employee
    from .kpi_calculator import calculate_daily_kpi

    tz_str = "+07:00"
    start_time = f"{target_date.strftime('%Y-%m-%d')}T00:00:00{tz_str}"
    end_time   = f"{target_date.strftime('%Y-%m-%d')}T23:59:59{tz_str}"

    all_events = []
    position   = 0
    page       = 0
    errors     = []

    logger.info(f"[Hikvision] Mulai fetch data tanggal {target_date}...")

    # ── Loop sampai semua halaman habis ──
    while page < max_pages:
        payload = {
            "AcsEventCond": {
                "searchID": "hris-fetch-001",
                "searchResultPosition": position,
                "maxResults": 30,
                "major": 0,
                "minor": 0,
                "startTime": start_time,
                "endTime": end_time,
            }
        }

        try:
            resp = requests.post(
                HIKVISION_URL,
                json=payload,
                auth=HTTPDigestAuth(HIKVISION_USER, HIKVISION_PASS),
                timeout=15,
                verify=False,  # Mesin biasanya self-signed cert
            )
            resp.raise_for_status()
        except requests.exceptions.RequestException as e:
            err = f"Gagal koneksi ke mesin Hikvision: {e}"
            logger.error(f"[Hikvision] {err}")
            errors.append(err)
            break

        data       = resp.json().get('AcsEvent', {})
        info_list  = data.get('InfoList', [])
        status_str = data.get('responseStatusStrg', 'OK')

        all_events.extend(info_list)
        logger.info(f"[Hikvision] Halaman {page+1}: dapat {len(info_list)} event, status={status_str}")

        # Jika mesin bilang tidak ada lagi data, stop
        if status_str in ('OK', 'NO MATCH'):
            break

        # Jika 'MORE', geser posisi dan ambil halaman berikutnya
        position += len(info_list)
        page     += 1

    logger.info(f"[Hikvision] Total event ditarik: {len(all_events)}")

    # ── Simpan raw events ──
    saved_raw = 0
    for event in all_events:
        serial_no = event.get('serialNo')
        if serial_no is None:
            continue

        # Hindari duplikat berdasarkan serial_no + tanggal
        if not HikvisionRawEvent.objects.filter(serial_no=serial_no, event_date=target_date).exists():
            HikvisionRawEvent.objects.create(
                serial_no       = serial_no,
                event_date      = target_date,
                event_time_raw  = event.get('time', ''),
                major           = event.get('major', 0),
                minor           = event.get('minor', 0),
                employee_no     = event.get('employeeNoString', ''),
                card_no         = event.get('cardNo', ''),
                name_on_device  = event.get('name', ''),
                verify_mode     = event.get('currentVerifyMode', ''),
                door_no         = event.get('doorNo'),
                raw_payload     = event,
            )
            saved_raw += 1

    logger.info(f"[Hikvision] Raw events baru disimpan: {saved_raw}")

    # ── Proses raw events menjadi AttendanceLog ──
    processed = _process_raw_to_attendance(target_date, errors)

    return {
        'total_fetched': len(all_events),
        'saved_raw': saved_raw,
        'processed_attendance': processed,
        'errors': errors,
    }


def _process_raw_to_attendance(target_date: date, errors: list) -> int:
    """
    Mengkonversi HikvisionRawEvent yang sudah disimpan menjadi baris AttendanceLog.
    Hanya memproses event major=5, minor=1 (akses BERHASIL).
    """
    from .models import HikvisionRawEvent, AttendanceLog
    from employees.models import Employee
    from .kpi_calculator import calculate_daily_kpi

    # Ambil semua event tap berhasil hari ini, urutkan dari paling awal
    access_events = HikvisionRawEvent.objects.filter(
        event_date=target_date,
        major=5,
        minor=1,  # Akses berhasil (face/card granted)
    ).exclude(employee_no='').order_by('event_time_raw')

    # Kelompokkan per employee_no
    by_employee: dict[str, list] = {}
    for event in access_events:
        emp_no = event.employee_no
        if emp_no not in by_employee:
            by_employee[emp_no] = []
        by_employee[emp_no].append(event)

    processed_count = 0

    for emp_no, events in by_employee.items():
        # Cari Employee yang sesuai berdasarkan hikvision_id
        try:
            employee = Employee.objects.get(hikvision_id=emp_no, is_active=True)
        except Employee.DoesNotExist:
            logger.warning(f"[Hikvision] Employee dengan ID mesin '{emp_no}' tidak ditemukan di database. "
                           f"Pastikan field 'hikvision_id' di Data Karyawan sudah diisi.")
            errors.append(f"Employee ID mesin '{emp_no}' tidak terdaftar di sistem.")
            continue
        except Employee.MultipleObjectsReturned:
            logger.error(f"[Hikvision] Duplikat hikvision_id '{emp_no}' ditemukan di database!")
            errors.append(f"Duplikat hikvision_id '{emp_no}'.")
            continue

        # Parse waktu event pertama (clock_in) dan terakhir (clock_out)
        first_event = events[0]
        last_event  = events[-1]

        clock_in_time  = _parse_event_time(first_event.event_time_raw)
        clock_out_time = _parse_event_time(last_event.event_time_raw) if len(events) > 1 else None

        if not clock_in_time:
            continue

        # Hitung keterlambatan
        work_start = WIB.localize(datetime.combine(target_date, datetime.min.time().replace(hour=WORK_START_HOUR)))
        is_late = clock_in_time > (work_start + timezone.timedelta(minutes=LATE_THRESHOLD_MINUTES))

        # Upsert ke AttendanceLog
        attendance, created = AttendanceLog.objects.get_or_create(
            employee=employee,
            date=target_date,
            defaults={
                'source': 'HIKVISION_MACHINE',
                'clock_in': clock_in_time,
                'clock_out': clock_out_time,
                'is_late': is_late,
            }
        )

        if not created:
            # Update data yang sudah ada (re-fetch bisa memperbaiki data)
            # clock_in: ambil yang paling awal
            if clock_in_time and (not attendance.clock_in or clock_in_time < attendance.clock_in):
                attendance.clock_in = clock_in_time
                attendance.is_late  = is_late

            # clock_out: ambil yang paling akhir
            if clock_out_time and (not attendance.clock_out or clock_out_time > attendance.clock_out):
                attendance.clock_out = clock_out_time

            attendance.source = 'HIKVISION_MACHINE'
            attendance.save()

        # Hitung ulang KPI
        calculate_daily_kpi(employee, target_date)
        processed_count += 1
        logger.info(f"[Hikvision] ✓ {employee.full_name} | Masuk: {clock_in_time} | Pulang: {clock_out_time} | Telat: {is_late}")

    return processed_count


def _parse_event_time(time_str: str):
    """Parse string waktu ISO 8601 dari mesin menjadi timezone-aware datetime."""
    if not time_str:
        return None
    try:
        dt = datetime.fromisoformat(time_str)
        if dt.tzinfo is None:
            dt = WIB.localize(dt)
        return dt
    except (ValueError, TypeError) as e:
        logger.warning(f"[Hikvision] Gagal parse waktu '{time_str}': {e}")
        return None
