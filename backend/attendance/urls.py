from django.urls import path
from . import views

urlpatterns = [
    # Attendance data
    path('today/', views.TodayAttendanceView.as_view(), name='attendance-today'),
    path('fetch/', views.FetchHikvisionView.as_view(), name='attendance-fetch'),
    path('auto-sync/', views.AutoSyncView.as_view(), name='attendance-auto-sync'),
    path('history/', views.AttendanceHistoryView.as_view(), name='attendance-history'),
    path('analytics/', views.AttendanceAnalyticsView.as_view(), name='attendance-analytics'),
    path('superuser-dashboard/', views.SuperuserDashboardView.as_view(), name='superuser-dashboard'),
    path('raw-events/', views.RawEventListView.as_view(), name='raw-events'),
    path('raw-events/summary/', views.RawEventSummaryView.as_view(), name='raw-events-summary'),
    
    # Hikvision device management
    path('device-info/', views.HikvisionDeviceInfoView.as_view(), name='device-info'),
    path('device-users/', views.HikvisionDeviceUsersView.as_view(), name='device-users'),
    path('device-push-user/', views.HikvisionPushUserView.as_view(), name='device-push-user'),
    path('device-delete-user/', views.HikvisionDeleteUserView.as_view(), name='device-delete-user'),
    path('device-cards/', views.HikvisionCardListView.as_view(), name='device-cards'),
    path('device-bind-card/', views.HikvisionBindCardView.as_view(), name='device-bind-card'),
    path('device-unbind-card/', views.HikvisionUnbindCardView.as_view(), name='device-unbind-card'),
    path('export-pdf/', views.ExportAttendancePDFView.as_view(), name='attendance-export-pdf'),
]
