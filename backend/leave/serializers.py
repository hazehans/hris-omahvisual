from rest_framework import serializers
from .models import LeaveRequest

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_nik = serializers.CharField(source='employee.nik', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = ['id', 'employee_name', 'employee_nik', 'leave_type', 'start_date', 'end_date', 'reason', 'attachment', 'signed_attachment', 'status', 'created_at']

