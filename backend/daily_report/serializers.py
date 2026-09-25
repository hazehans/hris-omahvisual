from rest_framework import serializers
from .models import DailyLog

class DailyLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_role = serializers.CharField(source='employee.role', read_only=True)

    class Meta:
        model = DailyLog
        fields = ['id', 'employee_name', 'employee_role', 'date', 'activity', 'work_link', 'issue', 'created_at']

