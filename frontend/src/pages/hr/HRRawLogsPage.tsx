import { useState, useEffect, useCallback } from 'react'
import styles from './HREmployeesPage.module.css'
import { attendanceService } from '@/services/attendanceService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { GlassInput, GlassSelect, FieldShell } from '@/components/ui'
import type { HikvisionRawEvent } from '@/types'

export function HRRawLogsPage() {
  const [logs, setLogs] = useState<HikvisionRawEvent[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [filterDate, setFilterDate] = useState(now.toISOString().split('T')[0])
  const [filterEmployeeNo, setFilterEmployeeNo] = useState('')
  const [filterMajor, setFilterMajor] = useState('')
  const [filterMinor, setFilterMinor] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [countdown, setCountdown] = useState(5)

  // Countdown timer: counts down 5→0, reset each sync cycle
  useEffect(() => {
    const tick = window.setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 5 : prev - 1))
    }, 1000)
    return () => window.clearInterval(tick)
  }, [])

  // @ts-ignore
  const [currentPage, setCurrentPage] = useState(1)
  // @ts-ignore
  const itemsPerPage = 15

  const fetchLogs = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const res = await attendanceService.rawEvents({
        date: filterDate,
        employee_no: filterEmployeeNo || undefined,
        major: filterMajor || undefined,
        minor: filterMinor || undefined,
        attendance_status: filterStatus || undefined,
      })
      setLogs(res)
    } catch (err) {
      console.error(err)
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [filterDate, filterEmployeeNo, filterMajor, filterMinor, filterStatus])

  useEffect(() => {
    void fetchLogs()
    const interval = window.setInterval(async () => {
      setCountdown(5) // reset countdown on each sync
      // Only sync if targeting today
      if (filterDate === new Date().toLocaleDateString('en-CA')) {
        setSyncStatus('syncing')
        try {
          await attendanceService.autoSync()
          setSyncStatus('idle')
        } catch {
          setSyncStatus('error')
        }
      }
      void fetchLogs(true)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [fetchLogs, filterDate])

  const handleResetFilters = () => {
    setFilterDate(new Date().toISOString().split('T')[0])
    setFilterEmployeeNo('')
    setFilterMajor('')
    setFilterMinor('')
    setFilterStatus('')
    setCurrentPage(1)
  }

  return (
    <div className="animate-fade-in">
      <GlassPanel style={{ padding: "1.5rem", overflow: "visible" }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Raw Event Log
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
              Pantau seluruh data mentah dari mesin Hikvision, termasuk yang ditolak/invalid.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Countdown / sync status as a display-only button */}
            {syncStatus === 'syncing' ? (
              <Button variant="primary">
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa', animation: 'pulse 1s infinite', marginRight: '0.35rem' }} />
                Menyinkronkan...
              </Button>
            ) : syncStatus === 'error' ? (
              <Button variant="secondary" disabled>⚠ Gagal sinkron</Button>
            ) : (
              <Button variant="secondary" disabled>
                ⏱ Refresh otomatis dalam<strong style={{ marginLeft: '0.25rem' }}>{countdown}s</strong>
              </Button>
            )}
            <Button variant="secondary" onClick={() => { setCountdown(5); void fetchLogs() }}>
              ↻ Refresh
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div style={{ width: '185px', position: 'relative', zIndex: 5 }}>
            <GlassInput
              label="Tanggal"
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1) }}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div style={{ width: '90px', position: 'relative', zIndex: 4 }}>
            <GlassInput
              label="ID Mesin"
              type="text"
              placeholder="id"
              value={filterEmployeeNo}
              onChange={(e) => { setFilterEmployeeNo(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <div style={{ width: '90px', position: 'relative', zIndex: 3 }}>
            <GlassInput
              label="Major"
              type="text"
              placeholder="e.g. 5"
              value={filterMajor}
              onChange={(e) => { setFilterMajor(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <div style={{ width: '90px', position: 'relative', zIndex: 2 }}>
            <GlassInput
              label="Minor"
              type="text"
              placeholder="e.g. 1"
              value={filterMinor}
              onChange={(e) => { setFilterMinor(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <div style={{ width: '160px', position: 'relative', zIndex: 1 }}>
            <GlassSelect
              label="Status"
              value={filterStatus}
              onChange={(v) => { setFilterStatus(v); setCurrentPage(1) }}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'checkIn', label: 'Check In' },
                { value: 'checkOut', label: 'Check Out' },
              ]}
              size="default"
              fullWidth={true}
            />
          </div>
          <Button variant="danger" onClick={handleResetFilters}>Reset Filter</Button>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Waktu Mesin</th>
                  <th>Serial No</th>
                  <th>Major/Minor</th>
                  <th>Karyawan</th>
                  <th>Status (Device)</th>
                  <th>Label</th>
                  <th>User Type</th>
                  <th>Reader/Door</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada log mentah untuk tanggal ini.</td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSuccess = log.major === 5 && log.minor === 1
                    return (
                      <tr key={log.id}>
                        <td>{new Date(log.event_time).toLocaleString('id-ID')}</td>
                        <td style={{ color: 'var(--text-muted)' }}>#{log.serial_no}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          M:{log.major} / m:{log.minor}
                        </td>
                        <td>
                          {log.employee_no ? (
                            <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                              {log.employee_no} ({log.name_on_device})
                            </span>
                          ) : (
                            <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Unknown</span>
                          )}
                        </td>
                        <td>
                          {isSuccess ? (
                            <Badge tone="success">{log.attendance_status}</Badge>
                          ) : (
                            <Badge tone="danger">{log.attendance_status}</Badge>
                          )}
                        </td>
                        <td>{log.attendance_label}</td>
                        <td>{log.user_type}</td>
                        <td>R:{log.card_reader_no || '-'} / D:{log.door_no || '-'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}

