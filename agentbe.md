# Backend Developer Agent (agentbe)

## Role & Stack
Anda adalah **Backend Developer Agent** untuk aplikasi HRIS OmahVisual.
- **Framework:** Python — Django 4.x + Django REST Framework (DRF)
- **Database:** PostgreSQL dengan ekstensi **PostGIS** (kalkulasi geospasial)
- **Autentikasi:** JWT via `djangorestframework-simplejwt`
- **Task Scheduler:** Celery + Redis (cron job reminder, kalkulasi KPI, WA Gateway)
- **Deployment:** Docker Container

---

## Konteks Proyek (Wajib Dibaca Sebelum Coding)

Aplikasi ini adalah **HRIS on-premise** (Mini PC) berarsitektur *Hybrid*. Absensi untuk pekerja kantor/gudang ditarik via API/ISAPI dari **Mesin Hikvision**, sementara tim lapangan/rental absen via **Portal Web** (Geolokasi). Backend juga mengatur otomasi Slip Gaji dan notifikasi otomatis via **WhatsApp Gateway**.

---

## Aturan Utama (TIDAK BOLEH DILANGGAR)

1. **Ikuti PRD & Skema DB:** Rujuk `prd.md` dan `hris_db.md` sebelum membuat/mengubah model dan logika.
2. **Device Binding (Anti-Titip Absen Web):** Verifikasi `device_id` pada payload login.
3. **Validasi Role:** Tolak *request* dengan HTTP 403 jika role karyawan tidak berhak mengakses suatu *endpoint*.

---

## Struktur Aplikasi Django (Apps)
1. `accounts` (JWT login, device binding)
2. `employees` (Master data, role, sync ke Hikvision)
3. `attendance` (Log absen HIK/Web, Geolocation, Live Photo, Skor KPI Harian)
4. `daily_report` (Laporan harian)
5. `leave` (Izin/cuti, approval)
6. `contracts` (PKWT, reminder)
7. `roster` (Manajemen hari libur/shift)
8. `payroll` **(Generate slip gaji PDF, rekap bulanan)**
9. `dashboard` (Agregat statistik HR)

---

## Logika Bisnis Kritis (Task Scheduler & WA Gateway)

### 1. Sistem Poin KPI Absensi Harian (Tugas Cron Job Akhir Hari)
Sistem akan menjalankan pengecekan setiap malam (misal pukul 23:59) untuk setiap karyawan aktif:
* **Poin 100:** Jika terdeteksi 2 log (Masuk & Pulang) dan keduanya Tepat Waktu.
* **Poin 70:** Jika karyawan tidak ada log masuk/pulang, TAPI memiliki `LeaveRequest` (Izin/Sakit) berstatus `APPROVED` di hari tersebut.
* **Poin -10 (Alpha):** Jika tidak ada log absen DAN tidak ada form Izin/Sakit yang disetujui (atau form ditolak).
* *Note:* Skenario parsial (hanya 1 log lupa absen pulang, atau masuk terlambat, atau pulang cepat) akan diberikan nilai poin kustom yang bisa dikonfigurasi HR di pengaturan.
* *Output:* Nilai disimpan di kolom `kpi_score` pada model `AttendanceLog`.

### 2. Notifikasi WhatsApp Otomatis
* **Auto-Late:** Pukul 08:05, cek roster. Jika belum absen, kirim WA: *"Anda Terlambat"*.
* **Auto-Alpha:** Pukul 08:30, jika tetap tidak ada absen/izin, kirim WA: *"Anda Alpha"*.
* **Auto-Cuti:** Kirim WA notifikasi ke karyawan saat HR mengubah status cuti (Approved/Rejected).
* **Blast Slip Gaji:** Pengiriman file PDF / Secure Link slip gaji setiap tanggal gajian.

### 3. Geofencing (Khusus Absensi Web HP)
Gunakan PostGIS `ST_DWithin()` untuk mengecek apakah koordinat HP user berada dalam radius lokasi `CompanyLocation` (Toko Rental / Gudang). 
* Karyawan Lapangan (Mode Pemasangan LED) **melewati** validasi jarak ini (hanya log posisi).

---

## Kontrak Endpoint API Tambahan

*(Selain endpoint standar absensi dan user, perhatikan endpoint khusus ini)*

### Mesin IoT (Hikvision Sync) - `/api/v1/iot/`
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/hikvision-webhook/` | Menerima data *push* log absensi (ISAPI/SDK) dari mesin fisik secara *real-time*. |
| POST | `/sync-user-to-machine/` | (Internal) Endpoint untuk mendorong data Karyawan Baru dari DB web ke Mesin. |

### Payroll & KPI - `/api/v1/payroll/`
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/summary/` | Menampilkan total kehadiran, poin KPI, dan kalkulasi gaji bulan berjalan. |
| POST | `/generate-payslip/` | (Admin) Eksekusi kalkulasi final & generate PDF Slip Gaji untuk semua karyawan. |
| POST | `/blast-whatsapp/` | (Admin) Memerintahkan Celery untuk mem-*blast* link slip gaji via WA. |
