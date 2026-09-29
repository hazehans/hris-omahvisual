import { useEffect, useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import { dailyLogService } from '@/services/dailyLogService';
import { leaveService } from '@/services/leaveService';
import type { AttendanceRecord, DailyLog, LeaveRequest } from '@/types';

export function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const empId = user?.employee_id ? parseInt(user.employee_id, 10) : undefined;

        const [attRes, logRes, leaveRes] = await Promise.all([
          empId ? attendanceService.history({ employee_id: empId, start: startOfMonth, end: endOfMonth }) : Promise.resolve([]),
          dailyLogService.list('ALL'),
          leaveService.list('ALL_HISTORY')
        ]);
        
        setAttendance(attRes);
        setDailyLogs(logRes.slice(0, 5));
        setLeaves(leaveRes.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const totalHadir = new Set(attendance.map(a => a.attendance_date)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
      <GlassPanel>
        <h2 style={{ color: 'white', margin: '0 0 0.5rem 0', fontWeight: 600 }}>Selamat Datang, {user?.name}</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>NIK: {user?.nik} | Posisi: {user?.position || '-'}</p>
      </GlassPanel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <GlassPanel>
          <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Total Hadir (Bulan Ini)</h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{loading ? '-' : totalHadir} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>Hari</span></div>
        </GlassPanel>
        <GlassPanel>
          <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Total Izin/Cuti</h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{loading ? '-' : leaves.length} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>Pengajuan</span></div>
        </GlassPanel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <GlassPanel>
          <h3 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Daily Log Terakhir</h3>
          {dailyLogs.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Belum ada catatan aktivitas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dailyLogs.map(log => (
                <div key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ color: 'white', fontSize: '0.9rem' }}>{log.date}</strong>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{log.activity}</div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel>
          <h3 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Izin & Cuti Terakhir</h3>
          {leaves.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Belum ada pengajuan.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {leaves.map(req => (
                <div key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ color: 'white', fontSize: '0.9rem' }}>{req.leave_type}</strong>
                    <Badge tone={req.status === 'APPROVED' ? 'success' : req.status === 'PENDING' ? 'warn' : 'danger'}>
                      {req.status}
                    </Badge>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{req.start_date} - {req.end_date}</div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}



