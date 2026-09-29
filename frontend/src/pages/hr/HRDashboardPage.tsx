import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'
import { Users, Clock, UserX, Calendar, CheckCircle2 } from 'lucide-react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { getSuperuserDashboard } from '@/services/attendanceService'
import { employeeService } from '@/services/employeeService'
import { leaveService } from '@/services/leaveService'
import type { SuperuserDashboardData, Employee, LeaveRequest } from '@/types'
import styles from '../admin/SuperuserDashboardPage.module.css'
import hrStyles from './HRDashboardPage.module.css'

export function HRDashboardPage() {
  const [data, setData] = useState<SuperuserDashboardData | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [chartFilter, setChartFilter] = useState<'7' | '30'>('30')

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, empRes, leaveRes] = await Promise.all([
          getSuperuserDashboard(),
          employeeService.list(),
          leaveService.list('PENDING' as any)
        ])
        setData(dashRes)
        setEmployees(empRes)
        setPendingLeaves(leaveRes)
      } catch (err) {
        console.error('Failed to fetch HR dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !data) {
    return (
      <div className={hrStyles.loading}>
        <div className={hrStyles.spinner} />
        <p>Memuat Data HR...</p>
      </div>
    )
  }

  // --- HR Specific Calculations ---
  const activeEmployees = employees.filter(e => e.is_active)
  const currentMonth = new Date().getMonth()
  const birthdayThisMonth = activeEmployees.filter(e => {
    if (!e.birth_date) return false
    return new Date(e.birth_date).getMonth() === currentMonth
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const contractWarnings = activeEmployees.filter(e => {
    if (!e.contract_end_date || (e.contract_type !== 'PKWT' && e.contract_type !== 'INTERN')) return false
    const end = new Date(e.contract_end_date)
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 30
  })

  // --- Superuser Chart Logic ---
  const displayChartData = chartFilter === '7' ? data.chart_data.slice(-7) : data.chart_data

  const stats = [
    { label: 'Total Karyawan', value: data.today_stats.total, icon: Users, color: styles.textBlue },
    { label: 'Hadir', value: data.today_stats.present, icon: CheckCircle2, color: styles.textEmerald },
    { label: 'Terlambat', value: data.today_stats.late, icon: Clock, color: styles.textAmber },
    { label: 'Izin / Cuti', value: data.today_stats.leave, icon: Calendar, color: styles.textPurple },
    { label: 'Belum Absen', value: data.today_stats.absent, icon: UserX, color: styles.textRose },
  ]

  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h1>HR Dashboard</h1>
          <p>{todayStr} — Ringkasan operasional dan kehadiran</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <GlassPanel key={i} className={styles.statCard}>
              <div className={styles.statIcon} style={{ color: stat.color }}>
                <Icon size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            </GlassPanel>
          )
        })}
      </div>

      {/* --- HR Specific Alerts --- */}
      {(birthdayThisMonth.length > 0 || contractWarnings.length > 0) && (
        <div className={hrStyles.alertsRow}>
          {birthdayThisMonth.length > 0 && (
            <GlassPanel className={hrStyles.alertCard}>
              <div className={hrStyles.alertHeader}>
                <span className={hrStyles.alertEmoji}>🎉</span>
                <span className={hrStyles.alertTitle}>Ulang Tahun Bulan Ini</span>
                <Badge tone="accent">{birthdayThisMonth.length}</Badge>
              </div>
              <ul className={hrStyles.alertList}>
                {birthdayThisMonth.map(e => (
                  <li key={e.id}>
                    <strong>{e.full_name}</strong>
                    <span className={hrStyles.alertMeta}>{e.birth_date}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}
          {contractWarnings.length > 0 && (
            <GlassPanel className={hrStyles.alertCard}>
              <div className={hrStyles.alertHeader}>
                <span className={hrStyles.alertEmoji}>⚠️</span>
                <span className={hrStyles.alertTitle}>Kontrak Hampir Berakhir</span>
                <Badge tone="warn">{contractWarnings.length}</Badge>
              </div>
              <ul className={hrStyles.alertList}>
                {contractWarnings.map(e => (
                  <li key={e.id}>
                    <strong>{e.full_name}</strong>
                    <span className={hrStyles.alertMeta}>{e.contract_end_date}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}
        </div>
      )}

      {/* --- Attendance Trend Chart --- */}
      <GlassPanel className={styles.chartPanel}>
        <div className={styles.chartHeader}>
          <div>
            <h2 className={styles.chartTitle}>Tren Kehadiran</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Tingkat partisipasi absen harian</p>
          </div>
          <div className={styles.chartFilters}>
            <button 
              className={`${styles.filterBtn} ${chartFilter === '7' ? styles.active : ''}`}
              onClick={() => setChartFilter('7')}
            >
              7 Hari
            </button>
            <button 
              className={`${styles.filterBtn} ${chartFilter === '30' ? styles.active : ''}`}
              onClick={() => setChartFilter('30')}
            >
              30 Hari
            </button>
          </div>
        </div>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.4)" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getDate()}/${d.getMonth()+1}`;
                }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.4)" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  background: 'rgba(15,23,42,0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="present" 
                name="Hadir"
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: 'rgba(16,185,129,0.3)', strokeWidth: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="late" 
                name="Terlambat"
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>

      {/* --- Two Columns --- */}
      <div className={styles.splitSection}>
        <GlassPanel className={styles.detailPanel}>
          <h2 className={styles.detailTitle}>Pengajuan Menunggu Persetujuan</h2>
          {pendingLeaves.length === 0 ? (
            <p className={styles.emptyFeed}>Tidak ada izin/cuti pending.</p>
          ) : (
            <div className={styles.detailList} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              {pendingLeaves.map((l, idx) => (
                <div key={idx} className={styles.feedItem}>
                  <div className={styles.feedLeft} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.leave_type === 'CUTI' ? '#6366f1' : '#ef4444' }} />
                    <div style={{ flex: 1 }}>
                      <p className={styles.feedName} style={{ margin: 0 }}><strong>{l.employee_name}</strong> mengajukan {l.leave_type}</p>
                      <p className={styles.feedTime} style={{ margin: 0, opacity: 0.6 }}>{l.start_date} s/d {l.end_date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel className={styles.detailPanel}>
          <h2 className={styles.detailTitle}>Aktivitas Absensi Terbaru</h2>
          <div className={styles.detailList} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {data.recent_logs.length === 0 ? (
              <p className={styles.emptyFeed}>Belum ada aktivitas hari ini.</p>
            ) : (
              data.recent_logs.map((act, idx) => (
                <div key={idx} className={styles.feedItem}>
                  <div className={styles.feedLeft} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.type === 'IN' ? '#10b981' : '#f43f5e' }} />
                    <div style={{ flex: 1 }}>
                      <p className={styles.feedName} style={{ margin: 0 }}><strong>{act.name}</strong> Clock {act.type}</p>
                      <p className={styles.feedTime} style={{ margin: 0, opacity: 0.6 }}>{new Date(act.time).toLocaleTimeString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
