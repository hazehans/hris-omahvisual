# Product Requirements Document (PRD) - HRIS Application

## 1. Project Summary
Aplikasi HRIS (Human Resource Information System) on-premise yang bertujuan untuk mengelola kehadiran (absensi), pelaporan harian (daily report), pengajuan izin/cuti, manajemen kontrak (PKWT), dan pencatatan bukti kerja karyawan. Aplikasi ini membedakan kewajiban input data berdasarkan Role (peran) masing-masing karyawan, mengakomodasi dinamika operasional lapangan (seperti pemasangan LED), serta menyediakan dashboard analitik komprehensif untuk tim HR.

## 2. Tech Stack
* **Frontend:** React
* **Backend & API:** Python (Django & Django REST Framework)
* **Database:** postgreSQL (dilengkapi dengan PostGIS untuk kalkulasi spasial)
* **Deployment/Server & Jaringan:** Docker Container Manager via Synology NAS DS920+ (YANG AKAN DIKONFIGURASI OLEH TIM JARINGAN, JADI BUKAN TUGAS KITA, KITA HANYA MEMBUAT WEBNYA SAJA).

## 3. Akun, Autentikasi, dan Keamanan
* **Metode Login:** Karyawan login menggunakan **Username** dan **Password** (terenkripsi hash). Autentikasi menggunakan sistem Token (JSON Web Token / JWT).
* **Device Binding (Anti-Titip Absen):** Setiap akun diikat pada **satu perangkat saja (Device ID)**. Pengguna tidak bisa login di device lain untuk mencegah "titip absen" (tipsen). Jika pengguna berganti HP, mereka harus meminta Admin me-reset Device ID di Database.
* **Role Admin/HR:** Akses khusus untuk mengelola master data karyawan, kontrak, approval cuti, mengatur kalender libur dinamis, dan melihat dashboard rekapitulasi.

## 4. Backend Requirements (Role-Based Data Table)

Sistem harus dapat mengidentifikasi "role pasti" dari setiap pengguna, lalu memvalidasi dan meneruskan data tersebut ke Database.

### 4.1. Role: Karyawan CV, Intern CV, Magang CV, Karyawan LED, Intern LED, Magang LED 

Karena kantor dan gudang berada di tempat yang sama, maka dijadikan satu geolokasi karyawan LED dan juga anak intern dan magang nya
NB : Istilah **Intern** di CV biasanya mahasiswa magang yang DIBAYAR, sedangkan untuk **Magang** biasanya anak SMK/SMA yang magang untuk kebutuhan sekolah dan tidak dibayar 

### 4.1.1. Mode Absen Reguler
* **Geolokasi:** Diperlukan (Geofencing divalidasi ke titik lokasi Gudang LED atau Kantor CV)
* **Foto:** Opsional
* **Daily Report:** Diperlukan  (Input berupa *Textarea*)
* **Jam Masuk:** Diperlukan
* **Jam Pulang:** Diperlukan

### 4.1.2. Mode Pemasangan LED
* **Geolokasi:** Direkam sebagai log saja, namun validasi Geofencing jarak kantor CV atau gudang diabaikan
* **Foto:** Wajib (Foto Aktivitas Pemasangan LED)
* **Daily Report:** Diperlukan  (Input berupa *Textarea*)
* **Jam Masuk:** Diperlukan
* **Jam Pulang:** Diperlukan

### 4.2. Role: Karyawan Rental, Magang Rental, Staff Rental
* **Geolokasi:** Diperlukan (Geofencing divalidasi ke titik lokasi Toko Rental)
* **Foto:** Diperlukan (sebagai *work evidence*)
* **Daily Report:** Diperlukan (Input berupa *Textarea*)
* **Jam Masuk:** Diperlukan
* **Jam Pulang:** Diperlukan

### 4.3. Role: Crew (Gudang)
* **Foto:** Diperlukan (sebagai *work evidence*)
* **Jam Masuk:** Diperlukan
* **Jam Pulang:** Diperlukan

## 5. Fitur Spesifik (Technical Rules)

* **Aturan Geolokasi (Multi-Location Geofencing):** 
  Sistem harus menerapkan geofencing (pembatasan jarak absen). Mengingat ada **2 lokasi kerja yang berbeda**, sistem harus cerdas dalam mengalkulasi jarak dari kedua titik lokasi tersebut. Absen dianggap sah jika koordinat pengguna berada dalam radius wajar dari *salah satu* dari 2 titik lokasi kerja perusahaan dengan menyesuaikan role yang ada.
* **Aturan Kamera (Work Evidence - Strictly Live):** 
  Sistem harus memaksa pengambilan foto dilakukan **secara langsung saat itu juga (*live camera*)**. Akses untuk mengunggah (*upload*) foto dari galeri (storage device) dilarang sepenuhnya demi mencegah kecurangan.
* **Sistem Kalkulasi Bonus & Lembur (Insentif):** 
  Sistem menmisahkan komponen uang harian berrbasis kehadiran valid dan otomatis menghitung selisih waktu clock-out yang melebihi jam operasional sebagai log lembut (Overtime).
* **Manajemen Jadwal & Shift Otomatis (Fleksibilitas Libur):** 
  Hari libur mingguan diatur default di hari Rabu namun **Tidak dipukul rata secara sistem dan dapat diedit oleh Admin/HR** (misal: bukan semua karyawan langsung disetting ke hari rabu) dengan tambahan catatan berikut:
  * Setiap karyawan memiliki profil hari libur (default: Rabu, atau sesuai dengan kontrak yang diberikan)
  * Sistem memiliki kalender kerja (Roster) yang mengecualikan karyawan dari tagihan absensi pada hari liburnya. Jika karyawan absen di hari liburnya, sistem mencatatnya sebagai lembur.
* **Pengajuan Izin/Cuti:** 
  * **Aturan H-2:** Pemilihan tanggal pelaksanaan di frontend minimal H-2 dari tanggal pengajuan.
  * **Auto Reject H-1:** Task scheduler di backend akan mengecek status pengajuan pada H-1 di jam 23:59. Jika belum direspons Admin, sistem otomatis mengubah status menjadi Ditolak (Auto-Reject). 

## 6. Modul Manajemen Kontrak (PKWT) & Notifikasi Terjadwal

Sistem memiliki tabel khusus untuk melacak masa kerja karyawan berdasarkan kontrak hukum.
* **Data Kontrak:** Menyimpan riwayat PKWT, termasuk Tanggal Mulai dan Tanggal Berakhir
* **sistem Pengingat (Cron Job/Scheduler):** Backend akan melakukan pengecekan otomatis setiap hari pada pukul 08:00 untuk mengirimkan notifikasi (via dashboard HR atau integrasi eksternal):
  *  **Reminder Kontrak:** Peringatan bagi karyawan yang masa kontraknya akan habis dalam 30 hari ke depan (H-30).
  *  **Reminder Ulang Tahun:** Pemberitahuan jika ada karyawan yang berrulang tahun pada hari tersebut.

## 7. Dashboard HR & Rekapitulasi (Admin Panel)
* **Overview Karyawan & Live Attendance:** Menampilkan jumlah total karyawan aktif dan memonitor kehadiran di hari ini secara real-time (masuk, telat, dan proyek luar).
* **Roster & Holiday Management:** (Modul Baru):
  * Admin dapat melihat matriks kalender bulanan yang menampilkan hari libur seluruh role karyawan.
  * Admin memiliki fitur untuk mengubah/meng-update hari libur karyawan secara individual (misal: memindahkan hari memindahkan hari libur reguler dari Rabu ke Kamis untuk minggu tertentu). Perubahan ini akan otomatis memperbarui logika perhitungan kehadiran di backend.
* **Log Book Monitor:** Tabel ringkasan Daily Log dari seluruh karyawan di hari tersebut.
* **Action Center:** Daftar pengajuan Izin/Cuti yang masih berstatus Pending dan butuh persetujuan
* **Laporan Analitik:** Rekap kehadiran bulanan per karyawan dan statistik keterlambatan