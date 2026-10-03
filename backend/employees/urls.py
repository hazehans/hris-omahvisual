from django.urls import path
from . import views
from .views import EmployeeListAPIView, EmployeeDetailAPIView

urlpatterns = [
    path('<int:pk>/reset-password/', views.EmployeePasswordResetView.as_view(), name='employee-password-reset'),
    path('<int:pk>/toggle-active/', views.EmployeeToggleActiveView.as_view(), name='employee-toggle-active'),
    path('<int:pk>/photo/', views.EmployeePhotoUploadView.as_view(), name='employee-photo-upload'),
    path('passwords/', views.EmployeePasswordListView.as_view(), name='employee-passwords'),
    path('', EmployeeListAPIView.as_view(), name='employee-list'),
    path('<int:pk>/', EmployeeDetailAPIView.as_view(), name='employee-detail'),
]
