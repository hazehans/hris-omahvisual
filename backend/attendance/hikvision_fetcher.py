import os
import logging
import requests
from requests.auth import HTTPDigestAuth
from datetime import datetime, date, time as time_type
from django.utils import timezone
from dateutil.parser import parse as parse_datetime
from .models import HikvisionRawEvent, AttendanceLog
from employees.models import Employee
from leave.models import LeaveRequest

logger = logging.getLogger(__name__)

HIKVISION_HOST = os.environ.get('HIKVISION_HOST', '172.16.12.89')
HIKVISION_USER = os.environ.get('HIKVISION_USER', 'admin')
HIKVISION_PASS = os.environ.get('HIKVISION_PASS', 'OmviJosjis2026')

ATTENDANCE_STATUS_MAP = {
    'checkIn': 'IN',
    'checkOut': 'OUT',
}

def fetch_events_from_device(target_date=None, device_serial='default'):
    """Fetch AcsEvents from Hikvision device for a given date."""
    if target_date is None:
        target_date = date.today()
    
    url = f'http://{HIKVISION_HOST}/ISAPI/AccessControl/AcsEvent?format=json'
    auth = HTTPDigestAuth(HIKVISION_USER, HIKVISION_PASS)
    
    start_time = f'{target_date}T00:00:00+07:00'
    end_time = f'{target_date}T23:59:59+07:00'
    
    all_events = []
    position = 0
    page_size = 30
    search_id = '1'
    
    while True:
        payload = {
            'AcsEventCond': {
                'searchID': search_id,
                'searchResultPosition': position,
                'maxResults': page_size,
                'major': 0,
                'minor': 0,
                'startTime': start_time,
                'endTime': end_time,
            }
        }
        
        try:
            resp = requests.post(url, json=payload, auth=auth, timeout=30)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.error(f'Hikvision fetch error at position {position}: {e}')
            break
        
        acs = data.get('AcsEvent', {})
        info_list = acs.get('InfoList', [])
        total = acs.get('totalMatches', 0)
        status = acs.get('responseStatusStrg', 'OK')
        
        if not info_list:
            break
        
        all_events.extend(info_list)
        
        if status != 'MORE':
            break
        
        position += len(info_list)
    
    # Process events
    raw_saved = 0
    attendance_created = 0
    
    for event in all_events:
        raw_event = save_raw_event(event, device_serial)
        if raw_event:
            raw_saved += 1
            att = process_attendance(raw_event, event)
            if att:
                attendance_created += 1
    
    return {
        'total_fetched': len(all_events),
        'raw_saved': raw_saved,
        'attendance_created': attendance_created,
        'date': str(target_date),
    }


def save_raw_event(event, device_serial):
    """Save a single raw event, deduplicated by device_serial + serial_no."""
    serial_no = event.get('serialNo')
    if serial_no is None:
        return None
    
    event_time_str = event.get('time', '')
    try:
        event_time = parse_datetime(event_time_str)
    except (ValueError, TypeError):
        event_time = timezone.now()
    
    raw, created = HikvisionRawEvent.objects.get_or_create(
        device_serial=device_serial,
        serial_no=serial_no,
        defaults={
            'event_time': event_time,
            'major': event.get('major', 0),
            'minor': event.get('minor', 0),
            'employee_no': event.get('employeeNoString', ''),
            'name_on_device': event.get('name', ''),
            'card_no': event.get('cardNo', ''),
            'card_type': str(event.get('cardType', '')),
            'card_reader_no': event.get('cardReaderNo'),
            'door_no': event.get('doorNo'),
            'verify_mode': event.get('currentVerifyMode', ''),
            'attendance_status': event.get('attendanceStatus', ''),
            'attendance_label': event.get('label', ''),
            'user_type': event.get('userType', ''),
            'raw_payload': event,
        }
    )
    return raw if created else None


def has_late_exemption(employee, attendance_date, clock_in_time) -> bool:
    """
    Cek apakah karyawan memiliki izin terlambat (IZIN_TERLAMBAT) yang sudah APPROVED
    untuk tanggal tersebut, dan jam masuk karyawan masih dalam batas late_until.
    """
    exemptions = LeaveRequest.objects.filter(
        employee=employee,
        leave_type='IZIN_TERLAMBAT',
        status='APPROVED',
        start_date__lte=attendance_date,
        end_date__gte=attendance_date,
    )
    for ex in exemptions:
        # Jika late_until tidak diset, izin berlaku sepanjang hari
        if ex.late_until is None:
            return True
        # Bandingkan jam masuk dengan batas late_until
        if clock_in_time.time() <= ex.late_until:
            return True
    return False


def process_attendance(raw_event, event_data):
    """Process a raw event into an attendance record if valid."""
    employee_no = raw_event.employee_no
    attendance_status = raw_event.attendance_status

    # Rule: must have employeeNoString
    if not employee_no:
        return None

    # Rule: must have valid attendanceStatus
    attendance_type = ATTENDANCE_STATUS_MAP.get(attendance_status)
    if not attendance_type:
        return None

    # Rule: must map to an HRIS employee
    try:
        employee = Employee.objects.get(hikvision_id=employee_no, is_active=True)
    except Employee.DoesNotExist:
        logger.warning(f'No HRIS employee found for hikvision_id={employee_no}')
        return None

    # Cek apakah karyawan punya izin terlambat yang approved (hanya relevan untuk IN)
    is_late_exempt = False
    if attendance_type == 'IN':
        is_late_exempt = has_late_exemption(
            employee=employee,
            attendance_date=raw_event.event_time.date(),
            clock_in_time=raw_event.event_time,
        )

    # Create attendance record (OneToOne with raw_event prevents duplicates)
    try:
        att = AttendanceLog.objects.create(
            employee=employee,
            raw_event=raw_event,
            attendance_date=raw_event.event_time.date(),
            event_time=raw_event.event_time,
            attendance_type=attendance_type,
            verification_mode=raw_event.verify_mode,
            source='hikvision',
            is_late_exempt=is_late_exempt,
        )
        return att
    except Exception as e:
        logger.debug(f'Attendance already exists for raw_event {raw_event.id}: {e}')
        return None


