import uuid
from django.db import models
from django.conf import settings
from employees.models import Employee

class LeaveRequest(models.Model):
    LEAVE_CHOICES = [
        ('CUTI', 'Cuti Tahunan'),
        ('IZIN', 'Izin Keperluan'),
        ('SAKIT', 'Sakit'),
        ('IZIN_TERLAMBAT', 'Izin Terlambat'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Menunggu Persetujuan'),
        ('APPROVED', 'Disetujui'),
        ('REJECTED', 'Ditolak'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=LEAVE_CHOICES)
    
    start_date = models.DateField()
    end_date = models.DateField()
    # Khusus untuk IZIN_TERLAMBAT: sampai jam berapa izin terlambat berlaku
    late_until = models.TimeField(null=True, blank=True, help_text='Khusus IZIN_TERLAMBAT: izin terlambat berlaku sampai jam ini')
    reason = models.TextField()
    attachment = models.FileField(upload_to='leave_attachments/', null=True, blank=True)
    signed_attachment = models.FileField(upload_to='leave_attachments/signed/', null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type} ({self.status})"

    class Meta:
        db_table = 'leave_request'
