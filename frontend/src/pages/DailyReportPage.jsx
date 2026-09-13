import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DailyReportPage = () => {
  const { user } = useAuth();
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Requirement: Crew doesn't have daily report
  if (user?.role === 'CREW_GUDANG') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500">Role Anda (CREW) tidak memerlukan Daily Report.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    
    setSubmitting(true);
    setMessage(null);

    try {
      await api.post('/daily-report/', { report: reportText });
      setMessage({ type: 'success', text: 'Daily report berhasil dikirim!' });
      setReportText(''); // reset
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal mengirim report.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Laporan Harian (Daily Report)</h2>
        
        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kegiatan Hari Ini <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows="6"
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ceritakan aktivitas atau pekerjaan yang Anda lakukan hari ini..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={submitting || !reportText.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DailyReportPage;

