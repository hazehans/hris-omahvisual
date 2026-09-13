import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardKaryawan from './pages/DashboardKaryawan';
import AbsensiPage from './pages/AbsensiPage';
import DailyReportPage from './pages/DailyReportPage';
import IzinCutiPage from './pages/IzinCutiPage';
import ProfilPage from './pages/ProfilPage';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';

const PrivateRoute = ({ children, allowedRoles, blockRoles }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  if (blockRoles && blockRoles.includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Custom route for root "/" to redirect admin to /admin/dashboard
const RootRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN_HR') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return (
    <AppLayout>
      <DashboardKaryawan />
    </AppLayout>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Karyawan Routes */}
      <Route path="/" element={<RootRoute />} />
      <Route
        path="/absensi"
        element={
          <PrivateRoute blockRoles={['ADMIN_HR']}>
            <AppLayout>
              <AbsensiPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/daily-report"
        element={
          <PrivateRoute blockRoles={['ADMIN_HR']}>
            <AppLayout>
              <DailyReportPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/izin-cuti"
        element={
          <PrivateRoute blockRoles={['ADMIN_HR']}>
            <AppLayout>
              <IzinCutiPage />
            </AppLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profil"
        element={
          <PrivateRoute blockRoles={['ADMIN_HR']}>
            <AppLayout>
              <ProfilPage />
            </AppLayout>
          </PrivateRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute allowedRoles={['ADMIN_HR']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      {/* Add more admin routes here later */}
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
