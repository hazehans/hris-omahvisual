# Product Requirements Document (PRD) - HRIS Application

## 1. Project Summary
Aplikasi HRIS (Human Resource Information System) yang bertujuan untuk mengelola kehadiran (absensi), pelaporan harian (daily report), dan pencatatan bukti kerja karyawan. Aplikasi ini secara spesifik membedakan kewajiban input data berdasarkan *Role* (peran) masing-masing karyawan, dengan antarmuka (frontend) yang dinamis menyesuaikan role pengguna.

## 2. Tech Stack
* **Frontend:** React
* **Backend:** Google Apps Script (GAS)
* **Database:** Google Sheets

## 3. Akun, Autentikasi, dan Keamanan
* **Metode Login:** Karyawan login menggunakan **Username** dan **Password**.
* **Device Binding (Anti-Titip Absen):** Setiap akun diikat pada **satu perangkat saja (Device ID)**. Pengguna tidak bisa login di device lain untuk mencegah "titip absen" (tipsen). Jika pengguna berganti HP, mereka harus meminta Admin me-reset Device ID di Google Sheets.
* **Role Admin/HR:** Terdapat role tambahan "Admin/HR" di sistem untuk mengelola akun pengguna, mengatur role karyawan, serta me-reset Device ID karyawan yang bermasalah.

## 4. Backend Requirements (Role-Based Data Table)

Sistem harus dapat mengidentifikasi "role pasti" dari setiap pengguna, lalu memvalidasi dan meneruskan data tersebut ke Google Sheets.

### 4.1. Role: Karyawan CV
* **Geolokasi:** Diperlukan (Geofencing divalidasi)
* **Foto:** Opsional
* **Daily Report:** Diperlukan (Input berupa *Textarea*)
* **Jam Masuk:** Diperlukan
* **Jam Pulang:** Diperlukan

### 4.2. Role: Karyawan Rental, Magang, Staff
* **Geolokasi:** Diperlukan (Geofencing divalidasi)
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
  Sistem harus menerapkan geofencing (pembatasan jarak absen). Mengingat ada **2 lokasi kerja yang berbeda**, sistem harus cerdas dalam mengalkulasi jarak dari kedua titik lokasi tersebut. Absen dianggap sah jika koordinat pengguna berada dalam radius wajar dari *salah satu* dari 2 titik lokasi kerja perusahaan.
* **Aturan Kamera (Work Evidence - Strictly Live):** 
  Sistem harus memaksa pengambilan foto dilakukan **secara langsung saat itu juga (*live camera*)**. Akses untuk mengunggah (*upload*) foto dari galeri (storage device) dilarang sepenuhnya demi mencegah kecurangan.

## 6. Frontend Requirements

* **Tampilan Dinamis (React):** 
  Gunakan logika kondisional (misal: *nested if* atau penanganan *state/component*) untuk merender elemen UI sesuai role karyawan. Field input tertentu disembunyikan jika role pengguna tidak membutuhkan field tersebut.
* **Aturan Mandatory (Wajib Isi):** 
  Selain informasi statis dasar (seperti Nama pengguna), pengaturan wajib (mandatory) pada form tidak boleh di-hardcode ke seluruh pengguna, melainkan harus dinamis sesuai poin ke-4.
* **Validasi Klien:**
  Terapkan validasi di sisi Frontend menggunakan ekosistem React untuk memastikan semua data siap (lokasi didapat, foto terjepret, field wajib terisi) sebelum *request* dikirim ke Backend (Google Apps Script).
