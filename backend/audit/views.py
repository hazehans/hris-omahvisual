from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogListView(generics.ListAPIView):
    """Superuser-only audit log viewer with filtering"""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        qs = AuditLog.objects.all()
        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if start:
            qs = qs.filter(created_at__date__gte=start)
        if end:
            qs = qs.filter(created_at__date__lte=end)
            
        username = self.request.query_params.get('user')
        if username:
            qs = qs.filter(username__icontains=username)
            
        ip = self.request.query_params.get('ip')
        if ip:
            qs = qs.filter(ip_address__icontains=ip)
            
        target_type = self.request.query_params.get('target_type')
        if target_type:
            qs = qs.filter(target_type=target_type)
            
        return qs[:500]
