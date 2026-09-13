"""
employees/models.py — Master Data Karyawan & Lokasi Perusahaan
"""

from django.db import models
from django.conf import settings


class RoleChoices(models.TextChoices):
    """Role karyawan sesuai PRD §4."""
    # CV Group
    CV_KARYAWAN  = 'CV_KARYAWAN',  'Karyawan CV'
    CV_INTERN    = 'CV_INTERN',    'Intern CV'
    CV_MAGANG    = 'CV_MAGANG',    'Magang CV'
    # LED Group
    LED_KARYAWAN = 'LED_KARYAWAN', 'Karyawan LED'
    LED_INTERN   = 'LED_INTERN',   'Intern LED'
    LED_MAGANG   = 'LED_MAGANG',   'Magang LED'
    # Rental Group
    RENTAL_KARYAWAN = 'RENTAL_KARYAWAN', 'Karyawan Rental'
    RENTAL_MAGANG   = 'RENTAL_MAGANG',   'Magang Rental'
    RENTAL_STAFF    = 'RENTAL_STAFF',    'Staff Rental'
    # Gudang
    CREW_GUDANG  = 'CREW_GUDANG',  'Crew Gudang'
    # Admin
    ADMIN_HR     = 'ADMIN_HR',     'Admin HR'


# Grup role untuk pengelompokan logika bisnis
CV_LED_ROLES = [
    RoleChoices.CV_KARYAWAN, RoleChoices.CV_INTERN, RoleChoices.CV_MAGANG,
    RoleChoices.LED_KARYAWAN, RoleChoices.LED_INTERN, RoleChoices.LED_MAGANG,
]
RENTAL_ROLES = [
    RoleChoices.RENTAL_KARYAWAN, RoleChoices.RENTAL_MAGANG, RoleChoices.RENTAL_STAFF,
]


class Employee(models.Model):
    """
    Master data karyawan.
    Berelasi OneToOne ke User model (accounts.User).
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='_employee',
        verbose_name='Akun User'
    )
    full_name = models.CharField(max_length=200, verbose_name='Nama Lengkap')
    nik = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='NIK',
        help_text='Nomor Induk Karyawan (unik per karyawan)'
    )
    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        verbose_name='Role'
    )
    department = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Departemen'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Nomor HP'
    )
    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Tanggal Lahir'
    )
    photo = models.ImageField(
        upload_to='employees/photos/',
        null=True,
        blank=True,
        verbose_name='Foto Profil'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Aktif',
        help_text='Non-aktifkan untuk soft-delete karyawan.'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Karyawan'
        verbose_name_plural = 'Karyawan'
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"

    @property
    def is_cv_or_led(self):
        """True jika role termasuk grup CV atau LED."""
        return self.role in CV_LED_ROLES

    @property
    def is_rental(self):
        """True jika role termasuk grup Rental."""
        return self.role in RENTAL_ROLES

    @property
    def is_crew_gudang(self):
        """True jika role Crew Gudang."""
        return self.role == RoleChoices.CREW_GUDANG

    @property
    def is_admin_hr(self):
        """True jika role Admin HR."""
        return self.role == RoleChoices.ADMIN_HR


class CompanyLocation(models.Model):
    """
    Titik lokasi perusahaan untuk validasi geofencing.
    Sesuai PRD §5: minimal 2 lokasi (Kantor CV & Gudang LED, Toko Rental).
    """

    class LocationType(models.TextChoices):
        CV_LED  = 'CV_LED',  'Kantor CV / Gudang LED'
        RENTAL  = 'RENTAL',  'Toko Rental'
        CUSTOM  = 'CUSTOM',  'Lokasi Kustom'

    name = models.CharField(max_length=100, verbose_name='Nama Lokasi')
    location_type = models.CharField(
        max_length=10,
        choices=LocationType.choices,
        default=LocationType.CUSTOM,
        verbose_name='Tipe Lokasi'
    )
    latitude = models.FloatField(verbose_name='Latitude')
    longitude = models.FloatField(verbose_name='Longitude')
    radius_meter = models.PositiveIntegerField(
        default=100,
        verbose_name='Radius (meter)',
        help_text='Batas toleransi jarak absen dalam meter.'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Lokasi Perusahaan'
        verbose_name_plural = 'Lokasi Perusahaan'

    def __str__(self):
        return f"{self.name} (r={self.radius_meter}m)"
