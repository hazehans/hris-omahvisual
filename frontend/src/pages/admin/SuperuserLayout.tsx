import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, type AppPage } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { isLanguage, UI_TEXT, type Language } from '@/lib/i18n';

type AdminPageId = 'dashboard' | 'device' | 'audit' | 'employees' | 'attendance' | 'raw-logs' | 'daily-log' | 'leave';

const ADMIN_PAGES: AppPage<AdminPageId>[] = [
  { id: 'dashboard',  label: 'Dashboard',    description: 'Overview & Statistik HRIS',      icon: '◎' },
  { id: 'device',     label: 'Integrasi Perangkat', description: 'Manajemen mesin Hikvision',   icon: '🖧' },
  { id: 'audit',      label: 'Audit Log',    description: 'Log aktivitas pengguna',         icon: '🛡️' },
  { id: 'employees',  label: 'Karyawan',     description: 'Manajemen data karyawan',          icon: '◈' },
  { id: 'attendance', label: 'Live Absensi', description: 'Pantau kehadiran hari ini',        icon: '◷' },
  { id: 'raw-logs',   label: 'Raw Event Log', description: 'Log mentah dari mesin absensi',   icon: '▤' },
  { id: 'daily-log',  label: 'Daily Log',    description: 'Laporan aktivitas harian',          icon: '◧' },
  { id: 'leave',      label: 'Izin & Cuti',  description: 'Persetujuan pengajuan karyawan',   icon: '◫' },
];

const PATH_TO_PAGE: Record<string, AdminPageId> = {
  dashboard:  'dashboard',
  device:     'device',
  audit:      'audit',
  employees:  'employees',
  attendance: 'attendance',
  'raw-logs': 'raw-logs',
  'daily-log': 'daily-log',
  leave:      'leave',
};

function getInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem('hris-language');
    return isLanguage(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

export function SuperuserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const text = UI_TEXT[language];

  const pathSegment = location.pathname.split('/').pop() ?? 'dashboard';
  const activePageId: AdminPageId = PATH_TO_PAGE[pathSegment] ?? 'dashboard';

  function handlePageChange(pageId: AdminPageId) {
    navigate(`/admin/${pageId}`);
  }

  function handleLanguageChange(next: Language) {
    setLanguage(next);
    try {
      window.localStorage.setItem('hris-language', next);
    } catch {
      // ignore
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <AppShell
      pages={ADMIN_PAGES}
      activePageId={activePageId}
      onPageChange={handlePageChange}
      language={language}
      languageLabel={text.language}
      navigationLabel="Menu Superuser"
      brand="OmahVisual"
      tagline="Superuser Console"
      liveBadgeLabel="System Admin"
      menuOpenLabel="Buka menu akun"
      menuCloseLabel="Tutup menu akun"
      onLanguageChange={handleLanguageChange}
      userLabel={user ? `${user.name} (Superuser)` : undefined}
      logoutLabel="Keluar"
      onLogout={() => void handleLogout()}
    >
      <Outlet />
    </AppShell>
  );
}





