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
      const [reservasi, pembayaran, pelanggan] = await Promise.all([
        db.query('reservasi'),
        db.query('pembayaran'),
        db.query('pelanggan'),
      ])

      const filteredRes  = Array.isArray(reservasi) ? reservasi.filter(r => r.tanggal >= start && r.tanggal <= end) : []
      const filteredBayar = Array.isArray(pembayaran) ? pembayaran.filter(p => {
        const tgl = p.tanggal_bayar || p.created_at?.slice(0, 10) || ''
        return tgl >= start && tgl <= end
      }) : []
      const filteredPel = Array.isArray(pelanggan) ? pelanggan.filter(p => p.created_at?.slice(0, 10) >= start && p.created_at?.slice(0, 10) <= end) : []

      const pendapatan = filteredBayar.filter(p => p.status === 'lunas').reduce((s, p) => s + Number(p.jumlah || 0), 0)
      const lunas      = filteredBayar.filter(p => p.status === 'lunas').length
      const belum      = filteredBayar.filter(p => p.status === 'belum_dibayar').length

      // By day
      const daysInMonth = new Date(tahun, bulan, 0).getDate()
      const dayData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = String(i + 1).padStart(2, '0')
        const date = `${tahun}-${String(bulan).padStart(2, '0')}-${day}`
        const dayRes = filteredRes.filter(r => r.tanggal === date).length
        const dayInc = filteredBayar.filter(p => (p.tanggal_bayar || p.created_at?.slice(0, 10) || '') === date && p.status === 'lunas')
          .reduce((s, p) => s + Number(p.jumlah || 0), 0)
        return { day: i + 1, date, reservasi: dayRes, pendapatan: dayInc }
      })

      // By status
      const statusCount = {}
      filteredRes.forEach(r => { statusCount[r.status || 'menunggu'] = (statusCount[r.status || 'menunggu'] || 0) + 1 })

      // Top pelanggan
      const pelMap = {}
      (pelanggan || []).forEach(p => { pelMap[p.id] = p.nama })
      const pelCount = {}
      filteredRes.forEach(r => {
        if (r.pelanggan_id) pelCount[r.pelanggan_id] = (pelCount[r.pelanggan_id] || 0) + 1
      })
      const topPel = Object.entries(pelCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ nama: pelMap[id] || id, count }))

      setStats({ pendapatan, reservasi: filteredRes.length, pelangganBaru: filteredPel.length, lunas, belum })
      setByDay(dayData)
      setByStatus(statusCount)
      setTopPelanggan(topPel)
      setAllReservasi(filteredRes.map(r => ({ ...r, nama_pelanggan: pelMap[r.pelanggan_id] || '-' })))
    } catch (error) {
      console.error(error)
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
    { label: 'Total Pendapatan', value: `Rp ${stats.pendapatan.toLocaleString('id-ID')}`, icon: '💰', color: 'var(--success-600)', bg: 'var(--success-50)' },
    { label: 'Total Reservasi',  value: stats.reservasi,  icon: '📅', color: 'var(--primary-600)', bg: 'var(--primary-50)' },
    { label: 'Pembayaran Lunas', value: stats.lunas,      icon: '✅', color: '#16a34a',            bg: '#f0fdf4' },
    { label: 'Belum Dibayar',    value: stats.belum,      icon: '⏳', color: '#ea580c',            bg: '#fff7ed' },
    { label: 'Pelanggan Baru',   value: stats.pelangganBaru, icon: '👥', color: 'var(--accent-600)', bg: 'var(--info-50)' },
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
          <select className="px-4 py-2 border border-gray-200 rounded-xl bg-white" value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="px-4 py-2 border border-gray-200 rounded-xl bg-white" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl" onClick={loadData}>🔄 Refresh</button>
        </div>
      </header>

      <div className="inline-flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="text-lg">📆</div>
        <div className="font-semibold text-blue-700">Periode: {months[bulan - 1]} {tahun}</div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">Memuat laporan...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
            {kpiCards.map((k) => (
              <div key={k.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-2xl">{k.icon}</div>
                <div className="text-xl font-extrabold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-2">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="font-semibold text-gray-800">📊 Pendapatan Harian</div>
              <p className="text-sm text-gray-500">Grafik pendapatan per hari — {months[bulan - 1]} {tahun}</p>
              <div className="mt-4 flex items-end gap-2 h-40">
                {byDay.map((d) => (
                  <div key={d.day} title={`${d.day}: Rp ${d.pendapatan.toLocaleString('id-ID')}`} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-100 rounded-t-md" style={{ height: `${Math.max((d.pendapatan / maxBar) * 100, d.pendapatan > 0 ? 8 : 3)}%` }} />
                    <div className="text-xs text-gray-500 mt-2">{d.day}</div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-500 text-center mt-3">Total: <strong className="text-blue-600">Rp {stats.pendapatan.toLocaleString('id-ID')}</strong></div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="font-semibold text-gray-800">🎯 Status Reservasi</div>
                {Object.keys(byStatus).length === 0 ? (
                  <div className="text-center text-gray-500 py-6">Tidak ada data</div>
                ) : (
                  <div className="space-y-3 mt-3">
                    {Object.entries(byStatus).map(([status, count]) => {
                      const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={status}>
                          <div className="flex justify-between mb-1">
                            <span className={`text-sm text-gray-700`}>{status}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                          <div className="bg-gray-100 rounded h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="font-semibold text-gray-800">🏆 Top Pelanggan</div>
                {topPelanggan.length === 0 ? (
                  <div className="text-center text-gray-500 py-6">Tidak ada data</div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {topPelanggan.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i < 2 ? 'text-white' : 'text-gray-600'}`} style={{ background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : i === 1 ? 'linear-gradient(135deg, #9ca3af, #6b7280)' : '#f1f5f9' }}>{i + 1}</div>
                          <div className="font-medium text-gray-800 truncate max-w-[160px]">{p.nama}</div>
                        </div>
                        <div className="text-sm font-semibold text-blue-600">{p.count}x</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="font-semibold text-gray-800 mb-2">📋 Detail Reservasi</div>
            <p className="text-sm text-gray-500 mb-4">{allReservasi.length} reservasi pada periode ini</p>
            {allReservasi.length === 0 ? (
              <div className="text-center text-gray-500 py-6">Tidak ada reservasi pada periode ini.</div>
            ) : (
              <div>
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4">#</th>
                      <th className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4">Pelanggan</th>
                      <th className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4">Tanggal</th>
                      <th className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4">Jam</th>
                      <th className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReservasi.map((r, i) => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-gray-500">{i + 1}</td>
                        <td className="p-4"><strong className="text-gray-800">{r.nama_pelanggan}</strong></td>
                        <td className="p-4 text-gray-500">{r.tanggal}</td>
                        <td className="p-4 font-semibold">{r.jam_mulai?.slice(0, 5) || r.jam || '-'}{r.jam_selesai ? ` - ${r.jam_selesai.slice(0, 5)}` : ''}</td>
                        <td className="p-4"><span className="text-sm text-gray-600">{r.status || 'menunggu'}</span></td>
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
