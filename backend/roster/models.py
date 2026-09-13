"""
roster/models.py — Manajemen Jadwal & Hari Libur Karyawan

Models:
    - WorkSchedule: Jadwal hari libur default per karyawan
    - HolidayOverride: Override hari libur untuk minggu/tanggal tertentu
"""

from django.db import models
from employees.models import Employee


class DayOfWeek(models.IntegerChoices):
    SENIN   = 0, 'Senin'
    SELASA  = 1, 'Selasa'
    RABU    = 2, 'Rabu'
    KAMIS   = 3, 'Kamis'
    JUMAT   = 4, 'Jumat'
    SABTU   = 5, 'Sabtu'
    MINGGU  = 6, 'Minggu'


class WorkSchedule(models.Model):
    """
    Jadwal hari libur mingguan per karyawan.
    Default: Rabu (weekday=2).

    Jika ada perubahan permanen (misal: karyawan pindah hari libur ke Kamis),
    buat record baru dengan effective_date yang baru. Record terbaru yang berlaku.
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='work_schedules',
        verbose_name='Karyawan'
    )
    day_off_weekday = models.IntegerField(
        choices=DayOfWeek.choices,
        default=DayOfWeek.RABU,
        verbose_name='Hari Libur'
    )
    effective_date = models.DateField(
        verbose_name='Berlaku Mulai Tanggal',
        help_text='Jadwal ini berlaku mulai tanggal ini ke depan.'
    )
    notes = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name='Keterangan'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Jadwal Kerja'
        verbose_name_plural = 'Jadwal Kerja'
        ordering = ['-effective_date']

    def __str__(self):
        return (
            f"{self.employee.full_name} — Libur: "
            f"{DayOfWeek(self.day_off_weekday).label} "
            f"(mulai {self.effective_date})"
        )


class HolidayOverride(models.Model):
    """
    Override hari libur untuk tanggal spesifik.
    Digunakan Admin untuk memindahkan hari libur karyawan pada minggu tertentu.

    Contoh: Hari libur normal Rabu 17 Sep dipindah ke Kamis 18 Sep.
    → original_date=2026-09-17, new_day_off_date=2026-09-18
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='holiday_overrides',
        verbose_name='Karyawan'
    )
    original_date = models.DateField(
        verbose_name='Tanggal Libur Asli',
        help_text='Tanggal hari libur yang dipindahkan.'
    )
    new_day_off_date = models.DateField(
        verbose_name='Tanggal Libur Baru',
        help_text='Tanggal pengganti hari libur.'
    )
    reason = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name='Alasan Perubahan'
    )
    created_by = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_overrides',
        verbose_name='Dibuat oleh (Admin)'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Override Hari Libur'
        verbose_name_plural = 'Override Hari Libur'

    def __str__(self):
        return (
            f"{self.employee.full_name}: "
            f"{self.original_date} → {self.new_day_off_date}"
        )
