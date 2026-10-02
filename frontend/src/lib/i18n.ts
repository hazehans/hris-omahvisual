// Bahasa tetap Indonesia — sistem multi-bahasa dihapus.

export const UI_TEXT = {
  brand: 'HRIS Omah Visual',
  brandTagline: 'Superuser Console',
  shell: {
    navLabel: 'Navigasi',
    liveBadge: 'Aktif',
    menuOpen: 'Buka menu akun',
    menuClose: 'Tutup menu akun',
  },
  auth: {
    signInTitle: 'Masuk',
    signInSubtitle: 'Gunakan akun HRIS Omah Visual Anda',
    username: 'Username',
    password: 'Password',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Masukkan password Anda',
    next: 'Lanjut',
    signingIn: 'Masuk...',
    signOut: 'Keluar',
    privacyNote: 'Bukan komputer Anda? Gunakan mode pribadi untuk masuk.',
    learnMore: 'Pelajari lebih lanjut',
    errors: {
      invalid: 'Username atau password salah.',
      failed: 'Login gagal. Coba lagi.',
    },
  },
  pages: {
    settings: ['Pengaturan', 'Preferensi tampilan dan sistem'],
  },
  home: {
    title: 'Selamat datang di HRIS Omah Visual',
    body: 'Kelola data karyawan, absensi, cuti, dan kontrak kerja dalam satu platform terintegrasi.',
    cards: [
      {
        title: 'Data Karyawan',
        body: 'Kelola profil, jabatan, dan data lengkap seluruh karyawan Omah Visual.',
      },
      {
        title: 'Live Absensi',
        body: 'Pantau kehadiran karyawan secara real-time langsung dari perangkat absensi.',
      },
      {
        title: 'Izin & Cuti',
        body: 'Proses pengajuan izin dan cuti karyawan dengan alur persetujuan yang mudah.',
      },
    ],
    ctaPrimary: 'Lihat Karyawan',
    ctaSecondary: 'Buka Pengaturan',
  },
  components: {
    title: 'Data Karyawan',
    subtitle: 'Daftar lengkap karyawan yang terdaftar di sistem HRIS.',
    primary: 'Utama',
    secondary: 'Sekunder',
    ghost: 'Ghost',
    danger: 'Hapus',
    disabled: 'Nonaktif',
    inputLabel: 'Input',
    inputPlaceholder: 'Ketik sesuatu…',
    selectLabel: 'Pilih',
    selectOptionA: 'Opsi A',
    selectOptionB: 'Opsi B',
    badgeLive: 'Aktif',
    badgeWarn: 'Perhatian',
    badgeOk: 'Siap',
    cardTitle: 'Panel Kaca',
    cardBody: 'Kartu dan panel menggunakan --glass-bg, --glass-blur, dan --shadow-glass untuk tampilan buram.',
  },
  settings: {
    title: 'Pengaturan Sistem',
    subtitle: 'Konfigurasi preferensi lokal dan tampilan aplikasi.',
    brandLabel: 'Nama Brand',
    brandPlaceholder: 'Nama produk Anda',
    languageLabel: 'Bahasa',
    save: 'Simpan Preferensi',
    saved: 'Tersimpan di browser ini.',
    hint: 'Nama brand disimpan di localStorage dengan kunci liquid-glass-brand.',
  },
} as const

export type UiText = typeof UI_TEXT
