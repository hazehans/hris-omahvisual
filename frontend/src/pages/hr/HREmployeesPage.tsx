// src/pages/hr/HREmployeesPage.tsx
// Employee management — CRUD via /api/v1/employees/
// Refactored: single "Edit" action per row; all sub-actions inside Edit modal.

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GlassInput, GlassSelect } from '@/components/ui'
import { employeeService } from '@/services/employeeService'
import type { Employee, ContractType, Gender } from '@/types'
import styles from './HREmployeesPage.module.css'
import { useAuth } from '@/context/AuthContext'

const EMPTY_FORM: Partial<Employee> = {
  nik: '', full_name: '', nickname: '', role: '',
  gender: 'LAKI_LAKI', whatsapp_number: '',
  join_date: '', contract_type: 'PKWT', contract_end_date: '',
  birth_date: '', hikvision_id: '',
  is_active: true,
}

// ── tiny hook: lock body scroll when a modal is open ──────────────────────
function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [active])
}

export function HREmployeesPage() {
  const { user } = useAuth()

  // ── data ─────────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // ── filter / search ──────────────────────────────────────────────────────
  const [search,         setSearch]         = useState('')
  const [filterRole,     setFilterRole]     = useState('ALL')
  const [filterStatus,   setFilterStatus]   = useState('ALL')
  const [filterContract, setFilterContract] = useState('ALL')
  const [currentPage,    setCurrentPage]    = useState(1)
  const itemsPerPage = 10

  // ── edit modal ───────────────────────────────────────────────────────────
  const [editOpen,    setEditOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState<Employee | null>(null)
  const [form,        setForm]        = useState<Partial<Employee>>(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const isDirty = useRef(false)

  // ── password sub-modal ───────────────────────────────────────────────────
  const [pwdOpen,       setPwdOpen]       = useState(false)
  const [rawPwd,        setRawPwd]        = useState<string>('')
  const [newPwdInput,   setNewPwdInput]   = useState('')
  const [pwdLoading,    setPwdLoading]    = useState(false)
  const [pwdResult,     setPwdResult]     = useState<{
    message?: string; username: string; password: string; error?: string
  } | null>(null)

  // ── confirm (deactivate/activate) sub-modal ──────────────────────────────
  const [confirmOpen,   setConfirmOpen]   = useState(false)
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'activate'>('deactivate')
  const [confirmLoading,setConfirmLoading]= useState(false)
  const [confirmError,  setConfirmError]  = useState<string | null>(null)

  useLockBodyScroll(editOpen || pwdOpen || confirmOpen)

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await employeeService.list()
      setEmployees(data)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Gagal memuat data karyawan.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchEmployees() }, [fetchEmployees])

  // ── filter logic ──────────────────────────────────────────────────────────
  const filtered = employees.filter(e => {
    if (filterRole !== 'ALL' && e.role !== filterRole) return false
    if (filterStatus !== 'ALL') {
      if (e.is_active !== (filterStatus === 'ACTIVE')) return false
    }
    if (filterContract !== 'ALL' && e.contract_type !== filterContract) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.full_name.toLowerCase().includes(q) ||
      e.nik.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    )
  })

  const resetFilters = () => {
    setSearch(''); setFilterRole('ALL'); setFilterStatus('ALL')
    setFilterContract('ALL'); setCurrentPage(1)
  }

  const totalPages       = Math.ceil(filtered.length / itemsPerPage)
  const currentEmployees = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // ── open / close edit modal ───────────────────────────────────────────────
  function openAdd() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormSuccess(null)
    isDirty.current = false
    setEditOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditTarget(emp)
    setForm({ ...emp })
    setFormError(null)
    setFormSuccess(null)
    isDirty.current = false
    setEditOpen(true)
  }

  function closeEdit() {
    if (isDirty.current) {
      if (!window.confirm('Perubahan belum disimpan. Tutup modal?')) return
    }
    setEditOpen(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormSuccess(null)
    isDirty.current = false
  }

  // ── save edit ─────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    setFormSuccess(null)
    try {
      if (editTarget) {
        await employeeService.update(editTarget.id, form)
        setFormSuccess('Data karyawan berhasil disimpan.')
        isDirty.current = false
        // update local list without full reload
        setEmployees(prev => prev.map(emp =>
          emp.id === editTarget.id ? { ...emp, ...form } as Employee : emp
        ))
      } else {
        await employeeService.create(form)
        setEditOpen(false)
        void fetchEmployees()
      }
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> }
      if (e.errors) {
        setFormError(Object.values(e.errors).flat().join(', '))
      } else {
        setFormError(e.message ?? 'Gagal menyimpan data.')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── password sub-modal ────────────────────────────────────────────────────
  async function openPwdModal() {
    if (!editTarget) return
    setPwdResult(null)
    setNewPwdInput('')
    setRawPwd('')
    setPwdOpen(true)
    if (user?.role === 'SUPERUSER') {
      try {
        const list = await employeeService.listPasswords()
        const found = list.find(l => l.employee_id === editTarget.id)
        setRawPwd(found?.raw_password || 'Belum diatur')
      } catch {
        setRawPwd('Error')
      }
    }
  }

  async function handleResetPwd() {
    if (!editTarget) return
    setPwdLoading(true)
    try {
      const res = await employeeService.resetPassword(
        editTarget.id,
        user?.role === 'SUPERUSER' && newPwdInput ? newPwdInput : undefined
      )
      setPwdResult(res)
      if (user?.role === 'SUPERUSER') setRawPwd(res.password)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setPwdResult({ username: '', password: '', error: e.message || 'Gagal mereset sandi' })
    } finally {
      setPwdLoading(false)
    }
  }

  // ── activate / deactivate ─────────────────────────────────────────────────
  function openConfirmToggle(action: 'deactivate' | 'activate') {
    setConfirmAction(action)
    setConfirmError(null)
    setConfirmOpen(true)
  }

  async function handleToggleStatus() {
    if (!editTarget) return
    setConfirmLoading(true)
    setConfirmError(null)
    try {
      if (confirmAction === 'deactivate') {
        await employeeService.deactivate(editTarget.id)
        const updated = { ...editTarget, is_active: false }
        setEditTarget(updated)
        setForm(f => ({ ...f, is_active: false }))
        setEmployees(prev => prev.map(emp => emp.id === editTarget.id ? updated : emp))
      } else {
        const updated = await employeeService.update(editTarget.id, { is_active: true })
        setEditTarget(updated)
        setForm(f => ({ ...f, is_active: true }))
        setEmployees(prev => prev.map(emp => emp.id === editTarget.id ? updated : emp))
      }
      setConfirmOpen(false)
    } catch (err: unknown) {
      setConfirmError((err as Error).message ?? 'Gagal mengubah status.')
    } finally {
      setConfirmLoading(false)
    }
  }

  // ── badge maps ────────────────────────────────────────────────────────────
  const contractBadge: Record<ContractType, 'accent' | 'success' | 'neutral' | 'warn'> = {
    PKWT: 'accent', PKWTT: 'success', FREELANCE: 'neutral', INTERN: 'warn',
  }

  // ── keyboard escape ───────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (confirmOpen) { setConfirmOpen(false); return }
      if (pwdOpen)     { setPwdOpen(false); return }
      if (editOpen)    { closeEdit() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen, pwdOpen, confirmOpen])

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Memuat data karyawan…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <GlassPanel>
        {/* ─── Page Header ─────────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Data Karyawan</h1>
            <p className={styles.pageSubtitle}>
              Manajemen seluruh data karyawan aktif dan nonaktif OmahVisual.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Badge tone="neutral">{filtered.length} karyawan</Badge>
            <Button variant="primary" onClick={openAdd}>+ Tambah Karyawan</Button>
          </div>
        </div>

        {/* ─── Filter bar ──────────────────────────────────────── */}
        <div className={styles.filterBar}>
          <div className={styles.filterSearch}>
            <GlassInput
              label="Cari karyawan"
              type="search"
              placeholder="Nama, NIK, jabatan…"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <GlassSelect
            label="Jabatan"
            value={filterRole}
            onChange={v => { setFilterRole(v); setCurrentPage(1) }}
            options={[
              { value: 'ALL', label: 'Semua Jabatan' },
              ...Array.from(new Set(employees.map(e => e.role))).sort().map(r => ({ value: r, label: r })),
            ]}
            size="default"
            className={styles.filterSelect}
          />
          <GlassSelect
            label="Status"
            value={filterStatus}
            onChange={v => { setFilterStatus(v); setCurrentPage(1) }}
            options={[
              { value: 'ALL', label: 'Semua Status' },
              { value: 'ACTIVE', label: 'Aktif' },
              { value: 'INACTIVE', label: 'Nonaktif' },
            ]}
            size="default"
            className={styles.filterSelect}
          />
          <GlassSelect
            label="Kontrak"
            value={filterContract}
            onChange={v => { setFilterContract(v); setCurrentPage(1) }}
            options={[
              { value: 'ALL', label: 'Semua Kontrak' },
              ...Array.from(new Set(employees.map(e => e.contract_type))).sort().map(c => ({ value: c, label: c })),
            ]}
            size="default"
            className={styles.filterSelect}
          />
          <Button variant="danger" onClick={resetFilters}>Reset Filter</Button>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* ─── Table ───────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <p className={styles.empty}>{search ? 'Tidak ditemukan.' : 'Belum ada data karyawan.'}</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIK</th>
                  <th>Jabatan</th>
                  <th>Kontrak</th>
                  <th>No WA</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td className={styles.nameCell}>
                      {emp.full_name}
                      {emp.nickname ? <span className={styles.nickname}> ({emp.nickname})</span> : null}
                    </td>
                    <td className={styles.mono}>{emp.nik}</td>
                    <td>{emp.role}</td>
                    <td>
                      <Badge tone={contractBadge[emp.contract_type] ?? 'neutral'}>
                        {emp.contract_type}
                      </Badge>
                    </td>
                    <td className={styles.mono}>{emp.whatsapp_number}</td>
                    <td>
                      {emp.is_active
                        ? <Badge tone="success">Aktif</Badge>
                        : <Badge tone="danger">Nonaktif</Badge>}
                    </td>
                    <td>
                      <Button variant="ghost" onClick={() => openEdit(emp)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination ──────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>Halaman {currentPage} dari {totalPages}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
              <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* ═══════════════════════════════════════════════════════════
          EDIT / ADD MODAL
      ══════════════════════════════════════════════════════════════ */}
      {editOpen && createPortal(
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeEdit() }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">

            {/* ── Modal Header ──────────────────────────────────── */}
            <div className={styles.modalHeader}>
              <div>
                <h2 id="modal-title" className={styles.modalTitle}>
                  {editTarget ? 'Edit Karyawan' : 'Tambah Karyawan'}
                </h2>
                {editTarget && (
                  <p className={styles.modalSubtitle}>
                    {editTarget.full_name} · NIK {editTarget.nik}
                  </p>
                )}
              </div>
              <button type="button" className={styles.closeBtn} onClick={closeEdit} aria-label="Tutup modal">✕</button>
            </div>

            {/* ── Form ──────────────────────────────────────────── */}
            <form onSubmit={e => void handleSave(e)} className={styles.form}>

              {/* SECTION 1 — DATA PRIBADI */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Data Pribadi</h3>
                <div className={styles.formGrid}>
                  <label className={styles.label}>
                    Nama Lengkap *
                    <input
                      required
                      className={styles.input}
                      value={form.full_name ?? ''}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, full_name: e.target.value })) }}
                    />
                  </label>
                  <label className={styles.label}>
                    Nama Panggilan
                    <input
                      className={styles.input}
                      value={form.nickname ?? ''}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, nickname: e.target.value })) }}
                    />
                  </label>
                  <label className={styles.label}>
                    Jenis Kelamin
                    <select
                      className={styles.input}
                      value={form.gender ?? 'LAKI_LAKI'}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, gender: e.target.value as Gender })) }}
                    >
                      <option value="LAKI_LAKI">Laki-laki</option>
                      <option value="PEREMPUAN">Perempuan</option>
                    </select>
                  </label>
                  <label className={styles.label}>
                    No. WhatsApp *
                    <input
                      required
                      type="tel"
                      className={styles.input}
                      placeholder="08xx..."
                      value={form.whatsapp_number ?? ''}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, whatsapp_number: e.target.value })) }}
                    />
                  </label>
                  <label className={styles.label}>
                    Tanggal Lahir
                    <input
                      type="date"
                      className={styles.input}
                      value={form.birth_date ?? ''}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, birth_date: e.target.value })) }}
                    />
                  </label>
                </div>
              </div>

              {/* SECTION 2 — DATA KEPEGAWAIAN */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Data Kepegawaian</h3>
                <div className={styles.formGrid}>
                  <label className={styles.label}>
                    NIK *
                    <input
                      required
                      className={styles.input}
                      value={form.nik ?? ''}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, nik: e.target.value })) }}
                    />
                  </label>
                  <label className={styles.label}>
                    Jabatan *
                    <input
                      required
                      className={styles.input}
                      value={form.role ?? ''}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, role: e.target.value })) }}
                    />
                  </label>
                  <label className={styles.label}>
                    Jenis Kontrak
                    <select
                      className={styles.input}
                      value={form.contract_type ?? 'PKWT'}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, contract_type: e.target.value as ContractType })) }}
                    >
                      <option value="PKWT">PKWT (Kontrak)</option>
                      <option value="PKWTT">PKWTT (Tetap)</option>
                      <option value="FREELANCE">Freelance</option>
                      <option value="INTERN">Magang</option>
                    </select>
                  </label>
                  <label className={styles.label}>
                    Tanggal Masuk *
                    <input
                      required
                      type="date"
                      className={styles.input}
                      value={form.join_date ?? ''}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, join_date: e.target.value })) }}
                    />
                  </label>
                  {(form.contract_type === 'PKWT' || form.contract_type === 'INTERN') && (
                    <label className={styles.label} style={{ gridColumn: '1 / -1' }}>
                      Tanggal Berakhir Kontrak
                      <input
                        type="date"
                        className={styles.input}
                        value={form.contract_end_date ?? ''}
                        onChange={e => { isDirty.current = true; setForm(f => ({ ...f, contract_end_date: e.target.value })) }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* SECTION 3 — DATA ABSENSI */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Data Absensi</h3>
                <div className={styles.formGrid}>
                  <label className={styles.label}>
                    ID Mesin Absensi (Hikvision)
                    <input
                      className={styles.input}
                      placeholder="Nomor ID user di mesin absensi"
                      value={form.hikvision_id ?? ''}
                      onChange={e => { isDirty.current = true; setForm(f => ({ ...f, hikvision_id: e.target.value })) }}
                    />
                  </label>
                </div>
              </div>

              {/* ── Error / Success feedback ──────────────────────── */}
              {formError   && <p className={styles.errorMsg}>{formError}</p>}
              {formSuccess  && <p className={styles.successMsg}>{formSuccess}</p>}

              {/* ── Secondary actions (edit only) ──────────────────── */}
              {editTarget && (
                <div className={styles.secondaryActions}>
                  <button type="button" className={styles.actionLink} onClick={() => void openPwdModal()}>
                    🔑 Ganti Password
                  </button>
                  {editTarget.is_active ? (
                    <button
                      type="button"
                      className={`${styles.actionLink} ${styles.actionLinkDanger}`}
                      onClick={() => openConfirmToggle('deactivate')}
                    >
                      ⚠ Nonaktifkan Karyawan
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.actionLink} ${styles.actionLinkSuccess}`}
                      onClick={() => openConfirmToggle('activate')}
                    >
                      ✓ Aktifkan Karyawan
                    </button>
                  )}
                </div>
              )}

              {/* ── Primary actions ────────────────────────────────── */}
              <div className={styles.formActions}>
                <Button variant="secondary" type="button" onClick={closeEdit}>Batal</Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════════════════════════════════════════════════
          PASSWORD SUB-MODAL (rendered on top of edit modal)
      ══════════════════════════════════════════════════════════════ */}
      {pwdOpen && editTarget && createPortal(
        <div className={styles.overlay} style={{ zIndex: 200 }} onClick={e => { if (e.target === e.currentTarget) setPwdOpen(false) }}>
          <div className={styles.subModal} role="dialog" aria-modal="true" aria-labelledby="pwd-title">
            <div className={styles.modalHeader}>
              <div>
                <h2 id="pwd-title" className={styles.modalTitle}>Ganti Password</h2>
                <p className={styles.modalSubtitle}>{editTarget.full_name} · NIK {editTarget.nik}</p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setPwdOpen(false)} aria-label="Tutup">✕</button>
            </div>

            <div className={styles.pwdBody}>
              {/* Superuser: see raw password + set custom */}
              {user?.role === 'SUPERUSER' ? (
                <>
                  <div className={styles.rawPwdBox}>
                    <span className={styles.rawPwdLabel}>Password Saat Ini (Teks Asli):</span>
                    <p className={styles.rawPwdValue}>{rawPwd || '—'}</p>
                  </div>
                  <label className={styles.label}>
                    Password Baru (kosongkan untuk generate OTP otomatis)
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ketik password baru atau biarkan kosong"
                      value={newPwdInput}
                      onChange={e => setNewPwdInput(e.target.value)}
                    />
                  </label>
                </>
              ) : (
                <p className={styles.pwdNote}>
                  Anda hanya dapat menghasilkan One-Time Password (OTP) 6 digit acak yang baru untuk karyawan ini.
                  Password asli tidak dapat dilihat oleh HR.
                </p>
              )}

              {/* Result feedback */}
              {pwdResult && !pwdResult.error && (
                <div className={styles.pwdResult}>
                  <p className={styles.pwdResultTitle}>✓ {pwdResult.message}</p>
                  <p className={styles.pwdResultRow}>Username: <strong>{pwdResult.username}</strong></p>
                  <p className={styles.pwdResultRow}>Password baru: <strong>{pwdResult.password}</strong></p>
                  <p className={styles.pwdResultHint}>Berikan informasi ini kepada karyawan yang bersangkutan.</p>
                </div>
              )}
              {pwdResult?.error && (
                <p className={styles.errorMsg}>✕ {pwdResult.error}</p>
              )}
            </div>

            <div className={styles.formActions}>
              <Button variant="ghost" onClick={() => setPwdOpen(false)}>Tutup</Button>
              <Button variant="primary" onClick={() => void handleResetPwd()} disabled={pwdLoading}>
                {pwdLoading
                  ? 'Memproses…'
                  : user?.role === 'SUPERUSER'
                    ? 'Simpan Password'
                    : 'Generate OTP Baru'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════════════════════════════════════════════════════
          CONFIRM TOGGLE STATUS
      ══════════════════════════════════════════════════════════════ */}
      {confirmOpen && editTarget && createPortal(
        <div className={styles.overlay} style={{ zIndex: 200 }} onClick={e => { if (e.target === e.currentTarget) setConfirmOpen(false) }}>
          <div className={styles.subModal} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className={styles.modalHeader}>
              <h2 id="confirm-title" className={styles.modalTitle}>
                {confirmAction === 'deactivate' ? 'Nonaktifkan Karyawan' : 'Aktifkan Karyawan'}
              </h2>
              <button type="button" className={styles.closeBtn} onClick={() => setConfirmOpen(false)} aria-label="Tutup">✕</button>
            </div>

            <div className={styles.confirmBody}>
              {confirmAction === 'deactivate' ? (
                <>
                  <p className={styles.confirmText}>
                    Nonaktifkan <strong>{editTarget.full_name}</strong>?
                  </p>
                  <p className={styles.confirmDesc}>
                    Karyawan akan menjadi nonaktif di sistem HRIS. Data tidak dihapus dan dapat diaktifkan kembali kapan saja.
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.confirmText}>
                    Aktifkan kembali <strong>{editTarget.full_name}</strong>?
                  </p>
                  <p className={styles.confirmDesc}>
                    Karyawan akan kembali aktif di sistem HRIS dan dapat mengakses portal.
                  </p>
                </>
              )}
              {confirmError && <p className={styles.errorMsg}>{confirmError}</p>}
            </div>

            <div className={styles.formActions}>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={confirmLoading}>Batal</Button>
              <Button
                variant={confirmAction === 'deactivate' ? 'danger' : 'primary'}
                onClick={() => void handleToggleStatus()}
                disabled={confirmLoading}
              >
                {confirmLoading
                  ? 'Memproses…'
                  : confirmAction === 'deactivate' ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
