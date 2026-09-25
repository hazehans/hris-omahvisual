"""dashboard/urls.py — Dashboard URL Patterns"""

from django.urls import path
from .views import HRDashboardView

urlpatterns = [
    path('', HRDashboardView.as_view(), name='hr-dashboard'),
]
