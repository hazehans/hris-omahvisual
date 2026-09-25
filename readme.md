# 📚 Cheat Sheet & Buku Panduan HRIS OmahVisual

Halo! Ini adalah buku panduan cepat (Cheat Sheet) untuk mengingatkan Anda letak file-file penting yang bisa Anda *tweak* (ubah) sendiri di kemudian hari.

---

## ⚙️ 1. Mengubah Rumus & Poin KPI Absensi
Jika HRD sudah memutuskan berapa nilai pasti untuk poin keterlambatan, lupa absen, dll, Anda bisa mengubah angkanya di file ini:
👉 **Lokasi File:** `backend/attendance/kpi_calculator.py`
* **Cara ubah:** Cari blok `POIN_SEMPURNA = 100`, lalu ubah angkanya sesuai keinginan dan tekan *Save*. Perhitungan akan otomatis mengikuti angka baru.

## 👥 2. Mengubah/Menambah Pilihan Jabatan & Role
Jika ada jabatan baru (misalnya "Manager Marketing"), Anda bisa mengecek atau menambahkannya di bagian tabel Karyawan.
👉 **Lokasi File:** `backend/employees/models.py` (Pada bagian `Employee` model).

## 🗄️ 3. Konfigurasi Password Database (PostgreSQL)
Jika Anda mengganti password PostgreSQL Anda di *pgAdmin*, jangan lupa ganti juga di file ini agar website tidak *error* (gagal konek).
👉 **Lokasi File:** `backend/.env` (Ubah pada bagian `DB_PASSWORD=...`).

## 📥 4. Migrasi Data Karyawan (Dari Excel/CSV)
Jika HR mengirimkan data karyawan masal baru via Excel/Google Sheets, ubah jadi CSV dan namakan `import_data_karyawan_20260921.csv`, letakkan di folder `backend/`, lalu jalankan perintah ini di Terminal (di dalam folder backend):
```bash
python manage.py import_employees import_data_karyawan_20260921.csv
```
*(Ingat: File script "otak" penyedotnya ada di: `backend/employees/management/commands/import_employees.py` jika Anda ingin mengubah format tanggal dsb).*

## 🔌 5. Pintu Masuk Data Mesin Absen (Hikvision Endpoint)
Jalur masuk API (*Webhook*) yang ditugaskan untuk menangkap data lemparan dari mesin fisik berada di sini:
👉 **Lokasi File Logic:** `backend/attendance/views.py` (Class `HikvisionWebhookView`)
👉 **Lokasi File URL:** `backend/attendance/urls.py` (Endpoint-nya adalah: `/api/v1/iot/hikvision-webhook/`)

---

## 🧪 6. Cara Mengetes Sistem (Simulasi Mesin Absen)
Jika Anda ingin mencoba-coba sistem absensi (memasukkan data seolah-olah dari mesin Hikvision) dan melihat perubahannya secara langsung di Dashboard Frontend, ikuti 3 langkah ini:

**Langkah 1: Nyalakan Server Backend (Django)**
Buka Terminal ke folder `backend/`, ketik `.\venv\Scripts\activate`, lalu ketik:
`python manage.py runserver`

**Langkah 2: Nyalakan Server Frontend (React)**
Buka Terminal BARU ke folder `frontend/`, lalu ketik:
`npm run dev`
*(Lalu buka web http://localhost:5173 di browser Anda)*

**Langkah 3: Jalankan Script Simulasi Mesin (Simulator)**
Buka file `backend/test_mesin.py` menggunakan Code Editor Anda. Di dalamnya, Anda bisa mengubah NIK, Tipe Absen ("IN"/"OUT"), dan Jamnya. Setelah di-save, jalankan di terminal (di folder backend):
`python test_mesin.py`

*(Tengok layar browser Anda, data pasti otomatis terupdate!)*

---

### 💻 Kumpulan Perintah Terminal (Wajib Hafal)
Pastikan Anda selalu berada di dalam folder `backend/` dan *virtual environment* menyala (`.\venv\Scripts\activate`) sebelum mengetik perintah di bawah ini:

* **Menjalankan Server Web (Testing):** `python manage.py runserver`
* **Menerapkan Perubahan Database:**
  Setiap Anda menambah/mengubah kolom di `models.py`, WAJIB ketik 2 baris ini:
  1. `python manage.py makemigrations`
  2. `python manage.py migrate`
* **Membuat Akun Super Admin (Bisa Login ke /admin):** `python manage.py createsuperuser`