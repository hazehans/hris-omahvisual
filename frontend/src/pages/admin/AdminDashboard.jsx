import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Karyawan Aktif</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Hadir Hari Ini</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Izin / Cuti Pending</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">--</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Attendance</h3>
        <p className="text-sm text-gray-500">Tabel live attendance akan ditampilkan di sini.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;

