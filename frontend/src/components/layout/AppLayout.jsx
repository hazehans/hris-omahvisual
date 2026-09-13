import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Clock, FileText, Calendar, User, LogOut } from 'lucide-react';

const AppLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/absensi', label: 'Absensi', icon: Clock },
    { path: '/daily-report', label: 'Daily Report', icon: FileText },
    { path: '/izin-cuti', label: 'Izin/Cuti', icon: Calendar },
    { path: '/profil', label: 'Profil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">HRIS</h1>
          <button onClick={logout} className="p-2 text-gray-600 hover:text-red-600">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 overflow-y-auto pb-20">
        {children || <Outlet />}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="bg-white border-t fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;

