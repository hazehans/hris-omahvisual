// src/pages/hr/HREmployeesPage.tsx
// Employee management — CRUD via /api/v1/employees/

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { employeeService } from '@/services/employeeService'
import type { Employee, ContractType, Gender } from '@/types'
import styles from './HREmployeesPage.module.css'

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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [form, setForm] = useState<Partial<Employee>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.full_name.toLowerCase().includes(q) ||
      e.nik.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    )
  })

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
        {/* Header */}
        <div className={styles.tableHeader}>
          <div className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Cari nama, NIK, jabatan…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Badge tone="neutral">{filtered.length} karyawan</Badge>
            <Button variant="primary" onClick={openAdd}>+ Tambah Karyawan</Button>
          </div>
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
                {filtered.map(emp => (
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
    </div>
  )
}
