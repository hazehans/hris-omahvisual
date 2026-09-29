from django.urls import path
from . import views
from .views import EmployeeListAPIView, EmployeeDetailAPIView

urlpatterns = [
    path('<int:pk>/reset-password/', views.EmployeePasswordResetView.as_view(), name='employee-password-reset'),
    path('passwords/', views.EmployeePasswordListView.as_view(), name='employee-passwords'),
    path('', EmployeeListAPIView.as_view(), name='employee-list'),
    path('<int:pk>/', EmployeeDetailAPIView.as_view(), name='employee-detail'),
]

