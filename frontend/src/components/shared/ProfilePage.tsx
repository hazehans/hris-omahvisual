/**
 * ProfilePage.tsx — Shared Profile Page
 * Digunakan oleh Employee, HR, dan Superadmin.
 * Konten dan warna badge disesuaikan otomatis berdasarkan role.
 *
 * Extensible: nanti tinggal tambahkan foto upload di bagian avatarCircle.
 */
import { useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { apiRequest } from '@/services/api'
import styles from './ProfilePage.module.css'

// ── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  SUPERUSER: 'Superuser (IT / Owner)',
  HR:        'Human Resource',
  EMPLOYEE:  'Karyawan',
}

const ROLE_BADGE_TONE: Record<string, 'info' | 'success' | 'warn'> = {
  SUPERUSER: 'warn',
  HR:        'info',
  EMPLOYEE:  'success',
}

// ── Component ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { user } = useAuth()

  const [pwForm, setPwForm] = useState({ new_password: '', confirm_password: '' })
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError]     = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)

  const mustChange   = user?.must_change_password === true
  const role         = user?.role ?? 'EMPLOYEE'
  const badgeTone    = ROLE_BADGE_TONE[role] ?? 'info'
  const roleLabel    = ROLE_LABEL[role] ?? role

  // ── Password strength ────────────────────────────────────────────────────
  function strengthInfo(pw: string) {
    if (pw.length === 0)  return { label: '',              cls: '' }
    if (pw.length < 6)    return { label: 'Terlalu pendek', cls: styles.weak }
    if (pw.length < 10)   return { label: 'Cukup',          cls: styles.medium }
    return                       { label: 'Kuat 💪',         cls: styles.strong }
  }
  const strength = strengthInfo(pwForm.new_password)

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(null)

    if (pwForm.new_password.length < 6) {
      setPwError('Password minimal 6 karakter.')
      return
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('Konfirmasi password tidak cocok.')
      return
    }

    setPwLoading(true)
    try {
      const res = await apiRequest<{ message: string }>('/auth/set-password/', {
        method: 'POST',
        body: {
          new_password: pwForm.new_password,
          confirm_password: pwForm.confirm_password,
        },
      })
      setPwSuccess(res.message || 'Password berhasil diubah!')
      setPwForm({ new_password: '', confirm_password: '' })
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Terjadi kesalahan.')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Banner OTP warning */}
      {mustChange && (
        <div className={styles.warningBanner}>
          <span>⚠️</span>
          <div>
            <strong>Anda menggunakan password sementara (OTP).</strong>
            <br />
            Mohon segera ganti password Anda menggunakan form di bawah ini.
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {/* ── Info Card ─────────────────────────────────────────────────── */}
        <GlassPanel>
          <div className={styles.profileHeader}>
            {/* Avatar — slot untuk foto nanti */}
            <div className={styles.avatarCircle}>
              <span className={styles.avatarInitial}>
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div className={styles.profileMeta}>
              <h2 className={styles.profileName}>{user?.name ?? '-'}</h2>
              <Badge tone={badgeTone}>{roleLabel}</Badge>
            </div>
          </div>

          <div className={styles.infoTable}>
            <InfoRow label="NIK"      value={user?.nik      ?? '-'} />
            <InfoRow label="Jabatan"  value={user?.position ?? '-'} />
            <InfoRow label="Role"     value={roleLabel} />
            {/* ↓ Baris foto ditambahkan di sini nanti (ImageField) */}
          </div>

          {/* Superadmin extra hint */}
          {role === 'SUPERUSER' && (
            <div className={styles.superHint}>
              🔐 Akun ini memiliki akses penuh ke seluruh sistem termasuk raw_password karyawan.
            </div>
          )}
        </GlassPanel>

        {/* ── Change Password Card ───────────────────────────────────────── */}
        <GlassPanel>
          <h3 className={styles.sectionTitle}>🔑 Ganti Password</h3>
          <p className={styles.sectionDesc}>
            Gunakan password yang mudah diingat namun sulit ditebak.
            Minimal <strong>6 karakter</strong>.
          </p>

          <form onSubmit={handleChangePassword} className={styles.pwForm}>
            <label className={styles.label}>
              Password Baru
              <div className={styles.inputWrapper}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Minimal 6 karakter"
                  value={pwForm.new_password}
                  onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                  required
                />
                <button type="button" className={styles.eyeBtn}
                  onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                  {showNew ? '🙈' : '👁️'}
                </button>
              </div>
              {pwForm.new_password.length > 0 && (
                <div className={styles.strengthRow}>
                  <div className={`${styles.strengthBar} ${strength.cls}`} />
                  <span className={styles.strengthLabel}>{strength.label}</span>
                </div>
              )}
            </label>

            <label className={styles.label}>
              Konfirmasi Password Baru
              <div className={styles.inputWrapper}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Ketik ulang password baru"
                  value={pwForm.confirm_password}
                  onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                  required
                />
                <button type="button" className={styles.eyeBtn}
                  onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </label>

            {pwError   && <p className={styles.errorMsg}>⚠️ {pwError}</p>}
            {pwSuccess && <p className={styles.successMsg}>✅ {pwSuccess}</p>}

            <button type="submit" className={styles.submitBtn} disabled={pwLoading}>
              {pwLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        </GlassPanel>
      </div>
    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}
