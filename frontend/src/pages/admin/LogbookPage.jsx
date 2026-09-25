import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Search, Clock } from 'lucide-react';
import api from '../../utils/api';

const LogbookPage = () => {
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('submitted'); // 'submitted' or 'not_submitted'

  const fetchLogbook = async (date) => {
    setLoading(true);
    try {
      const res = await api.get(`/daily-report/admin/?date=${date}`);
      setData(res.data?.data ?? res.data);
    } catch (err) {
      console.error('Failed to fetch logbook', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogbook(dateStr);
  }, [dateStr]);

  const reports = data?.reports || [];
  const notSubmitted = data?.not_submitted_employees || [];

  const filteredReports = reports.filter(r => 
    r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotSubmitted = notSubmitted.filter(e => 
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Logbook Harian</h2>
          <p className="text-sm text-gray-500">Pantau laporan kerja harian (Daily Report) karyawan.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="date" 
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
          <button 
            onClick={() => fetchLogbook(dateStr)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Tampilkan
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sudah Lapor</p>
            <p className="text-2xl font-bold text-gray-800">{data?.total_submitted || 0} <span className="text-sm font-normal text-gray-400">Orang</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Belum Lapor</p>
            <p className="text-2xl font-bold text-gray-800">{data?.total_not_submitted || 0} <span className="text-sm font-normal text-gray-400">Orang</span></p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Tabs & Search */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('submitted')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'submitted' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Laporan Masuk ({reports.length})
            </button>
            <button 
              onClick={() => setActiveTab('not_submitted')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'not_submitted' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Belum Mengisi ({notSubmitted.length})
            </button>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari karyawan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="p-0">
            {activeTab === 'submitted' && (
              <div className="divide-y divide-gray-100">
                {filteredReports.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Tidak ada laporan yang sesuai pencarian.</div>
                ) : (
                  filteredReports.map((r) => (
                    <div key={r.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                          {r.employee_name.charAt(0)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-gray-800">{r.employee_name}</h4>
                              <p className="text-xs text-gray-500">{r.role_display} {r.department ? `• ${r.department}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                              <Clock size={12} />
                              {new Date(r.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                            {r.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'not_submitted' && (
              <div className="p-2">
                {filteredNotSubmitted.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Semua karyawan wajib sudah mengisi laporan.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                    {filteredNotSubmitted.map((e) => (
                      <div key={e.id} className="border border-red-100 bg-red-50/30 p-4 rounded-xl flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold">
                          {e.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{e.full_name}</p>
                          <p className="text-xs text-gray-500">{e.role} {e.department ? `• ${e.department}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogbookPage;
