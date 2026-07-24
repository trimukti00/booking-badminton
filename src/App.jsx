import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pelanggan from './pages/Pelanggan'
import Jadwal from './pages/Jadwal'
import Pembayaran from './pages/Pembayaran'
import Laporan from './pages/Laporan'
import Admin from './pages/Admin'
import Home from './pages/Home'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import DetailLapangan from './pages/DetailLapangan'
import Checkout from './pages/Checkout'
import ETicket from './pages/ETicket'
import RiwayatPesanan from './pages/RiwayatPesanan' // <--- 1. Import halaman Riwayat Pesanan
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/detail/:id" element={<DetailLapangan />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pelanggan" element={<Pelanggan />} />
            <Route path="/jadwal" element={<Jadwal />} />
            <Route path="/pembayaran" element={<Pembayaran />} />
            <Route path="/laporan" element={<Laporan />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/eticket" element={<ETicket />} />
          <Route path="/riwayat" element={<RiwayatPesanan />} /> {/* <--- 2. Daftarkan path rute Riwayat Pesanan */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}