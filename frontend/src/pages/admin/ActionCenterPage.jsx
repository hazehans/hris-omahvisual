import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../utils/api';

const ActionCenterPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/leave/admin/pending/');
      const data = res.data?.data ?? res.data;
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to fetch pending requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleReview = async (id, status) => {
    try {
      await api.patch(`/leave/admin/review/${id}/`, { status });
      // Remove from list
      setRequests(requests.filter(req => req.id !== id));
    } catch (err) {
      alert('Gagal memproses pengajuan.');
      console.error(err);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-xl"></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Menunggu Persetujuan</h3>
        <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
          {requests.length} Pending
        </span>
      </div>
      
      {requests.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p>Tidak ada pengajuan izin/cuti yang menunggu.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map((req) => (
            <div key={req.id} className="p-6 hover:bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-800">{req.employee_name}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{req.leave_type}</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  <Clock size={14} className="inline mr-1" />
                  {req.start_date} s/d {req.end_date} ({req.duration_days} hari)
                </p>
                <p className="text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-100 inline-block">
                  <span className="font-semibold text-xs text-gray-400 block mb-1">Alasan:</span>
                  {req.reason}
                </p>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleReview(req.id, 'APPROVED')}
                  className="flex-1 md:flex-none bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Approve
                </button>
                <button
                  onClick={() => handleReview(req.id, 'REJECTED')}
                  className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionCenterPage;

