// src/pages/hr/HRDailyLogPage.tsx
// Daily log — GET /api/v1/daily-report/?date=<YYYY-MM-DD>|ALL

import { useEffect, useState, useCallback } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { dailyLogService } from '@/services/dailyLogService'
import type { DailyLog } from '@/types'
import styles from './HREmployeesPage.module.css'

export function HRDailyLogPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string>('ALL')
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const date = dateFilter === 'ALL' ? 'ALL' : (dateFilter === 'TODAY' ? customDate : customDate)
      const data = await dailyLogService.list(date)
      setLogs(data)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Gagal memuat daily log.')
    } finally {
      setLoading(false)
    }
  }, [dateFilter, customDate])

  useEffect(() => { void fetchLogs() }, [fetchLogs])

  const todayStr = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Memuat daily log…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <GlassPanel>
        <div className={styles.tableHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              Laporan Harian
            </h2>
            <select
              className={styles.input}
              style={{ width: 'auto', padding: '0.375rem 0.75rem' }}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini / Pilih Tanggal</option>
            </select>
            {dateFilter === 'TODAY' && (
              <input
                type="date"
                className={styles.input}
                style={{ width: 'auto', padding: '0.375rem 0.75rem', colorScheme: 'dark' }}
                value={customDate}
                max={todayStr}
                onChange={e => setCustomDate(e.target.value)}
              />
            )}
            
            {/* Filter Departemen/Jabatan */}
            <select
              className={styles.input}
              style={{ width: 'auto', padding: '0.375rem 0.75rem', marginLeft: 'auto' }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="ALL">Semua Jabatan</option>
              {Array.from(new Set(logs.map(l => l.employee_role))).sort().map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Badge tone="neutral">{logs.length} laporan</Badge>
            <Button variant="ghost" onClick={() => void fetchLogs()}>↻ Refresh</Button>
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {logs.length === 0 ? (
          <p className={styles.empty}>
            {dateFilter === 'ALL'
              ? 'Belum ada daily log.'
              : `Belum ada laporan pada tanggal ${customDate === todayStr ? 'hari ini' : customDate}.`}
          </p>
        ) : (
          <div className={styles.tableWrap} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
            {(() => {
              // 1. Filter by Role
              const filteredLogs = logs.filter(log => roleFilter === 'ALL' || log.employee_role === roleFilter)

              if (filteredLogs.length === 0) {
                return <p className={styles.empty}>Tidak ada laporan untuk jabatan yang dipilih.</p>
              }

              // 2. Group by Employee
              const groupedLogs = filteredLogs.reduce((acc, log) => {
                const name = log.employee_name
                if (!acc[name]) acc[name] = []
                acc[name].push(log)
                return acc
              }, {} as Record<string, DailyLog[]>)

              // 3. Render Groups
              return Object.entries(groupedLogs)
                .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
                .map(([employeeName, empLogs]) => (
                  <div key={employeeName} style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ color: 'rgba(255,255,255,0.95)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                      {employeeName} 
                      <Badge tone="accent">{empLogs[0].employee_role}</Badge>
                      <span style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 'normal', marginLeft: 'auto' }}>
                        {empLogs.length} Laporan
                      </span>
                    </h3>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>Waktu</th>
                          <th>Aktivitas</th>
                          <th style={{ width: '120px' }}>Link Kerja</th>
                          <th style={{ width: '150px' }}>Kendala</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empLogs.map(log => {
                          const time = new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          const dateStr = new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                          return (
                            <tr key={log.id}>
                              <td className={styles.mono} style={{ whiteSpace: 'nowrap' }}>
                                <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{time}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{dateStr}</div>
                              </td>
                              <td style={{ maxWidth: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem' }}>
                                {log.activity}
                              </td>
                              <td>
                                {log.work_link
                                  ? <a href={log.work_link} target="_blank" rel="noopener noreferrer" style={{ color: '#64d2ff', fontSize: '0.75rem' }}>Buka Link ↗</a>
                                  : <span style={{ opacity: 0.3 }}>—</span>}
                              </td>
                              <td>
                                {log.issue
                                  ? <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{log.issue}</span>
                                  : <span style={{ opacity: 0.3 }}>—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))
            })()}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
