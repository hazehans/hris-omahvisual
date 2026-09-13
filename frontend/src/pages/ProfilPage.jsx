import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ProfilPage = () => {
  const { user, logout } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await api.get('/contracts/my-contract/');
        setContract(res.data);
      } catch (err) {
        console.error('Failed to fetch contract info', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user?.username}</h2>
            <p className="text-gray-500">{user?.role}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-3">Informasi Akun</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Username</span>
              <span className="font-medium text-gray-800">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="font-medium text-gray-800">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-3">Informasi Kontrak</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : contract ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tipe Kontrak</span>
              <span className="font-medium text-gray-800">{contract.contract_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal Mulai</span>
              <span className="font-medium text-gray-800">{contract.start_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal Berakhir</span>
              <span className="font-medium text-gray-800">{contract.end_date}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Tidak ada informasi kontrak aktif.</p>
        )}
      </div>

      <button
        onClick={logout}
        className="w-full bg-red-50 text-red-600 py-3 rounded-md font-medium border border-red-100 hover:bg-red-100"
      >
        Keluar (Logout)
      </button>
    </div>
  );
};

export default ProfilPage;

