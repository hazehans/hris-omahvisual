"""contracts/urls.py — Contract URL Patterns"""

from django.urls import path
from .views import (
    MyContractView,
    AdminContractListCreateView,
    AdminContractDetailView,
    HRNotificationView,
)

urlpatterns = [
    path('my-contract/',             MyContractView.as_view(),              name='my-contract'),
    path('admin/',                   AdminContractListCreateView.as_view(),  name='contract-admin-list'),
    path('admin/<int:contract_id>/', AdminContractDetailView.as_view(),      name='contract-admin-detail'),
    path('notifications/',           HRNotificationView.as_view(),           name='hr-notifications'),
    path('notifications/<int:notif_id>/', HRNotificationView.as_view(),      name='hr-notification-read'),
]
