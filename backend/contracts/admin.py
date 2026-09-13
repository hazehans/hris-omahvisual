"""contracts/admin.py"""

from django.contrib import admin
from .models import Contract, HRNotification


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display  = ['employee', 'contract_type', 'start_date', 'end_date', 'is_active', 'days_remaining']
    list_filter   = ['contract_type']
    search_fields = ['employee__full_name', 'employee__nik']
    readonly_fields = ['created_at', 'updated_at']

    def is_active(self, obj):
        return obj.is_active
    is_active.boolean = True
    is_active.short_description = 'Aktif?'

    def days_remaining(self, obj):
        return f"{obj.days_remaining} hari"
    days_remaining.short_description = 'Sisa'


@admin.register(HRNotification)
class HRNotificationAdmin(admin.ModelAdmin):
    list_display  = ['notification_type', 'employee', 'is_read', 'created_at']
    list_filter   = ['notification_type', 'is_read']
    readonly_fields = ['created_at']
