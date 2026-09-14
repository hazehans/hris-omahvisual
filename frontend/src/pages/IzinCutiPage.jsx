import React, { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import api from '../utils/api';
import { Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  APPROVED: { label: 'Disetujui', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECTED: { label: 'Ditolak', className: 'bg-red-100 text-red-700', icon: XCircle },
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
};

const IzinCutiPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({ start_date: '', end_date: '', reason: '' });

  const minDate = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  const fetchRequests = async () => {
    try {
      const res = await api.get('/leave/my-requests/');
      const data = res.data?.data ?? res.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date || !formData.reason.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await api.post('/leave/request/', formData);
      setMessage({ type: 'success', text: 'Pengajuan izin berhasil dikirim.' });
      setFormData({ start_date: '', end_date: '', reason: '' });
      fetchRequests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengajukan izin.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key, label, type = 'text', extra = {}) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      {type === 'textarea' ? (
        <textarea
          required rows={3}
          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          {...extra}
        />
      ) : (
        <input
          type={type} required
          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData[key]}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          {...extra}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Izin / Cuti</h2>

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Pengajuan Baru</h3>

        {message && (
          <div className={`rounded-xl p-3 text-sm mb-4 border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('start_date', 'Tanggal Mulai', 'date', { min: minDate })}
          {field('end_date', 'Tanggal Selesai', 'date', {
            min: formData.start_date || minDate,
          })}
          {field('reason', 'Alasan / Keterangan', 'textarea')}

          <p className="text-xs text-gray-400">* Pengajuan minimal H-2 dari tanggal pelaksanaan.</p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {submitting
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Mengajukan...</span>
              : 'Ajukan Izin'}
          </button>
        </form>
      </div>

      {/* Riwayat */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Riwayat Pengajuan</h3>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Belum ada riwayat izin/cuti.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req, i) => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
              const Icon = cfg.icon;
              return (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {req.start_date} s/d {req.end_date}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.className}`}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{req.reason}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IzinCutiPage;
