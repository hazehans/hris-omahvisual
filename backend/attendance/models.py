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
