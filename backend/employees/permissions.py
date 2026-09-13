"""
employees/permissions.py — Custom Permission Classes

IsAdminHR: hanya izinkan user dengan role ADMIN_HR.
"""

from rest_framework.permissions import BasePermission


class IsAdminHR(BasePermission):
    """
    Custom permission — hanya izinkan Admin HR.
    Digunakan di semua endpoint admin-only.
    """
    message = 'Hanya Admin HR yang diizinkan mengakses endpoint ini.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_admin_hr()

