// src/pages/hr/HRAttendancePage.tsx
// Live attendance today from GET /api/v1/attendance/today/

import { useEffect, useState, useCallback } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { attendanceService } from '@/services/attendanceService'
import { apiRequest } from '@/services/api'
import type { AttendanceTodayItem } from '@/types'
import styles from './HRDashboardPage.module.css'

export function HRAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceTodayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [fetchingDevice, setFetchingDevice] = useState(false)
  const [fetchMessage, setFetchMessage] = useState('')

  const handleFetchDevice = async () => {
    setFetchingDevice(true)
    setFetchMessage('')
    try {
      const res = await apiRequest<any>('/attendance/fetch/', { method: 'POST' })
      setFetchMessage(`Berhasil menarik ${res.total_fetched} log mesin.`)
      void fetchData(true)
    } catch (err: any) {
      setFetchMessage(err.message || 'Gagal menarik data dari mesin.')
    } finally {
      setFetchingDevice(false)
    }
  }


  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const data = await attendanceService.today()
      setAttendance(data)
      setLastUpdated(new Date())
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Gagal memuat data absensi.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
    // Auto-refresh every 60 seconds
    const interval = window.setInterval(() => void fetchData(true), 60_000)
    return () => window.clearInterval(interval)
  }, [fetchData])

  const present = attendance.filter(a => a.clock_in !== '-')
  const late = attendance.filter(a => a.is_late)
  const alreadyOut = attendance.filter(a => a.clock_out !== '-')

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
          <p className={styles.statLabel}>Total Tercatat</p>
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
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Log Absensi Hari Ini</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                Update: {lastUpdated.toLocaleTimeString('id-ID')}
              </span>
            )}
            
            {fetchMessage && <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{fetchMessage}</span>}
            <Button
              variant="primary"
              onClick={handleFetchDevice}
              disabled={fetchingDevice}
            >
              {fetchingDevice ? 'Sedang Menarik...' : '🔄 Tarik Data Mesin'}
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
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Status</th>
                  <th>KPI</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a, idx) => (
                  <tr key={idx}>
                    <td className={styles.mono}>{idx + 1}</td>
                    <td className={styles.nameCell}>{a.name}</td>
                    <td className={styles.mono}>{a.nik}</td>
                    <td className={styles.clockIn}>{a.clock_in}</td>
                    <td className={styles.clockOut}>{a.clock_out}</td>
                    <td>
                      {a.is_late
                        ? <Badge tone="warn">Terlambat</Badge>
                        : <Badge tone="success">Tepat Waktu</Badge>}
                    </td>
                    <td className={styles.kpi}>
                      {typeof a.kpi_score === 'number'
                        ? <Badge tone={a.kpi_score >= 80 ? 'success' : a.kpi_score >= 60 ? 'warn' : 'danger'}>{a.kpi_score}</Badge>
                        : <span style={{ opacity: 0.4 }}>—</span>}
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
