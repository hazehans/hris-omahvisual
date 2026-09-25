// src/pages/auth/LoginPage.tsx
// Login page. Uses Liquid Glass LoginPanel as the visual layer.
// Authentication logic uses authService (real backend API).

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginPanel } from '@/components/auth/LoginPanel'
import { useAuth } from '@/context/AuthContext'
import { isLanguage, UI_TEXT, type Language } from '@/lib/i18n'

function getInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem('hris-language')
    return isLanguage(stored) ? stored : 'en'
  } catch {
    return 'en'
  }
}

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [authError, setAuthError] = useState<string | null>(null)

  // Navigate automatically once authenticated state propagates
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/hr/dashboard', { replace: true })
      } else {
        navigate('/employee/dashboard', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  const text = UI_TEXT[language]

  function updateLanguage(next: Language) {
    setLanguage(next)
    try {
      window.localStorage.setItem('hris-language', next)
    } catch {
      // ignore
    }
  }

  async function handleSubmit(username: string, password: string): Promise<boolean> {
    setAuthError(null)
    try {
      await login(username, password)
      // Do not navigate here! State update is asynchronous. 
      // The useEffect above will handle the redirect once AuthContext updates.
      return true
    } catch (err: unknown) {
      const e = err as { code?: string; status?: number; errors?: Record<string, string[]>; message?: string }

      // DEVICE_MISMATCH — device sudah terikat ke perangkat lain
      if (e?.code === 'DEVICE_MISMATCH') {
        setAuthError('Device tidak dikenali. Hubungi HR Administrator untuk reset device ID Anda.')
        return false
      }

      // VALIDATION_ERROR — biasanya credentials salah atau field missing
      // Backend: raise serializers.ValidationError(..., code='INVALID_CREDENTIALS')
      // DRF wraps it as non_field_errors → custom handler returns code='VALIDATION_ERROR'
      if (e?.code === 'VALIDATION_ERROR') {
        // Coba ambil pesan spesifik dari errors.non_field_errors jika ada
        const detail = e.errors?.non_field_errors?.[0] ?? e.message ?? ''
        if (detail.toLowerCase().includes('device')) {
          setAuthError('Device tidak dikenali. Hubungi HR Administrator.')
        } else {
          // Tampilkan pesan dari backend langsung jika lebih deskriptif
          setAuthError(detail || 'invalid')
        }
        return false
      }

      // 401 dari token expiry
      if (e?.status === 401) {
        setAuthError('invalid')
        return false
      }

      // Network error atau server error
      console.error('[LoginPage] Login error:', err)
      setAuthError('failed')
      return false
    }
  }

  return (
    <LoginPanel
      text={text.auth}
      brand="OmahVisual"
      language={language}
      languageLabel={text.language}
      onLanguageChange={updateLanguage}
      errorMessage={authError}
      onSubmit={handleSubmit}
    />
  )
}
