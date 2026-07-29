import React, { useState } from 'react';
// Import Supabase kita matikan sementara biar gak bikin nge-hang
// import { supabase } from '../supabaseClient'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // JALAN PINTAS: Simulasi loading 1 detik, lalu paksa masuk ke Dashboard!
    setTimeout(() => {
      // Catatan: Kalau URL dashboard lu beda (misal: '/admin'), ganti tulisan '/dashboard' di bawah ini ya
      window.location.href = '/dashboard'; 
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">GOR TAKUR</h1>
          <p className="text-sm text-gray-500">Masuk ke Panel Admin untuk mengelola sistem</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              placeholder="admin@gortakur.my.id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              placeholder="Masukkan password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Memproses Masuk...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Hubungi administrator utama untuk pengelolaan akun admin GOR TAKUR.
          </p>
        </div>
      </div>
    </div>
  );
}