import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { db } from '../lib/db'
import { useAuth } from '../context/AuthContext'

const quickActions = [
  { to: '/pelanggan', icon: '👥', label: 'Tambah Pelanggan', desc: 'Registrasi pelanggan baru', color: '#2563eb', bg: '#eff6ff' },
  { to: '/jadwal', icon: '📅', label: 'Buat Jadwal', desc: 'Reservasi lapangan baru', color: '#0d9488', bg: '#f0fdfa' },
  { to: '/pembayaran', icon: '💳', label: 'Input Pembayaran', desc: 'Catat transaksi pembayaran', color: '#7c3aed', bg: '#f5f3ff' },
  { to: '/laporan', icon: '📈', label: 'Lihat Laporan', desc: 'Analisis pendapatan & data', color: '#ea580c', bg: '#fff7ed' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ pelanggan: 0, reservasi: 0, pendapatan: 0, hariIni: 0 })
  const [recent, setRecent] = useState([])
  const [jadwalHariIni, setJadwalHariIni] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pelanggan, reservasi, pembayaran, lapangan] = await Promise.all([
        db.query('pelanggan'),
        db.query('reservasi'),
        db.query('pembayaran'),
        db.query('lapangan'),
      ])

      const today = new Date().toISOString().slice(0, 10)
      const hariIni = reservasi.filter((r) => r.tanggal === today && r.status !== 'dibatalkan').length
      
      // Ambil pendapatan langsung dari reservasi (biar sinkron dengan laporan)
      const totalPendapatan = reservasi
        .filter((r) => (r.status_pembayaran || '').toLowerCase() === 'lunas')
        .reduce((sum, r) => sum + Number(r.total_harga || 0), 0)

      const pelangganMap = {}
      pelanggan.forEach((p) => { pelangganMap[p.id] = p.nama })
      const lapanganMap = {}
      lapangan.forEach((l) => { lapanganMap[l.id] = l.nama })

      setStats({ pelanggan: pelanggan.length, reservasi: reservasi.length, pendapatan: totalPendapatan, hariIni })

      const recentData = [...reservasi]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 6)
        .map((r) => ({
          ...r,
          // Perbaikan: gunakan r.nama_pemesan sesuai database lu
          nama_pelanggan: pelangganMap[r.pelanggan_id] || r.nama_pemesan || '-',
          nama_lapangan: lapanganMap[r.lapangan_id] || r.lapangan || '-',
        }))

      const jadwalToday = reservasi
        .filter((r) => r.tanggal === today && r.status !== 'dibatalkan')
        .sort((a, b) => (a.jam_mulai || '').localeCompare(b.jam_mulai || ''))
        .slice(0, 5)
        .map((r) => ({
          ...r,
          // Perbaikan: gunakan r.nama_pemesan sesuai database lu
          nama_pelanggan: pelangganMap[r.pelanggan_id] || r.nama_pemesan || '-',
          nama_lapangan: lapanganMap[r.lapangan_id] || r.lapangan || '-',
        }))

      setRecent(recentData)
      setJadwalHariIni(jadwalToday)
    } catch (error) {
      console.error(error)
      setStats({ pelanggan: 0, reservasi: 0, pendapatan: 0, hariIni: 0 })
      setRecent([])
      setJadwalHariIni([])
    } finally {
      setLoading(false)
    }
  }

  // Merapikan nama sapaan (memotong @gmail.com jika login pakai email)
  const getDisplayName = () => {
    if (user?.nama_lengkap) return user.nama_lengkap;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return 'Admin';
  }

  const statCards = [
    { label: 'Total Pelanggan', value: stats.pelanggan, icon: '👥', color: '#2563eb', bg: '#eff6ff', trend: `${stats.pelanggan > 0 ? '+' : ''}${stats.pelanggan} orang` },
    { label: 'Total Reservasi', value: stats.reservasi, icon: '📅', color: '#0d9488', bg: '#f0fdfa', trend: `${stats.reservasi} transaksi` },
    { label: 'Hari Ini', value: stats.hariIni, icon: '📋', color: '#ea580c', bg: '#fff7ed', trend: `${stats.hariIni > 0 ? `${stats.hariIni} jadwal` : 'Belum ada'}` },
    { label: 'Pendapatan', value: `Rp ${stats.pendapatan.toLocaleString('id-ID')}`, icon: '💰', color: '#7c3aed', bg: '#f5f3ff', trend: 'Dari pembayaran lunas' },
  ]

  const greetHour = new Date().getHours()
  const greeting = greetHour < 12 ? 'Selamat Pagi' : greetHour < 15 ? 'Selamat Siang' : greetHour < 18 ? 'Selamat Sore' : 'Selamat Malam'

  return (
    <div className="space-y-6">
      <SEO title="Dashboard" />

      {/* Section Header / Greeting */}
      <header>
        <h1 className="text-2xl font-bold text-gray-800">{greeting}, {getDisplayName()}! 👋</h1>
        <p className="text-gray-500 mt-1">Selamat datang di Sistem Informasi Reservasi Lapangan Badminton GOR TAKUR. Berikut ringkasan data hari ini.</p>
      </header>

      {/* Section Statistik */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statCards.map((s, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <span className="text-3xl font-extrabold mb-2" style={{ color: s.color }}>
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 80, height: 36, borderRadius: 8 }} /> : s.value}
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section Quick Actions */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 mt-8">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
            >
              <div className="text-3xl">{a.icon}</div>
              <span className="font-semibold text-gray-800 group-hover:text-blue-600 mt-3">{a.label}</span>
              <span className="text-xs text-gray-500 mt-1">{a.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content Grid: Recent & Today's Schedule */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xl font-semibold">Reservasi Terbaru</div>
              <p className="text-sm text-gray-500">6 reservasi terakhir masuk sistem</p>
            </div>
            <Link to="/jadwal" className="text-sm text-blue-600 font-medium hover:underline">Lihat Jadwal →</Link>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 skeleton rounded-md" />
                <div className="h-12 skeleton rounded-md" />
                <div className="h-12 skeleton rounded-md" />
              </div>
            ) : recent.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Belum ada reservasi.</div>
            ) : (
              <ul className="divide-y divide-gray-100 mt-2">
                {recent.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{r.nama_pelanggan}</div>
                      <div className="text-xs text-gray-500">{r.nama_lapangan} • {r.tanggal}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{r.jam_mulai?.slice(0,5) || r.jam}{r.jam_selesai ? ` - ${r.jam_selesai.slice(0,5)}` : ''}</div>
                      <div className="text-xs mt-1 capitalize font-medium" style={{ color: r.status === 'dikonfirmasi' ? '#0ea5e9' : r.status === 'selesai' ? '#22c55e' : '#f59e0b' }}>
                        {r.status || 'menunggu'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="text-xl font-semibold">Jadwal Hari Ini</div>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 skeleton rounded-md" />
                <div className="h-12 skeleton rounded-md" />
              </div>
            ) : jadwalHariIni.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Tidak ada jadwal hari ini. 🎉</div>
            ) : (
              <ul className="space-y-3">
                {jadwalHariIni.map((r) => (
                  <li key={r.id} className="p-3 rounded-lg border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-gray-800">{r.nama_pelanggan}</div>
                      <div className="text-xs text-gray-500">{r.nama_lapangan}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">{r.jam_mulai?.slice(0,5) || r.jam}{r.jam_selesai ? ` - ${r.jam_selesai.slice(0,5)}` : ''}</div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">{r.status || 'menunggu'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {jadwalHariIni.length > 0 && (
            <div className="mt-4 text-center text-sm text-blue-700 bg-blue-50 border border-blue-100 py-2.5 rounded-lg transition-colors hover:bg-blue-100">
              📅 {jadwalHariIni.length} jadwal hari ini • <Link to="/jadwal" className="font-semibold">Kelola Jadwal</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}