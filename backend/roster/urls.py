"""roster/urls.py — Roster URL Patterns"""

from django.urls import path
from .views import AdminCalendarView, AdminUpdateDayOffView, AdminHolidayOverrideView

urlpatterns = [
    path('admin/calendar/',                              AdminCalendarView.as_view(),       name='roster-calendar'),
    path('admin/update-dayoff/<int:employee_id>/',       AdminUpdateDayOffView.as_view(),   name='roster-update-dayoff'),
    path('admin/holiday-override/',                      AdminHolidayOverrideView.as_view(), name='roster-holiday-override'),
]
