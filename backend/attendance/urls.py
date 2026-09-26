from django.urls import path
from .views import RawEventAPIView, HikvisionWebhookView, TodayAttendanceAPIView, FetchHikvisionView, AttendanceHistoryAPIView, AttendanceAnalyticsAPIView

urlpatterns = [
    # Legacy webhook (tidak aktif, dipertahankan untuk kompatibilitas)
    path('iot/hikvision-webhook/', HikvisionWebhookView.as_view(), name='hikvision-webhook'),

    # Data absensi hari ini (atau tanggal tertentu via ?date=YYYY-MM-DD)
    path('today/', TodayAttendanceAPIView.as_view(), name='today-attendance'),

    # Trigger fetch data dari mesin Hikvision (POST, body: {"date": "YYYY-MM-DD"})
    path('fetch/', FetchHikvisionView.as_view(), name='fetch-hikvision'),

    # Riwayat absensi dengan filter range tanggal
    path('history/', AttendanceHistoryAPIView.as_view(), name='attendance-history'),
    path('analytics/', AttendanceAnalyticsAPIView.as_view(), name='attendance-analytics'),
    path('raw-events/', RawEventAPIView.as_view(), name='raw-events'),
]
