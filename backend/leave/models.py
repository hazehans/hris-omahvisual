"""
leave/models.py — Pengajuan Izin/Cuti

Model:
    - LeaveRequest: Pengajuan izin atau cuti karyawan
    - Status: PENDING → APPROVED / REJECTED / AUTO_REJECTED
"""

from django.db import models
from employees.models import Employee


class LeaveType(models.TextChoices):
    IZIN = 'IZIN', 'Izin'
    CUTI = 'CUTI', 'Cuti'


class LeaveStatus(models.TextChoices):
    PENDING      = 'PENDING',      'Menunggu Persetujuan'
    APPROVED     = 'APPROVED',     'Disetujui'
    REJECTED     = 'REJECTED',     'Ditolak'
    AUTO_REJECTED = 'AUTO_REJECTED', 'Ditolak Otomatis (H-1)'


class LeaveRequest(models.Model):
    """
    Pengajuan izin atau cuti karyawan.

    Business Rules (PRD §5):
        - Pengajuan minimal H-2 dari tanggal mulai.
        - Jika belum direspons Admin pada H-1 pukul 23:59 → AUTO_REJECTED oleh Celery.
        - Admin bisa APPROVED atau REJECTED secara manual.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='leave_requests',
        verbose_name='Karyawan'
    )
    leave_type = models.CharField(
        max_length=10,
        choices=LeaveType.choices,
        verbose_name='Jenis'
    )
    start_date = models.DateField(verbose_name='Tanggal Mulai')
    end_date   = models.DateField(verbose_name='Tanggal Selesai')
    reason     = models.TextField(verbose_name='Alasan')
    status     = models.CharField(
        max_length=15,
        choices=LeaveStatus.choices,
        default=LeaveStatus.PENDING,
        verbose_name='Status'
    )

    # Diisi saat Admin melakukan review
    reviewed_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_leaves',
        verbose_name='Direview oleh'
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Waktu Review'
    )
    review_note = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name='Catatan Review (opsional)'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Pengajuan Izin/Cuti'
        verbose_name_plural = 'Pengajuan Izin/Cuti'
        ordering = ['-created_at']

    def __str__(self):
        return (
            f"{self.employee.full_name} — "
            f"{self.get_leave_type_display()} "
            f"({self.start_date} s/d {self.end_date}) "
            f"[{self.get_status_display()}]"
        )

    @property
    def duration_days(self):
        """Jumlah hari izin/cuti."""
        return (self.end_date - self.start_date).days + 1
