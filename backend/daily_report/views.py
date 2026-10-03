from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied
from .models import DailyLog
from .serializers import DailyLogSerializer
import datetime


class DailyLogListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DailyLogSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_context(self):
        # Pastikan request tersedia di context untuk build_absolute_uri
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def get_queryset(self):
        user = self.request.user
        date_filter = self.request.query_params.get('date', datetime.date.today())

        if user.is_staff or user.is_superuser:
            if date_filter == 'ALL':
                return DailyLog.objects.all().order_by('-created_at')
            return DailyLog.objects.filter(date=date_filter).order_by('-created_at')
        else:
            try:
                employee = user.employee_profile
                if date_filter == 'ALL':
                    return DailyLog.objects.filter(employee=employee).order_by('-created_at')
                return DailyLog.objects.filter(employee=employee, date=date_filter).order_by('-created_at')
            except Exception:
                return DailyLog.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superuser:
            raise PermissionDenied("Superadmin tidak perlu mengisi Daily Log Karyawan.")
        try:
            employee = user.employee_profile
            daily_log = serializer.save(employee=employee)
            # Handle multiple images
            images = self.request.FILES.getlist('images')
            from .models import DailyLogImage
            for img in images:
                DailyLogImage.objects.create(daily_log=daily_log, image=img)
        except Exception as e:
            raise PermissionDenied(f"Terjadi kesalahan: {str(e)}")