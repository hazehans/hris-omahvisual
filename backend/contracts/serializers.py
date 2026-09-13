"""
contracts/serializers.py — Contract Serializers
"""

from rest_framework import serializers
from .models import Contract, HRNotification


class ContractSerializer(serializers.ModelSerializer):
    """Serializer lengkap untuk Contract."""
    employee_name      = serializers.CharField(source='employee.full_name', read_only=True)
    contract_type_display = serializers.CharField(source='get_contract_type_display', read_only=True)
    is_active          = serializers.ReadOnlyField()
    days_remaining     = serializers.ReadOnlyField()

    class Meta:
        model = Contract
        fields = [
            'id', 'employee', 'employee_name',
            'contract_type', 'contract_type_display',
            'start_date', 'end_date',
            'is_active', 'days_remaining',
            'document_file', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'employee_name', 'contract_type_display',
            'is_active', 'days_remaining', 'created_at', 'updated_at',
        ]


class ContractCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk membuat/update kontrak (Admin)."""
    class Meta:
        model = Contract
        fields = [
            'employee', 'contract_type',
            'start_date', 'end_date',
            'document_file', 'notes',
        ]

    def validate(self, attrs):
        if attrs['end_date'] <= attrs['start_date']:
            raise serializers.ValidationError(
                {'end_date': 'Tanggal berakhir harus setelah tanggal mulai.'}
            )
        return attrs


class HRNotificationSerializer(serializers.ModelSerializer):
    """Serializer untuk notifikasi HR di dashboard."""
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    type_display  = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = HRNotification
        fields = [
            'id', 'notification_type', 'type_display',
            'employee', 'employee_name',
            'message', 'is_read', 'created_at',
        ]
        read_only_fields = [
            'id', 'notification_type', 'type_display',
            'employee_name', 'message', 'created_at',
        ]

