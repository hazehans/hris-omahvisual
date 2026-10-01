// src/pages/hr/HREmployeesPage.tsx
// Employee management — CRUD via /api/v1/employees/

import { useEffect, useState, useCallback } from 'react'
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
  is_active: true,
}

export function HREmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterContract, setFilterContract] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [form, setForm] = useState<Partial<Employee>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Password Management
  const { user } = useAuth()
  const [pwdModalOpen, setPwdModalOpen] = useState(false)
  const [pwdEmp, setPwdEmp] = useState<Employee | null>(null)
  const [pwdResult, setPwdResult] = useState<{ message?: string, username: string, password: string, error?: string } | null>(null)
  const [rawPwd, setRawPwd] = useState<string>('')
  const [newPwdInput, setNewPwdInput] = useState('')
  const [resettingPwd, setResettingPwd] = useState(false)

  const openPwdModal = async (emp: Employee) => {
    setPwdEmp(emp)
    setPwdResult(null)
    setNewPwdInput('')
    setPwdModalOpen(true)

    if (user?.role === 'SUPERUSER') {
      try {
        const list = await employeeService.listPasswords()
        const found = list.find(l => l.employee_id === emp.id)
        setRawPwd(found?.raw_password || 'Belum diatur')
      } catch {
        setRawPwd('Error')
      }
    }
  }

  const handleResetPwd = async () => {
    if (!pwdEmp) return
    setResettingPwd(true)
    try {
      const res = await employeeService.resetPassword(pwdEmp.id, user?.role === 'SUPERUSER' && newPwdInput ? newPwdInput : undefined)
      setPwdResult(res)
      if (user?.role === 'SUPERUSER') {
        setRawPwd(res.password)
      }
    } catch (err: any) {
      setPwdResult({ username: '', password: '', error: err.message || 'Gagal mereset sandi' })
    } finally {
      setResettingPwd(false)
    }
  }


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

  const filtered = employees.filter(e => {
    if (filterRole !== 'ALL' && e.role !== filterRole) return false
    if (filterStatus !== 'ALL') {
      const wantActive = filterStatus === 'ACTIVE'
      if (e.is_active !== wantActive) return false
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
    setSearch('')
    setFilterRole('ALL')
    setFilterStatus('ALL')
    setFilterContract('ALL')
    setCurrentPage(1)
  }

  function openAdd() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditTarget(emp)
    setForm({ ...emp })
    setFormError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      if (editTarget) {
        await employeeService.update(editTarget.id, form)
      } else {
        await employeeService.create(form)
      }
      closeModal()
      void fetchEmployees()
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> }
      if (e.errors) {
        const msgs = Object.values(e.errors).flat().join(', ')
        setFormError(msgs)
      } else {
        setFormError(e.message ?? 'Gagal menyimpan data.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(emp: Employee) {
    if (!window.confirm(`Nonaktifkan ${emp.full_name}?`)) return
    try {
      await employeeService.deactivate(emp.id)
      void fetchEmployees()
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  const contractBadge: Record<ContractType, 'accent' | 'success' | 'neutral' | 'warn'> = {
    PKWT: 'accent', PKWTT: 'success', FREELANCE: 'neutral', INTERN: 'warn',
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentEmployees = filtered.slice(startIndex, startIndex + itemsPerPage)

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
        {/* ─── Page Header ──────────────────────────────────────────── */}
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

        {/* ─── Filter bar ──────────────────────────────────────────── */}
        <div className={styles.filterBar}>
          <div className={styles.filterSearch}>
            <GlassInput
              label="Cari karyawan"
              type="search"
              placeholder="Nama, NIK, jabatan…"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
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
                      <div className={styles.actions}>
                        <Button variant="ghost" onClick={() => openEdit(emp)}>Edit</Button>
                        <Button variant="ghost" onClick={() => openPwdModal(emp)}>🔑 Sandi</Button>
                        {emp.is_active && (
                          <Button variant="danger" onClick={() => void handleDeactivate(emp)}>
                            Nonaktifkan
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Halaman {currentPage} dari {totalPages}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
              <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* ── Modal ─────────────────────────────── */}
      {modalOpen && createPortal(
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editTarget ? 'Edit Karyawan' : 'Tambah Karyawan'}
              </h2>
              <button type="button" className={styles.closeBtn} onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={e => void handleSave(e)} className={styles.form}>
              <div className={styles.formGrid}>
                <label className={styles.label}>
                  NIK *
                  <input required className={styles.input} value={form.nik ?? ''} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))} />
                </label>
                <label className={styles.label}>
                  Nama Lengkap *
                  <input required className={styles.input} value={form.full_name ?? ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </label>
                <label className={styles.label}>
                  Nama Panggilan
                  <input className={styles.input} value={form.nickname ?? ''} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
                </label>
                <label className={styles.label}>
                  Jabatan *
                  <input required className={styles.input} value={form.role ?? ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                </label>
                <label className={styles.label}>
                  Jenis Kelamin
                  <select className={styles.input} value={form.gender ?? 'LAKI_LAKI'} onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}>
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </label>
                <label className={styles.label}>
                  No. WhatsApp *
                  <input required className={styles.input} value={form.whatsapp_number ?? ''} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} />
                </label>
                <label className={styles.label}>
                  Tanggal Masuk *
                  <input required type="date" className={styles.input} value={form.join_date ?? ''} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} />
                </label>
                <label className={styles.label}>
                  Jenis Kontrak
                  <select className={styles.input} value={form.contract_type ?? 'PKWT'} onChange={e => setForm(f => ({ ...f, contract_type: e.target.value as ContractType }))}>
                    <option value="PKWT">PKWT (Kontrak)</option>
                    <option value="PKWTT">PKWTT (Tetap)</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="INTERN">Magang</option>
                  </select>
                </label>
                {(form.contract_type === 'PKWT' || form.contract_type === 'INTERN') && (
                  <label className={styles.label}>
                    Tanggal Berakhir Kontrak
                    <input type="date" className={styles.input} value={form.contract_end_date ?? ''} onChange={e => setForm(f => ({ ...f, contract_end_date: e.target.value }))} />
                  </label>
                )}
                <label className={styles.label}>
                  ID Mesin Hikvision
                  <input className={styles.input} value={form.hikvision_id ?? ''} onChange={e => setForm(f => ({ ...f, hikvision_id: e.target.value }))} />
                </label>
              </div>

              {editTarget && (
                <label className={styles.checkLabel}>
                  <input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                  Karyawan Aktif
                </label>
              )}

              {formError && <p className={styles.errorMsg}>{formError}</p>}

              <div className={styles.formActions}>
                <Button variant="secondary" type="button" onClick={closeModal}>Batal</Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Password Management Modal */}
      {pwdModalOpen && pwdEmp && createPortal(
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ padding: '2rem' }}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Manajemen Sandi Karyawan</h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.7 }}>Atur akses login Web App untuk <strong>{pwdEmp.full_name}</strong> (NIK: {pwdEmp.nik})</p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setPwdModalOpen(false)}>X</button>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {user?.role === 'SUPERUSER' ? (
                <>
                  <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Sandi Saat Ini (Teks Asli):</span>
                    <p style={{ fontFamily: 'monospace', fontSize: '1.25rem', marginTop: '0.25rem', color: '#10b981' }}>{rawPwd}</p>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>Setel Sandi Baru (Opsional)</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ketik password baru (atau kosongkan untuk acak otomatis)"
                      value={newPwdInput}
                      onChange={(e) => setNewPwdInput(e.target.value)}
                    />
                  </div>

                  <Button variant="primary" onClick={handleResetPwd} disabled={resettingPwd}>
                    {resettingPwd ? 'Menyimpan...' : 'Simpan / Reset Sandi'}
                  </Button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.875rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                    Sandi asli disembunyikan. Anda hanya bisa menghasilkan One-Time Password (OTP) 6 digit acak yang baru.
                  </p>
                  <Button variant="primary" onClick={handleResetPwd} disabled={resettingPwd}>
                    {resettingPwd ? 'Memproses...' : 'Generate OTP Baru'}
                  </Button>
                </>
              )}

              {pwdResult && !pwdResult.error && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <p style={{ color: '#10b981', fontWeight: 600, marginBottom: '0.5rem' }}>?? {pwdResult.message}</p>
                  <p style={{ fontSize: '0.875rem' }}>Username: <strong style={{ color: 'white' }}>{pwdResult.username}</strong></p>
                  <p style={{ fontSize: '0.875rem' }}>Password Baru: <strong style={{ color: 'white' }}>{pwdResult.password}</strong></p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem' }}>Silakan berikan informasi ini kepada karyawan yang bersangkutan.</p>
                </div>
              )}

              {pwdResult?.error && (
                <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>? Error: {pwdResult.error}</p>
              )}
            </div>

            <div className={styles.formActions} style={{ marginTop: '2rem' }}>
              <Button variant="ghost" onClick={() => setPwdModalOpen(false)}>Tutup</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
