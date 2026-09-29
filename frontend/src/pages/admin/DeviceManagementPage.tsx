import { useEffect, useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { attendanceService } from '@/services/attendanceService';
import { employeeService } from '@/services/employeeService';
import type { DeviceInfo, DeviceUser, Employee } from '@/types';
import styles from '../hr/HREmployeesPage.module.css';

export function DeviceManagementPage() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [users, setUsers] = useState<DeviceUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Push Modal
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [pushTarget, setPushTarget] = useState<Employee | null>(null);
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [pushMessage, setPushMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [info, usersData, empData] = await Promise.all([
        attendanceService.deviceInfo(),
        attendanceService.deviceUsers(),
        employeeService.list()
      ]);
      setDeviceInfo(info);
      setUsers(usersData?.UserInfo || []);
      setEmployees(empData);
    } catch (error) {
      console.error('Failed to fetch device info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPushModal = (emp: Employee) => {
    setPushTarget(emp);
    setPushStatus('idle');
    setPushMessage('');
    setPushModalOpen(true);
  };

  const handlePushUser = async () => {
    if (!pushTarget) return;
    setPushStatus('pushing');
    try {
      await attendanceService.devicePushUser(Number(pushTarget.id));
      setPushStatus('success');
      setPushMessage('Data karyawan berhasil dikirim ke mesin.');
      fetchData();
    } catch (err: any) {
      setPushStatus('error');
      setPushMessage(`Gagal push user: ${err.message}`);
    }
  };

  const handlePushAll = async () => {
    const confirmPush = window.confirm("Apakah Anda yakin ingin melakukan sinkronisasi massal? Ini akan mengirim semua data karyawan (yang memiliki ID Mesin) ke perangkat.");
    if (!confirmPush) return;
    
    let successCount = 0;
    let failCount = 0;
    setLoading(true);

    for (const emp of employees) {
      if (emp.hikvision_id) {
        try {
          await attendanceService.devicePushUser(Number(emp.id));
          successCount++;
        } catch (err) {
          failCount++;
        }
      }
    }
    
    setLoading(false);
    alert(`Push massal selesai!\nBerhasil: ${successCount}\nGagal: ${failCount}`);
    fetchData();
  };

  const handleDeleteUser = async (employeeNo: string) => {
    if (!confirm(`Hapus user ${employeeNo} dari mesin?`)) return;
    try {
      await attendanceService.deviceDeleteUser(employeeNo);
      alert('Berhasil menghapus user dari mesin!');
      fetchData();
    } catch (err: any) {
      alert(`Gagal hapus user: ${err.message}`);
    }
  };

  // Filter & Pagination Logic
  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.hikvision_id && emp.hikvision_id.includes(searchTerm))
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Memuat data perangkat...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Integrasi Perangkat</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manajemen Sinkronisasi Karyawan ke Mesin Hikvision</p>
      </div>

      {/* Info Mesin */}
      <GlassPanel>
        <div style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '1rem' }}>Status Mesin</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Status Koneksi</p>
              <Badge tone={deviceInfo?.status === 'online' ? 'success' : 'danger'}>
                {deviceInfo?.status === 'online' ? 'Terhubung' : 'Terputus'}
              </Badge>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total User di Mesin</p>
              <p style={{ color: 'white', fontWeight: 500, fontSize: '1.25rem', margin: 0 }}>{deviceInfo?.user_count?.userNumber || 0}</p>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Push Karyawan ke Mesin */}
      <GlassPanel>
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <div className={styles.tableHeader}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>Sinkronisasi Pengguna</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>Pilih karyawan di HRIS untuk disinkronkan ke mesin absensi.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className={styles.searchWrap} style={{ minWidth: '200px' }}>
                <input 
                  className={styles.searchInput}
                  type="search"
                  placeholder="Cari nama / ID..." 
                  value={searchTerm}
                  onChange={(e: any) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Button variant="primary" onClick={handlePushAll}>Push Semua Karyawan</Button>
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Karyawan</th>
                <th>ID Mesin (HRIS)</th>
                <th>Status Sinkronisasi</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map(emp => {
                const isInDevice = users.some(u => u.employeeNo === emp.hikvision_id);
                return (
                  <tr key={emp.id}>
                    <td className={styles.nameCell}>{emp.full_name}</td>
                    <td className={styles.mono}>{emp.hikvision_id || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Belum diset</span>}</td>
                    <td>
                      {!emp.hikvision_id ? (
                        <Badge tone="neutral">Tidak Ada ID Mesin</Badge>
                      ) : isInDevice ? (
                        <Badge tone="success">Tersinkron</Badge>
                      ) : (
                        <Badge tone="warn">Belum Tersinkron</Badge>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                        <Button 
                          variant="secondary" 
                          onClick={() => openPushModal(emp)}
                          disabled={!emp.hikvision_id}
                        >
                          Push ke Mesin
                        </Button>
                        {isInDevice && (
                          <Button 
                            variant="danger" 
                            onClick={() => handleDeleteUser(emp.hikvision_id as string)}
                          >
                            Hapus
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
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

      {/* Push Confirmation Modal */}
      {pushModalOpen && pushTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '0.75rem', padding: '1.5rem', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)' }}>Konfirmasi Push User</h3>
            
            {pushStatus === 'idle' || pushStatus === 'pushing' ? (
              <>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Anda akan mengirim data karyawan berikut ke mesin Hikvision:
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Nama</span>
                    <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }}>{pushTarget.full_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>ID Mesin (Serial)</span>
                    <span style={{ color: 'white', fontSize: '0.875rem', fontFamily: 'monospace' }}>{pushTarget.hikvision_id}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => setPushModalOpen(false)} disabled={pushStatus === 'pushing'}>
                    Batal
                  </Button>
                  <Button variant="primary" onClick={handlePushUser} disabled={pushStatus === 'pushing'}>
                    {pushStatus === 'pushing' ? 'Memproses...' : 'Ya, Kirim'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: '1rem', background: pushStatus === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)', borderRadius: '0.5rem', marginBottom: '1.5rem', border: `1px solid ${pushStatus === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(248, 113, 113, 0.3)'}` }}>
                  <p style={{ margin: 0, color: pushStatus === 'success' ? '#10b981' : '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>
                    {pushMessage}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Button variant="primary" onClick={() => setPushModalOpen(false)}>
                    Tutup
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
