// src/pages/hr/HRLayout.tsx
// HR shell layout — wraps AppShell with HRIS navigation.
// Uses React Router <Outlet> for child pages.

import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AppShell, type AppPage } from '@/components/layout/AppShell'
import { useAuth } from '@/context/AuthContext'
import { isLanguage, UI_TEXT, type Language } from '@/lib/i18n'

type HRPageId = 'dashboard' | 'attendance' | 'raw-logs' | 'employees' | 'daily-log' | 'leave'

const HR_PAGES: AppPage<HRPageId>[] = [
  { id: 'dashboard',  label: 'Dashboard',    description: 'Overview & Statistik HRIS',      icon: '◎' },
  { id: 'attendance', label: 'Live Absensi', description: 'Pantau kehadiran hari ini',        icon: '◷' },
  { id: 'employees',  label: 'Karyawan',     description: 'Manajemen data karyawan',          icon: '◈' },
  { id: 'daily-log',  label: 'Daily Log',    description: 'Laporan aktivitas harian',          icon: '◧' },
  { id: 'leave',      label: 'Izin & Cuti',  description: 'Persetujuan pengajuan karyawan',   icon: '◫' },
]

// Map route path segment → page id
const PATH_TO_PAGE: Record<string, HRPageId> = {
  dashboard:  'dashboard',
  attendance: 'attendance',
  'raw-logs': 'raw-logs',
  employees:  'employees',
  'daily-log': 'daily-log',
  leave:      'leave',
}

function getInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem('hris-language')
    return isLanguage(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

export function HRLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  const text = UI_TEXT[language]

  // Derive active page from URL
  const pathSegment = location.pathname.split('/').pop() ?? 'dashboard'
  const activePageId: HRPageId = PATH_TO_PAGE[pathSegment] ?? 'dashboard'

  function handlePageChange(pageId: HRPageId) {
    navigate(`/hr/${pageId}`)
  }

  function handleLanguageChange(next: Language) {
    setLanguage(next)
    try {
      window.localStorage.setItem('hris-language', next)
    } catch {
      // ignore
    }
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
      language={language}
      languageLabel={text.language}
      navigationLabel="Menu HRIS"
      brand="OmahVisual"
      tagline="HRIS Management System"
      liveBadgeLabel="Live HRIS"
      menuOpenLabel="Buka menu akun"
      menuCloseLabel="Tutup menu akun"
      onLanguageChange={handleLanguageChange}
      userLabel={user ? `${user.name} (${user.role === 'admin' ? 'HR Admin' : 'Karyawan'})` : undefined}
      logoutLabel="Keluar"
      onLogout={() => void handleLogout()}
    >
      <Outlet />
    </AppShell>
  )
}
