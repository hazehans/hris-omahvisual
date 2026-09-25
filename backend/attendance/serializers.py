"""
attendance/serializers.py — Attendance Serializers
"""

from rest_framework import serializers
from django.utils import timezone
from .models import AttendanceLog, AttendanceMode


class ClockInSerializer(serializers.Serializer):
    """
    Serializer untuk clock-in.
    Payload disesuaikan per role (geofence, foto, mode).
    """
    latitude  = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    photo     = serializers.ImageField(required=False, allow_null=True)
    mode      = serializers.ChoiceField(
        choices=AttendanceMode.choices,
        default=AttendanceMode.REGULAR
    )
    notes     = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
        help_text='Catatan opsional (misal: alamat lokasi pemasangan LED).'
    )

    def validate(self, attrs):
        request = self.context.get('request')
        employee = request.user._employee
        mode = attrs.get('mode', AttendanceMode.REGULAR)

        from .services import get_attendance_rules
        rules = get_attendance_rules(employee, mode)

        # Validasi foto wajib
        if rules['requires_photo'] and not attrs.get('photo'):
            raise serializers.ValidationError(
                {'photo': 'Foto wajib diunggah untuk role/mode ini.'}
            )

        # Validasi koordinat wajib jika geofence diperlukan
        if rules['requires_geofence']:
            if attrs.get('latitude') is None or attrs.get('longitude') is None:
                raise serializers.ValidationError(
                    {'latitude': 'Koordinat GPS diperlukan untuk absensi ini.'}
                )

        return attrs


class ClockOutSerializer(serializers.Serializer):
    """
    Serializer untuk clock-out.
    Minimal tidak membutuhkan payload tambahan (clock-out menggunakan waktu sekarang).
    Namun foto opsional bisa dikirim.
    """
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class AttendanceLogSerializer(serializers.ModelSerializer):
    """Serializer untuk response AttendanceLog."""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_role = serializers.CharField(source='employee.role', read_only=True)
    mode_display  = serializers.CharField(source='get_mode_display', read_only=True)
    work_duration_minutes = serializers.ReadOnlyField()

    class Meta:
        model = AttendanceLog
        fields = [
            'id', 'employee', 'employee_name', 'employee_role',
            'date', 'clock_in', 'clock_out',
            'mode', 'mode_display',
            'latitude', 'longitude', 'geofence_valid',
            'photo',
            'is_late', 'is_overtime', 'overtime_minutes',
            'is_day_off_attendance', 'notes',
            'work_duration_minutes',
            'created_at',
        ]
        read_only_fields = fields


class AttendanceTodaySerializer(serializers.ModelSerializer):
    """Serializer ringkas untuk status absensi hari ini."""
    mode_display = serializers.CharField(source='get_mode_display', read_only=True)
    has_clocked_in  = serializers.SerializerMethodField()
    has_clocked_out = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceLog
        fields = [
            'id', 'date', 'clock_in', 'clock_out',
            'mode', 'mode_display',
            'geofence_valid', 'is_late', 'is_overtime',
            'overtime_minutes', 'photo',
            'has_clocked_in', 'has_clocked_out',
        ]

    def get_has_clocked_in(self, obj):
        return obj.clock_in is not None

    def get_has_clocked_out(self, obj):
        return obj.clock_out is not None


class AdminAttendanceSummarySerializer(serializers.ModelSerializer):
    """Serializer untuk summary attendance di Admin dashboard."""
    employee_name       = serializers.CharField(source='employee.full_name', read_only=True)
    employee_role       = serializers.CharField(source='employee.role', read_only=True)
    role_display        = serializers.CharField(source='employee.get_role_display', read_only=True)
    department          = serializers.CharField(source='employee.department', read_only=True)
    mode_display        = serializers.CharField(source='get_mode_display', read_only=True)
    has_clocked_out     = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceLog
        fields = [
            'id', 'employee', 'employee_name', 'employee_role',
            'role_display', 'department',
            'date', 'clock_in', 'clock_out', 'has_clocked_out',
            'mode', 'mode_display',
            'geofence_valid', 'is_late', 'is_overtime',
        ]

    def get_has_clocked_out(self, obj):
        return obj.clock_out is not None

