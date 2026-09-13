"""leave/admin.py — Register LeaveRequest di Django Admin."""

from django.contrib import admin
from .models import LeaveRequest


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display  = [
        'employee', 'leave_type', 'start_date', 'end_date',
        'duration_days', 'status', 'reviewed_by', 'reviewed_at'
    ]
    list_filter   = ['status', 'leave_type']
    search_fields = ['employee__full_name', 'reason']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']
    date_hierarchy = 'start_date'

    def duration_days(self, obj):
        return obj.duration_days
    duration_days.short_description = 'Durasi (hari)'
