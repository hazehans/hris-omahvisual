// src/services/api.ts
// Central API client. All HTTP calls go through this layer.
// Handles: base URL, Bearer token injection, token refresh, standard response unwrapping.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

function getAccessToken(): string | null {
  return window.localStorage.getItem('access_token')
}

function getRefreshToken(): string | null {
  return window.localStorage.getItem('refresh_token')
}

function setTokens(access: string, refresh: string): void {
  window.localStorage.setItem('access_token', access)
  window.localStorage.setItem('refresh_token', refresh)
}

function clearTokens(): void {
  window.localStorage.removeItem('access_token')
  window.localStorage.removeItem('refresh_token')
  window.localStorage.removeItem('user_role')
  window.localStorage.removeItem('user_name')
  window.localStorage.removeItem('user_info')
}

// Attempt to refresh access token using refresh token.
async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!res.ok) {
      clearTokens()
      return null
    }

    // simplejwt TokenRefreshView returns plain { access, refresh } (not wrapped)
    const raw = await res.json()
    const access = raw.access ?? raw.data?.access
    const newRefresh = raw.refresh ?? raw.data?.refresh ?? refresh

    if (!access) {
      clearTokens()
      return null
    }

    setTokens(access, newRefresh)
    return access
  } catch {
    clearTokens()
    return null
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData | null
  skipAuth?: boolean
}

// Core fetch wrapper.
// - Injects Authorization header automatically
// - Unwraps { status: 'success', data: ... } envelope
// - On 401, attempts token refresh once then retries
// - Throws on error responses
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, headers: extraHeaders = {}, ...rest } = options

  const buildHeaders = (token: string | null): HeadersInit => {
    const h: Record<string, string> = { ...(extraHeaders as Record<string, string>) }
    if (token && !skipAuth) {
      h['Authorization'] = `Bearer ${token}`
    }
    if (body && !(body instanceof FormData)) {
      h['Content-Type'] = 'application/json'
    }
    return h
  }

  const buildBody = (): BodyInit | undefined => {
    if (!body) return undefined
    if (body instanceof FormData) return body
    return JSON.stringify(body)
  }

  const doFetch = async (token: string | null): Promise<Response> => {
    return fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: buildHeaders(token),
      body: buildBody(),
    })
  }

  let token = skipAuth ? null : getAccessToken()
  let response = await doFetch(token)

  // Token expired → try refresh once
  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      response = await doFetch(newToken)
    } else {
      // Refresh failed → force logout (clear session)
      clearTokens()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
  }

  // Parse response body
  let json: Record<string, unknown>
  try {
    json = await response.json()
  } catch {
    throw new Error(`HTTP ${response.status}: Empty or non-JSON response`)
  }

  // Handle API error envelope
  if (!response.ok) {
    const err = json as { status?: string; code?: string; message?: string; errors?: unknown }
    const message = err.message ?? `HTTP ${response.status}`
    const error = new Error(message) as Error & { code?: string; errors?: unknown; status?: number }
    error.code = err.code
    error.errors = err.errors
    error.status = response.status
    throw error
  }

  // Unwrap success envelope: { status: 'success', data: T }
  if ('data' in json) {
    return json.data as T
  }

  // Some endpoints (e.g. simplejwt refresh) return plain objects
  return json as T
}

export { clearTokens, setTokens, getAccessToken, getRefreshToken, API_BASE }
