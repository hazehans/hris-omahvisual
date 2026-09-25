import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const ROLE_OPTIONS = [
  { value: 'CV_KARYAWAN', label: 'Karyawan CV' },
  { value: 'CV_INTERN', label: 'Intern CV' },
  { value: 'CV_MAGANG', label: 'Magang CV' },
  { value: 'LED_KARYAWAN', label: 'Karyawan LED' },
  { value: 'LED_INTERN', label: 'Intern LED' },
  { value: 'LED_MAGANG', label: 'Magang LED' },
  { value: 'RENTAL_KARYAWAN', label: 'Karyawan Rental' },
  { value: 'RENTAL_MAGANG', label: 'Magang Rental' },
  { value: 'RENTAL_STAFF', label: 'Staff Rental' },
  { value: 'CREW_GUDANG', label: 'Crew Gudang' },
  { value: 'ADMIN_HR', label: 'Admin HR' },
];

const KaryawanPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const initialForm = {
    id: '', username: '', password: '', full_name: '', nik: '',
    role: 'CV_KARYAWAN', department: '', phone: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees/');
      const data = res.data?.data ?? res.data;
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openAddModal = () => {
    setFormData(initialForm);
    setIsEditMode(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setErrorMsg(null);
    setIsEditMode(true);
    setIsModalOpen(true);
    try {
      const res = await api.get(`/employees/${id}/`);
      const emp = res.data?.data ?? res.data;
      setFormData({
        id: emp.id,
        username: emp.username || '',
        password: '', // Password tidak diedit dari sini
        full_name: emp.full_name || '',
        nik: emp.nik || '',
        role: emp.role || 'CV_KARYAWAN',
        department: emp.department || '',
        phone: emp.phone || ''
      });
    } catch (err) {
      alert('Gagal mengambil data karyawan.');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menonaktifkan / menghapus ${name}?`)) return;
    try {
      await api.delete(`/employees/${id}/`);
      fetchEmployees();
    } catch (err) {
      alert('Gagal menghapus karyawan.');
    }
  };

  const handleResetDevice = async (id, name) => {
    if (!window.confirm(`Yakin ingin me-reset Device ID untuk ${name}? Karyawan akan diminta login ulang dari perangkat barunya.`)) return;
    try {
      await api.patch(`/auth/reset-device/${id}/`);
      alert(`Device ID untuk ${name} berhasil di-reset!`);
    } catch (err) {
      alert('Gagal me-reset Device ID.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const payload = { ...formData };
    if (isEditMode) {
      if (!payload.password) {
        delete payload.password; // Jangan kirim password kosong saat edit
      }
    }

    try {
      if (isEditMode) {
        await api.put(`/employees/${payload.id}/`, payload);
      } else {
        await api.post('/employees/', payload);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      // Handle Django Rest Framework validation errors
      const errors = err.response?.data?.errors || err.response?.data;
      if (typeof errors === 'object' && errors !== null) {
        const msgs = Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(', ');
        setErrorMsg(msgs || 'Terjadi kesalahan saat menyimpan data.');
      } else {
        setErrorMsg('Gagal menyimpan data.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-xl"></div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Master Karyawan</h2>
        <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus size={16} /> Tambah Karyawan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500">
                <th className="px-6 py-4 font-semibold">Nama Lengkap</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Departemen</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">Belum ada data karyawan.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <p>{emp.full_name}</p>
                          <p className="text-xs text-gray-500 font-normal">NIK: {emp.nik}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{emp.role_display || emp.role}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{emp.department || '-'}</td>
                    <td className="px-6 py-4">
                      {emp.is_active ? (
                        <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">Aktif</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleResetDevice(emp.id, emp.full_name)} className="text-gray-400 hover:text-green-600 mx-1 transition-colors" title="Reset Device Login">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-2 2 4 4-8 2 10 2-4h4"/></svg>
                      </button>
                      <button onClick={() => openEditModal(emp.id)} className="text-gray-400 hover:text-blue-600 mx-1 transition-colors" title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(emp.id, emp.full_name)} className="text-gray-400 hover:text-red-600 mx-1 transition-colors" title="Hapus">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                {isEditMode ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {errorMsg && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm">
                  {errorMsg}
                </div>
              )}
              
              <form id="karyawan-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Username (Login) *</label>
                    <input 
                      required
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Password {isEditMode ? '(Isi jika ingin diubah)' : '*'}
                    </label>
                    <input 
                      type="text" required={!isEditMode} minLength={8}
                      placeholder={isEditMode ? 'Kosongkan jika tetap' : ''}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap *</label>
                  <input 
                    required 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">NIK *</label>
                    <input 
                      required 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.nik}
                      onChange={(e) => setFormData({...formData, nik: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Role Karyawan *</label>
                    <select 
                      required
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Departemen</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor HP</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="karyawan-form"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {isEditMode ? 'Simpan Perubahan' : 'Tambah Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KaryawanPage;
