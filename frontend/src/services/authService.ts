// src/services/authService.ts
// Authentication service. Wraps login, logout, and current user calls.

import { apiRequest, setTokens, clearTokens } from './api'
import type { LoginPayload, LoginResponse, UserInfo } from '@/types'

const DEVICE_KEY = 'hris_device_id'
const USER_INFO_KEY = 'user_info'

/** Get or generate a stable device ID for this browser. */
export function getOrCreateDeviceId(): string {
  let id = window.localStorage.getItem(DEVICE_KEY)
  if (!id) {
    // Generate a UUID v4-like string
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    window.localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

/** Login with username + password. Returns UserInfo on success. */
export async function login(username: string, password: string): Promise<UserInfo> {
  const device_id = getOrCreateDeviceId()
  const payload: LoginPayload = { username, password, device_id }

  // Login endpoint returns plain { access, refresh, user } — NOT wrapped in { data: ... }
  // because LoginView.post() returns Response directly (not through StandardJSONRenderer envelope)
  const raw = await apiRequest<LoginResponse>('/auth/login/', {
    method: 'POST',
    body: payload as unknown as Record<string, unknown>,
    skipAuth: true,
  })

  setTokens(raw.access, raw.refresh)
  window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(raw.user))
  window.localStorage.setItem('user_role', raw.user.role)
  window.localStorage.setItem('user_name', raw.user.name)

  return raw.user
}

/** Logout — blacklists refresh token on backend. */
export async function logout(): Promise<void> {
  const refresh = window.localStorage.getItem('refresh_token')
  if (refresh) {
    try {
      await apiRequest('/auth/logout/', {
        method: 'POST',
        body: { refresh },
      })
    } catch {
      // ignore — clear tokens regardless
    }
  }
  clearTokens()
  window.localStorage.removeItem(USER_INFO_KEY)
}

/** Read cached UserInfo from localStorage (set at login time). */
export function getCachedUserInfo(): UserInfo | null {
  try {
    const raw = window.localStorage.getItem(USER_INFO_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserInfo
  } catch {
    return null
  }
}

/** Fetch fresh user info from backend (optional, for re-validation). */
export async function fetchCurrentUser(): Promise<UserInfo> {
  return apiRequest<UserInfo>('/auth/me/')
}
