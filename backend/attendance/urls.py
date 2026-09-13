"""
attendance/urls.py — Attendance URL Patterns
"""

from django.urls import path
from .views import (
    ClockInView,
    ClockOutView,
    TodayAttendanceView,
    AttendanceHistoryView,
    AdminAttendanceSummaryView,
)

urlpatterns = [
    path('clock-in/',       ClockInView.as_view(),              name='attendance-clock-in'),
    path('clock-out/',      ClockOutView.as_view(),             name='attendance-clock-out'),
    path('today/',          TodayAttendanceView.as_view(),      name='attendance-today'),
    path('history/',        AttendanceHistoryView.as_view(),    name='attendance-history'),
    path('admin/summary/',  AdminAttendanceSummaryView.as_view(), name='attendance-admin-summary'),
]
