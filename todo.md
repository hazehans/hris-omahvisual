# 📋 HRIS OmahVisual - Project Recap & Todo

**Last Updated:** 26 September 2026

---

## ✅ Apa Saja yang Sudah Diselesaikan Hari Ini?

### 1. Migrasi & Perombakan Database (PostgreSQL)
- Berhasil menghubungkan *backend* ke database PostgreSQL lokal (`hris_omahvisual_db`).
- Menghapus sistem *UUID* yang rumit dan menggantinya ke **Angka Integer Normal** (1, 2, 3...) agar API sangat mudah di-test lewat Postman.
- *Reset* total database dan melakukan *import* ulang 38 data karyawan dari *file* CSV.
- Pembuatan akun *Super Admin* otomatis (`admin` / `admin123`).

### 2. Integrasi Mesin Absensi Hikvision
- Membuat *script* pintar (`hikvision_fetcher.py`) untuk menyedot log absensi langsung dari mesin HiView fisik (IP `172.16.12.89`).
- **Gudang Data Mentah:** Semua log "aneh" dan gagal dari mesin kini diarsip dengan aman di tabel `HikvisionRawEvent`.
- **Penerjemahan Pintar:** Sistem berhasil memfilter log sukses (`major=5`, `minor=1`) dan memisahkannya menjadi Jam Masuk (`clock_in`) dan Jam Pulang (`clock_out`) di tabel `AttendanceLog`.
- **Sistem KPI Keterlambatan:** Begitu data ditarik, sistem secara langsung mendeteksi telat (lewat jam 08:15) dan otomatis melakukan pemotongan poin KPI.

### 3. Perombakan Frontend (TypeScript Modern)
- Berpindah sepenuhnya dari *file* `jsx` lawas ke arsitektur modern di folder `/src/pages/hr/`.
- Memperbaiki tuntas *bug* `404 Not Found` pada API *Daily Log*.
- Menambahkan **Tombol "Tarik Data Mesin"** di halaman `Live Absensi` admin.
- 🚀 **Fitur Baru:** Halaman **"Raw Event Log"** khusus HR untuk memantau aktivitas mentah di depan mesin absensi secara *real-time*.

---

## 🎯 Apa yang Akan Dilakukan Kedepannya (TODO)?

### 📦 Prioritas Utama (Target Sesi Berikutnya)
- [ ] **Fase 5: Sistem Penggajian (Payroll)**
  - Merumuskan formula: Gaji Pokok - Potongan Telat (dari KPI absensi) + Bonus.
  - Membuat *endpoint* untuk men- *generate* Slip Gaji berformat **PDF** yang bisa di- *download*.
- [ ] **Penyempurnaan Portal Karyawan (Employee Dashboard)**
  - Menampilkan tabel "Riwayat Kehadiran Pribadi" agar karyawan bisa melihat data *clock-in/out* mereka sendiri dari rumah.
  - Membuka akses untuk *download* Slip Gaji pribadi bulanan.

### ⏳ Fitur Lanjutan (Menengah)
- [ ] **Integrasi Daily Report (Laporan Harian)**
  - Menyatukan sistem "Laporan Harian" yang dulunya menggunakan Google Form agar langsung terhubung/ *handshake* dengan web *HRIS* ini.
- [ ] **Otomatisasi Celery / Cron Job**
  - Membuat *background worker* agar tombol "Tarik Data" otomatis ditekan oleh mesin setiap 10 menit sekali tanpa perlu HRD mengklik secara manual.

### 🔮 Backlog Tambahan
- [ ] **Modul Shift & Roster**
  - Membuka kembali `roster.urls` dan mendesain *UI Frontend* untuk pengaturan jadwal kerja karyawan (misal: Shift Pagi / Shift Malam).
