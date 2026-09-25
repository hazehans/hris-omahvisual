from django.urls import path
from .views import LeaveRequestAPIView, LeaveApprovalAPIView

urlpatterns = [
    path('', LeaveRequestAPIView.as_view(), name='leave-list'),
    path('<uuid:pk>/approve/', LeaveApprovalAPIView.as_view(), name='leave-approve'),
]

