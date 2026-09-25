import csv
import datetime
from django.core.management.base import BaseCommand
from employees.models import Employee

class Command(BaseCommand):
    help = 'Import karyawan dari file CSV Google Sheets'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path ke file CSV')

    def parse_indo_date(self, date_str):
        # Menerjemahkan format "14 Mei 1998" ke YYYY-MM-DD
        if not date_str: return None
        months = {
            'januari': 1, 'jan': 1, 'februari': 2, 'feb': 2,
            'maret': 3, 'mar': 3, 'april': 4, 'apr': 4,
            'mei': 5, 'may': 5, 'juni': 6, 'jun': 6,
            'juli': 7, 'jul': 7, 'agustus': 8, 'agu': 8, 'aug': 8,
            'september': 9, 'sep': 9, 'oktober': 10, 'okt': 10, 'oct': 10,
            'november': 11, 'nov': 11, 'desember': 12, 'des': 12, 'dec': 12
        }
        try:
            parts = date_str.strip().split()
            if len(parts) >= 3:
                day = int(parts[0])
                month = months.get(parts[1].lower(), 1)
                year = int(parts[2])
                return datetime.date(year, month, day)
        except Exception:
            pass
        return None

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        
        try:
            with open(csv_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.reader(f)
                header = next(reader) # Lewati baris pertama (Header / Judul Kolom)
                
                success_count = 0
                for row in reader:
                    # Lewati jika baris kosong atau tidak ada nomor NIK
                    if not row or not row[0].strip():
                        continue
                        
                    try:
                        nik = row[0].strip()
                        nickname = row[1].strip() if len(row) > 1 else ""
                        full_name = row[2].strip() if len(row) > 2 else ""
                        
                        # Pecah Tempat & Tanggal Lahir
                        ttl_raw = row[3].strip() if len(row) > 3 else ""
                        birth_place = ""
                        birth_date = None
                        if ',' in ttl_raw:
                            bp, bd = ttl_raw.split(',', 1)
                            birth_place = bp.strip()
                            birth_date = self.parse_indo_date(bd)
                        
                        address = row[4].strip() if len(row) > 4 else ""
                        religion = row[5].strip() if len(row) > 5 else ""
                        
                        # Setup Jenis Kelamin
                        gender_raw = row[6].strip().upper() if len(row) > 6 else ""
                        gender = 'LAKI_LAKI' if 'LAKI' in gender_raw else 'PEREMPUAN'
                        
                        wa_num = row[7].strip() if len(row) > 7 else ""
                        emergency_num = row[8].strip() if len(row) > 8 else ""
                        
                        # Parse Join Date (format DD/MM/YYYY)
                        join_date_raw = row[9].strip() if len(row) > 9 else ""
                        join_date = None
                        if join_date_raw:
                            try:
                                join_date = datetime.datetime.strptime(join_date_raw, "%d/%m/%Y").date()
                            except:
                                join_date = datetime.date.today() # Jika format salah, set hari ini
                                
                        # Lewati kolom 10 (Masa Kerja)
                        role = row[11].strip() if len(row) > 11 else ""
                        bank = row[12].strip() if len(row) > 12 else ""
                        
                        # Simpan atau Update ke Database
                        Employee.objects.update_or_create(
                            nik=nik,
                            defaults={
                                'full_name': full_name,
                                'nickname': nickname,
                                'address': address,
                                'religion': religion,
                                'gender': gender,
                                'whatsapp_number': wa_num,
                                'emergency_contact': emergency_num,
                                'birth_place': birth_place,
                                'birth_date': birth_date,
                                'join_date': join_date or datetime.date.today(),
                                'role': role,
                                'bank_account_info': bank,
                            }
                        )
                        success_count += 1
                        self.stdout.write(self.style.SUCCESS(f'[BERHASIL] Mengimpor Karyawan: {full_name}'))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'[GAGAL] Baris NIK {row[0]}: {str(e)}'))
                        
            self.stdout.write(self.style.SUCCESS(f'\n--- MIGRASI SELESAI: {success_count} Karyawan berhasil masuk ke PostgreSQL ---'))
            
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File {csv_file} tidak ditemukan. Pastikan file diletakkan di dalam folder backend/'))

