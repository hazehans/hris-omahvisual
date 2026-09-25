"""
contracts/tasks.py — Celery Task: Contract & Birthday Reminders

Task ini dijalankan setiap hari pukul 08:00 WIB.
Mengecek:
  1. Kontrak yang akan habis dalam 30 hari → buat HRNotification
  2. Karyawan yang berulang tahun hari ini → buat HRNotification
"""

from celery import shared_task
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(name='contracts.send_daily_reminders')
def send_daily_reminders():
    """
    Celery Beat Task — Reminder kontrak & ulang tahun.

    Jadwal: Setiap hari pukul 08:00 WIB.
    Logic (PRD §6):
        1. Cari Contract dengan end_date antara (hari ini) dan (hari ini + 30 hari).
           → Buat HRNotification type=CONTRACT_EXPIRY jika belum ada hari ini.
        2. Cari Employee dengan birth_date.month == today.month dan birth_date.day == today.day.
           → Buat HRNotification type=BIRTHDAY jika belum ada hari ini.

    Returns:
        dict: Jumlah notifikasi yang dibuat.
    """
    from .models import Contract, HRNotification
    from employees.models import Employee

    today = date.today()
    deadline = today + timedelta(days=30)
    contract_count  = 0
    birthday_count  = 0

    # 1. Contract Expiry Reminder (H-30)
    expiring_contracts = Contract.objects.filter(
        end_date__gte=today,
        end_date__lte=deadline,
        employee__is_active=True,
    ).select_related('employee')

    for contract in expiring_contracts:
        # Hindari duplikasi notifikasi di hari yang sama
        already_notified = HRNotification.objects.filter(
            notification_type=HRNotification.NotificationType.CONTRACT_EXPIRY,
            employee=contract.employee,
            created_at__date=today,
        ).exists()

        if not already_notified:
            days_left = (contract.end_date - today).days
            HRNotification.objects.create(
                notification_type=HRNotification.NotificationType.CONTRACT_EXPIRY,
                employee=contract.employee,
                message=(
                    f"Kontrak {contract.get_contract_type_display()} "
                    f"{contract.employee.full_name} akan berakhir dalam "
                    f"{days_left} hari ({contract.end_date.strftime('%d %B %Y')})."
                )
            )
            contract_count += 1
            logger.info(
                f'[Contract Reminder] {contract.employee.full_name} — '
                f'{days_left} hari tersisa.'
            )

    # 2. Birthday Reminder
    birthday_employees = Employee.objects.filter(
        is_active=True,
        birth_date__month=today.month,
        birth_date__day=today.day,
    )

    for employee in birthday_employees:
        already_notified = HRNotification.objects.filter(
            notification_type=HRNotification.NotificationType.BIRTHDAY,
            employee=employee,
            created_at__date=today,
        ).exists()

        if not already_notified:
            age = today.year - employee.birth_date.year
            HRNotification.objects.create(
                notification_type=HRNotification.NotificationType.BIRTHDAY,
                employee=employee,
                message=(
                    f"🎂 {employee.full_name} berulang tahun hari ini! "
                    f"Usia {age} tahun. ({employee.get_role_display()})"
                )
            )
            birthday_count += 1
            logger.info(f'[Birthday] {employee.full_name} — Ulang tahun ke-{age}.')

    logger.info(
        f'[Daily Reminders] Selesai: {contract_count} reminder kontrak, '
        f'{birthday_count} reminder ulang tahun.'
    )

    return {
        'date': today.isoformat(),
        'contract_reminders_created': contract_count,
        'birthday_reminders_created': birthday_count,
    }

