import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pesanan = location.state;

  const [selectedPayment, setSelectedPayment] = useState('bca');
  const [namaPemesan, setNamaPemesan] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  const [emailPemesan, setEmailPemesan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleBayar = async () => {
    if (!namaPemesan.trim() || !nomorWa.trim()) {
      return alert('Mohon isi Nama Pemesan dan Nomor WhatsApp terlebih dahulu!');
    }

    if (!pesanan.jamTerpilih || pesanan.jamTerpilih.length === 0) {
      return alert('Tidak ada jam yang dipilih!');
    }

    setIsSubmitting(true);

    try {
      // 1. Simpan atau perbarui data pelanggan secara otomatis ke tabel 'pelanggan'
      await supabase.from('pelanggan').upsert([
        {
          nama: namaPemesan,
          telepon: nomorWa,
          email: emailPemesan || `${namaPemesan.toLowerCase().replace(/\s+/g, '')}@pelanggan.com`,
          alamat: 'Dari Pemesanan Online'
        }
      ], { onConflict: 'telepon' });

      // 2. Masukkan reservasi per jam ke tabel 'reservasi'
      const jamList = pesanan.jamTerpilih;
      
      for (const jamMulai of jamList) {
        const jamSelesaiNum = parseInt(jamMulai, 10) + 1;
        const jamSelesaiStr = String(jamSelesaiNum).padStart(2, '0') + ':00';

        const { error } = await supabase.from('reservasi').insert([
          {
            nama_pemesan: namaPemesan,
            nomor_wa: nomorWa,
            tanggal: pesanan.tanggal,
            jam_mulai: `${jamMulai}:00`,
            jam_selesai: `${jamSelesaiStr}:00`,
            jenis_paket: 'Perorangan',
            total_harga: pesanan.totalHarga / jamList.length,
            status_pembayaran: selectedPayment === 'cash' ? 'Belum Lunas' : 'Lunas',
            status_kehadiran: 'Menunggu'
          }
        ]);

        if (error) {
          if (error.code === '23505') {
            throw new Error(`Mohon maaf, jam ${jamMulai} pada tanggal tersebut sudah dibooking oleh orang lain!`);
          }
          throw error;
        }
      }

      const randomCode = 'GOR-' + Math.floor(100000 + Math.random() * 900000);
      
      const transaksiBaru = {
        ...pesanan,
        namaPemesan,
        nomorWa,
        emailPemesan,
        bookingCode: randomCode,
        paymentMethod: selectedPayment,
        paidAt: new Date().toLocaleDateString('id-ID', { 
          day: 'numeric', month: 'long', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        }).replace('.', ':')
      };

      const riwayatLama = JSON.parse(localStorage.getItem('riwayatBooking') || '[]');
      localStorage.setItem('riwayatBooking', JSON.stringify([transaksiBaru, ...riwayatLama]));
      
      navigate('/eticket', { state: transaksiBaru });

    } catch (err) {
      alert(err.message || 'Terjadi kesalahan saat memproses pemesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-6 flex flex-col gap-6">
        
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h1 className="text-xl font-bold text-gray-900">Checkout Pesanan</h1>
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="text-gray-400 hover:text-gray-600 text-sm font-medium cursor-pointer"
          >
            ← Kembali
          </button>
        </div>

        {/* Input Data Pemesan */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-800 block">Informasi Pemesan</label>
          <div>
            <input 
              type="text"
              placeholder="Nama Lengkap"
              value={namaPemesan}
              onChange={(e) => setNamaPemesan(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-600 text-gray-800"
            />
          </div>
          <div>
            <input 
              type="tel"
              placeholder="Nomor WhatsApp (Contoh: 08123456789)"
              value={nomorWa}
              onChange={(e) => setNomorWa(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-600 text-gray-800"
            />
          </div>
          <div>
            <input 
              type="email"
              placeholder="Alamat Email (Opsional)"
              value={emailPemesan}
              onChange={(e) => setEmailPemesan(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-600 text-gray-800"
            />
          </div>
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
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3.5 rounded-2xl transition cursor-pointer text-sm shadow-md disabled:bg-emerald-300"
        >
          {isSubmitting ? 'Memproses ke Database...' : 'Proses Pembayaran & Buat E-Ticket'}
        </button>

      </div>
    </div>
  );
}