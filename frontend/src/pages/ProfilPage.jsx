import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { LogOut, FileText, Shield } from 'lucide-react';

const ROLE_LABELS = {
  CV_KARYAWAN: 'Karyawan CV', CV_INTERN: 'Intern CV', CV_MAGANG: 'Magang CV',
  LED_KARYAWAN: 'Karyawan LED', LED_INTERN: 'Intern LED', LED_MAGANG: 'Magang LED',
  RENTAL_KARYAWAN: 'Karyawan Rental', RENTAL_MAGANG: 'Magang Rental', RENTAL_STAFF: 'Staff Rental',
  CREW_GUDANG: 'Crew Gudang', ADMIN_HR: 'Admin HR',
};

const ProfilPage = () => {
  const { user, logout } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/contracts/my-contract/')
      .then((res) => setContract(res.data?.data ?? res.data))
      .catch(() => setContract(null))
      .finally(() => setLoading(false));
  }, []);

  const initials = (user?.full_name || user?.username || '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-4">
      {/* Avatar + name */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
          {initials}
        </div>
        <h2 className="text-xl font-bold">{user?.full_name || user?.username}</h2>
        <p className="text-blue-200 text-sm mt-1">{ROLE_LABELS[user?.role] || user?.role}</p>
      </div>

      {/* Info Akun */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Shield size={14} /> Informasi Akun
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-500">Username</span>
            <span className="font-medium text-gray-800">{user?.username}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">Role</span>
            <span className="font-medium text-gray-800">{ROLE_LABELS[user?.role] || user?.role}</span>
          </div>
        </div>
      </div>

      {/* Info Kontrak */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <FileText size={14} /> Informasi Kontrak
        </h3>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-3/4" />
            <div className="h-5 bg-gray-100 rounded w-1/2" />
          </div>
        ) : contract ? (
          <div className="space-y-2 text-sm">
            {[
              ['Tipe Kontrak', contract.contract_type],
              ['Mulai', contract.start_date],
              ['Berakhir', contract.end_date],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">{value || '—'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Tidak ada kontrak aktif yang ditemukan.</p>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors"
      >
        <LogOut size={16} /> Keluar
      </button>
    </div>
  );
};

export default ProfilPage;
