import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Clock, FileText, Calendar, User } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Beranda', icon: Home },
  { path: '/absensi', label: 'Absensi', icon: Clock },
  { path: '/daily-report', label: 'Report', icon: FileText },
  { path: '/izin-cuti', label: 'Izin', icon: Calendar },
  { path: '/profil', label: 'Profil', icon: User },
];

const AppLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content – padded bottom so it doesn't go behind nav bar */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-6 pb-24 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
