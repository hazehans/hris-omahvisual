from django.db import models
from employees.models import Employee
from django.utils.timezone import localdate

class DailyLog(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='daily_logs')
    date = models.DateField(default=localdate)
    activity = models.TextField(verbose_name="Aktivitas Pekerjaan")
    work_link = models.URLField(max_length=500, null=True, blank=True, verbose_name="Link Kerja")
    issue = models.TextField(null=True, blank=True, verbose_name="Kendala")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.full_name} | {self.date}"

    class Meta:
        db_table = 'daily_report_log'
        ordering = ['-created_at']
