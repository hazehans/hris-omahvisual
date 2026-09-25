from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer

class LeaveRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_superuser:
            # HR: get filter type (pending vs history)
            status_filter = request.query_params.get('status', 'PENDING')
            if status_filter == 'ALL_HISTORY':
                leaves = LeaveRequest.objects.exclude(status='PENDING').order_by('-reviewed_at')
            else:
                leaves = LeaveRequest.objects.filter(status='PENDING').order_by('-created_at')
        else:
            try:
                employee = request.user.employee_profile
                leaves = LeaveRequest.objects.filter(employee=employee).order_by('-created_at')
            except:
                leaves = []
                
        serializer = LeaveRequestSerializer(leaves, many=True)
        return Response(serializer.data)

    def post(self, request):
        try:
            employee = request.user.employee_profile
            attachment = request.FILES.get('attachment', None)
            
            leave = LeaveRequest.objects.create(
                employee=employee,
                leave_type=request.data.get('leave_type'),
                start_date=request.data.get('start_date'),
                end_date=request.data.get('end_date'),
                reason=request.data.get('reason'),
                attachment=attachment
            )
            return Response({'message': 'Berhasil diajukan! Menunggu persetujuan HR.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class LeaveApprovalAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_superuser:
            return Response({'error': 'Hanya HR yang bisa menyetujui!'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            leave = LeaveRequest.objects.get(pk=pk)
            action = request.data.get('action')
            
            # Cek apakah HR mengupload file signed (FormData multipart)
            signed_file = request.FILES.get('signed_attachment', None)
            
            if action == 'APPROVE':
                leave.status = 'APPROVED'
                if signed_file:
                    leave.signed_attachment = signed_file
            elif action == 'REJECT':
                leave.status = 'REJECTED'
                
            leave.approved_by = request.user
            leave.reviewed_at = timezone.now()
            leave.save()
            
            return Response({'message': f'Pengajuan berhasil di-{action.lower()}!'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
