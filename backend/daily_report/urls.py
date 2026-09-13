"""
daily_report/urls.py — Daily Report URL Patterns
"""

from django.urls import path
from .views import DailyReportView, AdminDailyReportView

urlpatterns = [
    path('',       DailyReportView.as_view(),      name='daily-report'),
    path('admin/', AdminDailyReportView.as_view(),  name='daily-report-admin'),
]
