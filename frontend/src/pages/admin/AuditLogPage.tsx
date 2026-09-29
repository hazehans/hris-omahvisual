import React, { useState, useEffect } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { auditService } from '@/services/auditService';
import type { AuditLogEntry } from '@/types';
import styles from '../hr/HREmployeesPage.module.css';

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Existing API Filters
  const [actionFilter, setActionFilter] = useState('');
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
  
  // New API Filters
  const [userFilter, setUserFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');

  // Client Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.list({ 
        action: actionFilter || undefined, 
        start: startDate || undefined, 
        end: endDate || undefined,
        user: userFilter || undefined,
        ip: ipFilter || undefined,
        target_type: targetFilter || undefined
      });
      setLogs(data);
      setCurrentPage(1); // reset to page 1 on fresh fetch
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleResetFilters = () => {
    setActionFilter('');
    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    setUserFilter('');
    setIpFilter('');
    setTargetFilter('');
    setSearchTerm('');
    setCurrentPage(1);
    // Since we updated states, we can either call fetchLogs here manually after a short timeout,
    // or depend on useEffect (but we don't have dependency array for fetchLogs).
    // Let's call it manually using the reset values:
    auditService.list({ 
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    }).then(data => { setLogs(data); setCurrentPage(1); });
  };

  const getBadgeColor = (action: string) => {
    if (action.includes('LOGIN')) return 'success';
    if (action.includes('ERROR') || action.includes('DELETE')) return 'danger';
    if (action.includes('UPDATE') || action.includes('PUSH')) return 'accent';
    return 'neutral';
  };

  // Filter logs locally
  const filteredLogs = logs.filter(log => 
    (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.target_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.ip_address || '').includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  if (loading && logs.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Memuat log audit...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Audit Log</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Sistem Pemantauan Jejak Rekam Aplikasi</p>
      </div>

      <GlassPanel>
        <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>User</label>
            <input 
              className={styles.searchInput} 
              value={userFilter} 
              onChange={(e: any) => setUserFilter(e.target.value)} 
              placeholder="Username" 
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tindakan (API)</label>
            <select 
              className={styles.searchInput} 
              value={actionFilter} 
              onChange={(e: any) => setActionFilter(e.target.value)}
              style={{ padding: '0.5rem' }}
            >
              <option value="">Semua</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="HIKVISION_SYNC">HIKVISION_SYNC</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Target</label>
            <input 
              className={styles.searchInput} 
              value={targetFilter} 
              onChange={(e: any) => setTargetFilter(e.target.value)} 
              placeholder="Module/Resource" 
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>IP Address</label>
            <input 
              className={styles.searchInput} 
              value={ipFilter} 
              onChange={(e: any) => setIpFilter(e.target.value)} 
              placeholder="IP Address" 
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Dari Tanggal</label>
            <input 
              className={styles.searchInput} 
              type="date" 
              style={{ colorScheme: 'dark' }}
              value={startDate} 
              onChange={(e: any) => setStartDate(e.target.value)} 
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sampai Tanggal</label>
            <input 
              className={styles.searchInput} 
              type="date" 
              style={{ colorScheme: 'dark' }}
              value={endDate} 
              onChange={(e: any) => setEndDate(e.target.value)} 
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="primary" onClick={fetchLogs}>Tarik Data Server</Button>
            <Button variant="ghost" onClick={handleResetFilters}>Reset Filter</Button>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel>
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <div className={styles.tableHeader}>
            <div style={{ flex: 1 }}>
               <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Log Tersimpan ({filteredLogs.length})</h2>
            </div>
            <div className={styles.searchWrap} style={{ minWidth: '250px' }}>
               <input 
                 className={styles.searchInput}
                 placeholder="Cari user, aksi, target, IP..." 
                 value={searchTerm} 
                 onChange={(e: any) => {
                   setSearchTerm(e.target.value);
                   setCurrentPage(1);
                 }}
               />
            </div>
          </div>
        </div>
        
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>User</th>
                <th>Aksi</th>
                <th>Target</th>
                <th>IP Address</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Tidak ada log ditemukan.</td></tr>
              ) : currentLogs.map(log => (
                <React.Fragment key={log.id}>
                  <tr>
                    <td className={styles.mono} style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className={styles.nameCell}>{log.username || '-'}</td>
                    <td>
                      <Badge tone={getBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td>
                      {log.target_type} <span style={{ opacity: 0.4 }}>#{log.target_id || '?'}</span>
                    </td>
                    <td className={styles.mono}>{log.ip_address || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Button variant="ghost" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                        {expandedId === log.id ? 'Tutup' : 'Lihat'}
                      </Button>
                    </td>
                  </tr>
                  {expandedId === log.id && log.detail && (
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <td colSpan={6} style={{ padding: '1rem' }}>
                        <pre style={{ 
                          fontSize: '0.75rem', 
                          fontFamily: 'monospace', 
                          color: '#64d2ff', 
                          background: 'rgba(0,0,0,0.4)', 
                          padding: '1rem', 
                          borderRadius: '0.5rem', 
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          margin: 0
                        }}>
                          {JSON.stringify(log.detail, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Halaman {currentPage} dari {totalPages}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button 
                  variant="ghost" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Prev
                </Button>
                <Button 
                  variant="ghost" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
