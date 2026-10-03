import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, type AppPage } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { UI_TEXT } from '@/lib/i18n';

type AdminPageId = 'dashboard' | 'device' | 'audit' | 'employees' | 'attendance' | 'raw-logs' | 'daily-log' | 'leave' | 'profile';

const ADMIN_PAGES: AppPage<AdminPageId>[] = [
  { id: 'dashboard',  label: 'Dashboard',          description: 'Overview & Statistik HRIS',      icon: '◎' },
  { id: 'device',     label: 'Integrasi Perangkat', description: 'Manajemen mesin Hikvision',       icon: '🖧' },
  { id: 'audit',      label: 'Audit Log',           description: 'Log aktivitas pengguna',          icon: '🛡️' },
  { id: 'employees',  label: 'Karyawan',            description: 'Manajemen data karyawan',         icon: '◈' },
  { id: 'attendance', label: 'Live Absensi',        description: 'Pantau kehadiran hari ini',        icon: '◷' },
  { id: 'raw-logs',   label: 'Raw Event Log',       description: 'Log mentah dari mesin absensi',   icon: '▤' },
  { id: 'daily-log',  label: 'Daily Log',           description: 'Laporan aktivitas harian',         icon: '◧' },
  { id: 'leave',      label: 'Izin & Cuti',         description: 'Persetujuan pengajuan karyawan',  icon: '◫' },
  { id: 'profile',    label: 'Profil Saya',         description: 'Data diri & password',            icon: '◉' },
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
  profile:    'profile',
};

export function SuperuserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pathSegment = location.pathname.split('/').pop() ?? 'dashboard';
  const activePageId: AdminPageId = PATH_TO_PAGE[pathSegment] ?? 'dashboard';

  function handlePageChange(pageId: AdminPageId) {
    navigate(`/admin/${pageId}`);
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
      navigationLabel="Menu Superuser"
      brand="OmahVisual"
      tagline="Superuser Console"
      liveBadgeLabel="System Admin"
      menuOpenLabel={UI_TEXT.shell.menuOpen}
      menuCloseLabel={UI_TEXT.shell.menuClose}
      userLabel={user ? user.name : undefined}
      logoutLabel={UI_TEXT.auth.signOut}
      onLogout={() => void handleLogout()}
    >
      <Outlet />
    </AppShell>
  );
}





