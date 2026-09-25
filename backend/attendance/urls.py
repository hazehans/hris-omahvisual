from django.urls import path
from .views import HikvisionWebhookView, TodayAttendanceAPIView

urlpatterns = [
    # Pintu masuk (Endpoint) untuk IoT Hikvision
    path('iot/hikvision-webhook/', HikvisionWebhookView.as_view(), name='hikvision-webhook'),
    path('today/', TodayAttendanceAPIView.as_view(), name='today-attendance'),
]

