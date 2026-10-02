"""
accounts/urls.py – Auth URL Patterns
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView, LogoutView, CurrentUserView,
    ResetDeviceView, GenerateOTPView, SetNewPasswordView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('reset-device/<int:employee_id>/', ResetDeviceView.as_view(), name='auth-reset-device'),
    # OTP Password Reset
    path('generate-otp/', GenerateOTPView.as_view(), name='auth-generate-otp'),
    path('set-password/', SetNewPasswordView.as_view(), name='auth-set-password'),
]
