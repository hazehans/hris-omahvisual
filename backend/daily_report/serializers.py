from rest_framework import serializers
from .models import DailyLog, DailyLogImage

class DailyLogImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = DailyLogImage
        fields = ['id', 'image_url']
    def get_image_url(self, obj):
        request = self.context.get('request')
        if request and obj.image:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None

class DailyLogSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_role = serializers.CharField(source='employee.role', read_only=True)
    images = DailyLogImageSerializer(many=True, read_only=True)

    class Meta:
        model = DailyLog
        fields = ['id', 'employee_name', 'employee_role', 'date', 'activity', 'work_link', 'issue', 'images', 'created_at']
