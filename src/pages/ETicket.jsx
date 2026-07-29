import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function ETicket() {
  const location = useLocation();
  const navigate = useNavigate();
  const pesanan = location.state;

  // Jika pengunjung nyasar ke halaman ini tanpa pesanan
  if (!pesanan) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Tiket Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Silakan lakukan pemesanan terlebih dahulu.</p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // ANGKA 0 DI DEPAN SUDAH DIHAPUS (Langsung 628...)
  const NOMOR_WA_ADMIN = "6283160681742"; 

  // Format pesan otomatis untuk WhatsApp
  const pesanWA = `Halo Admin GORTAKUR, saya ingin konfirmasi pembayaran booking lapangan:
  
*Kode Booking:* ${pesanan.bookingCode}
*Nama Pemesan:* ${pesanan.namaPemesan}
*Lapangan:* ${pesanan.lapangan?.nama}
*Tanggal Main:* ${pesanan.tanggal}
*Sesi Jam:* ${pesanan.jamTerpilih.join(', ')}
*Total Tagihan:* Rp ${pesanan.totalHarga?.toLocaleString('id-ID')}
*Metode Pembayaran:* ${pesanan.paymentMethod.toUpperCase()}

Berikut saya lampirkan bukti transfer pembayarannya. Mohon bantu di-cek ya min! 🙏`;

  // SUDAH DIGANTI PAKAI API WHATSAPP RESMI BIAR LANCAR DI LAPTOP & HP
  const linkWA = `https://api.whatsapp.com/send?phone=${NOMOR_WA_ADMIN}&text=${encodeURIComponent(pesanWA)}`;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex flex-col items-center">
      <SEO title="E-Ticket Pesanan" />

      {/* Bagian Tiket */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 relative print:shadow-none print:border-none">
        
        {/* Header Tiket */}
        <div className="bg-blue-600 text-white p-6 text-center relative">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Booking Berhasil!</h1>
          <p className="text-blue-100 text-sm mt-1">Ini adalah E-Ticket resmi Anda</p>
          
          {/* Garis putus-putus ala tiket */}
          <div className="absolute bottom-0 left-0 w-full h-4 bg-[radial-gradient(circle,transparent_4px,#2563eb_4px)] bg-[length:12px_12px] bg-repeat-x -mb-2"></div>
        </div>

        {/* Detail Tiket */}
        <div className="p-6 pt-8 flex flex-col gap-5">
          <div className="text-center pb-5 border-b border-dashed border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Kode Booking</p>
            <p className="text-3xl font-mono font-bold text-gray-900 tracking-widest">{pesanan.bookingCode}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Nama Pemesan</p>
              <p className="font-semibold text-gray-900">{pesanan.namaPemesan}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Nomor WhatsApp</p>
              <p className="font-semibold text-gray-900">{pesanan.nomorWa}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Lapangan</p>
              <p className="font-semibold text-blue-600">{pesanan.lapangan?.nama}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Tanggal</p>
              <p className="font-semibold text-gray-900">{pesanan.tanggal}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-1">Sesi Jam</p>
              <div className="flex flex-wrap gap-1">
                {pesanan.jamTerpilih.map((jam, i) => (
                  <span key={i} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                    {jam}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 text-sm">Metode</span>
              <span className="font-semibold text-gray-800 text-sm uppercase">{pesanan.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Total Bayar</span>
              <span className="font-bold text-emerald-600 text-lg">Rp {pesanan.totalHarga?.toLocaleString('id-ID')}</span>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 mt-2">
            Dipesan pada: {pesanan.paidAt}
          </div>
        </div>
      </div>

      {/* Area Tombol Aksi (Sembunyi saat di-print) */}
      <div className="max-w-md w-full mt-6 flex flex-col gap-3 print:hidden">
        <a 
          href={linkWA}
          target="_blank" 
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-2xl transition cursor-pointer shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
          </svg>
          Konfirmasi Pembayaran
        </a>

        <button 
          onClick={() => window.print()}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-2xl transition cursor-pointer shadow-sm border border-gray-200"
        >
          Simpan / Print Tiket
        </button>

        <button 
          onClick={() => navigate('/')}
          className="w-full text-blue-600 font-semibold py-3 rounded-2xl transition cursor-pointer mt-2"
        >
          Kembali ke Beranda
        </button>
      </div>

    </div>
  );
}