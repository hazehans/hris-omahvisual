# Product Requirements Document (PRD) - HRIS OmahVisual

## 1. Ringkasan Proyek
Aplikasi HRIS (Human Resource Information System) *hybrid* yang menggabungkan presensi fisik berbasis mesin IoT (Hikvision) dengan portal web untuk pengelolaan pelaporan harian (*daily report*), pengajuan izin/cuti, manajemen kontrak (PKWT), dan absensi khusus pekerja lapangan. Sistem dilengkapi dengan otomasi notifikasi via WhatsApp.

## 2. Arsitektur & Tech Stack
* **Infrastruktur:** On-Premise Mini PC terhubung ke NAS. (Akses publik/eksternal diurus oleh Tim Jaringan via Tunneling/VPN).
* **Frontend:** React (Vite) + Tailwind CSS (Mobile-first PWA-ready).
* **Backend & API:** Python (Django & Django REST Framework).
* **Database:** PostgreSQL (dengan ekstensi PostGIS untuk geolokasi).
* **Hardware Integrasi:** Mesin Absensi Hikvision HIK-K1T320MFWX (Face Recognition, Fingerprint, RFID) menggunakan protokol ISAPI / SDK.
* **Notifikasi:** WhatsApp API Gateway pihak ke-3 (misal: Fonnte, Wablas, Wazzup) dikoordinasi oleh Celery Task Scheduler.

## 3. Manajemen Pengguna & Autentikasi
* **Sistem Sinkronisasi 2 Arah (Web to Machine):** 
  Pembuatan akun karyawan baru HANYA dilakukan di Website HR oleh Admin. Ketika Admin menyimpan data karyawan, Backend otomatis melakukan "Push" data (ID Karyawan & Nama) ke Mesin Hikvision via ISAPI. Karyawan kemudian tinggal melakukan *Enrollment* (rekam wajah/sidik jari) di mesin fisik.
* **Autentikasi Web:** Karyawan login ke portal web menggunakan **Username** dan **Password**. Autentikasi menggunakan JSON Web Token (JWT).
* **Device Binding:** Login web diikat ke satu perangkat saja (Device ID) untuk fitur absensi web agar menghindari *titip absen*.

## 4. Aturan Absensi (Hybrid Mode) & Role-Based

Sistem harus membedakan perlakuan absensi berdasarkan lokasi dan *Role* karyawan.

### 4.1. Karyawan On-Site (Kantor CV & Gudang LED)
* **Karyawan Reguler & Anak Magang di area Kantor/Gudang.**
* **Absensi (Masuk & Pulang):** **WAJIB** menggunakan mesin fisik Hikvision HIK-K1T320MFWX (Wajah/Jari/Kartu). Mesin akan mengirim log (Timestamp + ID) ke Backend Django.
* **Website HRIS digunakan untuk:**
  * Menulis Laporan Harian (*Daily Report*).
  * Mengajukan Izin & Cuti.
  * Melihat riwayat absensi pribadi.

### 4.2. Karyawan Off-Site (Tim Pemasangan LED di Lapangan)
* **Status:** Sedang dinas luar / pemasangan LED.
* **Absensi (Masuk & Pulang):** **WAJIB** menggunakan Website HRIS di HP (Fitur "Mode LED").
* **Syarat Absen Web:** 
  * *Geolokasi:* Direkam (sebagai log posisi aktual lapangan).
  * *Live Photo:* Wajib memotret aktivitas/lokasi pemasangan secara langsung dari kamera (*Work Evidence*).
* **Website HRIS digunakan untuk:** Absensi Lapangan, Laporan Harian, Pengajuan Izin/Cuti.

### 4.3. Karyawan Toko Rental
* **Status:** Bekerja di lokasi toko rental (berbeda dengan letak mesin absensi utama).
* **Absensi (Masuk & Pulang):** Menggunakan Website HRIS di HP.
* **Syarat Absen Web:**
  * *Geolokasi:* Wajib. Di-*geofencing* (divalidasi jaraknya) dengan titik koordinat Toko Rental.
  * *Live Photo:* Wajib.
* **Website HRIS digunakan untuk:** Absensi Geofencing, Laporan Harian, Pengajuan Izin/Cuti.

## 5. Fitur Spesifik & Otomasi

### 5.1. Notifikasi WhatsApp Otomatis (Cron Job/Celery)
* **Auto-Late (Terlambat):** Pukul 08:05, sistem mengecek roster. Karyawan yang wajib masuk namun *clock-in* setelah pukul 08:00 akan menerima WA peringatan keterlambatan.
* **Auto-Alpha (Tidak Masuk):** Pukul 08:30 (atau jam yang ditentukan), sistem mengecek karyawan yang jadwalnya masuk tapi belum ada data absensi sama sekali (baik di mesin maupun web). Sistem mengirim WA peringatan ketidakhadiran (Alpha).
* **Notifikasi Cuti:** Notifikasi WA otomatis dikirim ke karyawan ketika HR menyetujui (Approve) atau Menolak (Reject) pengajuan cuti mereka.

### 5.2. Manajemen Izin/Cuti
* **Aturan H-2:** Sistem frontend menolak pemilihan tanggal cuti untuk H-1 atau hari H (minimal harus 2 hari sebelum pelaksanaan).
* **Auto Reject H-1:** Scheduler backend mengecek pengajuan *Pending* pada H-1 jam 23:59. Jika belum di-approve Admin, status otomatis berubah menjadi *Auto-Rejected*.

### 5.3. Manajemen Jadwal & Lembur (Roster)
* **Roster Fleksibel:** Sistem memiliki kalender matriks. Default libur adalah hari Rabu, namun HR bisa memodifikasi hari libur spesifik untuk karyawan tertentu.
* **Perhitungan Overtime:** Jika karyawan absen di mesin/web pada hari liburnya (berdasarkan roster), atau *clock-out* melewati batas jam operasional, selisih jamnya dihitung sebagai Lembur (*Overtime*).

### 5.4. Modul Manajemen Kontrak (PKWT)
* Database mencatat riwayat PKWT (Mulai - Berakhir).
* **Reminder Kontrak:** Scheduler mengecek setiap pukul 08:00 pagi. Jika ada kontrak yang sisa waktunya <= 30 hari, muncul notifikasi/alert di Dashboard Admin HR (dan opsional via WA ke HR).

## 6. Modul Penggajian (Payroll) & Slip Gaji Terintegrasi
* **Rekapitulasi Kehadiran Otomatis:** Sistem secara otomatis merekap total kehadiran bulanan (Jumlah Masuk, Terlambat, Alpha, Izin, Sakit, dan Cuti) berdasarkan data *AttendanceLog* dan *LeaveRequest*.
* **Penilaian KPI & Komponen Gaji:** HR memiliki antarmuka untuk menginput nilai KPI, Bonus, atau Potongan (misal: potongan telat/alpha) setiap periode penggajian.
* **Auto-Generate PDF Slip Gaji:** Sistem menghasilkan Slip Gaji berformat PDF yang merinci komponen gaji dan rekap kehadiran.
* **Distribusi Slip Gaji (WA Gateway):**
  * Karyawan dapat mengunduh slip gajinya sendiri melalui Web Portal HRIS (di halaman Profil/Payroll).
  * Sistem menyediakan tombol "Blast Payslip" bagi HR yang akan otomatis mengirimkan Slip Gaji (berupa file PDF atau Secure Link) ke WhatsApp masing-masing karyawan secara pribadi.

## 7. Dashboard HR & Admin Panel (Web)
* **Live Attendance & Log Book:** Monitor *real-time* siapa yang sudah absen via mesin maupun via web hari ini, beserta Laporan Harian mereka.
* **Hardware Sync Monitor:** Tombol/Indikator untuk memastikan koneksi Web ke Mesin Hikvision (ISAPI) berjalan normal.
* **Action Center:** Tabel antrean *approval* untuk Izin, Cuti, dan Reset Device ID (jika karyawan ganti HP).
* **Master Data & Roster:** Manajemen data karyawan dan pengelolaan jadwal libur dinamis.
* **Laporan Bulanan:** Ekspor laporan kehadiran dan rekapitulasi gaji/lembur ke Excel/PDF.