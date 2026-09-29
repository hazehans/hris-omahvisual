import uuid
from django.db import models
from django.conf import settings

class Employee(models.Model):
    GENDER_CHOICES = [
        ('LAKI_LAKI', 'Laki-laki'),
        ('PEREMPUAN', 'Perempuan'),
    ]

    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_profile')
    
    nik = models.CharField(max_length=50, unique=True, verbose_name="Nomor Karyawan (ID)")
    full_name = models.CharField(max_length=255, verbose_name="Nama Lengkap")
    nickname = models.CharField(max_length=100, null=True, blank=True, verbose_name="Nama Panggilan")
    
    # ID ini disamakan dengan ID yang terdaftar di mesin Hikvision
    hikvision_id = models.CharField(max_length=50, unique=True, null=True, blank=True, verbose_name="ID Mesin Hikvision")
    
    whatsapp_number = models.CharField(max_length=255, verbose_name="No HP Pribadi (WA)")
    emergency_contact = models.CharField(max_length=255, null=True, blank=True, verbose_name="No HP Darurat")
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    religion = models.CharField(max_length=50, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    
    role = models.CharField(max_length=100, verbose_name="Jabatan / Role")
    
    birth_place = models.CharField(max_length=100, null=True, blank=True, verbose_name="Tempat Lahir")
    birth_date = models.DateField(null=True, blank=True, verbose_name="Tanggal Lahir")
    join_date = models.DateField(verbose_name="Tanggal Masuk Kerja")
    
    contract_type = models.CharField(max_length=50, choices=[('PKWT', 'PKWT (Kontrak)'), ('PKWTT', 'PKWTT (Tetap)'), ('FREELANCE', 'Freelance'), ('INTERN', 'Magang')], default='PKWT', verbose_name="Jenis Kontrak")
    contract_end_date = models.DateField(null=True, blank=True, verbose_name="Tanggal Berakhir Kontrak")
    
    bank_account_info = models.CharField(max_length=255, null=True, blank=True, verbose_name="Info Rekening Bank")
    
    is_active = models.BooleanField(default=True, verbose_name="Karyawan Aktif")

    def __str__(self):
        return f"{self.nik} - {self.full_name}"

    class Meta:
        db_table = 'employees_employee'
