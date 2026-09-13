"""
accounts/serializers.py — Auth Serializers
"""

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken


class LoginSerializer(serializers.Serializer):
    """
    Serializer untuk endpoint login.
    Menerima username, password, dan device_id.
    """
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(
        max_length=128,
        write_only=True,
        style={'input_type': 'password'}
    )
    device_id = serializers.CharField(
        max_length=255,
        help_text="ID unik perangkat (IMEI / Android ID / UUID iOS)."
    )

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        device_id = attrs.get('device_id')

        # Autentikasi credential
        user = authenticate(
            request=self.context.get('request'),
            username=username,
            password=password
        )
        if not user:
            raise serializers.ValidationError(
                'Username atau password salah.',
                code='INVALID_CREDENTIALS'
            )

        if not user.is_active:
            raise serializers.ValidationError(
                'Akun tidak aktif. Hubungi Admin.',
                code='ACCOUNT_INACTIVE'
            )

        # Device binding check
        if user.device_id and user.device_id != device_id:
            raise serializers.ValidationError(
                'Device tidak dikenali. Hubungi Admin untuk reset Device ID.',
                code='DEVICE_MISMATCH'
            )

        attrs['user'] = user
        attrs['device_id'] = device_id
        return attrs


class LogoutSerializer(serializers.Serializer):
    """Serializer untuk logout — menerima refresh token untuk di-blacklist."""
    refresh = serializers.CharField()


class ResetDeviceSerializer(serializers.Serializer):
    """Serializer untuk reset device_id — Admin only."""
    pass  # Tidak butuh payload, hanya memerlukan employee_id di URL

