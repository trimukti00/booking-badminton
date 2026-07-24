import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';

export default function ETicket() {
  const location = useLocation();
  const navigate = useNavigate();
  const dataTiket = location.state;
  
  const ticketRef = useRef(null);

  if (!dataTiket) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Tiket Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Belum ada data transaksi yang aktif.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Cek apakah metode pembayaran adalah Cash / Bayar di Tempat
  const isCash = dataTiket.paymentMethod === 'cash' || dataTiket.paymentMethod === 'CASH';

  const renderJam = () => {
    const rawJam = dataTiket.jamTerpilih || dataTiket.jam;
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

  const handleDownloadImage = () => {
    if (ticketRef.current) {
      toPng(ticketRef.current, { cacheBust: true, quality: 0.95 })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `E-Ticket-${dataTiket.bookingCode || 'GOR'}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Gagal mendownload gambar:', err);
          alert('Terjadi kesalahan saat mengunduh gambar tiket.');
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full flex flex-col gap-4">
        
        {/* KARTU TIKET */}
        <div ref={ticketRef} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
          
          {/* WATERMARK BACKGROUND */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0 overflow-hidden">
            <svg className="w-96 h-96 text-gray-900 transform -rotate-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>

          {/* HEADER (WARNA OTOMATIS BERBEDA: HIJAU JIKA ONLINE, BIRU/AMBER JIKA CASH) */}
          <div className={`${isCash ? 'bg-blue-600' : 'bg-emerald-600'} text-white p-6 text-center relative z-10 transition-colors`}>
            
            {/* Lencana Status */}
            <div className="absolute top-4 left-4 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border border-white/20 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isCash ? 'bg-amber-300' : 'bg-emerald-300'} animate-pulse`}></span>
              {isCash ? 'Bayar di Tempat (Cash)' : 'Lunas (Online Verified)'}
            </div>

            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm shadow-inner mt-2">
              {isCash ? (
                // Ikon Jam / Tagihan untuk Cash
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              ) : (
                // Ikon Centang untuk Online
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight">
              {isCash ? 'BOOKING BERHASIL DIBUAT' : 'PEMBAYARAN BERHASIL'}
            </h1>
            <p className={`${isCash ? 'text-blue-100' : 'text-emerald-100'} text-xs mt-0.5`}>
              {isCash ? 'Silakan lunasi pembayaran saat tiba di lokasi' : 'Sistem Booking Lapangan Resmi'}
            </p>
          </div>

          {/* DETAIL E-TICKET */}
          <div className="p-6 space-y-5 bg-white/95 relative z-10">
            
            {/* Kode Booking */}
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 text-center relative">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1 font-semibold">Kode Booking Pengaman</span>
              <span className={`text-2xl font-mono font-extrabold ${isCash ? 'text-blue-700' : 'text-emerald-700'} tracking-wider`}>
                {dataTiket.bookingCode || 'GOR-889231'}
              </span>
            </div>

            {/* Rincian Pesanan */}
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-400">Nama Lapangan</span>
                <span className="font-semibold text-gray-900">{dataTiket.lapangan?.nama || "gor kronjo"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-400">Tanggal Main</span>
                <span className="font-semibold text-gray-900">{dataTiket.tanggal}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-400">Jam Sesi</span>
                <span className="font-semibold text-blue-600 text-right">{renderJam()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-400">Metode Pembayaran</span>
                <span className="font-semibold text-gray-900 uppercase">
                  {isCash ? 'CASH (Bayar di GOR)' : dataTiket.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-400">Waktu Transaksi</span>
                <span className="font-semibold text-gray-900">{dataTiket.paidAt || 'Baru saja'}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-400 font-medium">
                  {isCash ? 'Total Tagihan' : 'Total Dibayar'}
                </span>
                <span className={`font-bold ${isCash ? 'text-blue-600' : 'text-emerald-600'} text-base`}>
                  Rp {dataTiket.totalHarga?.toLocaleString('id-ID') || '0'}
                </span>
              </div>
            </div>

            {/* Catatan Instruksi Khusus (Beda Cash vs Online) */}
            {isCash ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed flex items-start gap-2">
                <span className="text-base">💵</span>
                <div>
                  <strong className="block font-semibold mb-0.5">Instruksi Pembayaran Cash:</strong>
                  Tunjukkan tiket ini dan bayar uang tunai sebesar <strong className="underline">Rp {dataTiket.totalHarga?.toLocaleString('id-ID')}</strong> langsung kepada penjaga GOR sebelum masuk lapangan.
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed flex items-start gap-2">
                <span className="text-base">🛡️</span>
                <div>
                  <strong className="block font-semibold mb-0.5">Tiket Lunas Terverifikasi</strong>
                  Tunjukkan bukti E-Ticket berlogo ini kepada penjaga GOR saat tiba di lokasi sebelum bermain.
                </div>
              </div>
            )}

          </div>

        </div>

        {/* TOMBOL AKSI */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={handleDownloadImage}
            className={`w-full ${isCash ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-medium py-3 rounded-2xl transition cursor-pointer text-sm shadow-md flex items-center justify-center gap-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Simpan Bukti sebagai Gambar (PNG)
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-2xl transition cursor-pointer text-sm border border-gray-200 shadow-sm"
          >
            Kembali ke Beranda
          </button>
        </div>

      </div>
    </div>
  );
}