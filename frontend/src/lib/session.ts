const SESSION_KEY = 'liquid-glass-session'

export interface AppSession {
  username: string
  role?: string
}

/** Demo-only credentials for the template login screen. */
export const DEMO_USERNAME = 'demo'
export const DEMO_PASSWORD = 'demo'

export function readSession(): AppSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppSession
    if (!parsed?.username) return null
    return parsed
  } catch {
    return null
  }
}

export function writeSession(session: AppSession): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore storage failures
  }
}

export function clearSession(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
    window.localStorage.removeItem('access_token')
    window.localStorage.removeItem('refresh_token')
    window.localStorage.removeItem('user_role')
    window.localStorage.removeItem('user_name')
  } catch {
    // ignore
  }
}

export function authenticateDemo(username: string, password: string): boolean {
  return username === DEMO_USERNAME && password === DEMO_PASSWORD
}
