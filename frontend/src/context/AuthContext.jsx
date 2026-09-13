import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { getDeviceId } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_data');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login/', { 
      username, 
      password,
      device_id: getDeviceId() 
    });
    
    const { access, refresh, user: userData } = res.data.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Normalize user data to easily access role
    const normalizedUser = {
      id: userData.id,
      username: userData.username,
      employee_id: userData.employee?.id,
      full_name: userData.employee?.full_name,
      role: userData.employee?.role || 'ADMIN_HR',
    };

    localStorage.setItem('user_data', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
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
