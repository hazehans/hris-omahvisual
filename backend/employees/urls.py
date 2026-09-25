from django.urls import path
from .views import EmployeeListAPIView, EmployeeDetailAPIView

urlpatterns = [
    path('', EmployeeListAPIView.as_view(), name='employee-list'),
    path('<uuid:pk>/', EmployeeDetailAPIView.as_view(), name='employee-detail'),
]

