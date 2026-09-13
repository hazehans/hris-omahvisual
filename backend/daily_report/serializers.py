"""
daily_report/serializers.py — Daily Report Serializers
"""

from rest_framework import serializers
from .models import DailyReport


class DailyReportSubmitSerializer(serializers.Serializer):
    """Serializer untuk submit laporan harian."""
    content = serializers.CharField(
        min_length=10,
        help_text='Isi laporan harian minimal 10 karakter.'
    )


class DailyReportSerializer(serializers.ModelSerializer):
    """Serializer lengkap untuk response DailyReport."""
    employee_name    = serializers.CharField(source='employee.full_name', read_only=True)
    employee_role    = serializers.CharField(source='employee.role', read_only=True)
    has_attendance   = serializers.SerializerMethodField()
    attendance_clock_in  = serializers.SerializerMethodField()
    attendance_clock_out = serializers.SerializerMethodField()

    class Meta:
        model = DailyReport
        fields = [
            'id', 'employee', 'employee_name', 'employee_role',
            'date', 'content',
            'has_attendance', 'attendance_clock_in', 'attendance_clock_out',
            'submitted_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_has_attendance(self, obj):
        return obj.attendance_log is not None

    def get_attendance_clock_in(self, obj):
        if obj.attendance_log:
            return str(obj.attendance_log.clock_in)
        return None

    def get_attendance_clock_out(self, obj):
        if obj.attendance_log and obj.attendance_log.clock_out:
            return str(obj.attendance_log.clock_out)
        return None


class DailyReportAdminSerializer(serializers.ModelSerializer):
    """Serializer untuk Admin view — ringkas untuk log book monitor."""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    role_display  = serializers.CharField(source='employee.get_role_display', read_only=True)
    department    = serializers.CharField(source='employee.department', read_only=True)

    class Meta:
        model = DailyReport
        fields = [
            'id', 'employee', 'employee_name', 'role_display', 'department',
            'date', 'content', 'submitted_at',
        ]
        read_only_fields = fields

