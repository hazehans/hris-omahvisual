// src/pages/hr/HRLayout.tsx
// HR shell layout — wraps AppShell with HRIS navigation.
// Uses React Router <Outlet> for child pages.

import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AppShell, type AppPage } from '@/components/layout/AppShell'
import { useAuth } from '@/context/AuthContext'
import { UI_TEXT } from '@/lib/i18n'

type HRPageId = 'dashboard' | 'attendance' | 'employees' | 'daily-log' | 'leave' | 'profile'

const HR_PAGES: AppPage<HRPageId>[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Overview & Statistik HRIS', icon: '◎' },
  { id: 'attendance', label: 'Live Absensi', description: 'Pantau kehadiran hari ini', icon: '◷' },
  { id: 'employees', label: 'Karyawan', description: 'Manajemen data karyawan', icon: '◈' },
  { id: 'daily-log', label: 'Daily Log', description: 'Laporan aktivitas harian', icon: '◧' },
  { id: 'leave', label: 'Izin & Cuti', description: 'Persetujuan pengajuan karyawan', icon: '◫' },
  { id: 'profile', label: 'Profil Saya', description: 'Data diri & password', icon: '◉' },
]

// Map route path segment → page id
const PATH_TO_PAGE: Record<string, HRPageId> = {
  dashboard: 'dashboard',
  attendance: 'attendance',
  employees: 'employees',
  'daily-log': 'daily-log',
  leave: 'leave',
  profile: 'profile',
}

export function HRLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Derive active page from URL
  const pathSegment = location.pathname.split('/').pop() ?? 'dashboard'
  const activePageId: HRPageId = PATH_TO_PAGE[pathSegment] ?? 'dashboard'

  function handlePageChange(pageId: HRPageId) {
    navigate(`/hr/${pageId}`)
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell
      pages={HR_PAGES}
      activePageId={activePageId}
      onPageChange={handlePageChange}
      navigationLabel="Menu HRIS"
      brand="OmahVisual"
      tagline="HR Console"
      liveBadgeLabel="Live HRIS"
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



