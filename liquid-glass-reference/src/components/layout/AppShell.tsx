import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { GlassSelect } from '@/components/ui/GlassSelect'
import { LANGUAGE_LABELS, LANGUAGES, type Language } from '@/lib/i18n'

import styles from './AppShell.module.css'

export interface AppPage<T extends string = string> {
  id: T
  label: string
  description: string
  icon?: string
}

interface AppShellProps<T extends string = string> {
  children: ReactNode
  pages: AppPage<T>[]
  activePageId: T
  onPageChange: (pageId: T) => void
  language: Language
  languageLabel: string
  navigationLabel: string
  brand: string
  tagline: string
  liveBadgeLabel?: string
  menuOpenLabel?: string
  menuCloseLabel?: string
  onLanguageChange: (language: Language) => void
  userLabel?: string | null
  logoutLabel?: string
  onLogout?: () => void
  pageIcons?: Partial<Record<T, string>>
}

const DEFAULT_ICONS: Record<string, string> = {
  home: '◎',
  components: '◇',
  settings: '⚙',
}

const LANGUAGE_OPTIONS = LANGUAGES.map((option) => ({
  value: option,
  label: LANGUAGE_LABELS[option],
}))

function AccountControls({
  language,
  languageLabel,
  onLanguageChange,
  userLabel,
  logoutLabel,
  onLogout,
  onAfterAction,
}: {
  language: Language
  languageLabel: string
  onLanguageChange: (language: Language) => void
  userLabel?: string | null
  logoutLabel?: string
  onLogout?: () => void
  onAfterAction?: () => void
}) {
  return (
    <>
      <div className={styles.languageControl}>
        <span className={styles.languageLabel}>{languageLabel}</span>
        <GlassSelect
          size="compact"
          value={language}
          options={LANGUAGE_OPTIONS}
          onChange={(next) => {
            onLanguageChange(next as Language)
            onAfterAction?.()
          }}
          aria-label={languageLabel}
        />
      </div>

      {userLabel || onLogout ? (
        <div className={styles.userBlock}>
          {userLabel ? <p className={styles.userLabel}>{userLabel}</p> : null}
          {onLogout && logoutLabel ? (
            <button
              className={`${styles.logoutButton} glass-lens`}
              type="button"
              onClick={() => {
                onLogout()
                onAfterAction?.()
              }}
            >
              {logoutLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

export function AppShell<T extends string = string>({
  children,
  pages,
  activePageId,
  onPageChange,
  language,
  languageLabel,
  navigationLabel,
  brand,
  tagline,
  liveBadgeLabel = 'Live workspace',
  menuOpenLabel = 'Open account menu',
  menuCloseLabel = 'Close account menu',
  onLanguageChange,
  userLabel,
  logoutLabel,
  onLogout,
  pageIcons,
}: AppShellProps<T>) {
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0]
  const userName = userLabel?.replace(/^.*\s/, '') || brand.slice(0, 1).toUpperCase() || 'A'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const menuWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [activePageId])

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node | null
      if (!target) return
      // GlassSelect portals its listbox to document.body, so option clicks
      // are not descendants of menuWrapRef — still treat them as inside.
      if (menuWrapRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('[data-glass-select-menu]')) return
      setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen])

  return (
    <div className={styles.shell}>
      <div className={styles.stageGlow} aria-hidden="true" />

      <aside className={styles.sidebar}>
        <div className={styles.mobileHeader}>
          <div className={styles.profileRow}>
            <div className={styles.avatar} aria-hidden="true">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <div className={styles.profileCopy}>
              <p className={styles.profileName}>{userName}</p>
              <p className={styles.profileMeta}>{tagline}</p>
            </div>
          </div>

          <div className={styles.mobileMenuWrap} ref={menuWrapRef}>
            <button
              type="button"
              className={`${styles.menuButton} glass-lens ${menuOpen ? styles.menuButtonOpen : ''}`}
              aria-label={menuOpen ? menuCloseLabel : menuOpenLabel}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className={styles.menuIcon} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>

            {menuOpen ? (
              <div id={menuId} className={styles.mobileMenu} role="region" aria-label={menuOpenLabel}>
                <AccountControls
                  language={language}
                  languageLabel={languageLabel}
                  onLanguageChange={onLanguageChange}
                  userLabel={userLabel}
                  logoutLabel={logoutLabel}
                  onLogout={onLogout}
                  onAfterAction={() => setMenuOpen(false)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <nav className={styles.nav} aria-label={navigationLabel}>
          {pages.map((page) => {
            const isActive = page.id === activePageId
            const icon = page.icon ?? pageIcons?.[page.id] ?? DEFAULT_ICONS[page.id] ?? '•'

            return (
              <button
                key={page.id}
                type="button"
                className={`${styles.navItem} glass-lens ${isActive ? styles.navItemActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onPageChange(page.id)}
                title={page.description}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  {icon}
                </span>
                <span className={styles.navText}>
                  <span className={styles.navLabel}>{page.label}</span>
                  <span className={styles.navDescription}>{page.description}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <AccountControls
            language={language}
            languageLabel={languageLabel}
            onLanguageChange={onLanguageChange}
            userLabel={userLabel}
            logoutLabel={logoutLabel}
            onLogout={onLogout}
          />
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{brand}</p>
            <h1 className={styles.pageTitle}>{activePage?.label}</h1>
            <p className={styles.pageDescription}>{activePage?.description}</p>
          </div>
          <div className={styles.heroBadge} aria-hidden="true">
            <span className={styles.heroBadgeDot} />
            {liveBadgeLabel}
          </div>
        </header>

        <main key={activePageId} className={`${styles.main} liquid-flow`}>
          {children}
        </main>
      </div>
    </div>
  )
}
