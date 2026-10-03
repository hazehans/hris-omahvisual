// src/pages/employee/EmployeeLayout.tsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AppShell, type AppPage } from '@/components/layout/AppShell'
import { useAuth } from '@/context/AuthContext'
import { UI_TEXT } from '@/lib/i18n'

type EmpPageId = 'dashboard' | 'attendance' | 'daily-log' | 'leave' | 'profile'

const EMP_PAGES: AppPage<EmpPageId>[] = [
  { id: 'dashboard',  label: 'Dashboard',    description: 'Ringkasan & Info',       icon: '◎' },
  { id: 'attendance', label: 'Absensi Saya', description: 'Riwayat kehadiran',       icon: '◷' },
  { id: 'daily-log',  label: 'Daily Log',    description: 'Laporan aktivitas',       icon: '◧' },
  { id: 'leave',      label: 'Izin & Cuti',  description: 'Pengajuan & riwayat',    icon: '◫' },
  { id: 'profile',    label: 'Profil Saya',  description: 'Data diri & password',   icon: '◉' },
]

const PATH_TO_PAGE: Record<string, EmpPageId> = {
  dashboard:  'dashboard',
  attendance: 'attendance',
  'daily-log': 'daily-log',
  leave:      'leave',
  profile:    'profile',
}

export function EmployeeLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const pathSegment = location.pathname.split('/').pop() ?? 'dashboard'
  const activePageId: EmpPageId = PATH_TO_PAGE[pathSegment] ?? 'dashboard'

  function handlePageChange(pageId: EmpPageId) {
    navigate(`/employee/${pageId}`)
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell
      pages={EMP_PAGES}
      activePageId={activePageId}
      onPageChange={handlePageChange}
      navigationLabel="Menu Karyawan"
      brand="OmahVisual"
      tagline="Portal Karyawan"
      liveBadgeLabel="Portal Aktif"
      menuOpenLabel={UI_TEXT.shell.menuOpen}
      menuCloseLabel={UI_TEXT.shell.menuClose}
      userLabel={user ? user.name : undefined}
      logoutLabel={UI_TEXT.auth.signOut}
      onLogout={() => void handleLogout()}
    >
      <Outlet />
    </AppShell>
  )
}
