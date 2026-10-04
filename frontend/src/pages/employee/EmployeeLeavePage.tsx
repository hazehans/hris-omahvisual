// src/pages/employee/EmployeeLeavePage.tsx
import { useEffect, useState, useCallback } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { leaveService } from '@/services/leaveService'
import type { LeaveRequest, LeaveCreatePayload } from '@/types'
import styles from '../hr/HREmployeesPage.module.css'

export function EmployeeLeavePage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [form, setForm] = useState<Partial<LeaveCreatePayload>>({
    leave_type: 'CUTI',
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    try {
      const data = await leaveService.list() // For employee, this returns their own leaves
      setLeaves(data)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Gagal memuat riwayat pengajuan.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchLeaves() }, [fetchLeaves])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFormSuccess(null)
    try {
      const payload: LeaveCreatePayload = {
        leave_type: form.leave_type as 'CUTI' | 'IZIN' | 'SAKIT' | 'IZIN_TERLAMBAT',
        start_date: form.start_date!,
        end_date: form.end_date!,
        late_until: (form as any).late_until || undefined,
        reason: form.reason!,
        attachment: attachment || undefined
      }
      const res = await leaveService.create(payload)
      setFormSuccess(res.message || 'Pengajuan berhasil dikirim.')
      setForm({
        leave_type: 'CUTI',
        start_date: '',
        end_date: '',
        reason: '',
      })
      setAttachment(null)
      // Reset file input visually
      const fileInput = document.getElementById('leaveAttachment') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      void fetchLeaves()
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> }
      if (e.errors) {
        setFormError(Object.values(e.errors).flat().join(', '))
      } else {
        setFormError(e.message ?? 'Gagal mengirim pengajuan.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <GlassPanel>
        <h2 style={{ color: 'white', margin: '0 0 1.25rem 0', fontWeight: 600 }}>Form Pengajuan Izin / Cuti</h2>
        <form onSubmit={e => void handleSubmit(e)} className={styles.form}>
          <div className={styles.formGrid}>
            <label className={styles.label}>
              Jenis Pengajuan *
              <select
                  className={styles.input}
                  value={form.leave_type}
                  onChange={e => {
                    const val = e.target.value as any;
                    setForm(f => ({ 
                      ...f, 
                      leave_type: val,
                      ...(val === 'IZIN_TERLAMBAT' ? { end_date: f.start_date } : {})
                    }));
                  }}
                >
                <option value="CUTI">Cuti Tahunan</option>
                <option value="IZIN">Izin Keperluan</option>
                <option value="SAKIT">Sakit</option>
                <option value="IZIN_TERLAMBAT">Izin Terlambat</option>
              </select>
            </label>
            <label className={styles.label}>
                {form.leave_type === 'IZIN_TERLAMBAT' ? 'Tanggal *' : 'Mulai Tanggal *'}
                <input 
                  required 
                  type="date"
                  className={styles.input} 
                  value={form.start_date} 
                  onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({ 
                      ...f, 
                      start_date: val, 
                      ...(f.leave_type === 'IZIN_TERLAMBAT' ? { end_date: val } : {}) 
                    }));
                  }}
                />
              </label>
              
              {form.leave_type !== 'IZIN_TERLAMBAT' && (
                <label className={styles.label}>
                  Sampai Tanggal *
                  <input 
                    required 
                    type="date"
                    className={styles.input} 
                    value={form.end_date} 
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  />
                </label>
              )}
            {/* Kondisional: hanya muncul saat Izin Terlambat */}
            {form.leave_type === 'IZIN_TERLAMBAT' && (
              <label className={styles.label} style={{ gridColumn: '1 / -1' }}>
                Izin Terlambat Sampai Jam *
                <input
                  required
                  type="time"
                  className={styles.input}
                  value={(form as any).late_until ?? ''}
                  onChange={e => setForm(f => ({ ...f, late_until: e.target.value }))}
                />
                <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem', display: 'block' }}>
                  Masukkan batas jam terlambat Anda (contoh: 10:00). Kosongkan jika izin berlaku seharian.
                </span>
              </label>
            )}
            <label className={styles.label} style={{ gridColumn: '1 / -1' }}>
              Alasan *
              <textarea 
                required 
                className={styles.input} 
                rows={3}
                value={form.reason} 
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Jelaskan alasan pengajuan secara singkat..."
              />
            </label>
            <label className={styles.label} style={{ gridColumn: '1 / -1' }}>
              Lampiran Pendukung (Foto Surat Sakit/Keterangan)
              <input 
                id="leaveAttachment"
                type="file"
                className={styles.input} 
                onChange={e => setAttachment(e.target.files?.[0] || null)}
                accept="image/*,.pdf"
              />
            </label>
          </div>

          {formError && <p className={styles.errorMsg}>{formError}</p>}
          {formSuccess && <p style={{ color: '#30d158', marginTop: '1rem', fontSize: '0.85rem' }}>{formSuccess}</p>}
          
          <div className={styles.formActions} style={{ marginTop: '1.5rem', justifyContent: 'flex-start' }}>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Mengirim…' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </GlassPanel>

      <div style={{ marginTop: '1.5rem' }}>
        <GlassPanel>
          <h2 style={{ color: 'white', margin: '0 0 1.25rem 0', fontWeight: 600 }}>Riwayat Pengajuan Saya</h2>
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Memuat riwayat…</p>
          ) : error ? (
            <p className={styles.errorMsg}>{error}</p>
          ) : leaves.length === 0 ? (
            <p className={styles.empty}>Belum ada riwayat pengajuan.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tgl Pengajuan</th>
                    <th>Jenis</th>
                    <th>Periode</th>
                    <th>Alasan</th>
                    <th>Status</th>
                    <th>Dokumen HR</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => {
                    const created = new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    return (
                      <tr key={l.id}>
                        <td className={styles.mono} style={{ fontSize: '0.75rem', opacity: 0.7 }}>{created}</td>
                        <td>
                          <Badge tone={
                            l.leave_type === 'CUTI' ? 'accent' :
                            l.leave_type === 'SAKIT' ? 'danger' : 'warn'
                          }>
                            {l.leave_type}
                          </Badge>
                        </td>
                        <td className={styles.mono} style={{ whiteSpace: 'nowrap' }}>
                          <div>{l.start_date}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>s.d. {l.end_date}</div>
                        </td>
                        <td style={{ maxWidth: 200, fontSize: '0.8125rem' }}>{l.reason}</td>
                        <td>
                          <Badge tone={
                            l.status === 'APPROVED' ? 'success' :
                            l.status === 'REJECTED' ? 'danger' : 'neutral'
                          }>
                            {l.status}
                          </Badge>
                        </td>
                        <td>
                          {l.signed_attachment
                            ? <a href={leaveService.getAttachmentUrl(l.signed_attachment)} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '0.75rem' }}>Lihat ↗</a>
                            : <span style={{ opacity: 0.3 }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}
