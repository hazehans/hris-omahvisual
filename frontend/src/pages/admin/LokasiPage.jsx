import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const LokasiPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const initialForm = {
    id: '', name: '', location_type: 'CUSTOM', latitude: '', longitude: '', radius_meter: 100, is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees/locations/');
      const data = res.data?.data ?? res.data;
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch locations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const openAddModal = () => {
    setFormData(initialForm);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (loc) => {
    setFormData({ ...loc });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditMode) {
        await api.put(`/employees/locations/${formData.id}/`, formData);
      } else {
        await api.post('/employees/locations/', formData);
      }
      setIsModalOpen(false);
      fetchLocations();
    } catch (err) {
      alert('Gagal menyimpan lokasi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Titik Lokasi Absensi</h2>
          <p className="text-sm text-gray-500">Atur koordinat pusat (Geofencing) untuk absen dari kantor/gudang.</p>
        </div>
        <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> Tambah Lokasi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
            Belum ada titik lokasi yang diatur. Absensi WFO karyawan akan gagal karena sistem tidak memiliki titik pusat untuk menghitung jarak.
          </div>
        ) : (
          locations.map(loc => (
            <div key={loc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="mt-1 w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{loc.name}</h3>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    <p>Tipe: <span className="font-semibold text-gray-700">{loc.location_type}</span></p>
                    <p>Lat: <span className="font-mono text-gray-700">{loc.latitude}</span></p>
                    <p>Lng: <span className="font-mono text-gray-700">{loc.longitude}</span></p>
                    <p>Radius toleransi: <span className="font-semibold text-gray-700">{loc.radius_meter} meter</span></p>
                  </div>
                  {!loc.is_active && <span className="mt-2 inline-block bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs">Nonaktif</span>}
                </div>
              </div>
              <button onClick={() => openEditModal(loc)} className="text-gray-400 hover:text-blue-600 transition-colors p-2">
                <Edit2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{isEditMode ? 'Edit Lokasi' : 'Tambah Lokasi'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form id="location-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lokasi (ex: Kantor Pusat)</label>
                <input 
                  required className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipe Lokasi</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500"
                  value={formData.location_type} onChange={(e) => setFormData({...formData, location_type: e.target.value})}
                >
                  <option value="CV_LED">Kantor CV / Gudang LED</option>
                  <option value="RENTAL">Toko Rental</option>
                  <option value="CUSTOM">Lainnya / Kustom</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Latitude</label>
                  <input 
                    type="number" step="any" required
                    placeholder="-6.123456"
                    className="w-full font-mono border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Longitude</label>
                  <input 
                    type="number" step="any" required
                    placeholder="106.123456"
                    className="w-full font-mono border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Radius Toleransi (Meter)</label>
                <input 
                  type="number" required min="10"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.radius_meter} onChange={(e) => setFormData({...formData, radius_meter: parseInt(e.target.value)})}
                />
                <p className="text-xs text-gray-400 mt-1">Disarankan: 50 - 150 meter.</p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} />
                <label htmlFor="is_active" className="text-sm text-gray-700">Lokasi Aktif</label>
              </div>
            </form>
            
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl">Batal</button>
              <button type="submit" form="location-form" disabled={submitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LokasiPage;

