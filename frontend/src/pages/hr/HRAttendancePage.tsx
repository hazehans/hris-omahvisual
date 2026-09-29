// src/pages/hr/HRAttendancePage.tsx
// Live attendance today from GET /api/v1/attendance/today/

import { useEffect, useState, useCallback } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { attendanceService } from '@/services/attendanceService'
import type { AttendanceTodaySummary } from '@/types'
import styles from './HRDashboardPage.module.css'

export function HRAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceTodaySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [targetDate, setTargetDate] = useState<string>(new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [exportingPdf, setExportingPdf] = useState(false)

  const fetchData = useCallback(async (isRefresh = false, quiet = false) => {
    if (!quiet) {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
    }
    setError(null)

    try {
      const data = await attendanceService.today(targetDate)
      setAttendance(data)
      setLastUpdated(new Date())
    } catch (err: unknown) {
      if (!quiet) setError((err as Error).message ?? 'Gagal memuat data absensi.')
    } finally {
      if (!quiet) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [targetDate]) // ADDED targetDate to dependencies!

  useEffect(() => {
    void fetchData()
    // Auto-refresh every 5 seconds (quietly sync and fetch)
    const interval = window.setInterval(async () => {
      // Only sync if targeting today
      if (targetDate === new Date().toLocaleDateString('en-CA')) {
        setSyncStatus('syncing')
        try {
          await attendanceService.autoSync()
          setSyncStatus('idle')
        } catch {
          setSyncStatus('error')
        }
      }
      void fetchData(true, true)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [fetchData, targetDate])

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      const res = await attendanceService.exportPdf(targetDate)
      if (!res.ok) throw new Error('Gagal mendownload PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laporan_Absensi_${targetDate}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setExportingPdf(false)
    }
  }

  const present = attendance.filter(a => a.first_in !== null)
  const late = attendance.filter(a => a.is_late)
  const alreadyOut = attendance.filter(a => a.last_out !== null)

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Memuat data absensi…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.statsGrid}>
        <GlassPanel className={styles.statCard}>
          <p className={styles.statLabel}>Total Karyawan Tercatat</p>
          <p className={styles.statValue}>{attendance.length}</p>
        </GlassPanel>
        <GlassPanel className={styles.statCard}>
          <p className={styles.statLabel}>Sudah Masuk</p>
          <p className={`${styles.statValue} ${styles.success}`}>{present.length}</p>
        </GlassPanel>
        <GlassPanel className={styles.statCard}>
          <p className={styles.statLabel}>Terlambat</p>
          <p className={`${styles.statValue} ${styles.warn}`}>{late.length}</p>
        </GlassPanel>
        <GlassPanel className={styles.statCard}>
          <p className={styles.statLabel}>Sudah Pulang</p>
          <p className={`${styles.statValue} ${styles.accent}`}>{alreadyOut.length}</p>
        </GlassPanel>
      </div>

      <GlassPanel>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>Pilih Tanggal</label>
            <input 
              type="date" 
              value={targetDate} 
              onChange={e => { setTargetDate(e.target.value); }} 
              style={{ padding: '0.5rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
            />
          </div>
          <Button variant="primary" onClick={() => fetchData()}>Tampilkan</Button>
        </div>

        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Log Absensi Hari Ini</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {syncStatus === 'syncing' && (
              <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Menyinkronkan...</span>
            )}
            {syncStatus === 'error' && (
              <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Sinkronisasi Gagal</span>
            )}
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                Update: {lastUpdated.toLocaleTimeString('id-ID')}
              </span>
            )}
            
            <Button
              variant="secondary"
              onClick={handleExportPdf}
              disabled={exportingPdf}
            >
              {exportingPdf ? 'Mengekspor...' : 'Unduh PDF'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => void fetchData(true)}
              disabled={refreshing}
            >
              {refreshing ? '↻ Memuat…' : '↻ Refresh'}
            </Button>
          </div>
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
        )}

        {attendance.length === 0 ? (
          <p className={styles.empty}>Belum ada data absensi hari ini.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama Karyawan</th>
                  <th>NIK</th>
                  <th>Jam Masuk Pertama</th>
                  <th>Jam Pulang Terakhir</th>
                  <th>Total Event</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a, idx) => (
                  <tr key={a.employee_id}>
                    <td className={styles.mono}>{idx + 1}</td>
                    <td className={styles.nameCell}>{a.employee_name}</td>
                    <td className={styles.mono}>{a.employee_nik}</td>
                    <td className={styles.clockIn}>{a.first_in ? new Date(a.first_in).toLocaleTimeString('id-ID') : '-'}</td>
                    <td className={styles.clockOut}>{a.last_out ? new Date(a.last_out).toLocaleTimeString('id-ID') : '-'}</td>
                    <td className={styles.mono}>{a.total_events}</td>
                    <td>
                      {a.first_in === null 
                        ? <Badge tone="neutral">Belum Hadir</Badge>
                        : a.is_late
                        ? <Badge tone="warn">Terlambat</Badge>
                        : <Badge tone="success">Tepat Waktu</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}

