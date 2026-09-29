from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)  # e.g. LOGIN, LOGOUT, EMPLOYEE_CREATE, EMPLOYEE_UPDATE, etc.
    target_type = models.CharField(max_length=100, null=True, blank=True)  # e.g. Employee, LeaveRequest
    target_id = models.CharField(max_length=255, null=True, blank=True)
    detail = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_log'
        ordering = ['-created_at']
