import uuid
from django.db import models
from employees.models import Employee

class AttendanceLog(models.Model):
    SOURCE_CHOICES = [
        ('HIKVISION_MACHINE', 'Mesin Hikvision'),
        ('WEB_LED_MODE', 'Web - Mode LED'),
        ('WEB_RENTAL', 'Web - Rental'),
        ('MANUAL_BY_HR', 'Manual HR'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_logs')
    date = models.DateField(verbose_name="Tanggal Absen")
    
    # Waktu Jam Masuk & Pulang
    clock_in = models.DateTimeField(null=True, blank=True)
    clock_out = models.DateTimeField(null=True, blank=True)
    
    # Sumber Data (Fokus utama kita HIKVISION_MACHINE)
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='HIKVISION_MACHINE')
    
    # Lokasi & Foto (Untuk tim lapangan kedepannya)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    photo_evidence = models.ImageField(upload_to='attendance_photos/', null=True, blank=True)
    
    # Flag Pelanggaran & Lembur
    is_late = models.BooleanField(default=False)
    is_overtime = models.BooleanField(default=False)
    overtime_duration = models.DurationField(null=True, blank=True)
    
    # KPI Score (Nilai Poin Absen Harian)
    kpi_score = models.IntegerField(null=True, blank=True, verbose_name="Poin KPI")

    def __str__(self):
        return f"{self.employee.full_name} - {self.date}"

    class Meta:
        db_table = 'attendance_log'
        unique_together = [('employee', 'date')]


class HikvisionRawEvent(models.Model):
    """
    Menyimpan event MENTAH dari mesin Hikvision sebelum diproses.
    Data ini tidak boleh dimodifikasi manual — ini adalah 'bukti asli' dari mesin.

    Event yang disimpan bisa bermacam-macam (akses berhasil, gagal, dll).
    Yang diproses menjadi AttendanceLog hanya: major=5, minor=1.
    """
    # Identifier unik dari mesin untuk setiap event
    serial_no = models.BigIntegerField(verbose_name="Serial Event Mesin")
    event_date = models.DateField(verbose_name="Tanggal Event")

    # Waktu event persis seperti dari mesin (string ISO 8601)
    event_time_raw = models.CharField(max_length=50, verbose_name="Waktu Event (Raw)")

    # Tipe event (major=5, minor=1 = akses berhasil)
    major = models.IntegerField(default=0)
    minor = models.IntegerField(default=0)

    # Info karyawan dari mesin (bisa kosong untuk event non-absensi)
    employee_no = models.CharField(max_length=50, blank=True, verbose_name="ID Karyawan di Mesin")
    card_no = models.CharField(max_length=50, blank=True, verbose_name="Nomor Kartu")
    name_on_device = models.CharField(max_length=255, blank=True, verbose_name="Nama di Mesin")
    verify_mode = models.CharField(max_length=100, blank=True, verbose_name="Mode Verifikasi")
    door_no = models.IntegerField(null=True, blank=True, verbose_name="Nomor Pintu")

    # Raw payload JSON lengkap sebagai backup
    raw_payload = models.JSONField(verbose_name="Payload Lengkap (JSON)")

    # Timestamp saat data ini ditarik oleh sistem kita
    fetched_at = models.DateTimeField(auto_now_add=True, verbose_name="Waktu Fetch")

    def __str__(self):
        return f"Event #{self.serial_no} | {self.event_date} | emp={self.employee_no or '-'} | maj={self.major} min={self.minor}"

    class Meta:
        db_table = 'hikvision_raw_event'
        unique_together = [('serial_no', 'event_date')]
        ordering = ['event_date', 'event_time_raw']
        verbose_name = "Hikvision Raw Event"
        verbose_name_plural = "Hikvision Raw Events"
