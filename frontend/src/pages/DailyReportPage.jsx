import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';

const DailyReportPage = () => {
  const { user } = useAuth();
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  // Crew Gudang tidak perlu daily report
  if (user?.role === 'CREW_GUDANG') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Laporan Harian</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">Role Crew Gudang tidak memerlukan Daily Report.</p>
        </div>
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
      setMessage({ type: 'success', text: 'Laporan harian berhasil dikirim!' });
      setReportText('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim laporan.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Laporan Harian</h2>

      {message && (
        <div className={`rounded-xl p-4 text-sm border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kegiatan Hari Ini <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={7}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Ceritakan aktivitas atau pekerjaan yang Anda lakukan hari ini..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{reportText.length} karakter</p>
          </div>

          <button
            type="submit"
            disabled={submitting || !reportText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Mengirim...
              </span>
            ) : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DailyReportPage;
