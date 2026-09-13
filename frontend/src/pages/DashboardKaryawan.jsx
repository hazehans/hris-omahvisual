import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const DashboardKaryawan = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayStatus = async () => {
      try {
        const res = await api.get('/attendance/today/');
        setTodayStatus(res.data);
      } catch (err) {
        console.error('Failed to fetch today status', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayStatus();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Halo, {user?.username}</h2>
        <p className="text-gray-500 text-sm">Role: {user?.role}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Status Absensi Hari Ini</h3>
        {todayStatus ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Jam Masuk</span>
              <span className="font-medium">{todayStatus.clock_in_time || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Jam Pulang</span>
              <span className="font-medium">{todayStatus.clock_out_time || '-'}</span>
            </div>
            <div className="mt-6 flex gap-3">
              {!todayStatus.clock_in_time && (
                <Link to="/absensi" className="flex-1 bg-blue-600 text-white text-center py-2 rounded-md font-medium hover:bg-blue-700">
                  Clock In
                </Link>
              )}
              {todayStatus.clock_in_time && !todayStatus.clock_out_time && (
                <Link to="/absensi" className="flex-1 bg-red-600 text-white text-center py-2 rounded-md font-medium hover:bg-red-700">
                  Clock Out
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 mb-4">Belum ada data absensi untuk hari ini.</p>
            <Link to="/absensi" className="block w-full bg-blue-600 text-white text-center py-2 rounded-md font-medium hover:bg-blue-700">
              Clock In Sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardKaryawan;

