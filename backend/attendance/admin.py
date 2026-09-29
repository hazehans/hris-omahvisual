from django.contrib import admin
from .models import AttendanceLog, HikvisionRawEvent


@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ('employee', 'attendance_date', 'event_time', 'attendance_type', 'verification_mode', 'source')
    list_filter = ('attendance_type', 'source', 'attendance_date')
    search_fields = ('employee__full_name', 'employee__nik')
    ordering = ('-attendance_date', '-event_time')
    date_hierarchy = 'attendance_date'


@admin.register(HikvisionRawEvent)
class HikvisionRawEventAdmin(admin.ModelAdmin):
    list_display = ('serial_no', 'event_time', 'major', 'minor', 'employee_no', 'name_on_device', 'attendance_status', 'verify_mode', 'fetched_at')
    list_filter = ('major', 'minor', 'attendance_status')
    search_fields = ('employee_no', 'name_on_device', 'card_no', 'serial_no')
    ordering = ('-event_time',)
    date_hierarchy = 'event_time'
    readonly_fields = ('fetched_at', 'raw_payload')
