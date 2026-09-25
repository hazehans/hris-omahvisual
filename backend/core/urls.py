"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Endpoint Autentikasi JWT & Role Checker
    path('api/v1/auth/', include('accounts.urls')),
    
    # Pintu masuk (API)
    path('api/v1/attendance/', include('attendance.urls')),
    path('api/v1/leave/', include('leave.urls')),
    path('api/v1/employees/', include('employees.urls')),
    path('api/v1/daily-logs/', include('daily_report.urls')),
]

# Mengizinkan akses URL ke folder media saat DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
