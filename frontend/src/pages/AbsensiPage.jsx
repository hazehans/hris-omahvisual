import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import LiveCamera from '../components/LiveCamera';
import { useNavigate } from 'react-router-dom';

const AbsensiPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ledMode, setLedMode] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Derived requirements based on role
  const role = user?.role || '';
  const isCV = role.startsWith('CV_') || role.startsWith('LED_');
  const isRental = role.startsWith('RENTAL_');
  const isCrew = role === 'CREW_GUDANG';

  const reqLocation = !isCrew;
  const reqPhoto = isCrew || isRental || (isCV && ledMode);

  useEffect(() => {
    if (reqLocation) {
      if (!navigator.geolocation) {
        setLocError('Geolocation tidak didukung oleh browser Anda.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocError(null);
        },
        (err) => {
          console.error(err);
          setLocError('Gagal mendapatkan lokasi. Pastikan izin lokasi (GPS) diaktifkan di browser/perangkat Anda.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [reqLocation]);

  const handleSubmit = async (type) => {
    // Validation
    if (reqLocation && !location) {
      setError('Lokasi wajib ada. Mohon aktifkan GPS.');
      return;
    }
    if (reqPhoto && !photo) {
      setError('Foto wajib disertakan.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      type, // 'clock_in' or 'clock_out' (or handle endpoints separately depending on backend API)
      led_mode: isCV ? ledMode : undefined,
    };

    if (location) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
    }

    if (photo) {
      payload.photo_base64 = photo;
    }

    try {
      const endpoint = type === 'clock_in' ? '/attendance/clock-in/' : '/attendance/clock-out/';
      await api.post(endpoint, payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat absensi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Form Absensi</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        {isCV && (
          <div className="mb-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Mode LED</p>
              <p className="text-xs text-gray-500">Aktifkan saat pemasangan LED</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={ledMode} onChange={(e) => setLedMode(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        )}

        <div className="space-y-6">
          {reqLocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi Saat Ini <span className="text-red-500">*</span>
              </label>
              {locError ? (
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{locError}</p>
              ) : location ? (
                <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  Lokasi berhasil didapatkan: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Mencari lokasi...</p>
              )}
            </div>
          )}

          <LiveCamera onCapture={setPhoto} required={reqPhoto} />

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => handleSubmit('clock_in')}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Clock In
            </button>
            <button
              onClick={() => handleSubmit('clock_out')}
              disabled={submitting}
              className="flex-1 bg-red-600 text-white py-3 rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Clock Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsensiPage;

