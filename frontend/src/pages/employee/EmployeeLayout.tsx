// src/pages/employee/EmployeeLayout.tsx
import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AppShell, type AppPage } from '@/components/layout/AppShell'
import { useAuth } from '@/context/AuthContext'
import { isLanguage, UI_TEXT, type Language } from '@/lib/i18n'

type EmpPageId = 'dashboard' | 'attendance' | 'daily-log' | 'leave'

const EMP_PAGES: AppPage<EmpPageId>[] = [
  { id: 'dashboard',  label: 'Dashboard',    description: 'Ringkasan & Info',      icon: '◎' },
  { id: 'attendance', label: 'Absensi Saya', description: 'Riwayat kehadiran',        icon: '◷' },
  { id: 'daily-log',  label: 'Daily Log',    description: 'Laporan aktivitas',          icon: '◧' },
  { id: 'leave',      label: 'Izin & Cuti',  description: 'Pengajuan & riwayat',   icon: '◫' },
]

const PATH_TO_PAGE: Record<string, EmpPageId> = {
  dashboard:  'dashboard',
  attendance: 'attendance',
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

export function EmployeeLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  const text = UI_TEXT[language]
  const pathSegment = location.pathname.split('/').pop() ?? 'dashboard'
  const activePageId: EmpPageId = PATH_TO_PAGE[pathSegment] ?? 'dashboard'

  function handlePageChange(pageId: EmpPageId) {
    navigate(`/employee/${pageId}`)
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
      pages={EMP_PAGES}
      activePageId={activePageId}
      onPageChange={handlePageChange}
      language={language}
      languageLabel={text.language}
      navigationLabel="Menu Karyawan"
      brand="OmahVisual"
      tagline="Portal Karyawan"
      liveBadgeLabel="Portal Aktif"
      menuOpenLabel="Buka menu akun"
      menuCloseLabel="Tutup menu akun"
      onLanguageChange={handleLanguageChange}
      userLabel={user ? `${user.name} (Karyawan)` : undefined}
      logoutLabel="Keluar"
      onLogout={() => void handleLogout()}
    >
      <Outlet />
    </AppShell>
  )
}
