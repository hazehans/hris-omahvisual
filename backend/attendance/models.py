from django.db import models

class HikvisionRawEvent(models.Model):
    device_serial = models.CharField(max_length=100, default='default')
    serial_no = models.BigIntegerField()
    event_time = models.DateTimeField()  # parsed from time field
    major = models.IntegerField()
    minor = models.IntegerField()
    employee_no = models.CharField(max_length=50, blank=True, default='')
    name_on_device = models.CharField(max_length=255, blank=True, default='')
    card_no = models.CharField(max_length=100, blank=True, default='')
    card_type = models.CharField(max_length=50, blank=True, default='')
    card_reader_no = models.IntegerField(null=True, blank=True)
    door_no = models.IntegerField(null=True, blank=True)
    verify_mode = models.CharField(max_length=100, blank=True, default='')
    attendance_status = models.CharField(max_length=50, blank=True, default='')  # checkIn, checkOut
    attendance_label = models.CharField(max_length=100, blank=True, default='')  # Clock-In, Clock-Out
    user_type = models.CharField(max_length=50, blank=True, default='')
    raw_payload = models.JSONField()
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hikvision_raw_event'
        unique_together = [('device_serial', 'serial_no')]
        ordering = ['-event_time']

class AttendanceLog(models.Model):
    ATTENDANCE_TYPE_CHOICES = [
        ('IN', 'Clock In'),
        ('OUT', 'Clock Out'),
    ]

    employee = models.ForeignKey('employees.Employee', on_delete=models.CASCADE, related_name='attendance_logs')
    raw_event = models.OneToOneField(HikvisionRawEvent, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_record')
    attendance_date = models.DateField()
    event_time = models.DateTimeField()
    attendance_type = models.CharField(max_length=10, choices=ATTENDANCE_TYPE_CHOICES)  # IN or OUT
    verification_mode = models.CharField(max_length=100, blank=True, default='')
    source = models.CharField(max_length=50, default='hikvision')
    # True jika karyawan memiliki IZIN_TERLAMBAT yang approved sehingga tidak dihitung terlambat
    is_late_exempt = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance_log'
        ordering = ['-event_time']
        indexes = [
            models.Index(fields=['employee', 'attendance_date']),
            models.Index(fields=['attendance_date']),
        ]

