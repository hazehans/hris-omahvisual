"""
employees/serializers.py — Employee & CompanyLocation Serializers
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Employee, CompanyLocation

User = get_user_model()


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk membuat akun User baru saat tambah karyawan."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class EmployeeListSerializer(serializers.ModelSerializer):
    """Serializer ringkas untuk daftar karyawan (Admin view)."""
    username = serializers.CharField(source='user.username', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'username', 'full_name', 'nik', 'role', 'role_display',
            'department', 'phone', 'is_active', 'photo',
        ]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Serializer lengkap untuk detail & update karyawan."""
    username = serializers.CharField(source='user.username', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'username', 'full_name', 'nik', 'role', 'role_display',
            'department', 'phone', 'birth_date', 'photo', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'username', 'role_display', 'created_at', 'updated_at']


class EmployeeCreateSerializer(serializers.Serializer):
    """
    Serializer untuk membuat karyawan baru beserta akun user-nya.
    Admin menginput: username, password, dan data employee.
    """
    # User fields
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)

    # Employee fields
    full_name = serializers.CharField(max_length=200)
    nik = serializers.CharField(max_length=20)
    role = serializers.ChoiceField(choices=Employee._meta.get_field('role').choices)
    department = serializers.CharField(max_length=100, required=False, default='')
    phone = serializers.CharField(max_length=20, required=False, default='')
    birth_date = serializers.DateField(required=False, allow_null=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username sudah digunakan.')
        return value

    def validate_nik(self, value):
        if Employee.objects.filter(nik=value).exists():
            raise serializers.ValidationError('NIK sudah terdaftar.')
        return value

    def create(self, validated_data):
        # Pisah data user dan employee
        username = validated_data.pop('username')
        password = validated_data.pop('password')

        # Buat user baru
        user = User.objects.create_user(username=username, password=password)

        # Buat employee
        employee = Employee.objects.create(user=user, **validated_data)
        return employee


class CompanyLocationSerializer(serializers.ModelSerializer):
    """Serializer untuk master data lokasi perusahaan (geofencing)."""
    class Meta:
        model = CompanyLocation
        fields = '__all__'

