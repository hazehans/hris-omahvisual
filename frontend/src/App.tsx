import { useMemo, useState } from 'react'

import { LoginPanel } from '@/components/auth/LoginPanel'
import { AppShell, type AppPage } from '@/components/layout/AppShell'
import { isLanguage, UI_TEXT, type Language } from '@/lib/i18n'
import {
  clearSession,
  readSession,
  writeSession,
  type AppSession,
} from '@/lib/session'
import { readStoredBrand } from '@/lib/storage'
import { ComponentsPage } from '@/pages/ComponentsPage'
import { HomePage } from '@/pages/HomePage'
import { SettingsPage } from '@/pages/SettingsPage'

export type AppPageId = 'dashboard' | 'karyawan' | 'absensi' | 'daily_log' | 'cuti' | 'kontrak' | 'settings'

function getInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem('liquid-glass-language')
    return isLanguage(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

function App() {
  const [activePageId, setActivePageId] = useState<AppPageId>('dashboard')
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const text = UI_TEXT[language]
  const [brand, setBrand] = useState(() => readStoredBrand(text.brand))
  const [session, setSession] = useState<AppSession | null>(() => readSession())
  const [authError, setAuthError] = useState<string | null>(null)

  const pages: AppPage<AppPageId>[] = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', description: 'Overview HRIS' },
      { id: 'karyawan', label: 'Karyawan', description: 'Manajemen Data Karyawan' },
      { id: 'absensi', label: 'Live Absensi', description: 'Pantau Kehadiran' },
      { id: 'daily_log', label: 'Daily Log', description: 'Laporan Aktivitas Harian' },
      { id: 'cuti', label: 'Izin & Cuti', description: 'Persetujuan Izin dan Cuti' },
      { id: 'kontrak', label: 'Kontrak', description: 'Masa Berlaku PKWT' },
      {
        id: 'settings',
        label: text.pages.settings[0],
        description: text.pages.settings[1],
      },
    ],
    [text],
  )

  function updateLanguage(next: Language): void {
    setLanguage(next)
    try {
      window.localStorage.setItem('liquid-glass-language', next)
    } catch {
      // ignore
    }
  }

  async function handleLogin(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        setAuthError('invalid')
        return false
      }

      const data = await response.json()
      const token = data.access
      window.localStorage.setItem('access_token', token)
      window.localStorage.setItem('refresh_token', data.refresh)

      const meResponse = await fetch('http://127.0.0.1:8000/api/v1/auth/me/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!meResponse.ok) {
        setAuthError('failed')
        return false
      }
      
      const meData = await meResponse.json()
      window.localStorage.setItem('user_role', meData.role)
      window.localStorage.setItem('user_name', meData.name)

      const next = { username: meData.name, role: meData.role }
      writeSession(next)
      setSession(next)
      setAuthError(null)
      return true
    } catch (err) {
      setAuthError('failed')
      return false
    }
  }

  function handleLogout(): void {
    clearSession()
    setSession(null)
    setAuthError(null)
    setActivePageId('dashboard')
  }

  if (!session) {
    return (
      <LoginPanel
        text={text.auth}
        brand={brand}
        language={language}
        languageLabel={text.language}
        onLanguageChange={updateLanguage}
        errorMessage={authError}
        onSubmit={handleLogin}
      />
    )
  }

  return (
    <AppShell
      pages={pages}
      activePageId={activePageId}
      onPageChange={setActivePageId}
      language={language}
      languageLabel={text.language}
      navigationLabel={text.shell.navLabel}
      brand={brand}
      tagline={text.brandTagline}
      liveBadgeLabel={text.shell.liveBadge}
      menuOpenLabel={text.shell.menuOpen}
      menuCloseLabel={text.shell.menuClose}
      onLanguageChange={updateLanguage}
      userLabel={`${text.auth.signedInAs} ${session.username}`}
      logoutLabel={text.auth.signOut}
      onLogout={handleLogout}
    >
      {activePageId === 'dashboard' ? (
        <HomePage
          text={text.home}
          onOpenComponents={() => setActivePageId('karyawan')}
          onOpenSettings={() => setActivePageId('settings')}
        />
      ) : null}

      {activePageId === 'karyawan' ? <ComponentsPage text={text.components} /> : null}
      
      {activePageId === 'absensi' ? <div style={{padding: '2rem'}}>Halaman Absensi (Segera Hadir)</div> : null}
      {activePageId === 'daily_log' ? <div style={{padding: '2rem'}}>Halaman Daily Log (Segera Hadir)</div> : null}
      {activePageId === 'cuti' ? <div style={{padding: '2rem'}}>Halaman Izin & Cuti (Segera Hadir)</div> : null}
      {activePageId === 'kontrak' ? <div style={{padding: '2rem'}}>Halaman Kontrak (Segera Hadir)</div> : null}

      {activePageId === 'settings' ? (
        <SettingsPage
          text={text.settings}
          language={language}
          brand={brand}
          onBrandChange={setBrand}
          onLanguageChange={updateLanguage}
        />
      ) : null}
    </AppShell>
  )
}

export default App
