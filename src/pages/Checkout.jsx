import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pesanan = location.state;

  const [selectedPayment, setSelectedPayment] = useState('bca');

  if (!pesanan) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Data Pesanan Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Silakan pilih lapangan dan jadwal terlebih dahulu.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const renderJam = () => {
    const rawJam = pesanan.jamTerpilih || pesanan.jam;
    if (!rawJam) return '-';
    if (Array.isArray(rawJam)) {
      return rawJam.map((hour) => {
        if (typeof hour === 'string' && hour.includes(':') && !hour.includes('-')) {
          const nextHour = String(parseInt(hour, 10) + 1).padStart(2, '0') + ':00';
          return `${hour} - ${nextHour}`;
        }
        return hour;
      }).join(', ');
    }
    return String(rawJam);
  };

  const handleBayar = () => {
    const randomCode = 'GOR-' + Math.floor(100000 + Math.random() * 900000);
    
    const transaksiBaru = {
      ...pesanan,
      bookingCode: randomCode,
      paymentMethod: selectedPayment,
      paidAt: new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', month: 'long', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      }).replace('.', ':')
    };

    // SIMPAN KE LOCALSTORAGE AGAR MUNCUL DI HALAMAN RIWAYAT
    const riwayatLama = JSON.parse(localStorage.getItem('riwayatBooking') || '[]');
    localStorage.setItem('riwayatBooking', JSON.stringify([transaksiBaru, ...riwayatLama]));
    
    // Pindah ke halaman eticket
    navigate('/eticket', { state: transaksiBaru });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-6 flex flex-col gap-6">
        
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h1 className="text-xl font-bold text-gray-900">Checkout Pesanan</h1>
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-400 hover:text-gray-600 text-sm font-medium cursor-pointer"
          >
            ← Kembali
          </button>
        </div>

        {/* Ringkasan */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm border border-gray-100">
          <div className="flex justify-between">
            <span className="text-gray-500">Lapangan</span>
            <span className="font-semibold text-gray-900">{pesanan.lapangan?.nama || 'GOR Badminton'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tanggal</span>
            <span className="font-semibold text-gray-900">{pesanan.tanggal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sesi Jam</span>
            <span className="font-semibold text-blue-600">{renderJam()}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base">
            <span className="text-gray-700">Total Harga</span>
            <span className="text-emerald-600">Rp {pesanan.totalHarga?.toLocaleString('id-ID') || '0'}</span>
          </div>
        </div>

        {/* Metode Pembayaran */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-800 block">Pilih Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'bca', name: 'Transfer BCA' },
              { id: 'mandiri', name: 'Transfer Mandiri' },
              { id: 'qris', name: 'QRIS (All Payment)' },
              { id: 'cash', name: 'Bayar di Tempat (Cash)' },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedPayment(method.id)}
                className={`p-3 rounded-2xl border text-xs font-semibold transition cursor-pointer text-center ${
                  selectedPayment === method.id 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {method.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tombol Bayar */}
        <button
          type="button"
          onClick={handleBayar}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3.5 rounded-2xl transition cursor-pointer text-sm shadow-md"
        >
          Proses Pembayaran & Buat E-Ticket
        </button>

      </div>
    </div>
  );
}