# PRODUCT REQUIREMENTS DOCUMENT (PRD) - HRIS OmahVisual
*Versi Revisi 2 - Active ISAPI Control, Attendance Synchronization, Role Management & Scope Clarification*
**Tanggal Revisi:** 27 September 2026

---

## 1. Ringkasan Eksekutif
Aplikasi HRIS (Human Resource Information System) on-premise untuk mendukung pengelolaan data karyawan, presensi terintegrasi dengan perangkat Hikvision, pelaporan aktivitas harian (daily report), serta pengajuan izin/cuti untuk operasional Omah Visual LED.

Sistem menggunakan Website HRIS sebagai pusat pengelolaan data karyawan dan integrasi perangkat Hikvision melalui protokol ISAPI. Modul payroll belum menjadi bagian dari implementasi tahap ini dan ditempatkan sebagai pengembangan masa depan.

Untuk modul presensi, Hikvision menjadi sumber data utama untuk event autentikasi dan status kehadiran yang dikirim oleh perangkat. HRIS tidak melakukan inferensi IN/OUT berdasarkan jam, melainkan menggunakan field `attendanceStatus` dari event Hikvision.

Integrasi biometric face enrollment/download tidak termasuk scope implementasi tahap ini karena endpoint khusus face data belum tervalidasi. Pendaftaran face recognition dapat tetap dilakukan langsung pada perangkat Hikvision.

---

## 2. Tujuan Sistem
1. Menyediakan satu sumber data utama untuk informasi karyawan pada sisi HRIS.
2. Mengintegrasikan data employee HRIS dengan identitas employee pada perangkat Hikvision.
3. Mengotomatisasi pembuatan/perubahan/hapus user Hikvision dari HRIS.
4. Mengambil dan menyimpan event presensi Hikvision secara berkala menggunakan background worker.
5. Menyediakan histori presensi yang dapat ditampilkan kepada HR dan karyawan.
6. Menyediakan pengelolaan daily report dan izin/cuti.
7. Menyediakan audit trail untuk aktivitas administratif dan integrasi perangkat.

---

## 3. Scope Sistem
### 3.1 In Scope
- Manajemen akun dan role.
- Master data karyawan.
- Integrasi user HRIS ↔ Hikvision.
- Integrasi kartu/access credential yang didukung endpoint Hikvision.
- Sinkronisasi AcsEvent sebagai raw event dan attendance record.
- Penentuan IN/OUT berdasarkan `attendanceStatus` dari Hikvision.
- Dashboard, histori presensi, raw event log, daily report, dan izin/cuti.
- Device health/status monitoring.
- Audit log.

### 3.2 Out of Scope / Future
- Payroll dan perhitungan gaji.
- Integrasi biometric face image/template dua arah.
- Pengambilan foto wajah dari perangkat ke HRIS.
- Upload foto wajah dari HRIS ke perangkat melalui API khusus biometric.
- Pemrosesan biometric template di database HRIS.

Catatan: perangkat tetap dapat digunakan untuk enrollment face/fingerprint secara langsung. Integrasi face data dapat ditambahkan setelah endpoint dan format data pada perangkat tervalidasi.

---

## 4. Arsitektur & Tech Stack
- Server: On-Premise Mini PC pada jaringan internal/LAN.
- Database: PostgreSQL (`hris_omahvisual_db`).
- Backend: Python + Django + Django REST Framework (DRF).
- Background processing: Celery.
- Frontend: React + Vite + TypeScript.
- Communication: HTTP/HTTPS sesuai dukungan perangkat Hikvision melalui ISAPI.
- Configuration: IP perangkat, username, password, dan credential integrasi disimpan melalui environment configuration/VENV/.env dan tidak di-hardcode.

### Prinsip Arsitektur
- HRIS menjadi master untuk data karyawan dan akun HRIS.
- Hikvision menjadi source of truth untuk event akses/attendance yang berasal dari perangkat.
- Identitas penghubung karyawan pada perangkat menggunakan `employeeNo`/`employeeNoString`.
- Raw event disimpan untuk audit dan troubleshooting.
- Attendance record merupakan hasil pemrosesan event yang valid untuk absensi.

---

## 5. Role & Account Management
### 5.1 Superuser / Owner
- Mengelola seluruh konfigurasi sistem.
- Mengelola akun user dan role.
- Melihat status integrasi perangkat.
- Melihat audit log.
- Melakukan reset password akun.
- Memiliki hak administratif tertinggi termasuk pengelolaan akses user/device.

### 5.2 Admin / HR
- Mengelola data karyawan.
- Mengelola sinkronisasi user ke Hikvision melalui proses yang disediakan sistem.
- Melihat dashboard presensi.
- Mengelola daily report dan approval izin/cuti.

### 5.3 Karyawan
- Melihat dashboard pribadi.
- Melihat riwayat presensi pribadi.
- Mengisi daily report.
- Mengajukan izin/cuti.

### 5.4 Kebijakan Password
- Password tidak boleh disimpan sebagai plaintext biasa.
- Jika kebutuhan bisnis mengharuskan Superuser melihat kembali credential tertentu, credential harus disimpan menggunakan mekanisme penyimpanan yang dapat dipulihkan secara aman (reversible encryption) dengan kontrol akses yang ketat dan audit log.
- Fitur reset password harus memiliki audit trail.
- Password default/hasil reset dapat ditampilkan kepada administrator sesuai policy keamanan yang ditentukan sistem.
- Password HRIS dan credential perangkat Hikvision adalah dua jenis credential yang berbeda dan tidak boleh dicampur.

---

## 6. Modul Karyawan (Employees)
Tabel utama: `employees_employee`

### Data Utama
- employee_id / primary key internal.
- Nomor identitas dan biodata karyawan.
- Nama lengkap.
- Kontak.
- Jenis kelamin.
- Jabatan.
- Status hubungan kerja (PKWT/Tetap/dll.).
- Tanggal mulai dan berakhir kontrak.
- Status aktif/nonaktif.
- `hikvision_employee_no` sebagai identifier pada perangkat Hikvision.

### Aturan Mapping
`employees_employee.hikvision_employee_no` harus menjadi mapping resmi antara employee HRIS dan `employeeNoString` pada event Hikvision.

Nama karyawan (`name`) tidak boleh digunakan sebagai primary identifier integrasi karena dapat berubah atau tidak unik.

---

## 7. Modul Integrasi Hikvision
### 7.1 User Management API
Endpoint yang sudah teridentifikasi:

| Fungsi | Method | Endpoint |
|---|---|---|
| Cari/List User | POST | `/ISAPI/AccessControl/UserInfo/Search?format=json` |
| Tambah/Edit User | PUT | `/ISAPI/AccessControl/UserInfo/SetUp?format=json` |
| Hapus User | PUT | `/ISAPI/AccessControl/UserInfo/Delete?format=json` |
| Cek Statistik User | GET | `/ISAPI/AccessControl/UserInfo/Record?format=json` |
| Cari Data Kartu | POST | `/ISAPI/AccessControl/CardInfo/Search?format=json` |
| Tambah/Ikat Kartu | PUT | `/ISAPI/AccessControl/CardInfo/SetUp?format=json` |
| Hapus Kartu | PUT | `/ISAPI/AccessControl/CardInfo/Delete?format=json` |
| Schedule Template | GET/PUT | `/ISAPI/AccessControl/ScheduleTemplate` |

### 7.2 Push User ke Device
Saat Admin/HR membuat atau memperbarui employee yang memiliki akses ke perangkat, backend dapat menjalankan background task untuk mengirim:

`PUT /ISAPI/AccessControl/UserInfo/SetUp?format=json`

Minimal data yang harus dimapping sesuai dukungan device:
- `employeeNo`
- `name`
- `Valid.beginTime`
- `Valid.endTime`
- `doorRight`
- `RightPlan`
- field user lain yang memang didukung perangkat.

Face/fingerprint enrollment tidak menjadi bagian dari proses otomatis ini pada tahap sekarang. Enrollment biometric tetap dapat dilakukan langsung pada mesin.

### 7.3 Delete User from Device
Saat employee dinonaktifkan/resign dan kebijakan perusahaan mengharuskan pencabutan akses perangkat, backend menggunakan:

`PUT /ISAPI/AccessControl/UserInfo/Delete?format=json`

Proses harus dicatat dalam audit log.

---

## 8. Modul Attendance & Hikvision Event
### 8.1 Endpoint Attendance
`POST /ISAPI/AccessControl/AcsEvent?format=json`

Request menggunakan `AcsEventCond`, termasuk:
- `searchID`
- `searchResultPosition`
- `maxResults`
- `major`
- `minor`
- `startTime`
- `endTime`

### 8.2 Pagination
Response perangkat dapat mengembalikan:
- `totalMatches`
- `numOfMatches`
- `responseStatusStrg`

Jika `responseStatusStrg = "MORE"`, backend wajib melakukan request lanjutan dengan `searchResultPosition` berikutnya sampai seluruh event pada rentang waktu berhasil diambil.

Contoh:

Request 1:
`searchResultPosition = 0`, `maxResults = 30`

Jika terdapat 60 event dan response `MORE`, backend melanjutkan request berikutnya dari posisi 30.

### 8.3 Raw Event Storage
Tabel: `attendance_hikvisionrawevent`

Menyimpan data mentah event untuk audit/debugging, minimal:
- device_id
- serial_no
- major
- minor
- event_time
- employee_no
- employee_name jika tersedia
- card_no jika tersedia
- card_type jika tersedia
- card_reader_no jika tersedia
- door_no jika tersedia
- current_verify_mode
- attendance_status jika tersedia
- attendance_label jika tersedia
- user_type jika tersedia
- raw_payload JSON
- created_at

### 8.4 Filtering Event Attendance
Tidak semua `AcsEvent.InfoList` adalah data presensi.

Event seperti door open/door close, device operation, network event, alarm, atau event tanpa employee harus tetap dapat disimpan sebagai raw event tetapi tidak otomatis menjadi attendance record.

Sebuah event dapat diproses menjadi attendance apabila minimal:
1. `employeeNoString` tersedia dan dapat dipetakan ke employee HRIS.
2. `attendanceStatus` tersedia dan bernilai status attendance yang didukung, misalnya `checkIn` atau `checkOut`.

**HRIS tidak boleh menentukan IN/OUT berdasarkan jam atau asumsi waktu.**

### 8.5 Attendance Status Mapping
| Hikvision | HRIS |
|---|---|
| `checkIn` | IN |
| `checkOut` | OUT |

Field `label` seperti `Clock-In` / `Clock-Out` dapat disimpan sebagai metadata/display label, tetapi `attendanceStatus` menjadi sumber nilai status attendance.

### 8.6 Contoh Event Valid
Event dengan:
- `employeeNoString = 9999`
- `attendanceStatus = checkOut`
- `label = Clock-Out`

diproses sebagai attendance OUT untuk employee yang memiliki mapping Hikvision ID `9999`.

Event dengan:
- `employeeNoString = 102`
- `attendanceStatus = checkIn`
- `label = Clock-In`

diproses sebagai attendance IN untuk employee dengan mapping Hikvision ID `102`.

### 8.7 Event Non-Attendance
Event yang hanya berisi data seperti:
- `major=5, minor=21` dan door information,
- `major=5, minor=22` dan door information,
- event operation/system,
- event tanpa `employeeNoString`,

tidak boleh dibuat menjadi attendance record secara otomatis.

### 8.8 Failed Authentication
Event autentikasi gagal atau event tanpa identitas employee dapat disimpan sebagai raw event. Event tersebut tidak dibuat sebagai attendance record karena tidak dapat dipetakan secara valid ke employee.

---

## 9. Attendance Processing Flow
```text
Hikvision Device
      |
      | POST /ISAPI/AccessControl/AcsEvent
      v
Django/Celery Worker
      |
      v
Handle Pagination
      |
      v
Deduplicate Event
      |
      v
Save Raw Event
      |
      v
employeeNoString tersedia?
      |-------------------- No --------------------> Raw Event Only
      |
     Yes
      |
      v
attendanceStatus tersedia?
      |-------------------- No --------------------> Raw Event Only
      |
     Yes
      |
      v
Map employeeNoString -> employee.hikvision_employee_no
      |
      v
Create Attendance Record
      |
      +--> checkIn  -> IN
      |
      +--> checkOut -> OUT
```

---

## 10. Attendance Database
### 10.1 `attendance_hikvisionrawevent`
Gudang event mentah dari perangkat.

### 10.2 `attendance_attendancelog`
Tabel terstruktur untuk event yang valid menjadi attendance.

Minimal:
- employee_id
- hikvision_event_id
- attendance_date
- event_time
- attendance_type (`IN`/`OUT`)
- verification_mode
- source (`hikvision`)
- created_at

### 10.3 Deduplication
Backend harus memiliki mekanisme untuk mencegah event yang sama menghasilkan attendance record ganda.

Identifier event yang tersedia, termasuk `serialNo`, dapat digunakan sebagai bagian dari strategi deduplication bersama `device_id`. Sistem tidak boleh mengasumsikan bahwa urutan item dalam `InfoList` selalu sama dengan urutan `serialNo`.

---

## 11. Attendance Rule
Konfigurasi rule attendance seperti `First In - Last Out` maupun konfigurasi lain yang dilakukan pada perangkat Hikvision dianggap sebagai konfigurasi di sisi perangkat.

HRIS hanya membaca hasil yang diberikan perangkat melalui `attendanceStatus`.

HRIS tidak membuat rule alternatif berdasarkan jam masuk/pulang apabila `attendanceStatus` tersedia.

---

## 12. Celery / Background Worker
Celery bertanggung jawab untuk:
1. Melakukan polling/sinkronisasi AcsEvent secara berkala.
2. Mengambil seluruh halaman response sampai tidak ada `MORE`.
3. Menyimpan raw event.
4. Menjalankan filtering dan mapping attendance.
5. Menjalankan deduplication.
6. Mencatat error integrasi.
7. Melaporkan status worker pada halaman Device Integration.

Interval polling harus configurable.

---

## 13. Device Management Page
Portal Superuser/Owner menyediakan halaman untuk:
- melihat status koneksi perangkat;
- melihat status worker/synchronization;
- melihat waktu sinkronisasi terakhir;
- melihat jumlah event berhasil diproses;
- melihat error sinkronisasi;
- melihat informasi device integration yang diperlukan;
- melihat audit aktivitas integrasi.

---

## 14. Sitemap / Halaman
### A. Portal Superuser / Owner
1. Device Integration.
2. Global Security / User Management.
3. System Audit.
4. Employee Management.
5. Attendance & Raw Event Monitor.

### B. Portal Admin / HR
1. Dashboard Overview.
2. Employee Management.
3. Attendance / Live Attendance & History.
4. Raw Event Log sesuai privilege.
5. Daily Report Review.
6. Leave / Permission Approval.

### C. Portal Karyawan
1. Dashboard.
2. Personal Attendance History.
3. Daily Report.
4. Leave / Permission Request.

---

## 15. Daily Report
Karyawan dapat mencatat aktivitas kerja harian.

Tabel: `daily_report_dailylog`

Fitur minimum:
- create/edit own daily report sesuai periode yang diizinkan;
- review oleh Admin/HR;
- histori laporan.

---

## 16. Leave / Permission
Tabel: `leave_leaverequest`

Fitur:
- pengajuan izin/cuti;
- jenis izin/cuti;
- tanggal mulai/akhir;
- alasan;
- attachment jika diperlukan;
- approval/rejection;
- histori status.

---

## 17. Audit & Logging
Sistem wajib mencatat aktivitas administratif penting, minimal:
- login/logout;
- perubahan data employee;
- create/update/delete user Hikvision;
- perubahan credential;
- reset password;
- approval/rejection leave;
- sinkronisasi event Hikvision;
- error integrasi;
- perubahan konfigurasi device integration.

---

## 18. Security Requirements
1. Credential perangkat disimpan di environment/secret configuration.
2. Endpoint integrasi tidak boleh mengekspos password device ke frontend.
3. Role-based access control wajib diterapkan.
4. Akses raw event dibatasi sesuai role.
5. Aktivitas sensitif harus diaudit.
6. Password HRIS tidak disimpan plaintext.
7. Informasi credential yang dapat dipulihkan harus dilindungi dengan encryption dan access control.

---

## 19. Future Enhancement
Fitur berikut dapat dipertimbangkan pada fase berikutnya:
- Face enrollment dari HRIS ke Hikvision.
- Fetch face image/data dari Hikvision ke HRIS.
- Integrasi biometric management yang lebih lengkap.
- Payroll.
- Multi-device Hikvision synchronization.
- Device failover / retry queue yang lebih advanced.

Face integration hanya boleh dimasukkan ke implementation scope setelah endpoint, format payload, dan perilaku device berhasil divalidasi pada model Hikvision yang digunakan.

---

## 20. Source of Truth
| Data / Proses | Source of Truth |
|---|---|
| Data karyawan | HRIS |
| Akun HRIS | HRIS |
| Password HRIS | HRIS |
| Hikvision Employee ID | Mapping HRIS ↔ Hikvision |
| Credential / Card di device | Hikvision |
| Face/Fingerprint enrollment | Hikvision (saat ini) |
| Door access event | Hikvision |
| Authentication event | Hikvision |
| Event timestamp | Hikvision |
| Attendance status IN/OUT | Hikvision (`attendanceStatus`) |
| Raw Hikvision events | Hikvision → HRIS |
| Attendance history untuk portal | HRIS hasil sinkronisasi |
| Role/Permission HRIS | HRIS |
| Payroll | Future / Out of Scope |

---

## 21. Acceptance Criteria Utama
1. Employee baru pada HRIS dapat dibuat dengan `hikvision_employee_no` yang valid.
2. Create/update employee dapat memicu sinkronisasi user ke perangkat sesuai endpoint yang didukung.
3. Delete/deactivate employee dapat memicu pencabutan akses device sesuai policy.
4. Worker dapat mengambil seluruh AcsEvent walaupun response menggunakan pagination `MORE`.
5. Raw event tersimpan dan dapat ditelusuri kembali.
6. Event yang memiliki `employeeNoString` + `attendanceStatus=checkIn` menjadi attendance IN.
7. Event yang memiliki `employeeNoString` + `attendanceStatus=checkOut` menjadi attendance OUT.
8. Door open/close atau event tanpa employee tidak dibuat menjadi attendance record.
9. Event yang sama tidak menggandakan attendance record.
10. Face enrollment tetap dapat dilakukan langsung pada mesin tanpa ketergantungan pada API face integration.
11. Payroll tidak menjadi dependency pada implementasi tahap ini.
