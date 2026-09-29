from rest_framework import serializers
from .models import AttendanceLog, HikvisionRawEvent

class HikvisionRawEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = HikvisionRawEvent
        fields = '__all__'

class AttendanceLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_nik = serializers.CharField(source='employee.nik', read_only=True)
    hikvision_id = serializers.CharField(source='employee.hikvision_id', read_only=True)
    
    class Meta:
        model = AttendanceLog
        fields = [
            'id', 'employee', 'employee_name', 'employee_nik', 'hikvision_id',
            'attendance_date', 'event_time', 'attendance_type',
            'verification_mode', 'source', 'created_at',
        ]

class AttendanceSummarySerializer(serializers.Serializer):
    """For daily attendance summary view"""
    employee_id = serializers.IntegerField()
    employee_name = serializers.CharField()
    employee_nik = serializers.CharField()
    date = serializers.DateField()
    first_in = serializers.DateTimeField(allow_null=True)
    last_out = serializers.DateTimeField(allow_null=True)
    total_events = serializers.IntegerField()
    is_late = serializers.BooleanField()
