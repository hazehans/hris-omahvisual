# 🎯 TODO List HRIS OmahVisual (Request HR)

*Dokumen ini diperbarui berdasarkan request terbaru dari HR (22 Sept 2026).*

## 🏗️ Phase 1.5: Restrukturisasi Layar HR (Sidebar Navigation)
- [ ] Merombak `Dashboard.jsx` (Admin) agar memiliki **Sidebar Menu Samping**.
- [ ] Memisahkan menu menjadi: Dashboard (Overview), Data Karyawan, Absensi, Daily Log, Izin/Cuti, Kontrak, dan Payroll.

## 📊 Phase 2: Dashboard Overview & Statistik
- [ ] Menambahkan *Metric Cards* di halaman depan HR:
  - Jumlah Karyawan Aktif.
  - Ringkasan Kehadiran Hari Ini (Hadir/Telat/Izin).
  - Pengajuan Cuti yang belum diproses (*Pending*).
- [ ] Menambahkan Grafik/Tabel Rekap Kehadiran per Bulan.
- [ ] Menambahkan Statistik Keterlambatan.

## 📝 Phase 3: Daily Log (Laporan Harian)
- [ ] Karyawan: Fitur input form aktivitas kerja harian (Dari jam X - Y mengerjakan apa).
- [ ] HR: Layar untuk memantau ringkasan *Daily Log* semua karyawan per hari.

## 📜 Phase 4: Modul Kontrak & Reminder
- [ ] UI Tabel Data Kontrak (PKWT), menampilkan Tanggal Mulai dan Berakhir.
- [ ] **Reminder Engine:** Sistem yang otomatis memberi tanda/peringatan merah jika ada kontrak yang akan habis (misal: H-30).
- [ ] **Reminder Ultah:** Notifikasi siapa karyawan yang berulang tahun di bulan/minggu ini.

## 💰 Phase 5: Sistem Penggajian (Payroll)
- [ ] Integrasi total Poin KPI dari absensi ke pemotongan gaji/bonus.
- [ ] Generate Slip Gaji (PDF) untuk diunduh karyawan.
