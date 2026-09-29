import { useEffect, useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import type { AttendanceRecord } from '@/types';

export function EmployeeAttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const end = new Date(year, month, 0).toISOString().split('T')[0];
        const empId = user?.employee_id ? parseInt(user.employee_id, 10) : undefined;

        if (empId) {
          const data = await attendanceService.history({ employee_id: empId, start, end });
          setRecords(data);
        }
      } catch (err) {
        console.error('Failed to fetch attendance history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [user, month, year]);

  const uniqueDays = new Set(records.map(r => r.attendance_date)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
      <GlassPanel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 0.5rem 0', fontWeight: 600 }}>Riwayat Kehadiran</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Lihat catatan absensi Anda berdasarkan bulan.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
              value={month} 
              onChange={e => setMonth(Number(e.target.value))}
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '4px' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1} style={{ color: 'black' }}>Bulan {i + 1}</option>
              ))}
            </select>
            <select 
              value={year} 
              onChange={e => setYear(Number(e.target.value))}
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '4px' }}
            >
              {[year - 1, year, year + 1].map(y => (
                <option key={y} value={y} style={{ color: 'black' }}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Total Hadir</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>{loading ? '-' : uniqueDays} Hari</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Tanggal</th>
                <th style={{ padding: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Waktu</th>
                <th style={{ padding: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Tipe</th>
                <th style={{ padding: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center' }}>Memuat data...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Tidak ada data absensi</td></tr>
              ) : (
                records.map(record => (
                  <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem' }}>{record.attendance_date}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(record.event_time).toLocaleTimeString('id-ID')}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <Badge tone={record.attendance_type === 'IN' ? 'success' : 'warn'}>
                        {record.attendance_type}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{record.verification_mode}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}



