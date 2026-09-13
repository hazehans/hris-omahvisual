"""
daily_report/models.py — Laporan Harian Karyawan

Karyawan submit laporan harian yang terhubung ke AttendanceLog hari itu.
"""

from django.db import models
from employees.models import Employee
from attendance.models import AttendanceLog


class DailyReport(models.Model):
    """
    Laporan harian karyawan.
    - Satu laporan per karyawan per hari.
    - Terhubung ke AttendanceLog hari yang sama (FK nullable: bisa submit walau belum clock-in).
    - content: Textarea bebas panjang.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='daily_reports',
        verbose_name='Karyawan'
    )
    date = models.DateField(verbose_name='Tanggal')
    content = models.TextField(
        verbose_name='Isi Laporan',
        help_text='Laporan aktivitas harian (textarea).'
    )
    attendance_log = models.OneToOneField(
        AttendanceLog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='daily_report',
        verbose_name='Log Absensi Terkait',
        help_text='Otomatis terhubung ke log absensi hari yang sama.'
    )
    submitted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Waktu Submit'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Laporan Harian'
        verbose_name_plural = 'Laporan Harian'
        ordering = ['-date']
        unique_together = [['employee', 'date']]

    def __str__(self):
        return f"{self.employee.full_name} — {self.date}"
