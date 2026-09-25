import requests

# ==========================================
# 🛠️ AREA PENGATURAN SIMULATOR MESIN ABSEN
# ==========================================

# 1. Masukkan NIK Karyawan yang mau dites (misal "1", "2", "3")
NIK_KARYAWAN = "34" 

# 2. Tentukan Tipe Absen ("IN" untuk Masuk, "OUT" untuk Pulang)
TIPE_ABSEN = "IN" 

# 3. Tentukan Jam (Format: YYYY-MM-DDTHH:MM:SSZ)
# Contoh: "2026-09-21T07:30:00Z" (Setengah 8 pagi)
JAM_ABSEN = "2026-09-21T09:30:00Z"

# ==========================================

print(f"⏳ Mengirim data absen {TIPE_ABSEN} untuk NIK {NIK_KARYAWAN} ke server Django...")

url = 'http://127.0.0.1:8000/api/v1/attendance/iot/hikvision-webhook/'
data = {
    'hikvision_id': NIK_KARYAWAN,
    'timestamp': JAM_ABSEN,
    'punch_type': TIPE_ABSEN
}

try:
    response = requests.post(url, json=data)
    if response.status_code == 200:
        print('✅ BERHASIL! Respons dari server:')
        print(response.json())
    else:
        print(f'❌ GAGAL! Kode Error: {response.status_code}')
        print(response.text)
except Exception as e:
    print("❌ ERROR KONEKSI: Pastikan server Django (python manage.py runserver) sudah menyala!")
    print(e)

