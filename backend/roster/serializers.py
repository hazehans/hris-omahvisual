"""
roster/serializers.py — Roster Serializers
"""

from rest_framework import serializers
from .models import WorkSchedule, HolidayOverride, DayOfWeek


class WorkScheduleSerializer(serializers.ModelSerializer):
    """Serializer untuk jadwal kerja karyawan."""
    employee_name   = serializers.CharField(source='employee.full_name', read_only=True)
    day_off_display = serializers.CharField(source='get_day_off_weekday_display', read_only=True)

    class Meta:
        model = WorkSchedule
        fields = [
            'id', 'employee', 'employee_name',
            'day_off_weekday', 'day_off_display',
            'effective_date', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'employee_name', 'day_off_display', 'created_at']


class UpdateDayOffSerializer(serializers.Serializer):
    """
    Serializer untuk Admin mengubah hari libur karyawan.
    Membuat WorkSchedule baru dengan effective_date yang ditentukan.
    """
    day_off_weekday = serializers.ChoiceField(choices=DayOfWeek.choices)
    effective_date  = serializers.DateField()
    notes           = serializers.CharField(required=False, allow_blank=True, default='')


class HolidayOverrideSerializer(serializers.ModelSerializer):
    """Serializer untuk override hari libur."""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)

    class Meta:
        model = HolidayOverride
        fields = [
            'id', 'employee', 'employee_name',
            'original_date', 'new_day_off_date', 'reason',
            'created_at',
        ]
        read_only_fields = ['id', 'employee_name', 'created_at']


class CalendarMatrixSerializer(serializers.Serializer):
    """
    Serializer untuk response matriks kalender bulanan.
    Tidak memetakan ke model langsung — dibangun secara dinamis di view.
    """
    employee_id   = serializers.IntegerField()
    employee_name = serializers.CharField()
    role          = serializers.CharField()
    department    = serializers.CharField()
    day_off_label = serializers.CharField()
    calendar      = serializers.DictField(
        child=serializers.DictField(),
        help_text='key: tanggal (YYYY-MM-DD), value: {is_day_off, has_attendance, override}'
    )

