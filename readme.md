# HRIS OmahVisual

Sistem Informasi Sumber Daya Manusia (HRIS) modern untuk internal OmahVisual, dengan dukungan langsung sinkronisasi perangkat biometrik **Hikvision** (Face/Card/PIN) menggunakan protokol ISAPI. 

Dibangun dengan arsitektur **Django (Backend)** dan **React + Vite (Frontend)** dengan antarmuka desain eksklusif "Liquid Glass".

---

## 🏗ï¸Ž Arsitektur Sistem

1. **Frontend (React 19 + TypeScript + Vite)**
   - **Desain UI:** *Liquid Glass Design System* (CSS Modules murni, *Zero-Tailwind*). Desain menggunakan efek *frosted glass*, *blur*, dan struktur modular.
   - **State Management:** React Hooks (`useState`, `useEffect`) & Context API (`AuthContext`).
   - **Lokasi Kode:** Folder `/frontend`

2. **Backend (Django 5 + Django REST Framework)**
   - **Database:** PostgreSQL (Mendukung transaksi dan skalabilitas).
   - **Autentikasi:** JWT / Session (bergantung setup DRF), terintegrasi penuh dengan `AbstractUser`.
   - **Fitur Spesial:** Perekaman *Plain-Text Password* di tabel User (kolom `raw_password`) **khusus** untuk diamati oleh *Superuser* (Instruksi Sistem Internal OmahVisual).
   - **Lokasi Kode:** Folder `/backend`

3. **Perangkat Keras (Hikvision)**
   - **Koneksi:** HTTP Digest Authentication via ISAPI.
   - **Konsep Absensi:** Mesin menjadi sumber utama kehadiran. Status kehadiran (`checkIn` / `checkOut`) dibaca langsung dari mesin, bukan ditebak dari jam masuk.

---

## 🚀 Panduan Setup Lokal (Untuk Pengembangan & Crosscheck)

### A. Persiapan Lingkungan
Pastikan komputer Anda sudah terinstal:
- **Node.js** (Versi 20 atau terbaru)
- **Python** (Versi 3.12 atau terbaru)
- **PostgreSQL** (Versi 16)

### B. Konfigurasi Database (PostgreSQL)
1. Buka *PgAdmin* atau *psql* console.
2. Buat database baru bernama `hris_omahvisual_db`.
3. Pastikan Anda memiliki *user* dengan nama `postgres` dan *password* `hans` (atau sesuaikan di file `.env`).

### C. Menjalankan Backend (Django)
1. Buka terminal, masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Buat *Virtual Environment* (jika belum ada) dan aktifkan:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # (Untuk Windows)
   ```
3. Install semua *library* Python:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan Migrasi Database:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
5. Buat Akun Superuser (Untuk login pertama kali):
   ```bash
   python manage.py createsuperuser
   ```
6. Jalankan Server:
   ```bash
   python manage.py runserver
   ```
   *Backend akan berjalan di `http://127.0.0.1:8000`*

### D. Menjalankan Frontend (React)
1. Buka terminal baru, masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Install semua *package* Node:
   ```bash
   npm install
   ```
3. Jalankan Server Pengembangan Vite:
   ```bash
   npm run dev
   ```
   *Frontend akan berjalan di `http://localhost:5173` atau `http://[IP_ADDRESS]:5173`*

---

## 🎨 Panduan Penyesuaian UI (Untuk UI/UX / Frontend Dev)

Jika teman Anda ingin melakukan penyesuaian (adjust) pada Frontend:
1. **Dilarang Menggunakan Tailwind!** 
   Sistem ini sudah dibersihkan dari *Tailwind utility classes* (`flex`, `text-center`, `bg-red-500`, dsb). Penggunaan Tailwind akan diabaikan oleh sistem.
2. **Gunakan CSS Modules:**
   Setiap komponen React (`.tsx`) memiliki pasangan file `.module.css`. 
   Contoh: Untuk mengedit jarak di halaman Karyawan, buka `HREmployeesPage.tsx` dan ubah gaya di `HREmployeesPage.module.css`.
3. **Komponen Bawaan:**
   Selalu gunakan `<GlassPanel>`, `<Button>`, dan `<Badge>` yang sudah disediakan di folder `src/components/ui/` agar konsistensi efek kaca (*Liquid Glass*) terjaga.

---

## 🌍 Panduan Deployment (Server Production)

Langkah-langkah untuk *System Administrator* / *DevOps* yang akan me-deploy sistem ini ke server (Linux Ubuntu/CentOS).

### 1. Kebutuhan Server
- OS Linux (Ubuntu 22.04 LTS sangat disarankan).
- Nginx (Sebagai *Reverse Proxy* dan *Static File Server*).
- Gunicorn (Sebagai penggerak aplikasi Django).
- PM2 (Opsional, untuk menjaga *script background* tetap menyala).
- IP Statis Server & Akses jaringan ke IP Mesin Hikvision (172.16.12.89).

### 2. Deployment Backend (Gunicorn + Nginx)
1. Letakkan *source code* di `/var/www/hris-omahvisual`.
2. Install Python environment dan dependencies seperti langkah C di atas.
3. Jalankan `python manage.py collectstatic`.
4. Buat file *service* Gunicorn (`/etc/systemd/system/gunicorn.service`):
   ```ini
   [Unit]
   Description=gunicorn daemon for HRIS
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/hris-omahvisual/backend
   ExecStart=/var/www/hris-omahvisual/.venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/var/www/hris-omahvisual/backend/hris.sock hris_core.wsgi:application

   [Install]
   WantedBy=multi-user.target
   ```
5. *Start* dan *Enable* Gunicorn: `sudo systemctl start gunicorn && sudo systemctl enable gunicorn`.

### 3. Otomatisasi Sinkronisasi Hikvision (Celery)
Agar mesin menarik data absensi secara otomatis, jalankan Celery di *background*:
```bash
# Buka terminal server, arahkan ke folder backend (pastikan venv aktif)
celery -A hris_core worker -l INFO
celery -A hris_core beat -l INFO
```
*(Gunakan **Supervisor** atau **Systemd** agar Celery tetap hidup ketika server di-*restart*)*.

### 4. Deployment Frontend (Build)
1. Masuk ke folder `frontend`, jalankan build:
   ```bash
   npm run build
   ```
2. Hasil akhir akan berada di folder `frontend/dist`. 

### 5. Konfigurasi Nginx
Arahkan Nginx untuk melayani file `dist` dari Frontend, dan meneruskan rute `/api/` ke Backend (Gunicorn).
```nginx
server {
    listen 80;
    server_name hris.omahvisual.com; # Ubah sesuai domain/IP lokal

    # Melayani Frontend (React)
    location / {
        root /var/www/hris-omahvisual/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Melayani API Backend (Django)
    location /api/ {
        include proxy_params;
        proxy_pass http://unix:/var/www/hris-omahvisual/backend/hris.sock;
    }
    
    # Melayani Static Files Django (Admin)
    location /static/ {
        root /var/www/hris-omahvisual/backend;
    }
}
```

---

## ⚠️ Peringatan Keamanan Penting
- **Database Backup:** Lakukan *backup* PostgreSQL secara rutin karena sistem ini mencatat `raw_password` dalam bentuk teks asli (Sesuai SOP OmahVisual). Jika *database* bocor, sandi pengguna terancam.
- **Isolasi Jaringan Mesin:** Pastikan port API mesin Hikvision tertutup dari publik, dan hanya bisa diakses via *Local Area Network (LAN)* / VPN oleh Server Django ini.