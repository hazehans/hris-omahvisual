import TablePagination from '../components/TablePagination';
import React, { useEffect, useState } from 'react';
import { LogOut, Calendar, Clock, FileText, User, X, CheckCircle, Clock as ClockIcon, XCircle, ClipboardEdit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState({ ABSENSI: { p: 1, l: 10 }, DAILY_LOG: { p: 1, l: 10 }, CUTI: { p: 1, l: 10 } });
  const getPage = (key) => pageState[key].p;
  const getLimit = (key) => pageState[key].l;
  const setPage = (key, p) => setPageState(prev => ({...prev, [key]: {...prev[key], p: typeof p === 'function' ? p(prev[key].p) : p}}));
  const setLimit = (key, l) => setPageState(prev => ({...prev, [key]: {p: 1, l}}));
  const [userName, setUserName] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [logDateFilter, setLogDateFilter] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    leave_type: 'IZIN',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    work_link: '',
    issue: ''
  });

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://127.0.0.1:8000/api/v1/leave/', { headers: { Authorization: `Bearer ${token}` } });
      setLeaves(res.data);
    } catch (err) {}
  };

  const fetchDailyLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/daily-logs/?date=${logDateFilter}`, { headers: { Authorization: `Bearer ${token}` } });
      setDailyLogs(res.data);
    } catch (err) {}
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://127.0.0.1:8000/api/v1/daily-logs/', logForm, { headers: { Authorization: `Bearer ${token}` } });
      setLogForm({ date: new Date().toISOString().split('T')[0], activity: '', work_link: '', issue: '' });
      fetchDailyLogs();
      alert('Laporan berhasil ditambahkan!');
    } catch (err) {
      alert('Gagal menyimpan Laporan.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    if (!token || role !== 'employee') {
      navigate('/login');
      return;
    }
    setUserName(localStorage.getItem('user_name') || 'Karyawan');
    fetchLeaves();
    fetchDailyLogs();
  }, [navigate, logDateFilter]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const data = new FormData();
      data.append('leave_type', formData.leave_type);
      data.append('start_date', formData.start_date);
      data.append('end_date', formData.end_date);
      data.append('reason', formData.reason);
      if (formData.attachment) {
        data.append('attachment', formData.attachment);
      }

      await axios.post('http://127.0.0.1:8000/api/v1/leave/', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Berhasil diajukan! Menunggu HR menyetujuinya.');
      setShowModal(false);
      fetchLeaves();
    } catch (err) {
      alert('Gagal mengajukan izin. Pastikan semua data terisi.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-[#020617] text-slate-200 flex flex-col">
      {/* Navbar Glassmorphism */}
      <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-500/20 p-2 rounded-xl">
                <User className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="font-bold text-lg tracking-wide text-white">Portal Karyawan</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition"
            >
              <LogOut className="w-4 h-4 text-slate-300" />
              <span className="text-sm font-medium text-slate-200">Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Konten Utama Karyawan */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-md">Halo, {userName}! 👋</h1>
          <p className="text-slate-400 mt-1">Selamat bekerja, semoga harimu menyenangkan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Box 1 */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl border border-white/10 p-6 flex flex-col items-center justify-center text-center">
            <div className="bg-indigo-500/20 border border-indigo-500/30 p-4 rounded-2xl mb-4">
              <Clock className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-bold text-slate-200">Absensi Hari Ini</h3>
            <p className="text-sm text-slate-400 mt-1">Gunakan mesin absen di kantor</p>
          </div>

          {/* Box 2 */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl border border-white/10 p-6 flex flex-col items-center justify-center text-center">
            <div className="bg-amber-500/20 border border-amber-500/30 p-4 rounded-2xl mb-4">
              <Calendar className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="font-bold text-slate-200">Pengajuan Izin</h3>
            <p className="text-sm text-slate-400 mt-1">Sakit, Cuti, Keperluan lain</p>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-4 w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium py-2 rounded-xl transition"
            >
              Ajukan Sekarang
            </button>
          </div>

          {/* Box 3 */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl border border-white/10 p-6 flex flex-col items-center justify-center text-center opacity-70">
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl mb-4">
              <FileText className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-bold text-slate-200">Slip Gaji</h3>
            <p className="text-sm text-slate-400 mt-1">Gaji bulan lalu</p>
            <button className="mt-4 text-sm text-slate-500 font-medium cursor-not-allowed">Segera Hadir</button>
          </div>
        </div>

        {/* Tabel Riwayat Cuti (Lama) */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl border border-white/10 overflow-hidden mb-12">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Riwayat Pengajuan Cuti & Izin</h2>
          </div>
          {leaves.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Anda belum pernah mengajukan izin.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-black/20">
                  <tr className="text-left text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-4 pl-6 pr-4">Tipe</th>
                    <th className="py-4 px-4">Dari Tanggal</th>
                    <th className="py-4 px-4">Sampai</th>
                    <th className="py-4 px-4">Alasan</th>
                    <th className="py-4 pl-4 pr-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaves.slice((getPage('CUTI') - 1) * getLimit('CUTI'), getPage('CUTI') * getLimit('CUTI')).map((l) => (
                    <tr key={l.id} className="text-sm text-slate-300 hover:bg-white/5 transition duration-200">
                      <td className="py-4 pl-6 pr-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-black/30 border border-white/10">{l.leave_type}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{l.start_date}</td>
                      <td className="py-4 px-4 text-slate-400">{l.end_date}</td>
                      <td className="py-4 px-4 truncate max-w-[200px] text-slate-400">{l.reason}</td>
                      <td className="py-4 pl-4 pr-6 text-right flex flex-col items-end space-y-2">
                        {l.status === 'PENDING' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"><ClockIcon className="w-3 h-3 mr-1.5"/> Pending</span>}
                        {l.status === 'APPROVED' && (
                          <>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1.5"/> Disetujui</span>
                            {l.signed_attachment && (
                              <a href={`http://127.0.0.1:8000${l.signed_attachment}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 px-2 py-1 rounded border border-indigo-500/30 transition flex items-center">
                                <FileText className="w-3 h-3 mr-1" /> Unduh Balasan HR
                              </a>
                            )}
                          </>
                        )}
                        {(l.status === 'REJECTED' || l.status === 'AUTO_REJECTED') && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30"><XCircle className="w-3 h-3 mr-1.5"/> Ditolak</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODUL BARU: DAILY LOG */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white drop-shadow-md flex items-center">
            <ClipboardEdit className="w-6 h-6 mr-2 text-blue-400" /> Laporan Harian (Daily Log)
          </h2>
          <p className="text-slate-400 mt-1">Catat aktivitas atau pekerjaan yang Anda selesaikan hari ini.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Form Input */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl border border-white/10 p-6 lg:col-span-1">
            <h3 className="font-bold text-white mb-4">Buat Laporan Baru</h3>
            <form onSubmit={handleSubmitLog} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tanggal Laporan</label>
                  <input type="date" required max={new Date().toISOString().split('T')[0]} style={{ colorScheme: 'dark' }} className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={logForm.date} onChange={(e) => setLogForm({...logForm, date: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Deskripsi Aktivitas / Progress Pekerjaan</label>
                  <textarea required rows="4" placeholder="Contoh: Mengedit video promosi produk untuk klien A..." className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm placeholder-slate-500" value={logForm.activity} onChange={(e) => setLogForm({...logForm, activity: e.target.value})}></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Link Kerja (Opsional)</label>
                  <input type="url" placeholder="https://gdrive..." className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm placeholder-slate-600" value={logForm.work_link} onChange={(e) => setLogForm({...logForm, work_link: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Kendala (Opsional)</label>
                  <input type="text" placeholder="Ada kesulitan?" className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm placeholder-slate-600" value={logForm.issue} onChange={(e) => setLogForm({...logForm, issue: e.target.value})} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Anda bisa men-submit laporan untuk hari ini atau hari-hari sebelumnya.</p>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition shadow-[0_0_15px_rgba(37,99,235,0.3)] text-sm mt-4">
                + Kirim Laporan
              </button>
            </form>
          </div>

          {/* Tabel Riwayat Laporan Harian */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-xl border border-white/10 p-6 lg:col-span-2 flex flex-col h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">Riwayat Laporan</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 flex items-center space-x-1">
                <select 
                  className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
                  value={logDateFilter === 'ALL' ? 'ALL' : 'DATE'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'ALL') setLogDateFilter('ALL');
                    else if (val === 'DATE') setLogDateFilter(new Date().toISOString().split('T')[0]);
                  }}
                >
                  <option className="bg-slate-800" value="ALL">Semua Waktu</option>
                  <option className="bg-slate-800" value="DATE">Pilih Tanggal / Hari Ini</option>
                </select>
                {logDateFilter !== 'ALL' && (
                  <input type="date" style={{ colorScheme: 'dark' }} className="bg-transparent text-xs text-slate-200 outline-none border-l border-white/10 pl-2 ml-1" value={logDateFilter} onChange={(e) => setLogDateFilter(e.target.value)} />
                )}
              </div>
            </div>
            
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 relative">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-black/20 sticky top-0">
                  <tr className="text-left text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-3 px-4 w-28">Tanggal & Waktu</th>
                    <th className="py-3 px-4">Laporan / Pekerjaan</th>
                    <th className="py-3 px-4">Lampiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dailyLogs.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-sm text-slate-400">
                        <ClipboardEdit className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        {logDateFilter === 'ALL' ? 'Belum ada riwayat laporan.' : `Belum ada laporan untuk tanggal ${logDateFilter}.`}
                      </td>
                    </tr>
                  ) : (
                    dailyLogs.slice((getPage('DAILY_LOG') - 1) * getLimit('DAILY_LOG'), getPage('DAILY_LOG') * getLimit('DAILY_LOG')).map((log) => {
                      const time = new Date(log.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                      const date = new Date(log.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});
                      return (
                      <tr key={log.id} className="text-sm text-slate-300 hover:bg-white/5 transition">
                        <td className="py-3 px-4 whitespace-nowrap align-top">
                          <div className="font-bold text-slate-200">{date}</div>
                          <div className="text-xs text-blue-400">{time}</div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="whitespace-pre-wrap mb-1">{log.activity}</div>
                          {log.issue && (
                            <div className="mt-2 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2 rounded">
                              <span className="font-bold">Kendala:</span> {log.issue}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top">
                          {log.work_link ? (
                            <a href={log.work_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs underline truncate block max-w-[150px]">
                              Buka Link
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination currentPage={getPage('DAILY_LOG')} totalPages={Math.ceil(dailyLogs.length / getLimit('DAILY_LOG'))} rowsPerPage={getLimit('DAILY_LOG')} setPage={(p) => setPage('DAILY_LOG', p)} setRowsPerPage={(l) => setLimit('DAILY_LOG', l)} totalItems={dailyLogs.length} />
          </div>
        </div>

      </main>

      {/* POPUP (Modal) Glassmorphism */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Form Pengajuan Izin</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipe Izin</label>
                <select 
                  className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={formData.leave_type}
                  onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                >
                  <option value="IZIN">Izin Keperluan</option>
                  <option value="SAKIT">Sakit (Wajib Bawa Surat Dokter)</option>
                  <option value="CUTI">Cuti Tahunan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Mulai Tanggal</label>
                  <input type="date" required 
                    className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    style={{ colorScheme: 'dark' }}
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Sampai Tanggal</label>
                  <input type="date" required 
                    className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    style={{ colorScheme: 'dark' }}
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Alasan Detail</label>
                <textarea required rows="3" 
                  className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500" 
                  placeholder="Jelaskan secara detail..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Lampiran (PDF/Foto Surat Dokter) <span className="text-slate-500 text-xs italic">- Wajib untuk izin Sakit</span>
                </label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  className="w-full text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30 cursor-pointer outline-none border border-white/10 rounded-xl p-1 bg-black/30"
                  onChange={(e) => setFormData({...formData, attachment: e.target.files[0]})}
                />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition mt-6 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                Kirim Pengajuan
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;




