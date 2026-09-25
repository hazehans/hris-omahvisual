// src/pages/hr/HRDashboardPage.tsx
// HR Dashboard — composes stats from: /attendance/today/ + /employees/ + /leave/?status=PENDING
// Dashboard endpoint (/api/v1/dashboard/) is currently empty, so we compose here.

import { useEffect, useState } from 'react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { attendanceService } from '@/services/attendanceService'
import { employeeService } from '@/services/employeeService'
import { leaveService } from '@/services/leaveService'
import type { AttendanceTodayItem, Employee, LeaveRequest } from '@/types'
import styles from './HRDashboardPage.module.css'

export function HRDashboardPage() {
  const [attendance, setAttendance] = useState<AttendanceTodayItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      attendanceService.today(),
      employeeService.list(),
      leaveService.list('PENDING'),
    ])
      .then(([att, emps, leaves]) => {
        if (cancelled) return
        setAttendance(att)
        setEmployees(emps)
        setPendingLeaves(leaves)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message ?? 'Gagal memuat data dashboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const activeEmployees = employees.filter(e => e.is_active)
  const presentToday = attendance.filter(a => a.clock_in !== '-').length
  const lateToday = attendance.filter(a => a.is_late).length
  const absentToday = activeEmployees.length - presentToday

  // Birthday this month
  const currentMonth = new Date().getMonth()
  const birthdayThisMonth = activeEmployees.filter(e => {
    if (!e.birth_date) return false
    return new Date(e.birth_date).getMonth() === currentMonth
  })

  // Contract expiry warnings (next 30 days)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const contractWarnings = activeEmployees.filter(e => {
    if (!e.contract_end_date || (e.contract_type !== 'PKWT' && e.contract_type !== 'INTERN')) return false
    const end = new Date(e.contract_end_date)
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 30
  })

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Memuat data dashboard…</p>
      </div>
    )
  }

  if (error) {
    return (
      <GlassPanel className={styles.errorPanel}>
        <Badge tone="danger">Error</Badge>
        <p className={styles.errorMsg}>{error}</p>
      </GlassPanel>
    )
  }

  return (
    <div className={styles.page}>
      {/* ── Stat Cards ──────────────────────────── */}
      <div className={styles.statsGrid}>
        <GlassPanel className={styles.statCard}>
          <p className={styles.statLabel}>Total Karyawan Aktif</p>
          <p className={styles.statValue}>{activeEmployees.length}</p>
        </GlassPanel>
        <GlassPanel className={styles.statCard}>
          <p className={styles.statLabel}>Hadir Hari Ini</p>
          <p className={`${styles.statValue} ${styles.success}`}>{presentToday}</p>
        </GlassPanel>
        <GlassPanel className={styles.statCard}>
          <p className={styles.statLabel}>Terlambat</p>
          <p className={`${styles.statValue} ${styles.warn}`}>{lateToday}</p>
        </GlassPanel>
        <GlassPanel className={styles.statCard}>
          <p className={styles.statLabel}>Belum Absen</p>
          <p className={`${styles.statValue} ${styles.danger}`}>{absentToday}</p>
        </GlassPanel>
        <GlassPanel className={styles.statCard}>
          <p className={styles.statLabel}>Izin/Cuti Pending</p>
          <p className={`${styles.statValue} ${styles.accent}`}>{pendingLeaves.length}</p>
        </GlassPanel>
      </div>

      {/* ── Alerts Row ──────────────────────────── */}
      {(birthdayThisMonth.length > 0 || contractWarnings.length > 0) && (
        <div className={styles.alertsRow}>
          {birthdayThisMonth.length > 0 && (
            <GlassPanel className={styles.alertCard}>
              <div className={styles.alertHeader}>
                <span className={styles.alertEmoji}>🎉</span>
                <span className={styles.alertTitle}>Ulang Tahun Bulan Ini</span>
                <Badge tone="accent">{birthdayThisMonth.length}</Badge>
              </div>
              <ul className={styles.alertList}>
                {birthdayThisMonth.map(e => (
                  <li key={e.id}>
                    <strong>{e.full_name}</strong>
                    <span className={styles.alertMeta}>{e.birth_date}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}
          {contractWarnings.length > 0 && (
            <GlassPanel className={styles.alertCard}>
              <div className={styles.alertHeader}>
                <span className={styles.alertEmoji}>⚠️</span>
                <span className={styles.alertTitle}>Kontrak Hampir Berakhir</span>
                <Badge tone="warn">{contractWarnings.length}</Badge>
              </div>
              <ul className={styles.alertList}>
                {contractWarnings.map(e => (
                  <li key={e.id}>
                    <strong>{e.full_name}</strong>
                    <span className={styles.alertMeta}>{e.contract_end_date}</span>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}
        </div>
      )}

      {/* ── Live Attendance Today ──────────────── */}
      <GlassPanel>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Absensi Hari Ini</h2>
          <Badge tone="success" pulse>{attendance.length} Tercatat</Badge>
        </div>
        {attendance.length === 0 ? (
          <p className={styles.empty}>Belum ada data absensi hari ini.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama</th>
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
                      {typeof a.kpi_score === 'number' ? a.kpi_score : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {/* ── Pending Leave Requests ─────────────── */}
      {pendingLeaves.length > 0 && (
        <GlassPanel>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Pengajuan Menunggu Persetujuan</h2>
            <Badge tone="warn" pulse>{pendingLeaves.length}</Badge>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>NIK</th>
                  <th>Jenis</th>
                  <th>Tanggal</th>
                  <th>Alasan</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map(l => (
                  <tr key={l.id}>
                    <td className={styles.nameCell}>{l.employee_name}</td>
                    <td className={styles.mono}>{l.employee_nik}</td>
                    <td>
                      <Badge tone={l.leave_type === 'CUTI' ? 'accent' : l.leave_type === 'SAKIT' ? 'danger' : 'warn'}>
                        {l.leave_type}
                      </Badge>
                    </td>
                    <td className={styles.mono}>{l.start_date} → {l.end_date}</td>
                    <td className={styles.reason}>{l.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
