"""roster/admin.py"""

from django.contrib import admin
from .models import WorkSchedule, HolidayOverride


@admin.register(WorkSchedule)
class WorkScheduleAdmin(admin.ModelAdmin):
    list_display  = ['employee', 'day_off_weekday', 'effective_date', 'notes']
    list_filter   = ['day_off_weekday']
    search_fields = ['employee__full_name']


@admin.register(HolidayOverride)
class HolidayOverrideAdmin(admin.ModelAdmin):
    list_display  = ['employee', 'original_date', 'new_day_off_date', 'reason', 'created_by']
    search_fields = ['employee__full_name']
