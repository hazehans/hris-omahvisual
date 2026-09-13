"""
employees/urls.py — Employee URL Patterns
"""

from django.urls import path
from .views import (
    EmployeeListCreateView,
    EmployeeDetailView,
    CompanyLocationListCreateView,
    CompanyLocationDetailView,
)

urlpatterns = [
    path('', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('<int:employee_id>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('locations/', CompanyLocationListCreateView.as_view(), name='location-list-create'),
    path('locations/<int:location_id>/', CompanyLocationDetailView.as_view(), name='location-detail'),
]

