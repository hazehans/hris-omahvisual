from django.contrib import admin
from .models import AttendanceLog, HikvisionRawEvent


@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'clock_in', 'clock_out', 'is_late', 'kpi_score', 'source')
    list_filter = ('date', 'is_late', 'source')
    search_fields = ('employee__full_name', 'employee__nik')
    ordering = ('-date', 'clock_in')
    date_hierarchy = 'date'


@admin.register(HikvisionRawEvent)
class HikvisionRawEventAdmin(admin.ModelAdmin):
    list_display = ('serial_no', 'event_date', 'event_time_raw', 'major', 'minor', 'employee_no', 'name_on_device', 'verify_mode', 'fetched_at')
    list_filter = ('event_date', 'major', 'minor')
    search_fields = ('employee_no', 'name_on_device', 'card_no', 'serial_no')
    ordering = ('-event_date', 'event_time_raw')
    date_hierarchy = 'event_date'
    readonly_fields = ('fetched_at', 'raw_payload')
