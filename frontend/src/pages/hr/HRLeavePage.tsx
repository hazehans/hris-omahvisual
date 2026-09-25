// src/pages/hr/HRLeavePage.tsx
// Leave management — GET /api/v1/leave/?status=PENDING|ALL_HISTORY
// Approve/Reject via POST /api/v1/leave/<uuid>/approve/

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { leaveService } from '@/services/leaveService'
import { API_BASE } from '@/services/api'
import type { LeaveRequest } from '@/types'
import styles from './HREmployeesPage.module.css'

type Tab = 'PENDING' | 'HISTORY'

const LEAVE_BADGE: Record<string, 'accent' | 'warn' | 'danger'> = {
  CUTI: 'accent', IZIN: 'warn', SAKIT: 'danger',
}

export function HRLeavePage() {
  const [tab, setTab] = useState<Tab>('PENDING')
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Approve modal
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null)
  const [signedFile, setSignedFile] = useState<File | null>(null)
  const [actioning, setActioning] = useState(false)

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await leaveService.list(tab === 'HISTORY' ? 'ALL_HISTORY' : 'PENDING')
      setLeaves(data)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Gagal memuat data cuti/izin.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { void fetchLeaves() }, [fetchLeaves])

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault()
    if (!approveTarget) return
    setActioning(true)
    try {
      await leaveService.approve(approveTarget.id, 'APPROVE', signedFile ?? undefined)
      setApproveTarget(null)
      setSignedFile(null)
      void fetchLeaves()
    } catch (err: unknown) {
      alert((err as Error).message)
    } finally {
      setActioning(false)
    }
  }

  async function handleReject(id: string) {
    if (!window.confirm('Tolak pengajuan ini?')) return
    try {
      await leaveService.approve(id, 'REJECT')
      void fetchLeaves()
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  const mediaBase = API_BASE.replace('/api/v1', '')

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Memuat data izin & cuti…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0' }}>
        <button
          className={`glass-lens`}
          style={{
            padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: '1px solid',
            borderColor: tab === 'PENDING' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
            background: tab === 'PENDING' ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: 'rgba(255,255,255,0.85)', font: 'inherit', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: tab === 'PENDING' ? 600 : 400,
          }}
          onClick={() => setTab('PENDING')}
        >
          Menunggu Persetujuan
          {tab === 'PENDING' && leaves.length > 0 && (
            <Badge tone="warn" style={{ marginLeft: '0.5rem' }}>{leaves.length}</Badge>
          )}
        </button>
        <button
          className={`glass-lens`}
          style={{
            padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: '1px solid',
            borderColor: tab === 'HISTORY' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
            background: tab === 'HISTORY' ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: 'rgba(255,255,255,0.85)', font: 'inherit', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: tab === 'HISTORY' ? 600 : 400,
          }}
          onClick={() => setTab('HISTORY')}
        >
          Riwayat Persetujuan
        </button>
      </div>

      <GlassPanel>
        {error && <p className={styles.errorMsg}>{error}</p>}

        {leaves.length === 0 ? (
          <p className={styles.empty}>
            {tab === 'PENDING' ? 'Tidak ada pengajuan yang menunggu persetujuan.' : 'Belum ada riwayat persetujuan.'}
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Jenis</th>
                  <th>Tgl Diajukan</th>
                  <th>Periode</th>
                  <th>Alasan</th>
                  {tab === 'PENDING' && <th>Lampiran</th>}
                  <th>{tab === 'PENDING' ? 'Aksi' : 'Status'}</th>
                  {tab === 'HISTORY' && <th>Dokumen HR</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => {
                  const created = new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  return (
                    <tr key={l.id}>
                      <td className={styles.nameCell}>
                        <div>{l.employee_name}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, fontFamily: 'monospace' }}>{l.employee_nik}</div>
                      </td>
                      <td><Badge tone={LEAVE_BADGE[l.leave_type] ?? 'neutral'}>{l.leave_type}</Badge></td>
                      <td className={styles.mono} style={{ fontSize: '0.75rem', opacity: 0.7 }}>{created}</td>
                      <td className={styles.mono} style={{ whiteSpace: 'nowrap' }}>
                        <div>{l.start_date}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>s.d. {l.end_date}</div>
                      </td>
                      <td style={{ maxWidth: 200, fontSize: '0.8125rem' }}>{l.reason}</td>
                      {tab === 'PENDING' && (
                        <td>
                          {l.attachment
                            ? <a href={`${mediaBase}${l.attachment}`} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '0.75rem' }}>Lihat ↗</a>
                            : <span style={{ opacity: 0.3 }}>—</span>}
                        </td>
                      )}
                      <td>
                        {tab === 'PENDING' ? (
                          <div className={styles.actions}>
                            <Button variant="primary" onClick={() => setApproveTarget(l)}>Setujui</Button>
                            <Button variant="danger" onClick={() => void handleReject(l.id)}>Tolak</Button>
                          </div>
                        ) : (
                          <Badge tone={
                            l.status === 'APPROVED' ? 'success'
                            : l.status === 'REJECTED' ? 'danger'
                            : 'warn'
                          }>
                            {l.status}
                          </Badge>
                        )}
                      </td>
                      {tab === 'HISTORY' && (
                        <td>
                          {l.signed_attachment
                            ? <a href={`${mediaBase}${l.signed_attachment}`} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '0.75rem' }}>PDF HR ↗</a>
                            : <span style={{ opacity: 0.3 }}>—</span>}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {/* ── Approve Modal ──────────────────────── */}
      {approveTarget && createPortal(
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ maxWidth: 440 }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Setujui Pengajuan</h2>
              <button type="button" className={styles.closeBtn} onClick={() => { setApproveTarget(null); setSignedFile(null) }}>✕</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Pengajuan <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{approveTarget.leave_type}</strong> dari <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{approveTarget.employee_name}</strong>
              <br />Periode: {approveTarget.start_date} s.d. {approveTarget.end_date}
            </p>
            <form onSubmit={e => void handleApprove(e)} className={styles.form}>
              <label className={styles.label}>
                Surat Persetujuan HR (PDF) — opsional
                <input
                  type="file" accept=".pdf"
                  className={styles.input}
                  onChange={e => setSignedFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <div className={styles.formActions}>
                <Button variant="secondary" type="button" onClick={() => { setApproveTarget(null); setSignedFile(null) }}>
                  Batal
                </Button>
                <Button variant="primary" type="submit" disabled={actioning}>
                  {actioning ? 'Memproses…' : '✓ Setujui'}
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
