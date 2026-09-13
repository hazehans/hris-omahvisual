"""
leave/serializers.py — Leave Serializers
"""

from rest_framework import serializers
from datetime import date, timedelta
from .models import LeaveRequest, LeaveType, LeaveStatus


class LeaveRequestSubmitSerializer(serializers.Serializer):
    """
    Serializer untuk pengajuan izin/cuti.
    Validasi H-2: start_date minimal hari ini + 2 hari.
    """
    leave_type = serializers.ChoiceField(choices=LeaveType.choices)
    start_date = serializers.DateField()
    end_date   = serializers.DateField()
    reason     = serializers.CharField(min_length=5)

    def validate_start_date(self, value):
        """Validasi H-2: start_date harus >= hari ini + 2."""
        min_date = date.today() + timedelta(days=2)
        if value < min_date:
            raise serializers.ValidationError(
                f'Pengajuan harus minimal H-2. Tanggal paling awal: {min_date.isoformat()}.'
            )
        return value

    def validate(self, attrs):
        """Validasi end_date >= start_date."""
        if attrs['end_date'] < attrs['start_date']:
            raise serializers.ValidationError(
                {'end_date': 'Tanggal selesai tidak boleh sebelum tanggal mulai.'}
            )
        return attrs


class LeaveRequestSerializer(serializers.ModelSerializer):
    """Serializer response lengkap untuk LeaveRequest."""
    employee_name     = serializers.CharField(source='employee.full_name', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display    = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name  = serializers.SerializerMethodField()
    duration_days     = serializers.ReadOnlyField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name',
            'leave_type', 'leave_type_display',
            'start_date', 'end_date', 'duration_days',
            'reason', 'status', 'status_display',
            'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'review_note',
            'created_at',
        ]
        read_only_fields = fields

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.full_name if obj.reviewed_by else None


class LeaveReviewSerializer(serializers.Serializer):
    """
    Serializer untuk Admin mereview pengajuan.
    Payload: {"status": "APPROVED" atau "REJECTED", "review_note": "..."}
    """
    status = serializers.ChoiceField(
        choices=[LeaveStatus.APPROVED, LeaveStatus.REJECTED]
    )
    review_note = serializers.CharField(required=False, allow_blank=True, default='')

