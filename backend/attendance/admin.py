"""attendance/admin.py — Register AttendanceLog di Django Admin."""

from django.contrib import admin
from .models import AttendanceLog


@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display  = [
        'employee', 'date', 'clock_in', 'clock_out',
        'mode', 'geofence_valid', 'is_late', 'is_overtime', 'overtime_minutes'
    ]
    list_filter   = ['mode', 'geofence_valid', 'is_late', 'is_overtime', 'date']
    search_fields = ['employee__full_name', 'employee__nik']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
