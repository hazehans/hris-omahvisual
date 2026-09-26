import re
with open('Dashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add state for raw logs
code = code.replace(
    'const [logs, setLogs] = useState([]);',
    'const [logs, setLogs] = useState([]);\n    const [rawLogs, setRawLogs] = useState([]);'
)

# 2. Add fetchRawLogs
code = code.replace(
    'const fetchAttendance = async () => {',
    '''const fetchRawLogs = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://127.0.0.1:8000/api/v1/attendance/raw-events/', { headers: { Authorization: `Bearer ${token}` } });
        setRawLogs(res.data);
      } catch (e) {}
    };

    const fetchAttendance = async () => {'''
)

# 3. Call it in useEffect
code = code.replace(
    'fetchAttendance(); fetchLeaves(); fetchEmployees(); fetchDailyLogs(); fetchAnalytics();',
    'fetchAttendance(); fetchLeaves(); fetchEmployees(); fetchDailyLogs(); fetchAnalytics(); fetchRawLogs();'
)

# 4. Add to refresh button (Live Absensi)
code = code.replace(
    'fetchAttendance(); // refresh the table',
    'fetchAttendance(); fetchRawLogs();'
)

# 5. Add TAB in navItems
code = code.replace(
    "{ id: 'ABSENSI', label: 'Live Absensi', icon: CalendarCheck },",
    "{ id: 'ABSENSI', label: 'Live Absensi', icon: CalendarCheck },\n      { id: 'RAW_LOGS', label: 'Raw Event Log', icon: FileText },"
)

# 6. Add pagination state
code = code.replace(
    'ABSENSI: { p: 1, l: 10 },',
    'ABSENSI: { p: 1, l: 10 },\n      RAW_LOGS: { p: 1, l: 10 },'
)

# 7. Add UI Block for RAW_LOGS
raw_logs_ui = """
          {/* TAB: RAW LOGS */}
          {activeTab === 'RAW_LOGS' && (() => {
            const paginatedRaw = rawLogs.slice((getPage('RAW_LOGS') - 1) * getLimit('RAW_LOGS'), getPage('RAW_LOGS') * getLimit('RAW_LOGS'));
            return (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white drop-shadow-md">Raw Event Log (Mesin Hikvision)</h2>
                  <p className="text-slate-400 mt-1 text-sm">Arsip mentah semua log dari mesin (termasuk yang tidak valid/ditolak).</p>
                </div>
                <button 
                  onClick={async () => {
                    fetchRawLogs();
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transition"
                >
                  <RefreshCw className="w-4 h-4 inline-block mr-2" />
                  Refresh Tabel
                </button>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-black/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Waktu Mesin</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Serial No</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Major/Minor</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Employee No</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedRaw.map((log, idx) => {
                        const isSuccess = log.major === 5 && log.minor === 1;
                        return (
                        <tr key={idx} className="hover:bg-white/5 transition duration-200">
                          <td className="px-6 py-4 text-sm text-slate-200">{log.event_time_raw}</td>
                          <td className="px-6 py-4 text-sm text-slate-400">#{log.serial_no}</td>
                          <td className="px-6 py-4 text-sm font-mono text-slate-300">M:{log.major} / m:{log.minor}</td>
                          <td className="px-6 py-4 text-sm">
                            {log.employee_no ? <span className="font-bold text-indigo-400">{log.employee_no} ({log.name_on_device})</span> : <span className="text-slate-600 italic">Unknown</span>}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {isSuccess ? <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold">SUCCESS</span> : <span className="px-2 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs">INVALID</span>}
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4">
                <TablePagination currentPage={getPage('RAW_LOGS')} totalPages={Math.ceil(rawLogs.length / getLimit('RAW_LOGS'))} rowsPerPage={getLimit('RAW_LOGS')} setPage={(p) => setPage('RAW_LOGS', p)} setRowsPerPage={(l) => setLimit('RAW_LOGS', l)} totalItems={rawLogs.length} />
              </div>
            </div>
            );
          })()}
"""

code = code.replace(
    "{/* TAB 4: DAILY LOG */}",
    raw_logs_ui + "\n          {/* TAB 4: DAILY LOG */}"
)

with open('Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Patcher Success")
