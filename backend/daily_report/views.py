from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import DailyLog
from .serializers import DailyLogSerializer
import datetime
from rest_framework.exceptions import PermissionDenied

class DailyLogListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DailyLogSerializer

    def get_queryset(self):
        user = self.request.user
        date_filter = self.request.query_params.get('date', datetime.date.today())

        if user.is_superuser:
            if date_filter == 'ALL':
                return DailyLog.objects.all().order_by('-created_at')
            return DailyLog.objects.filter(date=date_filter).order_by('-created_at')
        else:
            try:
                employee = user.employee_profile
                if date_filter == 'ALL':
                    return DailyLog.objects.filter(employee=employee).order_by('-created_at')
                return DailyLog.objects.filter(employee=employee, date=date_filter).order_by('-created_at')
            except:
                return DailyLog.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superuser:
            raise PermissionDenied("HR tidak perlu mengisi Daily Log Karyawan.")
        try:
            employee = user.employee_profile
            serializer.save(employee=employee)
        except:
            raise PermissionDenied("Profil karyawan tidak ditemukan.")
