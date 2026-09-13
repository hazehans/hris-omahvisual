"""employees/admin.py — Register Employee & CompanyLocation di Django Admin."""

from django.contrib import admin
from .models import Employee, CompanyLocation


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'nik', 'role', 'department', 'is_active']
    list_filter = ['role', 'is_active', 'department']
    search_fields = ['full_name', 'nik', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CompanyLocation)
class CompanyLocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'location_type', 'latitude', 'longitude', 'radius_meter', 'is_active']
    list_filter = ['location_type', 'is_active']
