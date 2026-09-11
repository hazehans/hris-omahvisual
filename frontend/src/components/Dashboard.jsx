import React, { useState } from 'react';

const Dashboard = ({ user, onLogout }) => {
  const [report, setReport] = useState('');

  // Tentukan field berdasarkan role sesuai PRD
  const isKaryawanCV = user.role === 'Karyawan CV';
  const isKaryawanRental = user.role === 'Karyawan Rental' || user.role === 'Magang' || user.role === 'Staff';
  const isCrew = user.role === 'Crew';

  const needsPhoto = isKaryawanRental || isCrew || isKaryawanCV; // CV opsional, yang lain wajib
  const needsDailyReport = isKaryawanCV || isKaryawanRental;

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit attendance & photo & daily report to GAS
    alert('Data absensi berhasil disimpan!');
  };

  return (
    <div className="dashboard-container">
      <header>
        <h2>Dashboard Karyawan</h2>
        <p>Selamat datang, {user.username} ({user.role})</p>
        <button onClick={onLogout}>Logout</button>
      </header>

      <section className="form-section">
        <h3>Formulir Kehadiran & Laporan Harian</h3>
        <form onSubmit={handleSubmit}>
          
          {/* GEOLOCATION - Required for CV and Rental/Magang/Staff */}
          {(isKaryawanCV || isKaryawanRental) && (
            <div className="form-group">
              <label>Status Geolokasi (Geofencing)</label>
              <div className="geo-status success">
                📍 Lokasi Ditemukan (Dalam Jarak Aman)
              </div>
            </div>
          )}

          {/* FOTO - Mandatory for Crew & Rental, Optional for CV */}
          {needsPhoto && (
            <div className="form-group">
              <label>Bukti Foto (Strictly Live Camera) {isKaryawanCV ? '(Opsional)' : '*'}</label>
              <input type="file" accept="image/*" capture="user" required={!isKaryawanCV} />
            </div>
          )}

          {/* DAILY REPORT - Textarea */}
          {needsDailyReport && (
            <div className="form-group">
              <label>Daily Report / Rencana Pekerjaan *</label>
              <textarea 
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Tuliskan laporan harian atau rencana pekerjaan hari ini..."
                required
              />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-masuk">Absen Masuk</button>
            <button type="submit" className="btn-pulang">Absen Pulang</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Dashboard;

