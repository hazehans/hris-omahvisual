"""
attendance/models.py — Log Absensi Karyawan

Menyimpan rekam jejak clock-in/clock-out per karyawan per hari.
"""

from django.db import models
from employees.models import Employee


class AttendanceMode(models.TextChoices):
    REGULAR          = 'REGULAR',          'Mode Reguler (Kantor)'
    LED_INSTALLATION = 'LED_INSTALLATION', 'Mode Pemasangan LED (Proyek Luar)'


class AttendanceLog(models.Model):
    """
    Satu baris = satu hari kerja seorang karyawan.
    - clock_in: waktu masuk (TimeField)
    - clock_out: waktu pulang (nullable, diisi saat clock-out)
    - mode: REGULAR atau LED_INSTALLATION
    - geofence_valid: hasil validasi geofencing
    - is_late: True jika clock_in melebihi jam masuk kantor
    - is_overtime: True jika clock_out melebihi jam operasional
    - overtime_minutes: durasi lembur dalam menit
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='attendance_logs',
        verbose_name='Karyawan'
    )
    date = models.DateField(verbose_name='Tanggal')
    clock_in = models.TimeField(verbose_name='Jam Masuk')
    clock_out = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Jam Pulang'
    )
    mode = models.CharField(
        max_length=20,
        choices=AttendanceMode.choices,
        default=AttendanceMode.REGULAR,
        verbose_name='Mode Absensi'
    )

    # Geolokasi
    latitude = models.FloatField(
        null=True, blank=True,
        verbose_name='Latitude'
    )
    longitude = models.FloatField(
        null=True, blank=True,
        verbose_name='Longitude'
    )
    geofence_valid = models.BooleanField(
        default=False,
        verbose_name='Geofence Valid',
        help_text='True jika koordinat berada dalam radius yang ditentukan.'
    )

    # Foto (work evidence / live camera)
    photo = models.ImageField(
        upload_to='attendance/photos/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Foto Bukti Kerja'
    )

    # Status kehadiran
    is_late = models.BooleanField(
        default=False,
        verbose_name='Terlambat'
    )
    is_overtime = models.BooleanField(
        default=False,
        verbose_name='Lembur'
    )
    overtime_minutes = models.PositiveIntegerField(
        default=0,
        verbose_name='Durasi Lembur (menit)'
    )

    # Apakah ini absen di hari libur karyawan?
    is_day_off_attendance = models.BooleanField(
        default=False,
        verbose_name='Masuk di Hari Libur',
        help_text='True jika karyawan absen pada hari liburnya (seluruh durasi = lembur).'
    )

    # Catatan tambahan (misal: lokasi pemasangan LED)
    notes = models.TextField(
        blank=True,
        default='',
        verbose_name='Catatan'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Log Absensi'
        verbose_name_plural = 'Log Absensi'
        ordering = ['-date', 'employee']
        # Satu karyawan hanya boleh punya satu record per hari
        unique_together = [['employee', 'date']]

    def __str__(self):
        return f"{self.employee.full_name} — {self.date} ({self.get_mode_display()})"

    @property
    def work_duration_minutes(self):
        """Hitung total menit kerja (clock_in hingga clock_out)."""
        if not self.clock_out:
            return None
        from datetime import datetime, date
        dt_in  = datetime.combine(date.today(), self.clock_in)
        dt_out = datetime.combine(date.today(), self.clock_out)
        delta = dt_out - dt_in
        return int(delta.total_seconds() / 60)
