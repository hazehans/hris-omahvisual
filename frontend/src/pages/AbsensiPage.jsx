import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import LiveCamera from '../components/LiveCamera';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';

const AbsensiPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ledMode, setLedMode] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [locStatus, setLocStatus] = useState('idle'); // idle | loading | success | error
  const [locError, setLocError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);

  // Role flags
  const role = user?.role || '';
  const isCV = role.startsWith('CV_') || role.startsWith('LED_');
  const isRental = role.startsWith('RENTAL_');
  const isCrew = role === 'CREW_GUDANG';

  const reqLocation = !isCrew;
  const reqPhoto = isCrew || isRental || (isCV && ledMode);

  // Fetch today status to show clock-in / clock-out button appropriately
  useEffect(() => {
    api.get('/attendance/today/')
      .then((res) => setTodayStatus(res.data?.data ?? res.data))
      .catch(() => setTodayStatus(null));
  }, []);

  // Request geolocation
  useEffect(() => {
    if (!reqLocation) return;
    setLocStatus('loading');
    if (!navigator.geolocation) {
      setLocStatus('error');
      setLocError('Geolocation tidak didukung oleh browser Anda.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocStatus('success');
        setLocError(null);
      },
      (err) => {
        setLocStatus('error');
        if (err.code === 1) {
          setLocError('Izin lokasi ditolak. Buka Pengaturan Browser → Izin Situs → aktifkan Lokasi, lalu muat ulang halaman.');
        } else if (err.code === 2) {
          setLocError('Posisi tidak tersedia. Pastikan GPS aktif.');
        } else {
          setLocError('Gagal mendapatkan lokasi (timeout). Coba lagi.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [reqLocation, ledMode]);

  const hasClockIn = !!todayStatus?.clock_in_time;
  const hasClockOut = !!todayStatus?.clock_out_time;

  const handleSubmit = async (type) => {
    setError(null);

    if (reqLocation && locStatus !== 'success') {
      setError('Lokasi belum berhasil didapatkan. Mohon tunggu atau aktifkan GPS.');
      return;
    }
    if (reqPhoto && !photo) {
      setError('Foto wajib disertakan untuk role Anda.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...(isCV && { led_mode: ledMode }),
        ...(location && { latitude: location.latitude, longitude: location.longitude }),
        ...(photo && { photo_base64: photo }),
      };

      const endpoint = type === 'clock_in' ? '/attendance/clock-in/' : '/attendance/clock-out/';
      await api.post(endpoint, payload);
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.errors?.non_field_errors?.[0] ||
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat absensi.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Form Absensi</h2>

      {hasClockIn && hasClockOut && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm font-medium">
          ✓ Absensi hari ini sudah lengkap (Clock In &amp; Clock Out).
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        {/* Toggle Mode LED (hanya untuk role CV/LED) */}
        {isCV && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Mode Pemasangan LED</p>
              <p className="text-xs text-gray-500">Aktifkan saat tugas di lokasi LED</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ledMode}
              onClick={() => setLedMode((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                ledMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  ledMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Lokasi */}
        {reqLocation && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lokasi Saat Ini <span className="text-red-500">*</span>
            </label>
            <div className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
              locStatus === 'success' ? 'bg-green-50 text-green-700' :
              locStatus === 'error' ? 'bg-red-50 text-red-600' :
              'bg-gray-50 text-gray-500'
            }`}>
              {locStatus === 'loading' && <Loader2 size={18} className="animate-spin shrink-0 mt-0.5" />}
              {locStatus === 'success' && <CheckCircle size={18} className="shrink-0 mt-0.5 text-green-500" />}
              {locStatus === 'error' && <MapPin size={18} className="shrink-0 mt-0.5 text-red-500" />}
              {locStatus === 'idle' && <MapPin size={18} className="shrink-0 mt-0.5" />}
              <span>
                {locStatus === 'loading' && 'Mendapatkan lokasi...'}
                {locStatus === 'success' && `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}`}
                {locStatus === 'error' && locError}
                {locStatus === 'idle' && 'Menunggu...'}
              </span>
            </div>
          </div>
        )}

        {/* Kamera Live */}
        <LiveCamera onCapture={setPhoto} required={reqPhoto} />

        {/* Tombol Clock In / Clock Out */}
        <div className="flex gap-3 pt-2">
          {!hasClockIn && (
            <button
              onClick={() => handleSubmit('clock_in')}
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Memproses...
                </span>
              ) : 'Clock In'}
            </button>
          )}
          {hasClockIn && !hasClockOut && (
            <button
              onClick={() => handleSubmit('clock_out')}
              disabled={submitting}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Memproses...
                </span>
              ) : 'Clock Out'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbsensiPage;
