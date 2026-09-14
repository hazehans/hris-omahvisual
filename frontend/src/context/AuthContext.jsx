import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { getDeviceId } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on first load
  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    const token = localStorage.getItem('access_token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Backend wraps success in { status: 'success', data: {...} }
    const res = await api.post('/auth/login/', {
      username,
      password,
      device_id: getDeviceId(),
    });

    const payload = res.data?.data ?? res.data; // handle both wrapped and bare
    const { access, refresh, user: userData } = payload;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    const normalizedUser = {
      id: userData.id,
      username: userData.username,
      employee_id: userData.employee?.id ?? null,
      full_name: userData.employee?.full_name ?? userData.username,
      role: userData.employee?.role ?? 'ADMIN_HR',
    };

    localStorage.setItem('user_data', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await api.post('/auth/logout/', { refresh });
    } catch {
      // ignore errors on logout
    }
    ['access_token', 'refresh_token', 'user_data'].forEach((k) =>
      localStorage.removeItem(k),
    );
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
