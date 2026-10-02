from rest_framework import serializers
from datetime import date
from .models import LeaveRequest


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_nik = serializers.CharField(source='employee.nik', read_only=True)
    urgency_warning = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee_name', 'employee_nik',
            'leave_type', 'start_date', 'end_date', 'late_until',
            'reason', 'attachment', 'signed_attachment',
            'status', 'created_at', 'urgency_warning',
        ]

    def get_urgency_warning(self, obj) -> str | None:
        """Tampilkan warning di sisi HR jika izin diajukan H-1 atau H-0."""
        try:
            delta = (obj.start_date - date.today()).days
            if delta == 0:
                return 'H-0: Izin untuk hari ini!'
            elif delta == 1:
                return 'H-1: Izin untuk besok!'
        except Exception:
            pass
        return None
