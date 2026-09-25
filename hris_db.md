# Skema Database HRIS OmahVisual (PostgreSQL + Django ORM)

Dokumen ini mendeskripsikan struktur tabel (Model) database relasional menggunakan PostgreSQL. Karena aplikasi membutuhkan perhitungan jarak koordinat (*geofencing*), database ini **wajib mengaktifkan ekstensi PostGIS**.

---

## 1. Tabel Karyawan & Autentikasi (App: `employees` & `accounts`)

### Tabel `User` (Custom Django Auth User)
Tabel untuk autentikasi login (Web Portal).
* `id` (UUID, Primary Key)
* `username` (String, Unique) - *Digunakan untuk login web*
* `password` (String, Hashed)
* `device_id` (String, Nullable) - *Fingerprint/UUID device HP karyawan untuk cegah titip absen web*

### Tabel `Employee` (Master Data Karyawan)
Menyimpan profil karyawan. Data ini disesuaikan dengan format migrasi dari Google Sheets HR.
* `id` (UUID, Primary Key)
* `user_id` (FK to User, 1-to-1, Nullable) - *Relasi ke akun login*
* `nik` (String, Unique) - *Nomor urut / Nomor Induk Karyawan*
* `full_name` (String) - *Nama Lengkap*
* `nickname` (String) - *Nama Panggilan*
* `hikvision_id` (String, Unique, Nullable) - *ID karyawan di mesin fisik Hikvision*
* `whatsapp_number` (String) - *Nomor HP Pribadi (Digunakan untuk notifikasi WA)*
* `emergency_contact` (String) - *Nomor HP Darurat*
* `gender` (Enum: LAKI_LAKI, PEREMPUAN)
* `religion` (String)
* `address` (TextField)
* `role` / `position` (String/Enum) - *Jabatan (misal: CEO, Manager, Marketing)*
* `birth_place` (String) - *Tempat Lahir*
* `birth_date` (Date) - *Tanggal Lahir (Untuk trigger reminder ulang tahun)*
* `join_date` (Date) - *Tanggal Masuk Kerja (Digunakan untuk hitung otomatis Masa Kerja)*
* `bank_account_info` (String) - *Nomor Rekening & Nama Bank*
* `is_active` (Boolean, Default: True) - *(Soft delete jika karyawan resign)*

---

## 2. Tabel Absensi & Laporan (App: `attendance` & `daily_report`)

### Tabel `AttendanceLog`
Mencatat log masuk dan pulang. Menerima data baik dari Tarikan Mesin Hikvision maupun dari input Web/HP.
* `id` (UUID, Primary Key)
* `employee_id` (FK to Employee)
* `date` (Date) - *Tanggal absen*
* `clock_in` (DateTime, Nullable)
* `clock_out` (DateTime, Nullable)
* `source` (Enum/String) - **Sumber data:** `HIKVISION_MACHINE`, `WEB_LED_MODE`, `WEB_RENTAL`, `MANUAL_BY_HR`
* `location` (PointField, PostGIS, Nullable) - *Menyimpan koordinat Latitude/Longitude (hanya terisi jika absen via Web)*
* `photo_evidence` (ImageField/URL, Nullable) - *Foto selfie bukti kerja (hanya terisi jika absen via Web)*
* `is_late` (Boolean, Default: False) - *(Dihitung otomatis saat clock-in)*
* `is_overtime` (Boolean, Default: False) - *(Dihitung otomatis saat clock-out)*
* `overtime_duration` (DurationField, Nullable)

### Tabel `DailyReport`
Menyimpan teks laporan pekerjaan harian.
* `id` (UUID, Primary Key)
* `employee_id` (FK to Employee)
* `attendance_log_id` (FK to AttendanceLog, 1-to-1) - *Laporan dikaitkan dengan absensi hari itu*
* `date` (Date)
* `report_text` (TextField) - *Isi laporan pekerjaan*
* `created_at` (DateTime, Auto_Now_Add)

---

## 3. Tabel Cuti & Izin (App: `leave`)

### Tabel `LeaveRequest`
* `id` (UUID, Primary Key)
* `employee_id` (FK to Employee)
* `leave_type` (Enum: IZIN, CUTI, SAKIT)
* `start_date` (Date)
* `end_date` (Date)
* `reason` (TextField)
* `attachment` (FileField, Nullable) - *Bukti surat dokter dsb*
* `status` (Enum: PENDING, APPROVED, REJECTED, AUTO_REJECTED)
* `approved_by_id` (FK to User, Nullable)
* `reviewed_at` (DateTime, Nullable)
* `created_at` (DateTime, Auto_Now_Add)

---

## 4. Tabel Manajemen Kontrak (App: `contracts`)

### Tabel `Contract`
Melacak masa aktif PKWT Karyawan.
* `id` (UUID, Primary Key)
* `employee_id` (FK to Employee)
* `contract_type` (String) - *Misal: PKWT 1, PKWT 2*
* `start_date` (Date)
* `end_date` (Date) - *(Field ini yang dipantau oleh Celery/Cronjob untuk notifikasi H-30)*
* `document_file` (FileField, Nullable)
* `is_active` (Boolean)

---

## 5. Tabel Jadwal & Roster (App: `roster`)

Sistem default mengatur hari libur reguler ke hari Rabu (atau sesuai role), namun tabel ini memungkinkan HR memberikan jadwal kustom per karyawan.

### Tabel `WorkSchedule` (Jadwal Default Karyawan)
* `id` (UUID, Primary Key)
* `employee_id` (FK to Employee, 1-to-1)
* `default_day_off` (Integer) - *0=Senin, 1=Selasa, 2=Rabu, dst.*

### Tabel `HolidayOverride` (Pengecualian/Pergeseran Libur)
Untuk skenario di mana HR memindahkan libur seorang karyawan (misal minggu ini liburnya dipindah ke Kamis).
* `id` (UUID, Primary Key)
* `employee_id` (FK to Employee)
* `date` (Date) - *Tanggal spesifik*
* `is_day_off` (Boolean) - *True jika hari itu diliburkan, False jika hari libur default disuruh masuk*
* `reason` (String)
