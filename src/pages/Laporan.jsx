import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { db } from '../lib/db'

function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0)
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
  return { start, end }
}

export default function Laporan() {
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({ pendapatan: 0, reservasi: 0, pelangganBaru: 0, lunas: 0, belum: 0 })
  const [byDay, setByDay]   = useState([])
  const [byStatus, setByStatus] = useState({})
  const [topPelanggan, setTopPelanggan] = useState([])
  const [allReservasi, setAllReservasi] = useState([])

  useEffect(() => { loadData() }, [bulan, tahun])

  const loadData = async () => {
    setLoading(true)
    try {
      const { start, end } = getMonthRange(tahun, bulan)
      
      // HANYA ambil dari tabel reservasi (anti-error)
      const reservasi = await db.query('reservasi').catch(() => [])

      // Filter berdasarkan bulan yang dipilih
      const filteredRes = Array.isArray(reservasi) 
        ? reservasi.filter(r => r.tanggal && r.tanggal >= start && r.tanggal <= end) 
        : []

      // Hitung uang masuk
      const pendapatan = filteredRes
        .filter(r => (r.status_pembayaran || '').toLowerCase() === 'lunas')
        .reduce((s, r) => s + Number(r.total_harga || 0), 0)

      const lunas = filteredRes.filter(r => (r.status_pembayaran || '').toLowerCase() === 'lunas').length
      const belum = filteredRes.filter(r => (r.status_pembayaran || '').toLowerCase() !== 'lunas').length

      // Hitung jumlah pelanggan unik bulan ini dari nomor WA atau nama
      const uniqueCustomers = new Set(filteredRes.map(r => r.nomor_wa || r.nama_pemesan)).size

      // Grafik Harian
      const daysInMonth = new Date(tahun, bulan, 0).getDate()
      const dayData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = String(i + 1).padStart(2, '0')
        const date = `${tahun}-${String(bulan).padStart(2, '0')}-${day}`
        
        const dayResList = filteredRes.filter(r => r.tanggal === date)
        const dayInc = dayResList
          .filter(r => (r.status_pembayaran || '').toLowerCase() === 'lunas')
          .reduce((s, r) => s + Number(r.total_harga || 0), 0)

        return { day: i + 1, date, reservasi: dayResList.length, pendapatan: dayInc }
      })

      // Status Pembayaran
      const statusCount = {}
      filteredRes.forEach(r => {
        const st = r.status_pembayaran || 'Belum Lunas'
        statusCount[st] = (statusCount[st] || 0) + 1
      })

      // Top Pelanggan
      const pelCount = {}
      filteredRes.forEach(r => {
        const key = r.nama_pemesan || 'Tanpa Nama'
        pelCount[key] = (pelCount[key] || 0) + 1
      })

      const topPel = Object.entries(pelCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nama, count]) => ({ nama, count }))

      setStats({ pendapatan, reservasi: filteredRes.length, pelangganBaru: uniqueCustomers, lunas, belum })
      setByDay(dayData)
      setByStatus(statusCount)
      setTopPelanggan(topPel)
      
      // Amankan data nama untuk tabel
      setAllReservasi(filteredRes.map(r => ({ ...r, nama_pelanggan: r.nama_pemesan || '-' })))
      
    } catch (error) {
      console.error('Data gagal dimuat:', error)
      setStats({ pendapatan: 0, reservasi: 0, pelangganBaru: 0, lunas: 0, belum: 0 })
      setByDay([])
      setByStatus({})
      setTopPelanggan([])
      setAllReservasi([])
    } finally {
      setLoading(false)
    }
  }

  const maxBar = Math.max(...byDay.map(d => d.pendapatan), 1)
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  const years  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  const kpiCards = [
    { label: 'Total Pendapatan', value: `Rp ${stats.pendapatan.toLocaleString('id-ID')}`, icon: '💰', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Total Reservasi',  value: stats.reservasi,  icon: '📅', color: '#2563eb', bg: '#eff6ff' },
    { label: 'Pembayaran Lunas', value: stats.lunas,      icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Belum Lunas',      value: stats.belum,      icon: '⏳', color: '#ea580c', bg: '#fff7ed' },
    { label: 'Pelanggan Bulan Ini', value: stats.pelangganBaru, icon: '👥', color: '#9333ea', bg: '#faf5ff' },
  ]

  return (
    <div className="space-y-6">
      <SEO title="Laporan" />

      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan</h1>
          <p className="text-gray-500">Statistik & analisis data GOR TAKUR per periode</p>
        </div>

        <div className="flex items-center gap-3">
          <select className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm" value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium cursor-pointer" onClick={loadData}>🔄 Refresh</button>
        </div>
      </header>

      <div className="inline-flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="text-lg">📆</div>
        <div className="font-semibold text-blue-700 text-sm">Periode: {months[bulan - 1]} {tahun}</div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">Memuat laporan...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
            {kpiCards.map((k) => (
              <div key={k.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-2xl mb-1">{k.icon}</div>
                <div className="text-xl font-extrabold truncate" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-2">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="font-semibold text-gray-800">📊 Pendapatan Harian</div>
              <p className="text-sm text-gray-500 mb-4">Grafik pendapatan per hari — {months[bulan - 1]} {tahun}</p>
              
              <div className="flex items-end gap-1 h-40 pt-4 border-b border-gray-100 pb-2">
                {byDay.map((d) => (
                  <div key={d.day} title={`${d.date}: Rp ${d.pendapatan.toLocaleString('id-ID')}`} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div className="w-full bg-emerald-500 rounded-t-sm transition-all hover:bg-emerald-600" style={{ height: `${Math.max((d.pendapatan / maxBar) * 100, d.pendapatan > 0 ? 8 : 2)}%` }} />
                    <div className="text-[10px] text-gray-400 mt-2">{d.day}</div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600 text-center mt-3">Total Pendapatan Bulan Ini: <strong className="text-emerald-600">Rp {stats.pendapatan.toLocaleString('id-ID')}</strong></div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="font-semibold text-gray-800 mb-3">🎯 Status Pembayaran</div>
                {Object.keys(byStatus).length === 0 ? (
                  <div className="text-center text-gray-400 py-6 text-sm">Tidak ada data status</div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(byStatus).map(([status, count]) => {
                      const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={status}>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="text-gray-700 capitalize font-medium">{status}</span>
                            <span className="font-semibold">{count} ({pct}%)</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="font-semibold text-gray-800 mb-3">🏆 Top Pelanggan</div>
                {topPelanggan.length === 0 ? (
                  <div className="text-center text-gray-400 py-6 text-sm">Belum ada pelanggan</div>
                ) : (
                  <div className="space-y-3">
                    {topPelanggan.map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-600">{i + 1}</div>
                          <div className="font-medium text-gray-800 text-sm truncate max-w-[180px]">{p.nama}</div>
                        </div>
                        <div className="text-sm font-semibold text-blue-600">{p.count}x booking</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="font-semibold text-gray-800 mb-1">📋 Detail Reservasi Periode Ini</div>
            <p className="text-sm text-gray-500 mb-4">{allReservasi.length} reservasi tercatat pada bulan {months[bulan - 1]} {tahun}</p>
            {allReservasi.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">Tidak ada reservasi pada periode ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                      <th className="p-3 font-semibold">#</th>
                      <th className="p-3 font-semibold">Pelanggan</th>
                      <th className="p-3 font-semibold">Tanggal</th>
                      <th className="p-3 font-semibold">Jam</th>
                      <th className="p-3 font-semibold">Total Harga</th>
                      <th className="p-3 font-semibold">Status Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allReservasi.map((r, i) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-gray-500">{i + 1}</td>
                        <td className="p-3 font-semibold text-gray-800">{r.nama_pelanggan}</td>
                        <td className="p-3 text-gray-600">{r.tanggal}</td>
                        <td className="p-3 font-medium text-blue-600">{r.jam_mulai?.slice(0, 5)} - {r.jam_selesai?.slice(0, 5)}</td>
                        <td className="p-3 font-semibold text-emerald-600">Rp {Number(r.total_harga || 0).toLocaleString('id-ID')}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            (r.status_pembayaran || '').toLowerCase() === 'lunas' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {r.status_pembayaran || 'Belum Lunas'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}