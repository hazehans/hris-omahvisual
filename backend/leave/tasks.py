"""
leave/tasks.py — Celery Task: Auto-Reject Leave Requests

Task ini dijalankan setiap hari pukul 23:59 (WIB) oleh Celery Beat.
Semua pengajuan yang masih PENDING dan start_date = besok → AUTO_REJECTED.

Konfigurasi schedule didaftarkan via Django admin (django-celery-beat)
atau lewat CELERY_BEAT_SCHEDULE di settings.py.
"""

from celery import shared_task
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(name='leave.auto_reject_pending_leaves')
def auto_reject_pending_leaves():
    """
    Celery Beat Task — Auto-reject pengajuan izin/cuti yang belum direspons.

    Jadwal: Setiap hari pukul 23:59 WIB.
    Logic (PRD §5 Auto Reject H-1):
        - Query semua LeaveRequest dengan status=PENDING dan start_date = besok.
        - Update status menjadi AUTO_REJECTED.

    Returns:
        dict: Jumlah pengajuan yang di-auto-reject.
    """
    from .models import LeaveRequest, LeaveStatus

    tomorrow = date.today() + timedelta(days=1)

    pending_to_reject = LeaveRequest.objects.filter(
        status=LeaveStatus.PENDING,
        start_date=tomorrow,
    )

    count = pending_to_reject.count()

    if count > 0:
        # Update sekaligus (bulk update lebih efisien)
        updated = pending_to_reject.update(status=LeaveStatus.AUTO_REJECTED)
        logger.info(
            f'[Auto-Reject] {updated} pengajuan izin/cuti di-auto-reject '
            f'karena start_date = {tomorrow} dan belum direspons Admin.'
        )
    else:
        logger.info(f'[Auto-Reject] Tidak ada pengajuan PENDING untuk tanggal {tomorrow}.')

    return {
        'date_checked': tomorrow.isoformat(),
        'auto_rejected_count': count,
    }

