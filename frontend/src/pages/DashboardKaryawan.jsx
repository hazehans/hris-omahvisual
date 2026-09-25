import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

const ROLE_LABELS = {
  CV_KARYAWAN: 'Karyawan CV',
  CV_INTERN: 'Intern CV',
  CV_MAGANG: 'Magang CV',
  LED_KARYAWAN: 'Karyawan LED',
  LED_INTERN: 'Intern LED',
  LED_MAGANG: 'Magang LED',
  RENTAL_KARYAWAN: 'Karyawan Rental',
  RENTAL_MAGANG: 'Magang Rental',
  RENTAL_STAFF: 'Staff Rental',
  CREW_GUDANG: 'Crew Gudang',
  ADMIN_HR: 'Admin HR',
};

const DashboardKaryawan = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTodayStatus = async () => {
      try {
        const res = await api.get('/attendance/today/');
        // Response: { status: 'success', data: {...} } or bare
        const data = res.data?.data ?? res.data;
        setTodayStatus(data);
      } catch (err) {
        // 404 means no attendance today → that's fine
        if (err.response?.status !== 404) {
          setError('Gagal memuat status absensi.');
        }
        setTodayStatus(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayStatus();
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hasClockIn = !!todayStatus?.clock_in_time;
  const hasClockOut = !!todayStatus?.clock_out_time;

  return (
    <div className="space-y-4">
      {/* Greeting Card */}
      <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-sm">
        <p className="text-blue-200 text-sm">{dateStr}</p>
        <h2 className="text-2xl font-bold mt-1">Halo, {user?.full_name || user?.username}!</h2>
        <p className="text-blue-200 text-sm mt-1">{ROLE_LABELS[user?.role] || user?.role}</p>
      </div>

      {/* Status Absensi */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-blue-600" />
          Status Absensi Hari Ini
        </h3>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="space-y-3">
            {/* Jam Masuk */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${hasClockIn ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                {hasClockIn
                  ? <CheckCircle size={20} className="text-green-500" />
                  : <AlertCircle size={20} className="text-gray-400" />}
                <span className="text-sm font-medium text-gray-700">Jam Masuk</span>
              </div>
              <span className={`text-sm font-semibold ${hasClockIn ? 'text-green-700' : 'text-gray-400'}`}>
                {todayStatus?.clock_in_time ?? '—'}
              </span>
            </div>

            {/* Jam Pulang */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${hasClockOut ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                {hasClockOut
                  ? <CheckCircle size={20} className="text-green-500" />
                  : <AlertCircle size={20} className="text-gray-400" />}
                <span className="text-sm font-medium text-gray-700">Jam Pulang</span>
              </div>
              <span className={`text-sm font-semibold ${hasClockOut ? 'text-green-700' : 'text-gray-400'}`}>
                {todayStatus?.clock_out_time ?? '—'}
              </span>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              {!hasClockIn && (
                <Link
                  to="/absensi"
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Clock In Sekarang <ArrowRight size={16} />
                </Link>
              )}
              {hasClockIn && !hasClockOut && (
                <Link
                  to="/absensi"
                  className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Clock Out <ArrowRight size={16} />
                </Link>
              )}
              {hasClockIn && hasClockOut && (
                <div className="text-center text-sm text-green-600 font-medium py-2">
                  ✓ Absensi hari ini sudah lengkap
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/daily-report"
          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-colors"
        >
          <p className="text-xs text-gray-500 mb-1">Laporan</p>
          <p className="text-sm font-semibold text-gray-800">Daily Report</p>
        </Link>
        <Link
          to="/izin-cuti"
          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-colors"
        >
          <p className="text-xs text-gray-500 mb-1">Pengajuan</p>
          <p className="text-sm font-semibold text-gray-800">Izin / Cuti</p>
        </Link>
      </div>
    </div>
  );
};

export default DashboardKaryawan;
