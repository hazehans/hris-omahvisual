import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, CalendarDays, FileText } from 'lucide-react';
import api from '../../utils/api';

const AdminDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, leavesRes] = await Promise.all([
          api.get('/attendance/admin/summary/'),
          api.get('/leave/admin/pending/')
        ]);
        
        setSummary(summaryRes.data?.data ?? summaryRes.data);
        
        const leavesData = leavesRes.data?.data ?? leavesRes.data;
        setPendingLeaves(leavesData.total_pending || 0);
      } catch (err) {
        console.error('Failed to fetch admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Karyawan Aktif</h3>
            <p className="text-3xl font-bold text-gray-800">{summary?.total_active_employees || 0}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Users size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Hadir Hari Ini</h3>
            <p className="text-3xl font-bold text-green-600">{summary?.present || 0}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl text-green-600">
            <UserCheck size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Izin / Cuti Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingLeaves}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-xl text-yellow-600">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Detailed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" /> Live Attendance Hari Ini
            </h3>
          </div>
          <div className="p-0">
            {summary?.attendance_logs?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada absensi hari ini.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {summary?.attendance_logs?.map((log, i) => (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{log.employee_name}</p>
                      <p className="text-xs text-gray-500">{log.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{log.clock_in}</p>
                      <p className="text-xs text-gray-400">{log.clock_out ? `Pulang: ${log.clock_out}` : 'Masih Bekerja'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Absent / Tidak Hadir */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <CalendarDays size={16} className="text-red-500" /> Karyawan Belum Hadir / Absen
            </h3>
          </div>
          <div className="p-0">
            {summary?.absent_employees?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Semua karyawan hadir hari ini.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {summary?.absent_employees?.map((emp, i) => (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{emp.full_name}</p>
                      <p className="text-xs text-gray-500">{emp.department} • {emp.role}</p>
                    </div>
                    <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                      Belum Absen
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;