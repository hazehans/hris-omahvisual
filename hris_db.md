# Dokumentasi Database (HRIS OmahVisual)

Aplikasi HRIS OmahVisual saat ini menggunakan **PostgreSQL** sebagai database utamanya.

## Konfigurasi Koneksi (Lokal)
- **Database Engine:** PostgreSQL 16/17
- **Host:** `localhost`
- **Port:** `5432`
- **Database Name:** `hris_db`
- **Username:** `postgres`
- **Password:** `hans` (atau sesuai konfigurasi lokal Anda)

Konfigurasi ini dikelola melalui file `.env` di direktori `backend/`:
```env
USE_SQLITE=False
DB_NAME=hris_db
DB_USER=postgres
DB_PASSWORD=hans
DB_HOST=localhost
DB_PORT=5432
```

## Arsitektur Aplikasi & Tabel
Aplikasi ini menggunakan pendekatan arsitektur *Modular (Multi-App)* di dalam Django. Berikut adalah pemetaan aplikasi terhadap fungsionalitasnya:

| App Name | Fungsi Utama | Tabel Utama di Database |
|---|---|---|
| **accounts** | Custom User Authentication | `accounts_user` |
| **employees** | Data Karyawan & Lokasi Perusahaan | `employees_employee`, `employees_companylocation` |
| **attendance** | Log Absensi & Geofencing | `attendance_attendancelog` |
| **daily_report** | Laporan Harian (Log book) | `daily_report_dailyreport` |
| **leave** | Pengajuan Izin/Cuti (Rule H-2) | `leave_leaverequest` |
| **contracts** | Riwayat Kontrak & Notifikasi | `contracts_contract`, `contracts_hrnotification` |
| **roster** | Penjadwalan & Override Libur | `roster_workschedule`, `roster_holidayoverride` |
| **dashboard** | Agregasi Data (Tanpa Model) | *(Tidak ada tabel khusus)* |

## Manajemen Celery (Cron Jobs & Task Queue)
Karena aplikasi memiliki fitur berjalan di latar belakang (seperti *auto-reject* pengajuan cuti dan pengingat kontrak), tabel-tabel tambahan digenerate otomatis oleh *library* pihak ketiga:
- `django_celery_beat_*`: Menyimpan jadwal cron jobs.
- `django_celery_results_*`: Menyimpan hasil eksekusi background tasks.

## Persiapan Awal Setelah Fresh Install
Setiap kali database Postgres baru dibuat (kosong), langkah yang wajib dilakukan adalah:
1. `python manage.py migrate` (Membangun semua struktur tabel).
2. Memasukkan data awal (*seeding*) minimal 1 karyawan bertipe **Admin HR**.

---

## Detail Skema Seluruh Tabel (Data Dictionary)
Di bawah ini adalah struktur lengkap dari semua tabel yang telah kita buat (tidak termasuk tabel sistem bawaan Django seperti session, permission, dan celery).

### 1. Tabel `accounts_user` (Aplikasi: accounts)
Modifikasi dari *default user* Django untuk mendukung sistem absensi per perangkat (*device binding*).
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `username`, `password`, `email` | String | Data standar *login* |
| `first_name`, `last_name` | String | Nama (bawaan Django) |
| `device_id` | String | ID Perangkat unik (HP/Laptop) yang di-bind saat *login* pertama kali |

### 2. Tabel `employees_employee` (Aplikasi: employees)
Menyimpan data profil utama karyawan HRIS.
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `user_id` | Integer (Foreign Key) | Relasi 1-to-1 ke `accounts_user` |
| `full_name` | String | Nama Lengkap Karyawan |
| `nik` | String (Unique) | Nomor Induk Karyawan |
| `role` | String | Role sistem (contoh: ADMIN_HR, CV_KARYAWAN, RENTAL_KARYAWAN, CREW_GUDANG) |
| `department` | String | Nama Departemen / Divisi |
| `phone` | String | Nomor Telepon (opsional) |
| `birth_date` | Date | Tanggal lahir (untuk reminder ultah) |
| `is_active` | Boolean | Status aktif/non-aktif karyawan (Default: True) |
| `created_at` / `updated_at` | DateTime | Timestamp data |

### 3. Tabel `employees_companylocation` (Aplikasi: employees)
Titik koordinat geofencing untuk kantor cabang atau lokasi proyek.
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `name` | String | Nama Lokasi (contoh: Gudang LED / Kantor CV) |
| `location_type` | String | Kategori (CV_LED, RENTAL, CUSTOM) |
| `latitude` / `longitude` | Float | Titik koordinat GPS |
| `radius_meter` | Integer | Batas toleransi jarak absensi (Default: 100 meter) |
| `is_active` | Boolean | Status aktif lokasi |

### 4. Tabel `attendance_attendancelog` (Aplikasi: attendance)
Data utama *clock-in* dan *clock-out* karyawan per harinya.
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `employee_id` | Integer (Foreign Key) | Relasi ke `employees_employee` |
| `date` | Date | Tanggal absensi berjalan |
| `clock_in` / `clock_out` | Time | Jam masuk dan jam pulang (bisa Null) |
| `mode` | String | Mode (REGULAR / LED_INSTALLATION) |
| `latitude` / `longitude` | Float | Lokasi aktual saat tombol *clock-in* ditekan |
| `geofence_valid` | Boolean | Validasi radius (apakah berada di dalam toleransi lokasi) |
| `photo` | String (Path) | Lokasi file foto selfie (wajib untuk role tertentu) |
| `is_late` | Boolean | Apakah terlambat masuk (> 08:15) |
| `is_overtime` | Boolean | Apakah pulang lembur (> 17:00) atau masuk di hari libur |
| `overtime_minutes` | Integer | Durasi lembur dalam hitungan menit |
| `is_day_off_attendance` | Boolean | Apakah absensi ini direkam di saat hari libur (lembur *full-day*) |
| `notes` | Text | Keterangan tambahan opsional |

### 5. Tabel `daily_report_dailyreport` (Aplikasi: daily_report)
Catatan kerja (Log book) harian yang diisi saat akan pulang kerja.
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `employee_id` | Integer (Foreign Key) | Relasi ke `employees_employee` |
| `date` | Date | Tanggal laporan |
| `content` | Text | Isi laporan aktivitas harian |
| `attendance_log_id` | Integer (One-to-One) | Relasi ke `attendance_attendancelog` di hari yang sama |
| `submitted_at` / `updated_at` | DateTime | Timestamp penyerahan laporan |

### 6. Tabel `leave_leaverequest` (Aplikasi: leave)
Pengajuan Cuti / Izin karyawan ke HR.
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `employee_id` | Integer (Foreign Key) | Relasi ke `employees_employee` |
| `leave_type` | String | Tipe (CUTI atau IZIN) |
| `start_date` / `end_date` | Date | Rentang waktu cuti/izin |
| `reason` | Text | Alasan / keterangan cuti |
| `status` | String | Status saat ini (PENDING, APPROVED, REJECTED, AUTO_REJECTED) |
| `reviewed_by_id` | Integer (Foreign Key) | Relasi ke `employees_employee` (Admin HR yang menyetujui/menolak) |
| `reviewed_at` | DateTime | Kapan direview |
| `review_note` | String | Catatan Admin saat me-review |

### 7. Tabel `contracts_contract` (Aplikasi: contracts)
Penyimpanan riwayat dan durasi kontrak (PKWT) karyawan.
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `employee_id` | Integer (Foreign Key) | Relasi ke `employees_employee` |
| `contract_type` | String | Jenis Kontrak (PKWT) |
| `start_date` / `end_date` | Date | Rentang aktifnya kontrak |
| `document_file` | String (Path) | Lokasi upload dokumen *scan* kontrak (PDF) |
| `notes` | Text | Catatan tambahan |

### 8. Tabel `contracts_hrnotification` (Aplikasi: contracts)
Data peringatan/notifikasi di dashboard Admin HR (Digenerate otomatis oleh Celery).
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `notification_type` | String | Jenis (CONTRACT_EXPIRY / BIRTHDAY) |
| `employee_id` | Integer (Foreign Key) | Karyawan mana yang memicu notifikasi |
| `message` | Text | Kalimat notifikasi utuh |
| `is_read` | Boolean | Apakah notif sudah ditekan/dibaca Admin |

### 9. Tabel `roster_workschedule` (Aplikasi: roster)
Manajemen hari libur bawaan (Default) tiap karyawan.
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `employee_id` | Integer (Foreign Key) | Relasi ke `employees_employee` |
| `day_off_weekday` | Integer | Indeks hari libur (0=Senin, ... 6=Minggu) |
| `effective_date` | Date | Mulai kapan perubahan jadwal ini berlaku |
| `notes` | String | Keterangan penggantian jadwal (opsional) |

### 10. Tabel `roster_holidayoverride` (Aplikasi: roster)
Penggantian (Tukar/Tembak) hari libur insidental di minggu tertentu oleh Admin.
| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | Integer (Primary Key) | Auto increment ID |
| `employee_id` | Integer (Foreign Key) | Relasi ke `employees_employee` |
| `original_date` | Date | Tanggal libur asli yang dikorbankan |
| `new_day_off_date` | Date | Tanggal libur pengganti yang baru |
| `reason` | String | Keterangan / alasan perubahan jadwal |
| `created_by_id` | Integer (Foreign Key) | Admin HR yang membuat perubahan jadwal |

