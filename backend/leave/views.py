from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import date, datetime
from .models import LeaveRequest
from .serializers import LeaveRequestSerializer
from audit.utils import log_action


def get_urgency_warning(start_date_str: str) -> str | None:
    """Return a warning string jika pengajuan H-1 atau H-0 (hari ini)."""
    try:
        start = date.fromisoformat(start_date_str)
        today = date.today()
        delta = (start - today).days
        if delta == 0:
            return 'Perhatian: Pengajuan izin untuk HARI INI (H-0). Mohon segera ditinjau.'
        elif delta == 1:
            return 'Perhatian: Pengajuan izin untuk BESOK (H-1). Harap segera diproses.'
    except (ValueError, TypeError):
        pass
    return None


class LeaveRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_staff or request.user.is_superuser:
            status_filter = request.query_params.get('status', 'PENDING')
            if status_filter == 'ALL_HISTORY':
                leaves = LeaveRequest.objects.exclude(status='PENDING').order_by('-reviewed_at')
            else:
                leaves = LeaveRequest.objects.filter(status='PENDING').order_by('-created_at')
        else:
            try:
                employee = request.user.employee_profile
                leaves = LeaveRequest.objects.filter(employee=employee).order_by('-created_at')
            except Exception:
                leaves = []

        serializer = LeaveRequestSerializer(leaves, many=True)
        return Response(serializer.data)

    def post(self, request):
        try:
            employee = request.user.employee_profile
            attachment = request.FILES.get('attachment', None)

            leave_type = request.data.get('leave_type')
            start_date = request.data.get('start_date')
            end_date = request.data.get('end_date')
            late_until = request.data.get('late_until', None)  # format: "HH:MM"

            leave = LeaveRequest.objects.create(
                employee=employee,
                leave_type=leave_type,
                start_date=start_date,
                end_date=end_date,
                late_until=late_until if leave_type == 'IZIN_TERLAMBAT' else None,
                reason=request.data.get('reason'),
                attachment=attachment,
            )
            log_action(request, 'LEAVE_CREATE', 'LeaveRequest', leave.id, detail={'leave_type': leave.leave_type})

            # Berikan warning ke karyawan jika pengajuan mepet
            warning = get_urgency_warning(str(start_date))
            message = 'Berhasil diajukan! Menunggu persetujuan HR.'
            if warning:
                message += f' ⚠️ {warning}'

            return Response({'message': message, 'warning': warning}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LeaveApprovalAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'Hanya HR yang bisa menyetujui!'}, status=status.HTTP_403_FORBIDDEN)

        try:
            leave = LeaveRequest.objects.get(pk=pk)
            action = request.data.get('action')

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

            log_action(request, f'LEAVE_{action}', 'LeaveRequest', leave.id)

            return Response({'message': f'Pengajuan berhasil di-{action.lower()}!'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
