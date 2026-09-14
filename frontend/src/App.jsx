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

// ── Guards ─────────────────────────────────────────────────────────────────

/** Redirect to login if not authenticated. */
const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

/** Restrict to specific roles. */
const RequireRole = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

/** Smart root redirect based on role. */
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'ADMIN_HR'
    ? <Navigate to="/admin/dashboard" replace />
    : (
      <AppLayout>
        <DashboardKaryawan />
      </AppLayout>
    );
};

// ── Routes ─────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />

    {/* Root: smart redirect for Admin vs Karyawan */}
    <Route path="/" element={<RootRedirect />} />

    {/* Karyawan pages */}
    <Route path="/absensi" element={<RequireAuth><AppLayout><AbsensiPage /></AppLayout></RequireAuth>} />
    <Route path="/daily-report" element={<RequireAuth><AppLayout><DailyReportPage /></AppLayout></RequireAuth>} />
    <Route path="/izin-cuti" element={<RequireAuth><AppLayout><IzinCutiPage /></AppLayout></RequireAuth>} />
    <Route path="/profil" element={<RequireAuth><AppLayout><ProfilPage /></AppLayout></RequireAuth>} />

    {/* Admin pages */}
    <Route
      path="/admin/dashboard"
      element={
        <RequireRole roles={['ADMIN_HR']}>
          <AdminLayout><AdminDashboard /></AdminLayout>
        </RequireRole>
      }
    />

    {/* Catch-all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
