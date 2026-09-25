# Database Schema (Google Sheets) - HRIS Application

Dokumen ini berisi rancangan struktur tabel (Sheets/Tabs) beserta nama kolom yang dibutuhkan untuk aplikasi HRIS. Struktur ini dirancang dengan pendekatan **Append-Only** agar optimal dan aman saat diakses melalui API (Node.js/PHP).

## Instruksi untuk Pembuatan Google Sheets
Buatlah 6 buah *Tabs* (Sheet) di bagian bawah. Pada masing-masing tab, jadikan Baris 1 (Row 1) sebagai **Header** tabel sesuai dengan nama kolom yang tertera di bawah ini.

---

### Tab 1: `Users`
Tab ini menyimpan master data pengguna, hak akses (role), dan device binding untuk mencegah *tipsen* (titip absen).

| Kolom | Nama Header | Deskripsi / Fungsi |
| :--- | :--- | :--- |
| **A** | `user_id` | ID Unik karyawan (contoh: USR-001) |
| **B** | `nama_lengkap` | Nama asli karyawan |
| **C** | `username` | Username unik untuk login |
| **D** | `password` | Password untuk login (akan di-hash/enkripsi oleh backend) |
| **E** | `role` | Peran karyawan (Pilihan: `CV`, `Staff`, `Crew`, `Admin`) |
| **F** | `device_id` | Otomatis diisi ID Device saat login pertama. Kosongkan untuk reset ganti HP |
| **G** | `status` | Status karyawan (`Aktif` / `Nonaktif`) |

---

### Tab 2: `Absensi`
Tab ini mencatat rekam jejak jam masuk dan jam pulang secara event-based (1 kali absen = 1 baris baru ke bawah).

| Kolom | Nama Header | Deskripsi / Fungsi |
| :--- | :--- | :--- |
| **A** | `absensi_id` | ID Transaksi Absensi (contoh: ABS-20260908-001) |
| **B** | `timestamp` | Waktu absen tercatat (Format: YYYY-MM-DD HH:MM:SS) |
| **C** | `user_id` | Relasi ke `user_id` di tab Users |
| **D** | `tipe_absen` | Pilihan: `Masuk` atau `Pulang` |
| **E** | `koordinat` | Hasil tracking GPS (Format: Latitude, Longitude) |
| **F** | `status_geofencing` | Log validasi lokasi (contoh: `Valid Lokasi 1`, `Luar Radius`) |
| **G** | `foto_url` | Tautan file foto (live camera) yang terunggah di Cloud/Drive |

---

### Tab 3: `Daily_Reports`
Tab ini menampung laporan harian secara terpisah karena karyawan bisa submit report secara fleksibel (tidak harus bersamaan dengan jam absen).

| Kolom | Nama Header | Deskripsi / Fungsi |
| :--- | :--- | :--- |
| **A** | `report_id` | ID Transaksi Laporan (contoh: REP-20260908-001) |
| **B** | `timestamp` | Waktu submit laporan |
| **C** | `user_id` | Relasi ke `user_id` di tab Users |
| **D** | `isi_laporan` | Teks laporan harian (bebas panjang / textarea) |

---

### Tab 4: `Settings`
Tab khusus untuk konfigurasi aplikasi yang bisa diubah oleh Admin (contohnya pengaturan koordinat pusat lokasi absensi).

| Kolom | Nama Header | Deskripsi / Fungsi |
| :--- | :--- | :--- |
| **A** | `id_lokasi` | ID Lokasi (contoh: LOK-1, LOK-2) |
| **B** | `nama_lokasi` | Label Lokasi (contoh: Kantor Pusat, Gudang Cabang) |
| **C** | `latitude` | Titik koordinat Latitude pusat kantor |
| **D** | `longitude` | Titik koordinat Longitude pusat kantor |
| **E** | `max_radius_meter` | Batas toleransi jarak absen dalam satuan meter (contoh: 100) |

---

### Tab 5: `KPI_Penilaian`
Tab ini digunakan oleh Admin/HR untuk mencatat evaluasi kinerja (Key Performance Indicator) karyawan.

| Kolom | Nama Header | Deskripsi / Fungsi |
| :--- | :--- | :--- |
| **A** | `kpi_id` | ID Transaksi Penilaian (contoh: KPI-2026-001) |
| **B** | `timestamp` | Waktu penilaian dicatat |
| **C** | `user_id` | Relasi ke `user_id` karyawan yang dinilai |
| **D** | `penilai_id` | `user_id` dari Admin/HR yang memberikan nilai |
| **E** | `periode_penilaian` | Contoh: `Bulan September 2026` atau `Q3 2026` |
| **F** | `skor_kpi` | Nilai/Skor yang didapatkan (angka) |
| **G** | `catatan_evaluasi` | Keterangan atau catatan khusus terkait kinerja |

---

### Tab 6: `System_Logs`
Tab ini berfungsi sebagai jejak rekam (audit trail) otomatis untuk mencatat setiap aktivitas penting demi keamanan sistem.

| Kolom | Nama Header | Deskripsi / Fungsi |
| :--- | :--- | :--- |
| **A** | `log_id` | ID Log (contoh: LOG-10023) |
| **B** | `timestamp` | Waktu aktivitas terjadi |
| **C** | `user_id` | ID user yang melakukan aksi (kosongkan jika anonim/sistem) |
| **D** | `action` | Jenis aksi (contoh: `LOGIN_SUCCESS`, `RESET_DEVICE_ID`, `LOGIN_FAILED`) |
| **E** | `description` | Deskripsi detail log (contoh: "User mencoba login di device beda") |
| **F** | `ip_address` | IP Address perangkat pengguna |
