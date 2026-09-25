import TablePagination from '../components/TablePagination';
import React, { useEffect, useState } from 'react';
import { 
  LogOut, Users, Clock, AlertTriangle, CheckCircle, Check, X, 
  Paperclip, FileCheck, History, LayoutDashboard, CalendarCheck, 
  ClipboardEdit, FileSpreadsheet, FileSignature, RefreshCw, Edit, Trash2, ArrowUpDown, Loader, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  // Pagination States
  const [pageState, setPageState] = useState({
    KARYAWAN: { p: 1, l: 10 },
    ABSENSI: { p: 1, l: 10 },
    DAILY_LOG: { p: 1, l: 10 },
    CUTI_PENDING: { p: 1, l: 10 },
    CUTI_HISTORY: { p: 1, l: 10 },
    KONTRAK: { p: 1, l: 10 }
  });
  const getPage = (key) => pageState[key].p;
  const getLimit = (key) => pageState[key].l;
  const setPage = (key, p) => setPageState(prev => ({...prev, [key]: {...prev[key], p: typeof p === 'function' ? p(prev[key].p) : p}}));
  const setLimit = (key, l) => setPageState(prev => ({...prev, [key]: {p: 1, l}}));

  // States
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [historyLeaves, setHistoryLeaves] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  
  // Fitur Filter & Loading
  const [isRefreshingEmp, setIsRefreshingEmp] = useState(false);
  const [isRefreshingLog, setIsRefreshingLog] = useState(false);
  const [isRefreshingLeave, setIsRefreshingLeave] = useState(false);
  const [logDateFilter, setLogDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [leaveDateFilter, setLeaveDateFilter] = useState('ALL');
  
  // Modal States - Cuti
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [signedFile, setSignedFile] = useState(null);

  // Modal States - Karyawan (CRUD)
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [isEditingEmp, setIsEditingEmp] = useState(false);
  const [empForm, setEmpForm] = useState({
    id: '', nik: '', full_name: '', role: '', gender: 'LAKI_LAKI', 
    whatsapp_number: '', join_date: '', is_active: true,
    contract_type: 'PKWT', contract_end_date: ''
  });

  // State Sorting Karyawan
  const [sortConfig, setSortConfig] = useState({ key: 'is_active', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEmployees = [...employeesList].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // --- API FETCHERS ---
  const fetchAttendance = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/attendance/today/');
      setLogs(res.data);
      setLoading(false);
    } catch (e) { setLoading(false); }
  };

  const fetchLeaves = async (showLoading = false) => {
    if (showLoading) setIsRefreshingLeave(true);
    try {
      const token = localStorage.getItem('access_token');
      const resPending = await axios.get('http://127.0.0.1:8000/api/v1/leave/', { headers: { Authorization: `Bearer ${token}` }});
      setPendingLeaves(resPending.data);
      const resHistory = await axios.get('http://127.0.0.1:8000/api/v1/leave/?status=ALL_HISTORY', { headers: { Authorization: `Bearer ${token}` }});
      setHistoryLeaves(resHistory.data);
    } catch (e) {}
    if (showLoading) setTimeout(() => setIsRefreshingLeave(false), 600);
  };

  const fetchEmployees = async (showLoading = false) => {
    if (showLoading) setIsRefreshingEmp(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://127.0.0.1:8000/api/v1/employees/', { headers: { Authorization: `Bearer ${token}` }});
      setEmployeesList(res.data);
    } catch (e) {}
    if (showLoading) setTimeout(() => setIsRefreshingEmp(false), 600);
  };

  const fetchDailyLogs = async (showLoading = false) => {
    if (showLoading) setIsRefreshingLog(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/daily-logs/?date=${logDateFilter}`, { headers: { Authorization: `Bearer ${token}` }});
      setDailyLogs(res.data);
    } catch (e) {}
    if (showLoading) setTimeout(() => setIsRefreshingLog(false), 600);
  };

  // --- FUNGSI EXPORT CSV ---
  const exportToCSV = (data, filename, keys, headers) => {
    const csvContent = [
      headers.join(","),
      ...data.map(item => keys.map(k => {
        let val = item[k] || '';
        // handle date formatting if needed, but strings are fine
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EMPLOYEE CRUD HANDLERS ---
  const openAddEmployee = () => {
    setEmpForm({ id: '', nik: '', full_name: '', role: '', gender: 'LAKI_LAKI', whatsapp_number: '', join_date: '', is_active: true, contract_type: 'PKWT', contract_end_date: '' });
    setIsEditingEmp(false);
    setShowEmpModal(true);
  };

  const openEditEmployee = (emp) => {
    setEmpForm({ ...emp });
    setIsEditingEmp(true);
    setShowEmpModal(true);
  };

  const handleDeleteEmployee = async (id, name) => {
    if(!window.confirm(`Apakah Anda yakin ingin menonaktifkan karyawan ${name}?`)) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/v1/employees/${id}/`, { headers: { Authorization: `Bearer ${token}` }});
      fetchEmployees();
    } catch (e) { alert('Gagal menonaktifkan karyawan.'); }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const payload = { ...empForm };
      if (!payload.contract_end_date) payload.contract_end_date = null;
      if (!payload.birth_date) payload.birth_date = null;

      if (isEditingEmp) {
        await axios.put(`http://127.0.0.1:8000/api/v1/employees/${empForm.id}/`, payload, { headers: { Authorization: `Bearer ${token}` }});
      } else {
        await axios.post(`http://127.0.0.1:8000/api/v1/employees/`, payload, { headers: { Authorization: `Bearer ${token}` }});
      }
      setShowEmpModal(false);
      fetchEmployees(); // Refresh tabel
    } catch (error) {
      alert('Gagal menyimpan data. Pastikan NIK belum terpakai & format sesuai.');
    }
  };

  // --- LEAVE HANDLERS ---
  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`http://127.0.0.1:8000/api/v1/leave/${id}/approve/`, { action: 'REJECT' }, { headers: { Authorization: `Bearer ${token}` }});
      fetchLeaves();
    } catch (e) { alert('Gagal menolak!'); }
  };

  const openApproveModal = (leave) => {
    setSelectedLeave(leave);
    setSignedFile(null);
    setShowApproveModal(true);
  };

  const executeApprove = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const data = new FormData();
      data.append('action', 'APPROVE');
      if (signedFile) data.append('signed_attachment', signedFile);
      
      await axios.post(`http://127.0.0.1:8000/api/v1/leave/${selectedLeave.id}/approve/`, data, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }});
      setShowApproveModal(false);
      fetchLeaves();
    } catch (e) { alert('Gagal menyetujui!'); }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetchAttendance(); fetchLeaves(); fetchEmployees(); fetchDailyLogs();
    const interval = setInterval(() => { fetchAttendance(); fetchLeaves(); fetchDailyLogs(); }, 5000); 
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    // Saat tanggal filter berubah, otomatis fetch
    fetchDailyLogs(true);
  }, [logDateFilter]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { id: 'OVERVIEW', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'KARYAWAN', label: 'Data Karyawan', icon: Users },
    { id: 'ABSENSI', label: 'Live Absensi', icon: CalendarCheck },
    { id: 'DAILY_LOG', label: 'Daily Log', icon: ClipboardEdit },
    { id: 'CUTI', label: 'Izin & Cuti', icon: FileSpreadsheet },
    { id: 'KONTRAK', label: 'Kontrak & PKWT', icon: FileSignature },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-800 via-slate-900 to-[#020617] text-slate-200 flex overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900/50 backdrop-blur-md border-r border-white/10 hidden md:flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="bg-indigo-500/20 p-2 rounded-xl mr-3">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="font-bold text-xl tracking-wide text-white">HR<span className="text-indigo-400">Panel</span></span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 ${ activeTab === item.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.1)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200' }`}>
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/5 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-2xl font-bold text-white drop-shadow-md">{navItems.find(i => i.id === activeTab)?.label}</h1>
          <button onClick={handleLogout} className="flex items-center space-x-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-xl transition">
            <LogOut className="w-4 h-4" /> <span className="text-sm font-medium">Keluar</span>
          </button>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (() => {
            const currentMonth = new Date().getMonth();
            const birthdayEmployees = employeesList
              .filter(e => e.is_active && e.birth_date && new Date(e.birth_date).getMonth() === currentMonth)
              .sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());
            
            return (
            <div className="space-y-6 animate-in fade-in">
              {birthdayEmployees.length > 0 && (
                <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-3xl p-5 mb-2 flex items-center shadow-lg">
                  <div className="text-4xl mr-4 animate-bounce">🎉</div>
                  <div>
                    <h3 className="text-pink-300 font-bold text-lg">Ulang Tahun Bulan Ini!</h3>
                    <div className="text-sm text-pink-200/80 mt-2">
                      Jangan lupa beri ucapan selamat kepada:
                      <ul className="mt-1.5 space-y-1">
                        {birthdayEmployees.map(e => (
                          <li key={e.id} className="text-white flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mr-2"></span>
                            <span className="font-bold">{e.full_name}</span> 
                            <span className="text-pink-300 ml-1.5">({new Date(e.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                  <h3 className="text-slate-400 text-sm font-medium mb-2">Total Karyawan Aktif</h3>
                  <div className="text-4xl font-bold text-indigo-300">{employeesList.filter(e=>e.is_active).length}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                  <h3 className="text-slate-400 text-sm font-medium mb-2">Kehadiran Hari Ini</h3>
                  <div className="text-4xl font-bold text-emerald-300">{logs.filter(l => l.clock_in !== '-').length} <span className="text-lg text-emerald-500/50">/ {employeesList.filter(e=>e.is_active).length}</span></div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                  <h3 className="text-slate-400 text-sm font-medium mb-2">Izin Pending</h3>
                  <div className="text-4xl font-bold text-amber-300">{pendingLeaves.length}</div>
                </div>
              </div>
              </div>
            );
          })()}

          {/* TAB 2: DATA KARYAWAN (CRUD) */}
          {activeTab === 'KARYAWAN' && (() => {
            const paginatedEmployees = sortedEmployees.slice((getPage('KARYAWAN') - 1) * getLimit('KARYAWAN'), getPage('KARYAWAN') * getLimit('KARYAWAN'));
            return (
              <div className="animate-in fade-in">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white drop-shadow-md">Database Karyawan</h2>
                  <p className="text-slate-400 mt-1 text-sm">Kelola data seluruh karyawan OmahVisual</p>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => exportToCSV(sortedEmployees, 'Data_Karyawan_OmahVisual.csv', ['nik', 'full_name', 'role', 'gender', 'whatsapp_number', 'join_date', 'contract_type', 'contract_end_date', 'is_active'], ['NIK', 'Nama Lengkap', 'Jabatan', 'Jenis Kelamin', 'No WhatsApp', 'Tgl Gabung', 'Jenis Kontrak', 'Tgl Berakhir', 'Aktif?'])} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center transition text-sm">
                    <Download className="w-4 h-4 mr-2" /> Download CSV
                  </button>
                  <button onClick={() => fetchEmployees(true)} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 rounded-xl flex items-center transition text-sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingEmp ? 'animate-spin text-indigo-400' : ''}`} /> 
                    {isRefreshingEmp ? 'Memuat...' : 'Refresh'}
                  </button>
                  <button onClick={openAddEmployee} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                    + Tambah Karyawan
                  </button>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                <table className="min-w-full divide-y divide-white/5">
                  <thead className="bg-black/20">
                    <tr>
                      <th onClick={() => handleSort('full_name')} className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase cursor-pointer hover:bg-white/5 transition group select-none">
                        <div className="flex items-center space-x-1"><span>Karyawan</span> <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" /></div>
                      </th>
                      <th onClick={() => handleSort('role')} className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase cursor-pointer hover:bg-white/5 transition group select-none">
                        <div className="flex items-center space-x-1"><span>Jabatan</span> <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" /></div>
                      </th>
                      <th onClick={() => handleSort('join_date')} className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase cursor-pointer hover:bg-white/5 transition group select-none">
                        <div className="flex items-center space-x-1"><span>Tgl Gabung</span> <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" /></div>
                      </th>
                      <th onClick={() => handleSort('is_active')} className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase cursor-pointer hover:bg-white/5 transition group select-none">
                        <div className="flex items-center space-x-1"><span>Status</span> <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" /></div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedEmployees.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">Belum ada data.</td></tr>
                    ) : (
                      paginatedEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-white/5 transition duration-200">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-200">{emp.full_name} {emp.gender === 'LAKI_LAKI' ? '(L)' : '(P)'}</div>
                            <div className="text-xs text-slate-500">NIK: {emp.nik} | WA: {emp.whatsapp_number}</div>
                          </td>
                          <td className="px-6 py-4 text-sm"><span className="px-2 py-1 bg-black/30 border border-white/10 rounded-md text-slate-300 text-xs">{emp.role}</span></td>
                          <td className="px-6 py-4 text-sm text-slate-400">{emp.join_date}</td>
                          <td className="px-6 py-4">
                            {emp.is_active ? <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Aktif</span> : <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">Nonaktif</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <button onClick={() => openEditEmployee(emp)} className="p-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition" title="Edit"><Edit className="w-4 h-4" /></button>
                              {emp.is_active && (
                                <button onClick={() => handleDeleteEmployee(emp.id, emp.full_name)} className="p-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition" title="Nonaktifkan"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })()}

          {/* TAB 3: LIVE ABSENSI */}
          {activeTab === 'ABSENSI' && (() => {
            const paginatedLogs = logs.slice((getPage('ABSENSI') - 1) * getLimit('ABSENSI'), getPage('ABSENSI') * getLimit('ABSENSI'));
            return (
            <div className="animate-in fade-in">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                  <table className="min-w-full divide-y divide-white/5">
                    {/* Simplified for brevity (Same as before) */}
                    <thead className="bg-black/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Nama Karyawan</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Jam Masuk</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Jam Pulang</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Telat?</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">KPI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-6 py-4 text-sm text-slate-200 font-medium">{log.name}</td>
                          <td className="px-6 py-4 text-sm text-emerald-400">{log.clock_in}</td>
                          <td className="px-6 py-4 text-sm text-fuchsia-400">{log.clock_out}</td>
                          <td className="px-6 py-4 text-sm">{log.is_late ? 'Ya' : 'Tepat'}</td>
                          <td className="px-6 py-4 text-sm text-center font-bold">{log.kpi_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>
            );
          })()}

          {/* TAB 4: DAILY LOG */}
        {activeTab === 'DAILY_LOG' && (() => {
            const paginatedDailyLogs = dailyLogs.slice((getPage('DAILY_LOG') - 1) * getLimit('DAILY_LOG'), getPage('DAILY_LOG') * getLimit('DAILY_LOG'));
            return (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white drop-shadow-md">Laporan Harian (Daily Log)</h2>
                  <p className="text-slate-400 mt-1 text-sm">Rekap aktivitas kerja semua karyawan berdasarkan tanggal.</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Filter:</span>
                    <select 
                      className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
                      value={logDateFilter === 'ALL' ? 'ALL' : (logDateFilter === new Date().toISOString().split('T')[0] ? 'TODAY' : 'CUSTOM')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'ALL') setLogDateFilter('ALL');
                        else if (val === 'TODAY') setLogDateFilter(new Date().toISOString().split('T')[0]);
                      }}
                    >
                      <option className="bg-slate-800" value="TODAY">Hari ini/Pilih Tanggal</option>
                      <option className="bg-slate-800" value="ALL">Semua Waktu</option>
                    </select>
                    {logDateFilter !== 'ALL' && logDateFilter !== new Date().toISOString().split('T')[0] && (
                      <input type="date" style={{ colorScheme: 'dark' }} className="bg-transparent text-sm text-slate-200 outline-none ml-2 border-l border-white/10 pl-2" value={logDateFilter} onChange={(e) => setLogDateFilter(e.target.value)} />
                    )}
                    {logDateFilter === new Date().toISOString().split('T')[0] && ( // hidden input just to let them trigger custom when they want to click date picker directly if we want, but logic above is cleaner
                      <input type="date" style={{ colorScheme: 'dark' }} className="bg-transparent text-sm text-slate-200 outline-none ml-2 border-l border-white/10 pl-2" value={logDateFilter} onChange={(e) => {
                         setLogDateFilter(e.target.value);
                      }} />
                    )}
                  </div>
                  <button onClick={() => exportToCSV(dailyLogs, `Daily_Log_${logDateFilter}.csv`, ['created_at', 'employee_name', 'employee_role', 'activity', 'work_link', 'issue'], ['Waktu Kirim', 'Karyawan', 'Jabatan', 'Aktivitas', 'Link Kerja', 'Kendala'])} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center transition text-sm">
                    <Download className="w-4 h-4 mr-2" /> Download CSV
                  </button>
                  <button onClick={() => fetchDailyLogs(true)} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 rounded-xl flex items-center transition text-sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingLog ? 'animate-spin text-indigo-400' : ''}`} /> 
                    {isRefreshingLog ? 'Memuat...' : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                <table className="min-w-full divide-y divide-white/5">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase w-32">Waktu Kirim</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Karyawan</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Laporan / Aktivitas</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Lampiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dailyLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                          <ClipboardEdit className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-lg font-medium text-slate-300">Data Masih Kosong</p>
                          <p className="text-sm">
                            {logDateFilter === 'ALL' 
                              ? 'Belum ada data laporan sama sekali.' 
                              : `Belum ada karyawan yang menyetor laporan pada ${logDateFilter === new Date().toISOString().split('T')[0] ? 'hari ini' : 'tanggal ' + logDateFilter}.`}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      dailyLogs.map((log) => {
                        const time = new Date(log.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                        return (
                        <tr key={log.id} className="hover:bg-white/5 transition duration-200">
                          <td className="px-6 py-4 text-sm font-bold text-blue-300 whitespace-nowrap align-top">
                            {time}
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="text-sm font-bold text-slate-200">{log.employee_name}</div>
                            <div className="text-xs text-slate-500">{log.employee_role}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300 align-top">
                            <div className="whitespace-pre-wrap mb-1">{log.activity}</div>
                            {log.issue && (
                              <div className="mt-2 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2 rounded">
                                <span className="font-bold">Kendala:</span> {log.issue}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 align-top">
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
            </div>
            );
          })()}

          {/* TAB 5: IZIN & CUTI */}
          {activeTab === 'CUTI' && (() => {
            const filteredPending = pendingLeaves.filter(leave => leaveDateFilter === 'ALL' || (leave.created_at || '').split('T')[0] === leaveDateFilter);
            const filteredHistory = historyLeaves.filter(leave => leaveDateFilter === 'ALL' || (leave.created_at || '').split('T')[0] === leaveDateFilter);
            const paginatedPending = filteredPending.slice((getPage('CUTI_PENDING') - 1) * getLimit('CUTI_PENDING'), getPage('CUTI_PENDING') * getLimit('CUTI_PENDING'));
            const paginatedHistory = filteredHistory.slice((getPage('CUTI_HISTORY') - 1) * getLimit('CUTI_HISTORY'), getPage('CUTI_HISTORY') * getLimit('CUTI_HISTORY'));
            
            return (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white drop-shadow-md">Manajemen Izin & Cuti</h2>
                  <p className="text-slate-400 mt-1 text-sm">Persetujuan dan riwayat pengajuan izin/cuti karyawan.</p>
                </div>
                <div className="flex space-x-3 items-center">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Filter (Tgl Dibuat):</span>
                    <select 
                      className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
                      value={leaveDateFilter === 'ALL' ? 'ALL' : (leaveDateFilter === new Date().toISOString().split('T')[0] ? 'TODAY' : 'CUSTOM')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'ALL') setLeaveDateFilter('ALL');
                        else if (val === 'TODAY') setLeaveDateFilter(new Date().toISOString().split('T')[0]);
                      }}
                    >
                      <option className="bg-slate-800" value="ALL">Semua Waktu</option>
                      <option className="bg-slate-800" value="TODAY">Hari ini/Pilih Tanggal</option>
                    </select>
                    {leaveDateFilter !== 'ALL' && leaveDateFilter !== new Date().toISOString().split('T')[0] && (
                      <input type="date" style={{ colorScheme: 'dark' }} className="bg-transparent text-sm text-slate-200 outline-none ml-2 border-l border-white/10 pl-2" value={leaveDateFilter} onChange={(e) => setLeaveDateFilter(e.target.value)} />
                    )}
                    {leaveDateFilter === new Date().toISOString().split('T')[0] && (
                      <input type="date" style={{ colorScheme: 'dark' }} className="bg-transparent text-sm text-slate-200 outline-none ml-2 border-l border-white/10 pl-2" value={leaveDateFilter} onChange={(e) => setLeaveDateFilter(e.target.value)} />
                    )}
                  </div>
                  <button onClick={() => fetchLeaves(true)} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 rounded-xl flex items-center transition text-sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingLeave ? 'animate-spin text-indigo-400' : ''}`} /> 
                    {isRefreshingLeave ? 'Memuat...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {/* Pending Table */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden mb-6">
                <div className="bg-amber-500/10 px-6 py-4 border-b border-white/5">
                  <h3 className="font-bold text-amber-400 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Menunggu Persetujuan</h3>
                </div>
                <table className="min-w-full divide-y divide-white/5">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Karyawan</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Tgl Diajukan</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Jadwal Cuti/Izin</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Detail</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPending.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">{leaveDateFilter === 'ALL' ? 'Tidak ada pengajuan izin/cuti yang menunggu.' : `Tidak ada pengajuan izin/cuti pada tanggal ${leaveDateFilter}.`}</td></tr>
                    ) : (
                      paginatedPending.map(leave => {
                        const createdDate = new Date(leave.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
                        const createdTime = new Date(leave.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                        return (
                        <tr key={leave.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-200">{leave.employee_name}</div>
                            <div className="text-xs text-slate-500">{leave.leave_type}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div className="font-medium text-slate-200">{createdDate}</div>
                            <div className="text-xs text-slate-500">{createdTime}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {leave.start_date} <br/><span className="text-slate-500 text-xs">s.d</span><br/> {leave.end_date}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-300 mb-1">{leave.reason}</div>
                            {leave.attachment && (
                              <a href={`http://127.0.0.1:8000${leave.attachment}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center">
                                <Paperclip className="w-3 h-3 mr-1" /> Lihat Lampiran
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2 justify-center">
                              <button onClick={() => openApproveModal(leave)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2 rounded-lg transition" title="Setujui">
                                <Check className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleReject(leave.id)} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2 rounded-lg transition" title="Tolak">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table>
              </div>

              {/* History Table */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="bg-black/20 px-6 py-4 border-b border-white/5">
                  <h3 className="font-bold text-slate-300 flex items-center"><History className="w-5 h-5 mr-2" /> Riwayat Persetujuan</h3>
                </div>
                <table className="min-w-full divide-y divide-white/5">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Karyawan</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Tgl Diajukan</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Jadwal Cuti/Izin</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Dokumen HR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredHistory.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">{leaveDateFilter === 'ALL' ? 'Belum ada riwayat persetujuan.' : `Belum ada riwayat persetujuan pada tanggal ${leaveDateFilter}.`}</td></tr>
                    ) : (
                      paginatedHistory.map(leave => {
                        const createdDate = new Date(leave.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
                        const createdTime = new Date(leave.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                        return (
                        <tr key={leave.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-200">{leave.employee_name}</div>
                            <div className="text-xs text-slate-500">{leave.leave_type}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div className="font-medium text-slate-200">{createdDate}</div>
                            <div className="text-xs text-slate-500">{createdTime}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-300">{leave.start_date} - {leave.end_date}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {leave.status === 'APPROVED' ? (
                              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">DISETUJUI</span>
                            ) : (
                              <span className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/20">DITOLAK</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {leave.signed_attachment ? (
                              <a href={`http://127.0.0.1:8000${leave.signed_attachment}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-xs bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                <FileCheck className="w-3 h-3 mr-1" /> PDF HR
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
            </div>
            );
          })()}

          {/* TAB 6: KONTRAK & PKWT */}
          {activeTab === 'KONTRAK' && (() => {
            const pkwtEmployees = employeesList.filter(e => e.is_active && (e.contract_type === 'PKWT' || e.contract_type === 'INTERN'));
            const pkwttEmployees = employeesList.filter(e => e.is_active && (e.contract_type === 'PKWTT' || e.contract_type === 'FREELANCE'));
            
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const getStatus = (endDateStr) => {
              if (!endDateStr) return { label: 'Tidak Ada', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' };
              const endDate = new Date(endDateStr);
              const diffTime = endDate - today;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays < 0) return { label: 'Habis', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', textDays: `Lewat ${Math.abs(diffDays)} hari` };
              if (diffDays === 0) return { label: 'Segera Habis', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', textDays: `Hari ini terakhir` };
              if (diffDays <= 30) return { label: 'Segera Habis', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', textDays: `Sisa ${diffDays} hari` };
              return { label: 'Aman', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', textDays: `Sisa ${diffDays} hari` };
            };
            
            return (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white drop-shadow-md">Manajemen Kontrak & PKWT</h2>
                    <p className="text-slate-400 mt-1 text-sm">Monitor masa berlaku kontrak karyawan dan peringatan dini.</p>
                  </div>
                  <button onClick={() => fetchEmployees(true)} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2 rounded-xl flex items-center transition text-sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingEmp ? 'animate-spin text-indigo-400' : ''}`} /> 
                    {isRefreshingEmp ? 'Memuat...' : 'Refresh'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Total PKWT / Magang</h3>
                    <div className="text-4xl font-bold text-white">{pkwtEmployees.length}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                    <h3 className="text-slate-400 text-sm font-medium mb-2">Total Karyawan Tetap</h3>
                    <div className="text-4xl font-bold text-blue-300">{pkwttEmployees.length}</div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
                    <h3 className="text-amber-400/80 text-sm font-medium mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Perlu Perhatian</h3>
                    <div className="text-4xl font-bold text-amber-400">
                      {pkwtEmployees.filter(e => getStatus(e.contract_end_date).label !== 'Aman' && getStatus(e.contract_end_date).label !== 'Tidak Ada').length}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/5">
                    <h3 className="font-bold text-white">Daftar Kontrak Karyawan</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                      <thead className="bg-black/20">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Karyawan</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status Kontrak</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Periode</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Peringatan</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {paginatedContracts.map(emp => {
                          const status = getStatus(emp.contract_end_date);
                          return (
                            <tr key={emp.id} className="hover:bg-white/5 transition">
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-200">{emp.full_name}</div>
                                <div className="text-xs text-slate-500">{emp.nik}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${emp.contract_type === 'PKWT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : emp.contract_type === 'INTERN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                  {emp.contract_type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-300">
                                <div>Mulai: <span className="font-medium text-slate-200">{emp.join_date}</span></div>
                                {(emp.contract_type === 'PKWT' || emp.contract_type === 'INTERN') && (
                                  <div>Berakhir: <span className="font-medium text-slate-200">{emp.contract_end_date || '-'}</span></div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {(emp.contract_type === 'PKWT' || emp.contract_type === 'INTERN') ? (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                                    {status.label} {status.textDays && `(${status.textDays})`}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-xs">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => openEditEmployee(emp)} className="text-blue-400 hover:text-blue-300 text-xs bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-lg transition border border-blue-500/20">
                                  Perbarui
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination currentPage={getPage('KONTRAK')} totalPages={Math.ceil(activeContracts.length / getLimit('KONTRAK'))} rowsPerPage={getLimit('KONTRAK')} setPage={(p) => setPage('KONTRAK', p)} setRowsPerPage={(l) => setLimit('KONTRAK', l)} totalItems={activeContracts.length} />
                </div>
              </div>
            );
          })()}

        </main>
      </div>

      {/* MODAL APPROVE CUTI */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-xl font-bold text-white mb-2">Setujui Izin/Cuti</h2>
            <p className="text-sm text-slate-400 mb-6">Unggah dokumen persetujuan (PDF) yang sudah distempel HR. Opsional, namun sangat disarankan.</p>
            <form onSubmit={executeApprove} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Surat Persetujuan HR (PDF)</label>
                <input type="file" accept=".pdf" onChange={(e) => setSignedFile(e.target.files[0])} className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30" />
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => setShowApproveModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl transition font-medium">Batal</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl transition font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] flex justify-center items-center">
                  <CheckCircle className="w-5 h-5 mr-2" /> Setujui
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRUD KARYAWAN */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{isEditingEmp ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h2>
              <button onClick={() => setShowEmpModal(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">NIK</label>
                  <input required type="text" className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none" value={empForm.nik} onChange={e=>setEmpForm({...empForm, nik: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Nama Lengkap</label>
                  <input required type="text" className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none" value={empForm.full_name} onChange={e=>setEmpForm({...empForm, full_name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Jabatan / Role</label>
                  <input required type="text" className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none" value={empForm.role} onChange={e=>setEmpForm({...empForm, role: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">No. WhatsApp</label>
                  <input required type="text" className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none" value={empForm.whatsapp_number} onChange={e=>setEmpForm({...empForm, whatsapp_number: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Jenis Kelamin</label>
                  <select className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none" value={empForm.gender} onChange={e=>setEmpForm({...empForm, gender: e.target.value})}>
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Tanggal Masuk (Join Date)</label>
                  <input required type="date" style={{ colorScheme: 'dark' }} className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none" value={empForm.join_date} onChange={e=>setEmpForm({...empForm, join_date: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Jenis Kontrak</label>
                  <select className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none" value={empForm.contract_type} onChange={e=>setEmpForm({...empForm, contract_type: e.target.value})}>
                    <option value="PKWT">PKWT (Kontrak)</option>
                    <option value="PKWTT">PKWTT (Tetap)</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="INTERN">Magang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Tanggal Berakhir Kontrak</label>
                  <input type="date" style={{ colorScheme: 'dark' }} className="w-full bg-black/30 border border-white/10 text-slate-200 rounded-xl p-3 outline-none disabled:opacity-50" value={empForm.contract_end_date || ''} onChange={e=>setEmpForm({...empForm, contract_end_date: e.target.value})} disabled={empForm.contract_type === 'PKWTT' || empForm.contract_type === 'FREELANCE'} />
                </div>
              </div>
              
              <div className="flex items-center mt-4">
                <input type="checkbox" id="isActive" checked={empForm.is_active} onChange={e=>setEmpForm({...empForm, is_active: e.target.checked})} className="w-4 h-4 bg-black/30 border border-white/10 rounded" />
                <label htmlFor="isActive" className="ml-2 text-sm text-slate-300">Karyawan Aktif (Soft Delete)</label>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition mt-6">
                Simpan Karyawan
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;














