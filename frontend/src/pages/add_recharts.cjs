const fs = require('fs');
let code = fs.readFileSync('Dashboard.jsx', 'utf8');

// 1. Import recharts
code = code.replace(
    "import React, { useEffect, useState } from 'react';", 
    "import React, { useEffect, useState } from 'react';\nimport { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';"
);

// 2. Add state for analytics
code = code.replace(
    "const [dailyLogs, setDailyLogs] = useState([]);",
    "const [dailyLogs, setDailyLogs] = useState([]);\n  const [analytics, setAnalytics] = useState({ chart_data: [], top_lates: [] });"
);

// 3. Add fetchAnalytics function
const fetchCode = `
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://127.0.0.1:8000/api/v1/attendance/analytics/', { headers: { Authorization: \`Bearer \${token}\` }});
      setAnalytics(res.data);
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    }
  };
`;
code = code.replace("const fetchAttendance = async", fetchCode + "\n  const fetchAttendance = async");

// 4. Add to useEffect
code = code.replace(
    "fetchAttendance(); fetchLeaves(); fetchEmployees(); fetchDailyLogs();",
    "fetchAttendance(); fetchLeaves(); fetchEmployees(); fetchDailyLogs(); fetchAnalytics();"
);

// 5. Add UI logic
const chartUI = `
              {/* Analytics Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl h-fit">
                  <h3 className="text-white font-bold mb-4">Tren Kehadiran (Bulan Ini)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.split('-')[2]} />
                        <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20', borderRadius: '12px' }} 
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Line type="monotone" name="Hadir Tepat Waktu" dataKey="hadir" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" name="Terlambat" dataKey="terlambat" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="md:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl h-fit">
                  <h3 className="text-white font-bold mb-4">Top 5 Karyawan Terlambat</h3>
                  {analytics.top_lates && analytics.top_lates.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.top_lates.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 text-xs flex items-center justify-center font-bold mr-3">{idx + 1}</div>
                            <span className="text-sm font-medium text-slate-200">{item.name}</span>
                          </div>
                          <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded text-xs">{item.late_count}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
                      <span className="text-2xl mb-2">🏆</span>
                      <p>Luar biasa!</p>
                      <p>Semua karyawan disiplin bulan ini.</p>
                    </div>
                  )}
                </div>
              </div>
`;

// Insert after the Widget Ulang Tahun row (search for </ResponsiveContainer> logic or the closing div of md:col-span-4)
// The layout is currently:
// <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"> ... </div>
const oldGridEnd = 'Tidak ada yang berulang tahun bulan ini\n                    </div>\n                  )}\n                </div>\n              </div>';
code = code.replace(oldGridEnd, oldGridEnd + '\n' + chartUI);

fs.writeFileSync('Dashboard.jsx', code);
console.log('Success');
