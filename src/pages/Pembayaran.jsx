import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { db } from '../lib/db'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const METODE_ICONS = {
  tunai: '💵',
  transfer: '🏦',
  qris: '📱',
  'e-wallet': '💳',
  bca: '🏦',
  mandiri: '🏦',
  cash: '💵',
}

export default function Pembayaran() {
  const [data, setData]         = useState([])
  const [lapangan, setLapangan]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [saving, setSaving]     = useState(false)
  
  // Form untuk update status pembayaran manual oleh admin
  const [statusBayar, setStatusBayar] = useState('Lunas')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [res, lap] = await Promise.all([
        db.query('reservasi'),
        db.query('lapangan'),
      ])
      setData(res || [])
      setLapangan(lap || [])
    } catch (error) {
      console.error(error)
      setData([])
      setLapangan([])
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (row) => {
    setSelectedRow(row)
    setStatusBayar(row.status_pembayaran || 'Lunas')
    setModal(true)
  }

  const handleSaveStatus = async (e) => {
    e.preventDefault()
    if (!selectedRow) return
    setSaving(true)
    try {
      await db.update('reservasi', selectedRow.id, {
        status_pembayaran: statusBayar
      })
      setModal(false)
      load()
    } catch (err) {
      alert('Gagal update status pembayaran: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!confirm('Hapus data reservasi/pembayaran ini?')) return
    try {
      await db.remove('reservasi', row.id)
      load()
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  // Filter berdasarkan status pembayaran
  const filtered = filterStatus 
    ? data.filter(d => (d.status_pembayaran || '').toLowerCase() === filterStatus.toLowerCase()) 
    : data

  // Summaries / Perhitungan Total Otomatis dari Tabel Reservasi
  const totalLunas = data
    .filter(d => (d.status_pembayaran || '').toLowerCase() === 'lunas')
    .reduce((s, d) => s + Number(d.total_harga || 0), 0)

  const totalBelum = data
    .filter(d => (d.status_pembayaran || '').toLowerCase() !== 'lunas')
    .reduce((s, d) => s + Number(d.total_harga || 0), 0)

  const countLunas = data.filter(d => (d.status_pembayaran || '').toLowerCase() === 'lunas').length
  const countBelum = data.filter(d => (d.status_pembayaran || '').toLowerCase() !== 'lunas').length

  const getNamaLapangan = (id) => {
    const l = lapangan.find(item => String(item.id) === String(id))
    return l?.nama || 'Lapangan'
  }

  const columns = [
    {
      key: 'nama_pemesan', label: 'Pelanggan',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 13 }}>{r.nama_pemesan || '-'}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{r.nomor_wa || '-'}</div>
        </div>
      )
    },
    {
      key: 'lapangan', label: 'Lapangan & Jadwal',
      render: (r) => (
        <div style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{getNamaLapangan(r.lapangan_id)}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{r.tanggal} • {r.jam_mulai?.slice(0,5)}</div>
        </div>
      )
    },
    {
      key: 'total_harga', label: 'Jumlah',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: 13 }}>
          Rp {Number(r.total_harga || 0).toLocaleString('id-ID')}
        </span>
      )
    },
    {
      key: 'status_pembayaran', label: 'Status',
      render: (r) => {
        const isLunas = (r.status_pembayaran || '').toLowerCase() === 'lunas'
        return (
          <span style={{
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            background: isLunas ? '#dcfce7' : '#fff7ed',
            color: isLunas ? '#16a34a' : '#ea580c'
          }}>
            {r.status_pembayaran || 'Belum Lunas'}
          </span>
        )
      }
    },
  ]

  return (
    <div className="space-y-6">
      <SEO title="Pembayaran" />

      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pembayaran</h1>
          <p className="text-gray-500">Kelola data pembayaran reservasi lapangan — {data.length} transaksi</p>
        </div>
      </header>

      {/* Kartu Ringkasan Keuangan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-3xl font-bold text-emerald-600 mb-1">Rp {totalLunas.toLocaleString('id-ID')}</div>
          <div className="text-sm text-gray-500">Total Pendapatan Lunas ({countLunas} transaksi)</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-3xl font-bold text-orange-500 mb-1">Rp {totalBelum.toLocaleString('id-ID')}</div>
          <div className="text-sm text-gray-500">Belum Lunas / Pending ({countBelum} transaksi)</div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <select className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="lunas">✅ Lunas</option>
            <option value="belum lunas">⏳ Belum Lunas</option>
          </select>
          {filterStatus && (
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm" onClick={() => setFilterStatus('')}>✕ Reset Filter</button>
          )}
          <span className="ml-auto text-sm text-gray-500">{filtered.length} dari {data.length} transaksi</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <DataTable
              columns={columns}
              data={filtered}
              onEdit={openEdit}
              onDelete={handleDelete}
              loading={loading}
              emptyIcon="💳"
              emptyText="Belum ada data pembayaran."
            />
          </div>
        </div>
      </div>

      {/* Modal Update Status Pembayaran */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Ubah Status Pembayaran"
        subtitle="Kelola status pelunasan transaksi"
        icon="💳"
      >
        <form onSubmit={handleSaveStatus} className="space-y-4">
          {selectedRow && (
            <div className="p-3 bg-gray-50 rounded-xl text-sm space-y-1">
              <div><strong>Pemesan:</strong> {selectedRow.nama_pemesan}</div>
              <div><strong>Total Tagihan:</strong> Rp {Number(selectedRow.total_harga || 0).toLocaleString('id-ID')}</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Pembayaran</label>
            <select 
              className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm" 
              value={statusBayar} 
              onChange={(e) => setStatusBayar(e.target.value)}
            >
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm cursor-pointer" onClick={() => setModal(false)}>Batal</button>
            <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition text-sm font-medium cursor-pointer" disabled={saving}>
              {saving ? '⏳ Menyimpan...' : '✔ Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}