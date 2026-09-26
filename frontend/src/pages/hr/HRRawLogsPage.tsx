import { useState, useEffect } from 'react'
// ...existing code...
import { PageHeader } from '@/components/PageHeader'
// ...existing code...
import styles from './HREmployeesPage.module.css'
import { apiRequest } from '@/services/api'

type RawLog = {
  id: number
  serial_no: string
  event_date: string
  event_time_raw: string
  employee_no: string
  name_on_device: string
  verify_mode: string
  major: number
  minor: number
}

export function HRRawLogsPage() {
  const [logs, setLogs] = useState<RawLog[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchLogs() {
    setLoading(true)
    try {
      const res = await apiRequest<RawLog[]>('/attendance/raw-events/')
      setLogs(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchLogs()
  }, [])

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Raw Event Log" 
        description="Pantau seluruh data mentah dari mesin Hikvision, termasuk yang ditolak/invalid." 
      />
      
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={fetchLogs} className={styles.btnPrimary}>
          â†» Refresh Tabel
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Waktu Mesin</th>
                <th>Serial No</th>
                <th>Major / Minor</th>
                <th>Karyawan (Mesin)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada log mentah.</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.major === 5 && log.minor === 1
                  return (
                    <tr key={log.id}>
                      <td>{log.event_time_raw}</td>
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
                          <span style={{ 
                            padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'rgb(52, 211, 153)',
                            borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}>
                            SUCCESS
                          </span>
                        ) : (
                          <span style={{ 
                            padding: '4px 8px', background: 'rgba(244, 63, 94, 0.1)', color: 'rgb(251, 113, 133)',
                            borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(244, 63, 94, 0.2)'
                          }}>
                            INVALID
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
