import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/login/', {
        username: username,
        password: password
      });
      
      const token = response.data.access;
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      const meResponse = await axios.get('http://127.0.0.1:8000/api/v1/auth/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userRole = meResponse.data.role;
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('user_name', meResponse.data.name);

      if (userRole === 'admin') {
        navigate('/dashboard'); 
      } else {
        navigate('/employee-dashboard'); 
      }
    } catch (err) {
      setError('Username atau Password salah!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06053f] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/20 via-[#020617] to-[#020617]">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="bg-indigo-600/10 border border-indigo-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <LogIn className="text-indigo-400 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">HRIS OmahVisual</h2>
          <p className="text-slate-400 text-sm mt-1">Portal Autentikasi Sistem</p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 text-red-400 p-4 rounded-lg text-sm">
              <p className="font-semibold">Gagal Masuk</p>
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Username / NIK
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder-slate-600"
              placeholder="Masukkan NIK atau Username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition placeholder-slate-600"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] transition-all duration-300"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-600">
          &copy; 2026 CV Han Media Tekindo.
        </div>
      </div>
    </div>
  );
};

export default Login;
