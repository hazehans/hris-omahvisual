// src/pages/employee/EmployeeDailyLogPage.tsx
import { useEffect, useState, useCallback } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { dailyLogService } from '@/services/dailyLogService'
import type { DailyLog, DailyLogCreatePayload } from '@/types'
import styles from '../hr/HREmployeesPage.module.css' // Reuse table styles

export function EmployeeDailyLogPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [form, setForm] = useState<DailyLogCreatePayload>({
    activity: '',
    work_link: '',
    issue: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await dailyLogService.list('ALL')
      setLogs(data)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Gagal memuat daily log.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchLogs() }, [fetchLogs])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      await dailyLogService.create(form)
      setForm({
        activity: '',
        work_link: '',
        issue: ''
      })
      void fetchLogs() // Refresh logs
    } catch (err: unknown) {
      const e = err as { message?: string; errors?: Record<string, string[]> }
      if (e.errors) {
        setFormError(Object.values(e.errors).flat().join(', '))
      } else {
        setFormError(e.message ?? 'Gagal mengirim daily log.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <GlassPanel>
        <h2 style={{ color: 'white', margin: '0 0 1.25rem 0', fontWeight: 600 }}>Tulis Daily Log</h2>
        <form onSubmit={e => void handleSubmit(e)} className={styles.form}>
          <div className={styles.formGrid}>
            <label className={styles.label} style={{ gridColumn: '1 / -1' }}>
              Aktivitas / Deskripsi Pekerjaan *
              <textarea 
                required 
                className={styles.input} 
                rows={4}
                value={form.activity} 
                onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
                placeholder="Contoh: Menyelesaikan desain banner promo bulan ini..."
              />
            </label>
            <label className={styles.label}>
              Link Hasil Kerja (Opsional)
              <input 
                type="url"
                className={styles.input} 
                value={form.work_link ?? ''} 
                onChange={e => setForm(f => ({ ...f, work_link: e.target.value }))}
                placeholder="Link GDrive, Trello, dsb."
              />
            </label>
            <label className={styles.label}>
              Kendala (Opsional)
              <input 
                className={styles.input} 
                value={form.issue ?? ''} 
                onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                placeholder="Tulis kendala jika ada"
              />
            </label>
          </div>

          {formError && <p className={styles.errorMsg}>{formError}</p>}
          
          <div className={styles.formActions} style={{ marginTop: '1.5rem', justifyContent: 'flex-start' }}>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Mengirim…' : 'Kirim Daily Log'}
            </Button>
          </div>
        </form>
      </GlassPanel>

      <div style={{ marginTop: '1.5rem' }}>
        <GlassPanel>
          <h2 style={{ color: 'white', margin: '0 0 1.25rem 0', fontWeight: 600 }}>Riwayat Laporan Saya</h2>
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>Memuat riwayat…</p>
          ) : error ? (
            <p className={styles.errorMsg}>{error}</p>
          ) : logs.length === 0 ? (
            <p className={styles.empty}>Belum ada riwayat daily log.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Aktivitas</th>
                    <th>Kendala / Link</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className={styles.mono} style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{log.date}</td>
                      <td style={{ fontSize: '0.85rem' }}>{log.activity}</td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {log.issue && <div><strong>Kendala:</strong> {log.issue}</div>}
                        {log.work_link && <div><a href={log.work_link} target="_blank" rel="noopener noreferrer" style={{ color: '#64d2ff' }}>Lihat Hasil ↗</a></div>}
                        {!log.issue && !log.work_link && <span style={{ opacity: 0.3 }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}
