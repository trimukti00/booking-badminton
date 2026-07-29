import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Sekarang kita pakai AuthContext

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingProcess, setLoadingProcess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, user } = useAuth(); // Ambil data dari buku tamu

  // KUNCI ANTI-MENTAL: Dia bakal otomatis pindah ke Dashboard HANYA KALAU user sudah benar-benar dicatat!
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoadingProcess(true);
    setError('');

    try {
      // Panggil fungsi login dari AuthContext
      await login(email, password);
      // GAK ADA KODE NAVIGATE DI SINI LAGI BIAR GAK BALAPAN
    } catch (err) {
      setError(err.message || 'Gagal login, periksa kembali email dan password.');
      setLoadingProcess(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">GOR TAKUR</h1>
          <p className="text-sm text-gray-500">Masuk ke Panel Admin untuk mengelola sistem</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

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
            disabled={loadingProcess}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            {loadingProcess ? 'Memproses Masuk...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}