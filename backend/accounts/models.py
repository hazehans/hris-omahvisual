"""
accounts/models.py — Custom User Model

Extends AbstractUser dengan field device_id untuk device binding (anti-titip absen).
Relasi OneToOne ke Employee didefinisikan di employees app untuk menghindari circular import.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User Model.
    - Menggantikan auth.User default Django.
    - Menambah field device_id untuk device binding.
    - Relasi ke Employee via OneToOneField (defined di employees.Employee).
    """

    device_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text=(
            "ID unik perangkat karyawan. "
            "Diisi otomatis saat login pertama kali. "
            "Null berarti belum terikat atau sudah di-reset oleh Admin."
        )
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.username

    @property
    def employee(self):
        """Shortcut ke objek Employee yang berelasi."""
        try:
            return self._employee
        except Exception:
            return None

    def is_admin_hr(self):
        """Cek apakah user memiliki role ADMIN_HR."""
        try:
            return self._employee.role == 'ADMIN_HR'
        except Exception:
            return False
