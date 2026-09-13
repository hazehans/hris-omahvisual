"""
contracts/models.py — Manajemen Kontrak PKWT Karyawan

Menyimpan riwayat kontrak karyawan beserta tanggal mulai & berakhir.
Notifikasi otomatis di-generate lewat Celery task saat kontrak mendekati H-30.
"""

from django.db import models
from employees.models import Employee


class ContractType(models.TextChoices):
    PKWT = 'PKWT', 'PKWT (Perjanjian Kerja Waktu Tertentu)'


class Contract(models.Model):
    """
    Kontrak kerja karyawan.
    - Satu karyawan bisa punya banyak kontrak (riwayat).
    - Hanya satu kontrak yang aktif di satu waktu (start_date <= today <= end_date).
    - Dokumen kontrak bisa diupload (PDF).
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='contracts',
        verbose_name='Karyawan'
    )
    contract_type = models.CharField(
        max_length=10,
        choices=ContractType.choices,
        default=ContractType.PKWT,
        verbose_name='Jenis Kontrak'
    )
    start_date = models.DateField(verbose_name='Tanggal Mulai')
    end_date   = models.DateField(verbose_name='Tanggal Berakhir')
    document_file = models.FileField(
        upload_to='contracts/documents/%Y/',
        null=True,
        blank=True,
        verbose_name='Dokumen Kontrak (PDF)'
    )
    notes = models.TextField(
        blank=True,
        default='',
        verbose_name='Catatan'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Kontrak'
        verbose_name_plural = 'Kontrak'
        ordering = ['-start_date']

    def __str__(self):
        return (
            f"{self.employee.full_name} — "
            f"{self.get_contract_type_display()} "
            f"({self.start_date} s/d {self.end_date})"
        )

    @property
    def is_active(self):
        """True jika kontrak sedang aktif hari ini."""
        from datetime import date
        today = date.today()
        return self.start_date <= today <= self.end_date

    @property
    def days_remaining(self):
        """Sisa hari kontrak dari hari ini."""
        from datetime import date
        today = date.today()
        delta = self.end_date - today
        return delta.days


class HRNotification(models.Model):
    """
    Notifikasi untuk dashboard HR.
    Di-generate oleh Celery tasks (contract reminder & birthday reminder).
    """

    class NotificationType(models.TextChoices):
        CONTRACT_EXPIRY = 'CONTRACT_EXPIRY', 'Kontrak Hampir Habis'
        BIRTHDAY        = 'BIRTHDAY',        'Ulang Tahun Karyawan'

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        verbose_name='Tipe Notifikasi'
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='hr_notifications',
        verbose_name='Karyawan'
    )
    message = models.TextField(verbose_name='Pesan Notifikasi')
    is_read = models.BooleanField(default=False, verbose_name='Sudah Dibaca')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notifikasi HR'
        verbose_name_plural = 'Notifikasi HR'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_notification_type_display()}] {self.employee.full_name} — {self.created_at.date()}"
