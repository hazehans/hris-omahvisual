"""
URL Configuration — HRIS OmahVisual
Base URL: /api/v1/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/employees/', include('employees.urls')),
    path('api/v1/attendance/', include('attendance.urls')),
    path('api/v1/daily-report/', include('daily_report.urls')),
    path('api/v1/leave/', include('leave.urls')),
    path('api/v1/contracts/', include('contracts.urls')),
    path('api/v1/roster/', include('roster.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
]

# Serve media files di development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
