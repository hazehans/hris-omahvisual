from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from django.db.models import Min, Max, Count, Q
from datetime import date, datetime, time
import os

from .models import AttendanceLog, HikvisionRawEvent
from .serializers import AttendanceLogSerializer, HikvisionRawEventSerializer, AttendanceSummarySerializer
from .hikvision_fetcher import fetch_events_from_device
from employees.models import Employee
from audit.utils import log_action

WORK_START_HOUR = int(os.environ.get('WORK_START_HOUR', 8))
LATE_THRESHOLD_MINUTES = int(os.environ.get('LATE_THRESHOLD_MINUTES', 15))


class TodayAttendanceView(APIView):
    """GET /attendance/today/ — Today's attendance summary for all employees"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        target_date = request.query_params.get('date')
        if target_date:
            try:
                target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
            except ValueError:
                target_date = date.today()
        else:
            target_date = date.today()
        
        logs = AttendanceLog.objects.filter(
            attendance_date=target_date
        ).select_related('employee')
        
        # Group by employee for summary
        employee_data = {}
        for log in logs:
            emp_id = log.employee_id
            if emp_id not in employee_data:
                employee_data[emp_id] = {
                    'employee_id': emp_id,
                    'employee_name': log.employee.full_name,
                    'employee_nik': log.employee.nik,
                    'date': target_date,
                    'first_in': None,
                    'last_out': None,
                    'total_events': 0,
                    'events': [],
                }
            
            entry = employee_data[emp_id]
            entry['total_events'] += 1
            entry['events'].append({
                'time': log.event_time.isoformat(),
                'type': log.attendance_type,
                'verification_mode': log.verification_mode,
            })
            
            if log.attendance_type == 'IN':
                if entry['first_in'] is None or log.event_time < entry['first_in']:
                    entry['first_in'] = log.event_time
            elif log.attendance_type == 'OUT':
                if entry['last_out'] is None or log.event_time > entry['last_out']:
                    entry['last_out'] = log.event_time
        
        # Calculate is_late based on threshold and Leave permissions
        from leave.models import LeaveRequest
        approved_late_leaves = LeaveRequest.objects.filter(
            start_date=target_date, 
            leave_type='IZIN_TERLAMBAT', 
            status='APPROVED'
        )
        late_exempt_map = {
            leave.employee_id: leave.late_until 
            for leave in approved_late_leaves
        }

        default_late_threshold = time(WORK_START_HOUR, LATE_THRESHOLD_MINUTES)
        result = []
        for entry in employee_data.values():
            is_late = False
            emp_id = entry['employee_id']
            if entry['first_in']:
                local_time = timezone.localtime(entry['first_in']).time()
                current_threshold = late_exempt_map.get(emp_id) or default_late_threshold
                is_late = local_time > current_threshold
                entry['first_in'] = entry['first_in'].isoformat()
            if entry['last_out']:
                entry['last_out'] = entry['last_out'].isoformat()
            entry['is_late'] = is_late
            result.append(entry)
        
        return Response(result)


class FetchHikvisionView(APIView):
    """POST /attendance/fetch/ — Manual trigger to fetch events from Hikvision"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        target_date_str = request.data.get('date')
        if target_date_str:
            try:
                target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        else:
            target_date = date.today()
        
        try:
            result = fetch_events_from_device(target_date)
            log_action(request, 'HIKVISION_SYNC', detail=result)
            return Response(result)
        except Exception as e:
            log_action(request, 'HIKVISION_SYNC_ERROR', detail={'error': str(e)})
            return Response({'error': str(e)}, status=500)


class AutoSyncView(APIView):
    """GET /attendance/auto-sync/ — Background trigger to fetch today's events from Hikvision"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Allow any authenticated user (HR/Superuser) to trigger background sync
        # The frontend will poll this every 5 seconds
        target_date = date.today()
        try:
            result = fetch_events_from_device(target_date)
            # Don't log to audit log to avoid spamming the audit log every 5 seconds
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=500)



class AttendanceHistoryView(APIView):
    """GET /attendance/history/ — Filterable attendance history"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        qs = AttendanceLog.objects.select_related('employee').all()
        
        # Non-admin users can only see their own attendance
        if not request.user.is_superuser:
            try:
                employee = request.user.employee_profile
                qs = qs.filter(employee=employee)
            except Exception:
                return Response([])
        
        # Filters
        employee_id = request.query_params.get('employee_id')
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        start = request.query_params.get('start')
        if start:
            qs = qs.filter(attendance_date__gte=start)
        end = request.query_params.get('end')
        if end:
            qs = qs.filter(attendance_date__lte=end)
        att_type = request.query_params.get('type')  # IN or OUT
        if att_type:
            qs = qs.filter(attendance_type=att_type)
        
        qs = qs.order_by('-event_time')[:500]
        serializer = AttendanceLogSerializer(qs, many=True)
        return Response(serializer.data)


class AttendanceAnalyticsView(APIView):
    """GET /attendance/analytics/ — Monthly analytics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        from django.db.models.functions import TruncDate
        
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        
        logs = AttendanceLog.objects.filter(
            attendance_date__month=month,
            attendance_date__year=year,
            attendance_type='IN',  # Count unique IN events for attendance
        ).select_related('employee')
        
        # Daily counts
        daily = logs.annotate(d=TruncDate('event_time')).values('d').annotate(
            total=Count('employee', distinct=True)
        ).order_by('d')
        
        # Late employees (first IN after threshold)
        late_threshold = time(WORK_START_HOUR, LATE_THRESHOLD_MINUTES)
        total_employees = Employee.objects.filter(is_active=True).count()
        
        return Response({
            'month': month,
            'year': year,
            'total_active_employees': total_employees,
            'daily_attendance': list(daily),
        })


# ─────────────────────────────────────────────────────────────────────────────
# Hikvision Event Classification Map
# Format: (major, minor): {'label': str, 'category': 'HIDE'|'SHOW'|'DETAIL'}
# HIDE   – noise/spam dari perangkat, tidak perlu ditampilkan
# SHOW   – event kehadiran relevan, selalu tampilkan
# DETAIL – event sistem/admin, tampilkan dengan detail teknis
# ─────────────────────────────────────────────────────────────────────────────
HIKVISION_EVENT_MAP = {
    # --- HIDE: noise/spam dari perangkat ---
    (5, 21):   {'label': 'Door Open',                 'category': 'HIDE'},
    (5, 22):   {'label': 'Door Close',                'category': 'HIDE'},
    (5, 9):    {'label': 'Face Failed',               'category': 'HIDE'},
    (5, 39):   {'label': 'Verify Timeout',            'category': 'HIDE'},
    (5, 38):   {'label': 'Card Verify Wait',          'category': 'HIDE'},
    (5, 76):   {'label': 'Face/Card Pass',            'category': 'HIDE'},

    # --- SHOW: event kehadiran relevan ---
    (5, 75):   {'label': 'Biometrics Verify Pass',     'category': 'SHOW'},
    (5, 1):    {'label': 'Card Verify Pass',          'category': 'SHOW'},

    # --- DETAIL: event sistem / admin ---
    (3, 80):   {'label': 'Remote Login',              'category': 'DETAIL'},
    (3, 112):  {'label': 'Remote Config Load',        'category': 'DETAIL'},
    (3, 121):  {'label': 'Remote Config Save',        'category': 'DETAIL'},
    (2, 1031): {'label': 'Tamper Detection',          'category': 'DETAIL'},
    (2, 1024): {'label': 'Network Timeout',           'category': 'DETAIL'},
    (2, 39):   {'label': 'Network Connected',         'category': 'DETAIL'},
}

# Set major/minor pair yang masuk kategori HIDE (untuk exclude di queryset)
HIDE_EVENTS = Q()
for (maj, min_), meta in HIKVISION_EVENT_MAP.items():
    if meta['category'] == 'HIDE':
        HIDE_EVENTS |= Q(major=maj, minor=min_)


def annotate_event(event_dict: dict) -> dict:
    """Tambahkan 'event_label' dan 'event_category' ke dict event."""
    key = (event_dict.get('major'), event_dict.get('minor'))
    meta = HIKVISION_EVENT_MAP.get(key, {
        'label': f"Unknown ({event_dict.get('major')}/{event_dict.get('minor')})",
        'category': 'UNKNOWN',
    })
    event_dict['event_label'] = meta['label']
    event_dict['event_category'] = meta['category']
    return event_dict


class RawEventListView(APIView):
    """
    GET /attendance/raw-events/ — Raw Hikvision event log viewer

    Query params:
      date             – filter by date (YYYY-MM-DD)
      employee_no      – filter by employee no (partial)
      major            – filter by major code
      minor            – filter by minor code
      attendance_status– filter by attendance_status field
      verify_mode      – filter by verify_mode field
      user_type        – filter by user_type field
      category         – 'SHOW' | 'DETAIL' | 'UNKNOWN' | 'ALL'
                         (default: 'ALL' — excludes HIDE events)
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Selalu exclude event HIDE (spam/noise dari perangkat)
        qs = HikvisionRawEvent.objects.exclude(HIDE_EVENTS)

        # ── Filter: category ──────────────────────────────────────────────────
        # Jika category=SHOW, hanya tampilkan event yang ada di SHOW list
        # Jika category=DETAIL, hanya tampilkan event DETAIL list
        # Jika category=ALL atau tidak diisi, tampilkan semua selain HIDE
        category_filter = request.query_params.get('category', 'ALL').upper()
        if category_filter in ('SHOW', 'DETAIL', 'UNKNOWN'):
            target_pairs = Q()
            for (maj, min_), meta in HIKVISION_EVENT_MAP.items():
                if meta['category'] == category_filter:
                    target_pairs |= Q(major=maj, minor=min_)
            if category_filter == 'UNKNOWN':
                # UNKNOWN = tidak ada di event map sama sekali
                known_pairs = Q()
                for (maj, min_) in HIKVISION_EVENT_MAP:
                    known_pairs |= Q(major=maj, minor=min_)
                qs = qs.exclude(known_pairs)
            else:
                qs = qs.filter(target_pairs)

        # ── Filter: tanggal ───────────────────────────────────────────────────
        target_date = request.query_params.get('date')
        if target_date:
            qs = qs.filter(event_time__date=target_date)

        # ── Filter: employee ──────────────────────────────────────────────────
        employee_no = request.query_params.get('employee_no')
        if employee_no:
            qs = qs.filter(employee_no__icontains=employee_no)

        # ── Filter: major / minor ─────────────────────────────────────────────
        major = request.query_params.get('major')
        if major:
            qs = qs.filter(major=major)

        minor = request.query_params.get('minor')
        if minor:
            qs = qs.filter(minor=minor)

        # ── Filter: lainnya ───────────────────────────────────────────────────
        attendance_status = request.query_params.get('attendance_status')
        if attendance_status:
            qs = qs.filter(attendance_status=attendance_status)

        verify_mode = request.query_params.get('verify_mode')
        if verify_mode:
            qs = qs.filter(verify_mode=verify_mode)

        user_type = request.query_params.get('user_type')
        if user_type:
            qs = qs.filter(user_type=user_type)

        # ── Serialize + annotate event label ──────────────────────────────────
        qs = qs.order_by('-event_time')[:200]
        serializer = HikvisionRawEventSerializer(qs, many=True)
        data = [annotate_event(row) for row in serializer.data]

        return Response({
            'count': len(data),
            'results': data,
        })


class RawEventSummaryView(APIView):
    """
    GET /attendance/raw-events/summary/ — Ringkasan jumlah event per kategori
    Berguna untuk debugging dan monitoring perangkat Hikvision.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        target_date = request.query_params.get('date')

        summary = []
        for (maj, min_), meta in sorted(HIKVISION_EVENT_MAP.items()):
            qs = HikvisionRawEvent.objects.filter(major=maj, minor=min_)
            if target_date:
                qs = qs.filter(event_time__date=target_date)
            summary.append({
                'major': maj,
                'minor': min_,
                'label': meta['label'],
                'category': meta['category'],
                'count': qs.count(),
            })

        # Hitung event yang tidak ada di map (UNKNOWN)
        known_pairs = Q()
        for (maj, min_) in HIKVISION_EVENT_MAP:
            known_pairs |= Q(major=maj, minor=min_)
        unknown_qs = HikvisionRawEvent.objects.exclude(known_pairs)
        if target_date:
            unknown_qs = unknown_qs.filter(event_time__date=target_date)
        summary.append({
            'major': None,
            'minor': None,
            'label': 'Unknown / Tidak Terdaftar',
            'category': 'UNKNOWN',
            'count': unknown_qs.count(),
        })

        return Response({
            'date': target_date or 'all-time',
            'events': summary,
        })


class HikvisionDeviceInfoView(APIView):
    """GET /attendance/device-info/ — Get device user count and status"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        from .hikvision_user_service import get_user_count, search_users
        try:
            user_count = get_user_count()
            return Response({
                'status': 'online',
                'user_count': user_count,
            })
        except Exception as e:
            return Response({
                'status': 'offline',
                'error': str(e),
            }, status=503)


class HikvisionDeviceUsersView(APIView):
    """GET /attendance/device-users/ — List users on Hikvision device"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        from .hikvision_user_service import search_users
        try:
            result = search_users()
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=503)


class HikvisionPushUserView(APIView):
    """POST /attendance/device-push-user/ — Push employee to Hikvision device"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        from .hikvision_user_service import push_user_to_device
        employee_id = request.data.get('employee_id')
        try:
            emp = Employee.objects.get(pk=employee_id)
            if not emp.hikvision_id:
                return Response({'error': 'Employee has no hikvision_id'}, status=400)
            
            gender_map = {'LAKI_LAKI': 'male', 'PEREMPUAN': 'female'}
            result = push_user_to_device(
                employee_no=emp.hikvision_id,
                name=emp.full_name,
                gender=gender_map.get(emp.gender, 'unknown'),
            )
            log_action(request, 'HIKVISION_PUSH_USER', 'Employee', emp.id, {
                'hikvision_id': emp.hikvision_id, 'name': emp.full_name, 'result': result
            })
            return Response(result)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)
        except Exception as e:
            log_action(request, 'HIKVISION_PUSH_USER_ERROR', 'Employee', employee_id, {'error': str(e)})
            return Response({'error': str(e)}, status=503)


class HikvisionDeleteUserView(APIView):
    """POST /attendance/device-delete-user/ — Delete user from Hikvision device"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        from .hikvision_user_service import delete_user_from_device
        employee_no = request.data.get('employee_no')
        if not employee_no:
            return Response({'error': 'employee_no is required'}, status=400)
        try:
            result = delete_user_from_device(employee_no)
            log_action(request, 'HIKVISION_DELETE_USER', detail={'employee_no': employee_no, 'result': result})
            return Response(result)
        except Exception as e:
            log_action(request, 'HIKVISION_DELETE_USER_ERROR', detail={'employee_no': employee_no, 'error': str(e)})
            return Response({'error': str(e)}, status=503)


class HikvisionCardListView(APIView):
    """GET /attendance/device-cards/ — List cards on device"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        from .hikvision_user_service import search_cards
        try:
            result = search_cards()
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=503)


class HikvisionBindCardView(APIView):
    """POST /attendance/device-bind-card/ — Bind card to employee on device"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        from .hikvision_user_service import bind_card
        employee_no = request.data.get('employee_no')
        card_no = request.data.get('card_no')
        if not employee_no or not card_no:
            return Response({'error': 'employee_no and card_no required'}, status=400)
        try:
            result = bind_card(employee_no, card_no)
            log_action(request, 'HIKVISION_BIND_CARD', detail={'employee_no': employee_no, 'card_no': card_no})
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=503)


class HikvisionUnbindCardView(APIView):
    """POST /attendance/device-unbind-card/ — Unbind card from device"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        from .hikvision_user_service import unbind_card
        card_no = request.data.get('card_no')
        if not card_no:
            return Response({'error': 'card_no required'}, status=400)
        try:
            result = unbind_card(card_no)
            log_action(request, 'HIKVISION_UNBIND_CARD', detail={'card_no': card_no})
            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=503)

from datetime import time

class SuperuserDashboardView(APIView):
    """GET /api/v1/attendance/superuser-dashboard/"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        from datetime import timedelta
        from django.utils import timezone
        from employees.models import Employee
        from leave.models import LeaveRequest
        from .models import AttendanceLog, HikvisionRawEvent
        
        today = timezone.localtime().date()
        WORK_START_HOUR = int(os.environ.get('WORK_START_HOUR', 8))
        LATE_THRESHOLD_MINUTES = int(os.environ.get('LATE_THRESHOLD_MINUTES', 15))
        late_time = time(WORK_START_HOUR, LATE_THRESHOLD_MINUTES)
        
        total_emp = Employee.objects.filter(is_active=True).count()
        today_logs = AttendanceLog.objects.filter(attendance_date=today, attendance_type='IN')
        
        present_emp_ids = set()
        late_count = 0
        for log in today_logs:
            if log.employee_id not in present_emp_ids:
                present_emp_ids.add(log.employee_id)
                if timezone.localtime(log.event_time).time() > late_time:
                    late_count += 1
                    
        present_count = len(present_emp_ids)
        leave_count = LeaveRequest.objects.filter(status='APPROVED', start_date__lte=today, end_date__gte=today).count()
        absent_count = max(0, total_emp - present_count - leave_count)
        
        today_stats = {
            'total': total_emp,
            'present': present_count,
            'late': late_count,
            'leave': leave_count,
            'absent': absent_count,
        }
        
        recent = AttendanceLog.objects.select_related('employee').order_by('-event_time')[:5]
        recent_logs = [{
            'time': timezone.localtime(log.event_time).strftime('%H:%M'),
            'name': log.employee.full_name,
            'type': log.get_attendance_type_display(),
        } for log in recent]
        
        chart_data = []
        for i in range(29, -1, -1):
            d = today - timedelta(days=i)
            logs_d = AttendanceLog.objects.filter(attendance_date=d, attendance_type='IN')
            p_set = set()
            l_cnt = 0
            for lg in logs_d:
                if lg.employee_id not in p_set:
                    p_set.add(lg.employee_id)
                    if timezone.localtime(lg.event_time).time() > late_time:
                        l_cnt += 1
            chart_data.append({
                'date': d.strftime('%d %b'),
                'present': len(p_set),
                'late': l_cnt
            })
            
        last_event = HikvisionRawEvent.objects.order_by('-fetched_at').first()
        device_info = {
            'status': 'Online' if last_event and (timezone.now() - last_event.fetched_at).total_seconds() < 3600 else 'Offline / Standby',
            'last_sync': timezone.localtime(last_event.fetched_at).strftime('%H:%M (%d %b)') if last_event else 'Belum pernah'
        }
        
        total_present_30d = sum(item['present'] for item in chart_data)
        working_days_approx = total_emp * 22
        trend_pct = round((total_present_30d / working_days_approx) * 100, 1) if working_days_approx > 0 else 0
        trend_pct = min(100.0, trend_pct)  # Cap at 100% just in case
        
        return Response({
            'today_stats': today_stats,
            'recent_logs': recent_logs,
            'chart_data': chart_data,
            'trend_pct': trend_pct,
            'device_info': device_info,
        })

from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from datetime import time

class ExportAttendancePDFView(APIView):
    """GET /attendance/export-pdf/ — Export attendance as PDF"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'Unauthorized'}, status=403)
            
        target_date_str = request.query_params.get('date')
        if not target_date_str:
            target_date = date.today()
        else:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Laporan_Absensi_{target_date}.pdf"'
        
        doc = SimpleDocTemplate(response, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        elements.append(Paragraph(f"Laporan Absensi - {target_date.strftime('%d %b %Y')}", styles['Title']))
        elements.append(Spacer(1, 12))
        
        data = [['NIK', 'Nama Karyawan', 'Check In', 'Check Out', 'Status']]
        
        logs = AttendanceLog.objects.filter(attendance_date=target_date, attendance_type='IN').select_related('employee')
        
        for log in logs:
            first_in = timezone.localtime(log.event_time).strftime('%H:%M')
            out_log = AttendanceLog.objects.filter(employee=log.employee, attendance_date=target_date, attendance_type='OUT').order_by('-event_time').first()
            last_out = timezone.localtime(out_log.event_time).strftime('%H:%M') if out_log else '-'
            
            from leave.models import LeaveRequest
            approved_late = LeaveRequest.objects.filter(employee=log.employee, start_date=target_date, leave_type='IZIN_TERLAMBAT', status='APPROVED').first()
            late_time = approved_late.late_until if approved_late and approved_late.late_until else time(8, 0)
            status = 'Terlambat' if timezone.localtime(log.event_time).time() > late_time else 'Tepat Waktu'
            data.append([
                log.employee.nik,
                log.employee.full_name,
                first_in,
                last_out,
                status
            ])
            
        table = Table(data, colWidths=[60, 150, 80, 80, 100])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        doc.build(elements)
        
        return response
