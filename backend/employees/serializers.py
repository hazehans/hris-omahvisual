from rest_framework import serializers
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    # URL foto yang bisa diakses dari frontend
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = '__all__'

    def get_photo_url(self, obj) -> str | None:
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
