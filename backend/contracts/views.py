"""
contracts/views.py — Contract Views

Endpoints:
    GET    /api/v1/contracts/my-contract/   → Kontrak aktif milik user sendiri
    GET    /api/v1/contracts/admin/         → Admin only: semua kontrak
    POST   /api/v1/contracts/admin/         → Admin only: buat kontrak baru
    PUT    /api/v1/contracts/admin/<id>/    → Admin only: update kontrak
"""

from datetime import date

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Contract, HRNotification
from .serializers import ContractSerializer, ContractCreateSerializer, HRNotificationSerializer
from employees.permissions import IsAdminHR


class MyContractView(APIView):
    """
    GET /api/v1/contracts/my-contract/
    Info kontrak aktif milik user yang login.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            employee = request.user._employee
        except Exception:
            return Response(
                {'status': 'error', 'code': 'NO_EMPLOYEE_PROFILE',
                 'message': 'Akun tidak memiliki profil karyawan.'},
                status=status.HTTP_403_FORBIDDEN
            )

        today = date.today()
        # Kontrak aktif: yang mencakup hari ini
        active_contract = Contract.objects.filter(
            employee=employee,
            start_date__lte=today,
            end_date__gte=today,
        ).first()

        if not active_contract:
            # Coba ambil kontrak terakhir meski sudah expired
            last_contract = Contract.objects.filter(
                employee=employee
            ).order_by('-end_date').first()

            return Response({
                'has_active_contract': False,
                'last_contract': ContractSerializer(
                    last_contract, context={'request': request}
                ).data if last_contract else None,
                'message': 'Tidak ada kontrak aktif.',
            })

        return Response({
            'has_active_contract': True,
            'contract': ContractSerializer(active_contract, context={'request': request}).data,
        })


class AdminContractListCreateView(APIView):
    """
    GET  /api/v1/contracts/admin/  → Semua kontrak karyawan
    POST /api/v1/contracts/admin/  → Buat kontrak baru
    """
    permission_classes = [IsAuthenticated, IsAdminHR]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        """List semua kontrak, opsional filter by employee_id atau aktif saja."""
        contracts = Contract.objects.select_related('employee').order_by('-start_date')

        # Filter opsional
        employee_id = request.query_params.get('employee_id')
        active_only = request.query_params.get('active_only', 'false').lower() == 'true'

        if employee_id:
            contracts = contracts.filter(employee_id=employee_id)

        if active_only:
            today = date.today()
            contracts = contracts.filter(start_date__lte=today, end_date__gte=today)

        serializer = ContractSerializer(contracts, many=True, context={'request': request})
        return Response({
            'total': contracts.count(),
            'contracts': serializer.data,
        })

    def post(self, request):
        """Buat kontrak baru."""
        serializer = ContractCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        contract = serializer.save()
        return Response(
            ContractSerializer(contract, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class AdminContractDetailView(APIView):
    """
    PUT /api/v1/contracts/admin/<id>/  → Update kontrak
    """
    permission_classes = [IsAuthenticated, IsAdminHR]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def put(self, request, contract_id):
        try:
            contract = Contract.objects.get(id=contract_id)
        except Contract.DoesNotExist:
            return Response(
                {'status': 'error', 'code': 'NOT_FOUND',
                 'message': 'Kontrak tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ContractCreateSerializer(
            contract, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        contract = serializer.save()
        return Response(ContractSerializer(contract, context={'request': request}).data)


class HRNotificationView(APIView):
    """
    GET   /api/v1/contracts/notifications/        → Admin only: daftar notifikasi
    PATCH /api/v1/contracts/notifications/<id>/   → Admin only: tandai sudah dibaca
    """
    permission_classes = [IsAuthenticated, IsAdminHR]

    def get(self, request):
        notifs = HRNotification.objects.select_related('employee').order_by('-created_at')

        # Filter: belum dibaca saja
        unread_only = request.query_params.get('unread_only', 'false').lower() == 'true'
        if unread_only:
            notifs = notifs.filter(is_read=False)

        serializer = HRNotificationSerializer(notifs, many=True, context={'request': request})
        return Response({
            'total': notifs.count(),
            'unread_count': HRNotification.objects.filter(is_read=False).count(),
            'notifications': serializer.data,
        })

    def patch(self, request, notif_id):
        try:
            notif = HRNotification.objects.get(id=notif_id)
        except HRNotification.DoesNotExist:
            return Response(
                {'status': 'error', 'code': 'NOT_FOUND',
                 'message': 'Notifikasi tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'message': 'Notifikasi ditandai sudah dibaca.'})
