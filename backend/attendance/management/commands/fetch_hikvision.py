"""
Management Command: fetch_hikvision
====================================
Jalankan manual dari terminal:

  python manage.py fetch_hikvision
  python manage.py fetch_hikvision --date 2026-09-26
  python manage.py fetch_hikvision --date 2026-09-25 --date 2026-09-26

Bisa juga dijadwalkan via Celery Beat (harian jam 23:30) untuk fetch otomatis.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, datetime


class Command(BaseCommand):
    help = 'Menarik data absensi dari mesin Hikvision dan menyimpannya ke database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            action='append',
            dest='dates',
            help='Tanggal yang ingin difetch (format: YYYY-MM-DD). Bisa diulang untuk multi-hari.',
        )

    def handle(self, *args, **options):
        from attendance.hikvision_fetcher import fetch_events_from_device

        dates_input = options.get('dates') or []

        if dates_input:
            target_dates = []
            for d in dates_input:
                try:
                    target_dates.append(datetime.strptime(d, '%Y-%m-%d').date())
                except ValueError:
                    self.stderr.write(self.style.ERROR(f"Format tanggal tidak valid: '{d}'. Gunakan YYYY-MM-DD."))
                    return
        else:
            # Default: hari ini
            target_dates = [timezone.now().date()]

        for target_date in target_dates:
            self.stdout.write(f"\n{'─'*50}")
            self.stdout.write(self.style.MIGRATE_HEADING(f"Fetch data Hikvision: {target_date}"))
            self.stdout.write(f"{'─'*50}")

            result = fetch_events_from_device(target_date)

            self.stdout.write(self.style.SUCCESS(f"  ✓ Total event ditarik dari mesin : {result['total_fetched']}"))
            self.stdout.write(self.style.SUCCESS(f"  ✓ Raw event baru disimpan        : {result['saved_raw']}"))
            self.stdout.write(self.style.SUCCESS(f"  ✓ AttendanceLog diproses         : {result['processed_attendance']}"))

            if result['errors']:
                self.stdout.write(self.style.WARNING(f"\n  ⚠ Peringatan ({len(result['errors'])}):"))
                for err in result['errors']:
                    self.stdout.write(self.style.WARNING(f"    - {err}"))

        self.stdout.write(f"\n{'─'*50}")
        self.stdout.write(self.style.SUCCESS("Selesai!"))
