import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout, getCachedUserInfo } from '@/services/authService'
import { clearTokens } from '@/services/api'
import type { UserInfo } from '@/types'

interface AuthContextValue {
  user: UserInfo | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<UserInfo>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => getCachedUserInfo())

  const login = useCallback(async (username: string, password: string) => {
    const userInfo = await apiLogin(username, password)
    setUser(userInfo)
    return userInfo
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    clearTokens()
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isAdmin: user?.role === 'admin',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
