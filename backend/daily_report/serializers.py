from rest_framework import serializers
from .models import DailyLog


class DailyLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_role = serializers.CharField(source='employee.role', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = DailyLog
        fields = ['id', 'employee_name', 'employee_role', 'date', 'activity', 'work_link', 'issue', 'image', 'image_url', 'created_at']
        extra_kwargs = {
            'image': {'write_only': True, 'required': False},
        }

    def get_image_url(self, obj) -> str | None:
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
