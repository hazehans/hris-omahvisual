from django.urls import path
from .views import DailyLogListCreateAPIView

urlpatterns = [
    path('', DailyLogListCreateAPIView.as_view(), name='dailylog-list-create'),
]

