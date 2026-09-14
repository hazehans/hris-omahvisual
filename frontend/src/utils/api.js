import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 15000,
});

// Generate / retrieve persistent device ID
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// ── Request interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Device-ID'] = getDeviceId();
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: auto-refresh JWT on 401 ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/token/refresh/`,
            { refresh: refreshToken },
          );
          const newAccess = res.data.access ?? res.data.data?.access;
          localStorage.setItem('access_token', newAccess);
          api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch {
          // refresh token expired → force logout
          ['access_token', 'refresh_token', 'user_data'].forEach((k) =>
            localStorage.removeItem(k),
          );
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
