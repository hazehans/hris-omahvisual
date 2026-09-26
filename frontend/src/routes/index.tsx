// src/routes/index.tsx
// Application router. Defines all routes with role-based guards.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/pages/auth/LoginPage'
import { HRLayout } from '@/pages/hr/HRLayout'
import { HRDashboardPage } from '@/pages/hr/HRDashboardPage'
import { HRAttendancePage } from '@/pages/hr/HRAttendancePage'
import { HRRawLogsPage } from '@/pages/hr/HRRawLogsPage'
import { HREmployeesPage } from '@/pages/hr/HREmployeesPage'
import { HRDailyLogPage } from '@/pages/hr/HRDailyLogPage'
import { HRLeavePage } from '@/pages/hr/HRLeavePage'
import { EmployeeLayout } from '@/pages/employee/EmployeeLayout'
import { EmployeeDashboardPage } from '@/pages/employee/EmployeeDashboardPage'
import { EmployeeAttendancePage } from '@/pages/employee/EmployeeAttendancePage'
import { EmployeeDailyLogPage } from '@/pages/employee/EmployeeDailyLogPage'
import { EmployeeLeavePage } from '@/pages/employee/EmployeeLeavePage'

// ─── Guards ─────────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}


function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/hr/dashboard" replace />
  return <Navigate to="/employee/dashboard" replace />
}

// ─── Router ──────────────────────────────────────────────────────────────────

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* HR Routes */}
        <Route
          path="/hr"
          element={
            <RequireAdmin>
              <HRLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/hr/dashboard" replace />} />
          <Route path="dashboard" element={<HRDashboardPage />} />
          <Route path="attendance" element={<HRAttendancePage />} />
          <Route path="raw-logs" element={<HRRawLogsPage />} />
          <Route path="employees" element={<HREmployeesPage />} />
          <Route path="daily-log" element={<HRDailyLogPage />} />
          <Route path="leave" element={<HRLeavePage />} />
        </Route>

        {/* Employee Routes */}
        <Route
          path="/employee"
          element={
            <RequireAuth>
              <EmployeeLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboardPage />} />
          <Route path="attendance" element={<EmployeeAttendancePage />} />
          <Route path="daily-log" element={<EmployeeDailyLogPage />} />
          <Route path="leave" element={<EmployeeLeavePage />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
