import React, { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import api from '../utils/api';

const IzinCutiPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  });

  const fetchRequests = async () => {
    try {
      const res = await api.get('/leave/my-requests/');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const minDate = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await api.post('/leave/request/', formData);
      setMessage({ type: 'success', text: 'Pengajuan izin berhasil dikirim.' });
      setFormData({ start_date: '', end_date: '', reason: '' });
      fetchRequests();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal mengajukan izin.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Disetujui</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Ditolak</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Pengajuan Izin/Cuti</h2>
        
        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              className="w-full border border-gray-300 rounded-md p-2"
            />
            <p className="text-xs text-gray-500 mt-1">Minimal pengajuan H-2</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              min={formData.start_date || minDate}
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alasan / Keterangan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows="3"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full border border-gray-300 rounded-md p-2"
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Mengajukan...' : 'Ajukan Izin'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Riwayat Pengajuan</h3>
        {loading ? (
          <p className="text-gray-500 text-sm">Memuat riwayat...</p>
        ) : requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req, i) => (
              <div key={i} className="p-3 border rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium">
                    {req.start_date} s/d {req.end_date}
                  </div>
                  {getStatusBadge(req.status)}
                </div>
                <p className="text-xs text-gray-600">{req.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Belum ada riwayat izin/cuti.</p>
        )}
      </div>
    </div>
  );
};

export default IzinCutiPage;

