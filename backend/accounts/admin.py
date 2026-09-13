"""accounts/admin.py — Register User model di Django Admin."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'device_id', 'is_active', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Device Binding', {'fields': ('device_id',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Device Binding', {'fields': ('device_id',)}),
    )
