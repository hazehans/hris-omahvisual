"""
leave/urls.py — Leave URL Patterns
"""

from django.urls import path
from .views import (
    LeaveRequestSubmitView,
    MyLeaveRequestsView,
    AdminPendingLeavesView,
    AdminLeaveReviewView,
)

urlpatterns = [
    path('request/',              LeaveRequestSubmitView.as_view(),  name='leave-request'),
    path('my-requests/',          MyLeaveRequestsView.as_view(),     name='leave-my-requests'),
    path('admin/pending/',        AdminPendingLeavesView.as_view(),  name='leave-admin-pending'),
    path('admin/review/<int:leave_id>/', AdminLeaveReviewView.as_view(), name='leave-admin-review'),
]
