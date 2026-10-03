/**
 * ResetPasswordPage.tsx
 * Halaman standalone (tanpa sidebar/navbar) khusus untuk karyawan yang
 * baru login menggunakan OTP dan diwajibkan mengganti password baru.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import styles from './ResetPasswordPage.module.css'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [form, setForm] = useState({ new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.new_password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (form.new_password !== form.confirm_password) {
      setError('Password baru dan konfirmasi tidak cocok.')
      return
    }

    setLoading(true)
    try {
      await apiRequest<{ message: string }>('/auth/set-password/', {
        method: 'POST',
        body: {
          new_password: form.new_password,
          confirm_password: form.confirm_password,
        } as Record<string, unknown>,
      })
      setSuccess(true)
      // Logout otomatis setelah 2.5 detik, paksa login ulang pakai password baru
      setTimeout(() => {
        logout()
        navigate('/login', { replace: true })
      }, 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* Logo / Brand */}
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🔐</span>
          <h1 className={styles.brandName}>OmahVisual HRIS</h1>
        </div>

        <h2 className={styles.title}>Buat Password Baru</h2>
        <p className={styles.subtitle}>
          Anda baru saja login menggunakan kode OTP sementara dari HR.
          <br />
          Silakan buat password baru yang <strong>mudah Anda ingat</strong> tapi <strong>sulit ditebak orang lain</strong>.
        </p>

        {success ? (
          <div className={styles.successBox}>
            <span className={styles.successIcon}>✅</span>
            <p>Password berhasil diubah!</p>
            <p className={styles.successSub}>Anda akan diarahkan ke halaman login dalam beberapa detik...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>
              Password Baru
              <div className={styles.inputWrapper}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Minimal 6 karakter"
                  value={form.new_password}
                  onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowNew(v => !v)}
                  tabIndex={-1}
                >
                  {showNew ? '🙈' : '👁️'}
                </button>
              </div>
            </label>

            <label className={styles.label}>
              Konfirmasi Password Baru
              <div className={styles.inputWrapper}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Ketik ulang password baru Anda"
                  value={form.confirm_password}
                  onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </label>

            {/* Password strength indicator */}
            {form.new_password.length > 0 && (
              <div className={styles.strength}>
                <div
                  className={`${styles.strengthBar} ${
                    form.new_password.length < 6
                      ? styles.weak
                      : form.new_password.length < 10
                      ? styles.medium
                      : styles.strong
                  }`}
                />
                <span className={styles.strengthLabel}>
                  {form.new_password.length < 6
                    ? 'Terlalu pendek'
                    : form.new_password.length < 10
                    ? 'Cukup'
                    : 'Kuat 💪'}
                </span>
              </div>
            )}

            {error && <p className={styles.error}>⚠️ {error}</p>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
