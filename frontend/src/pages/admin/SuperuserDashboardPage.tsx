import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts'
import { Users, Clock, UserX, Calendar, Activity, CheckCircle2 } from 'lucide-react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
// useAuth removed
import { getSuperuserDashboard } from '@/services/attendanceService'
import type { SuperuserDashboardData } from '@/types'
import { useNavigate } from 'react-router-dom'
import styles from './SuperuserDashboardPage.module.css'

export function SuperuserDashboardPage() {
  // unused user
  const navigate = useNavigate()
  const [data, setData] = useState<SuperuserDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartFilter, setChartFilter] = useState<'7' | '30'>('30')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')

  const fetchDashboardData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const res = await getSuperuserDashboard()
      setData(res)
    } catch (err) {
      console.error('Failed to fetch superuser dashboard:', err)
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-white/60 animate-pulse">Memuat Command Center...</div>
      </div>
    )
  }

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
      
      {/* Header */}
      <div className={styles.headerRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className={styles.titleGroup}>
          <h1>
            <Activity  />
            Dashboard Superuser
          </h1>
          <p >
            Command Center HRIS OmahVisual
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <p className={styles.todayDate}>{todayStr}</p>
          <Button variant="ghost" onClick={() => fetchDashboardData()}>
            ↻ Refresh
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className={styles.statsGrid}>
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <GlassPanel key={i} className={styles.statCard}>
              <Icon className={`w-6 h-6 mb-2 ${s.color}`} />
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.value}</p>
            </GlassPanel>
          )
        })}
      </div>

      {/* Chart Section */}
      <GlassPanel className={styles.detailPanel}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>
            Rekap Kehadiran
          </h2>
          <div className={styles.chartFilters}>
            <button 
              onClick={() => setChartFilter('7')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${chartFilter === '7' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'}`}
            >
              7 Hari
            </button>
            <button 
              onClick={() => setChartFilter('30')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${chartFilter === '30' ? 'bg-white/20 text-white font-medium' : 'text-white/50 hover:text-white'}`}
            >
              30 Hari
            </button>
          </div>
        </div>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
              <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'rgba(20,20,20,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" name="Hadir" dataKey="present" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Terlambat" dataKey="late" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>

      {/* Mid Section: Details & Recent */}
      <div className={styles.splitSection}>
        {/* Today Detailed Status */}
        <GlassPanel className={styles.detailPanel}>
          <h2 className={styles.detailTitle}>
            Status Hari Ini
          </h2>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}><CheckCircle2 className={styles.textEmerald} /> Hadir Tepat Waktu</span>
              <span className={styles.detailItemValue}>{data.today_stats.present - data.today_stats.late} org</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}><Clock className={styles.textAmber} /> Hadir Terlambat</span>
              <span className={styles.detailItemValue}>{data.today_stats.late} org</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}><Calendar className={styles.textPurple} /> Sedang Izin/Cuti</span>
              <span className={styles.detailItemValue}>{data.today_stats.leave} org</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}><UserX className={styles.textRose} /> Belum Terdata (Absen)</span>
              <span className={styles.detailItemValue}>{data.today_stats.absent} org</span>
            </div>
          </div>
        </GlassPanel>

        {/* Live Recent Feed */}
        <GlassPanel className={styles.detailPanel}>
          <h2 className={styles.detailTitle}>
            Absensi Terbaru
          </h2>
          {data.recent_logs.length === 0 ? (
            <p className={styles.emptyFeed}>Belum ada aktivitas hari ini.</p>
          ) : (
            <div className={styles.detailList}>
              {data.recent_logs.map((log, i) => (
                <div key={i} className={styles.feedItem}>
                  <div className={styles.feedLeft}>
                    <span className={styles.feedTime}>{log.time}</span>
                    <span className={styles.feedName}>{log.name}</span>
                  </div>
                  <Badge tone={log.type === 'Clock In' ? 'success' : 'neutral'} className="text-[10px] uppercase">
                    {log.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Bottom Section: Trends & Device */}
      <div className={styles.splitSection}>
        <GlassPanel className={styles.trendPanel}>
          <h2 className={styles.detailTitle}>
            Attendance Trend
          </h2>
          <div className={styles.trendBig}>
            <span className={styles.trendValue}>{data.trend_pct}%</span>
            <span className={styles.trendLabel}>
              <svg  fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              Tingkat Kehadiran
            </span>
          </div>
          <p className={styles.trendSub}>Berdasarkan rasio absen masuk 30 hari terakhir</p>
        </GlassPanel>

        <GlassPanel className={styles.trendPanel}>
          <h2 className={styles.detailTitle}>
            Hikvision Device
          </h2>
          <div className={styles.deviceRow}>
            <div className={styles.deviceStatus}>
              <span className={`w-3 h-3 rounded-full ${data.device_info.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className={styles.detailItemValue}>{data.device_info.status}</span>
            </div>
            <div >
              <p className={styles.deviceSyncLabel}>Last Sync</p>
              <p className={styles.deviceSyncTime}>{data.device_info.last_sync}</p>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {syncStatus === 'syncing' && <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Menyinkronkan auto...</span>}
            {syncStatus === 'error' && <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Auto-sync gagal</span>}
          </div>
        </GlassPanel>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsRow}>
        <Button variant="primary" onClick={() => navigate('/admin/employees')}>
          + Tambah Karyawan
        </Button>
        <Button variant="secondary" onClick={() => navigate('/admin/raw-logs')}>
          Raw Device Log
        </Button>
        <Button variant="secondary" onClick={() => navigate('/admin/attendance')}>
          Tabel Absensi
        </Button>
      </div>
      
    </div>
  )
}

