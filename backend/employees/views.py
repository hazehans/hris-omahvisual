from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Employee
from .serializers import EmployeeSerializer

class EmployeeListAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Employee.objects.all().order_by('-is_active', 'full_name')
    serializer_class = EmployeeSerializer

class EmployeeDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    # Saat di-delete, jangan dihapus dari database, tapi di-nonaktifkan saja (Soft Delete)
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

