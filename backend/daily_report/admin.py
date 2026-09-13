"""daily_report/admin.py — Register DailyReport di Django Admin."""

from django.contrib import admin
from .models import DailyReport


@admin.register(DailyReport)
class DailyReportAdmin(admin.ModelAdmin):
    list_display  = ['employee', 'date', 'submitted_at', 'has_attendance']
    list_filter   = ['date']
    search_fields = ['employee__full_name', 'content']
    readonly_fields = ['submitted_at', 'updated_at']
    date_hierarchy = 'date'

    def has_attendance(self, obj):
        return obj.attendance_log is not None
    has_attendance.boolean = True
    has_attendance.short_description = 'Ada Absensi?'
