import { useMemo, useState } from 'react'

import { LoginPanel } from '@/components/auth/LoginPanel'
import { AppShell, type AppPage } from '@/components/layout/AppShell'
import { isLanguage, UI_TEXT, type Language } from '@/lib/i18n'
import {
  authenticateDemo,
  clearSession,
  readSession,
  writeSession,
  type DemoSession,
} from '@/lib/session'
import { readStoredBrand } from '@/lib/storage'
import { ComponentsPage } from '@/pages/ComponentsPage'
import { HomePage } from '@/pages/HomePage'
import { SettingsPage } from '@/pages/SettingsPage'

export type AppPageId = 'home' | 'components' | 'settings'

function getInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem('liquid-glass-language')
    return isLanguage(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

function App() {
  const [activePageId, setActivePageId] = useState<AppPageId>('home')
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const text = UI_TEXT[language]
  const [brand, setBrand] = useState(() => readStoredBrand(text.brand))
  const [session, setSession] = useState<DemoSession | null>(() => readSession())
  const [authError, setAuthError] = useState<string | null>(null)

  const pages: AppPage<AppPageId>[] = useMemo(
    () => [
      { id: 'home', label: text.pages.home[0], description: text.pages.home[1] },
      {
        id: 'components',
        label: text.pages.components[0],
        description: text.pages.components[1],
      },
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
    // Simulated latency so the signing-in state is visible in the demo.
    await new Promise((resolve) => window.setTimeout(resolve, 280))
    if (!authenticateDemo(username, password)) {
      setAuthError('invalid')
      return false
    }
    const next = { username }
    writeSession(next)
    setSession(next)
    setAuthError(null)
    return true
  }

  function handleLogout(): void {
    clearSession()
    setSession(null)
    setAuthError(null)
    setActivePageId('home')
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
      {activePageId === 'home' ? (
        <HomePage
          text={text.home}
          onOpenComponents={() => setActivePageId('components')}
          onOpenSettings={() => setActivePageId('settings')}
        />
      ) : null}

      {activePageId === 'components' ? <ComponentsPage text={text.components} /> : null}

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
