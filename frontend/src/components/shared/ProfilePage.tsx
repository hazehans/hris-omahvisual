/**
 * ProfilePage.tsx — Shared Profile Page (All Roles)
 * Features:
 * - Foto profil: upload oleh HR untuk karyawan, self-upload untuk HR/Superadmin
 * - Edit nickname (karyawan)
 * - Ganti password
 * - Banner OTP warning
 */
import { useState, useRef } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { apiRequest, getAccessToken, API_BASE } from '@/services/api'
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

  // ── Password state ───────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ new_password: '', confirm_password: '' })
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError]     = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)

  // ── Nickname state (Employee only) ───────────────────────────────────────
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [nickLoading, setNickLoading] = useState(false)
  const [nickError, setNickError] = useState<string | null>(null)
  const [nickSuccess, setNickSuccess] = useState<string | null>(null)

  // ── Photo upload state ───────────────────────────────────────────────────
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const mustChange  = user?.must_change_password === true
  const role        = user?.role ?? 'EMPLOYEE'
  const badgeTone   = ROLE_BADGE_TONE[role] ?? 'info'
  const roleLabel   = ROLE_LABEL[role] ?? role

  // Current photo: either newly selected preview, or from user/employee profile
  const currentPhotoUrl = photoPreview ?? user?.photo_url ?? null

  // ── Password strength ────────────────────────────────────────────────────
  function strengthInfo(pw: string) {
    if (pw.length === 0)  return { label: '',               cls: '' }
    if (pw.length < 6)    return { label: 'Terlalu pendek', cls: styles.weak }
    if (pw.length < 10)   return { label: 'Cukup',          cls: styles.medium }
    return                       { label: 'Kuat 💪',         cls: styles.strong }
  }
  const strength = strengthInfo(pwForm.new_password)

  // ── Photo change ─────────────────────────────────────────────────────────
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    setPhotoError(null)
    setPhotoSuccess(null)
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
    } else {
      setPhotoPreview(null)
    }
  }

  async function handlePhotoUpload() {
    if (!photoFile) return
    setPhotoLoading(true)
    setPhotoError(null)
    setPhotoSuccess(null)

    try {
      const empId = user?.employee_id
      if (!empId) {
        setPhotoError('Tidak ditemukan profil karyawan untuk akun ini.')
        return
      }

      const formData = new FormData()
      formData.append('photo', photoFile)
      const token = getAccessToken()
      const res = await fetch(`${API_BASE}/employees/${empId}/photo/`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      setPhotoSuccess('Foto berhasil diperbarui! Refresh halaman untuk melihat perubahan.')
      setPhotoFile(null)
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Gagal upload foto.')
    } finally {
      setPhotoLoading(false)
    }
  }

  // ── Nickname update ──────────────────────────────────────────────────────
  async function handleNicknameUpdate(e: React.FormEvent) {
    e.preventDefault()
    setNickLoading(true)
    setNickError(null)
    setNickSuccess(null)
    try {
      const empId = user?.employee_id
      if (!empId) throw new Error('Profil karyawan tidak ditemukan.')
      await apiRequest(`/employees/${empId}/`, {
        method: 'PATCH',
        body: { nickname } as Record<string, unknown>,
      })
      setNickSuccess('Nama panggilan berhasil diperbarui!')
    } catch (err: unknown) {
      setNickError(err instanceof Error ? err.message : 'Gagal menyimpan.')
    } finally {
      setNickLoading(false)
    }
  }

  // ── Password update ──────────────────────────────────────────────────────
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
        } as Record<string, unknown>,
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
        {/* ── Info + Foto Card ───────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <GlassPanel>
            <div className={styles.profileHeader}>
              {/* Avatar — foto atau inisial */}
              <div
                className={styles.avatarCircle}
                onClick={() => photoInputRef.current?.click()}
                title="Klik untuk ganti foto"
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {currentPhotoUrl ? (
                  <img
                    src={currentPhotoUrl}
                    alt="Foto Profil"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  <span className={styles.avatarInitial}>
                    {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                )}
                {/* Overlay edit icon */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.35)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ fontSize: '1.2rem' }}>📷</span>
                </div>
              </div>

              <div className={styles.profileMeta}>
                <h2 className={styles.profileName}>{user?.name ?? '-'}</h2>
                <Badge tone={badgeTone}>{roleLabel}</Badge>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem' }}>
                  Klik foto untuk menggantinya
                </span>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            {/* Photo upload controls (shown when file is selected) */}
            {photoFile && (
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => void handlePhotoUpload()}
                  disabled={photoLoading}
                  className={styles.submitBtn}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', margin: 0 }}
                >
                  {photoLoading ? 'Mengunggah…' : '📤 Simpan Foto'}
                </button>
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  style={{
                    background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.5)', borderRadius: '0.4rem',
                    padding: '0.45rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
              </div>
            )}
            {photoError   && <p className={styles.errorMsg} style={{ marginBottom: '0.75rem' }}>⚠️ {photoError}</p>}
            {photoSuccess && <p className={styles.successMsg} style={{ marginBottom: '0.75rem' }}>✅ {photoSuccess}</p>}

            <div className={styles.infoTable}>
              <InfoRow label="NIK"      value={user?.nik      ?? '-'} />
              <InfoRow label="Jabatan"  value={user?.position ?? '-'} />
              <InfoRow label="Role"     value={roleLabel} />
            </div>

            {role === 'SUPERUSER' && (
              <div className={styles.superHint}>
                🔐 Akun ini memiliki akses penuh ke seluruh sistem termasuk raw_password karyawan.
              </div>
            )}
          </GlassPanel>

          {/* ── Nickname Edit (Employee only) ─────────────────────── */}
          {role === 'EMPLOYEE' && (
            <GlassPanel>
              <h3 className={styles.sectionTitle}>✏️ Nama Panggilan</h3>
              <p className={styles.sectionDesc}>
                Nama yang akan ditampilkan di sidebar. Kolom lain hanya bisa diubah oleh HR.
              </p>
              <form onSubmit={e => void handleNicknameUpdate(e)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  className={styles.input}
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="Nama panggilan kamu..."
                  maxLength={100}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={nickLoading}
                  style={{ margin: 0, padding: '0.65rem 1rem', whiteSpace: 'nowrap' }}
                >
                  {nickLoading ? '…' : 'Simpan'}
                </button>
              </form>
              {nickError   && <p className={styles.errorMsg} style={{ marginTop: '0.5rem' }}>⚠️ {nickError}</p>}
              {nickSuccess && <p className={styles.successMsg} style={{ marginTop: '0.5rem' }}>✅ {nickSuccess}</p>}
            </GlassPanel>
          )}
        </div>

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
