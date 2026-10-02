from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid
import random


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device_id = models.CharField(max_length=255, null=True, blank=True)
    raw_password = models.CharField(
        max_length=255, null=True, blank=True,
        help_text='Sandi teks asli — hanya dapat dilihat oleh Superuser (IT/Owner)'
    )
    # Flag: jika True, user wajib ganti password sebelum bisa akses dashboard
    must_change_password = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class PasswordResetOTP(models.Model):
    """
    OTP sementara yang dibuat oleh HR untuk mereset password karyawan.
    OTP berlaku 30 menit dan hanya bisa dipakai sekali.
    """
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reset_otps'
    )
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_otp'
        ordering = ['-created_at']

    def is_valid(self) -> bool:
        """Cek apakah OTP masih berlaku (belum dipakai & belum lebih 30 menit)."""
        if self.used:
            return False
        expiry = self.created_at + timedelta(minutes=30)
        return timezone.now() < expiry

    @classmethod
    def generate_for(cls, user: User) -> 'PasswordResetOTP':
        """Buat OTP 6 digit baru untuk user, invalidate semua OTP lama."""
        # Hapus OTP lama yang belum dipakai
        cls.objects.filter(user=user, used=False).delete()
        otp_code = f'{random.randint(0, 999999):06d}'
        return cls.objects.create(user=user, otp=otp_code)

    def __str__(self):
        return f'OTP {self.otp} for {self.user.username} (used={self.used})'
