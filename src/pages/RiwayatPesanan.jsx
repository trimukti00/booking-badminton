import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RiwayatPesanan() {
  const navigate = useNavigate();
  const [riwayat, setRiwayat] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('riwayatBooking') || '[]');
    setRiwayat(data);
  }, []);

  const renderJam = (jamData) => {
    if (!jamData) return '-';
    if (Array.isArray(jamData)) {
      return jamData.map((hour) => {
        if (typeof hour === 'string' && hour.includes(':') && !hour.includes('-')) {
          const nextHour = String(parseInt(hour, 10) + 1).padStart(2, '0') + ':00';
          return `${hour} - ${nextHour}`;
        }
        return hour;
      }).join(', ');
    }
    return String(jamData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Pesanan Saya</h1>
          <button 
            onClick={() => navigate('/')} 
            className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer shadow-sm"
          >
            ← Beranda
          </button>
        </div>

        {/* Daftar Riwayat */}
        {riwayat.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm mt-10">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🎫
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Belum Ada Riwayat Pesanan</h3>
            <p className="text-gray-500 text-sm mb-6">Anda belum pernah melakukan booking lapangan.</p>
            <button 
              onClick={() => navigate('/')} 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition cursor-pointer text-sm shadow-sm"
            >
              Mulai Booking Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {riwayat.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
                
                {/* Info Atas */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      Berhasil Dibayar
                    </span>
                    <p className="text-xs text-gray-400 mt-1.5 font-mono">Kode: {item.bookingCode}</p>
                  </div>
                  <span className="text-xs text-gray-400">{item.paidAt}</span>
                </div>

                {/* Detail Tengah */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{item.lapangan?.nama || "gor kronjo"}</h3>
                    <p className="text-sm text-gray-600 mt-1">📅 {item.tanggal}</p>
                    <p className="text-sm text-blue-600 font-semibold mt-0.5">⏰ {renderJam(item.jamTerpilih || item.jam)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block mb-0.5">Total Bayar</span>
                    <span className="font-bold text-emerald-600 text-base">Rp {item.totalHarga?.toLocaleString('id-ID') || '0'}</span>
                  </div>
                </div>

                {/* Tombol Lihat E-Ticket */}
                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => navigate('/eticket', { state: item })}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <span>📄</span> Lihat E-Ticket Lengkap
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}