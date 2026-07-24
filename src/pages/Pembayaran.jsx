import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { db } from '../lib/db'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const emptyForm = { reservasi_id: '', jumlah: '', metode: 'tunai', status: 'belum_dibayar', tanggal_bayar: '' }

const METODE_ICONS = {
  tunai: '💵',
  transfer: '🏦',
  qris: '📱',
  'e-wallet': '💳',
}

const STATUS_COLORS = {
  lunas:        { bg: 'var(--success-50)', color: 'var(--success-600)' },
  belum_dibayar:{ bg: '#fff7ed',           color: '#ea580c' },
  batal:        { bg: 'var(--danger-50)',  color: 'var(--danger-600)' },
}

export default function Pembayaran() {
  const [data, setData]         = useState([])
  const [reservasi, setReservasi] = useState([])
  const [pelanggan, setPelanggan] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(emptyForm)
  const [editId, setEditId]     = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [saving, setSaving]     = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [p, r, pel] = await Promise.all([
        db.query('pembayaran'),
        db.query('reservasi'),
        db.query('pelanggan'),
      ])
      setData(p)
      setReservasi(r)
      setPelanggan(pel)
    } catch (error) {
      console.error(error)
      setData([])
      setReservasi([])
      setPelanggan([])
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => {
    const newForm = { ...form, [k]: e.target.value }
    // Auto-set tanggal_bayar when status = lunas
    if (k === 'status' && e.target.value === 'lunas' && !newForm.tanggal_bayar) {
      newForm.tanggal_bayar = new Date().toISOString().slice(0, 10)
    }
    setForm(newForm)
  }

  const getNamaPelanggan = (reservasiId) => {
    const res = reservasi.find((r) => r.id === reservasiId)
    if (!res) return '-'
    const pel = pelanggan.find((p) => p.id === res.pelanggan_id)
    return pel?.nama || res.nama || '-'
  }

  const getReservasiLabel = (r) => {
    const nama = getNamaPelanggan(r.id)
    const jam = r.jam_mulai?.slice(0, 5) || r.jam || ''
    return `${nama} — ${r.tanggal} ${jam}`
  }

  const openAdd = () => { setForm(emptyForm); setEditId(null); setProofFile(null); setUploadError(''); setModal(true) }
  const openEdit = (row) => {
    setForm({
      reservasi_id: row.reservasi_id || '',
      jumlah: row.jumlah || '',
      metode: row.metode || 'tunai',
      status: row.status || 'belum_dibayar',
      tanggal_bayar: row.tanggal_bayar || '',
    })
    setEditId(row.id)
    setProofFile(null)
    setUploadError('')
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setUploadError('')
    const payload = {
      ...form,
      tanggal_bayar: form.status === 'lunas' ? (form.tanggal_bayar || new Date().toISOString().slice(0, 10)) : form.tanggal_bayar,
    }

    if (proofFile) {
      const fileName = `bukti-${form.reservasi_id || 'unknown'}-${Date.now()}.${proofFile.name.split('.').pop()}`
      const publicUrl = await db.uploadProof(proofFile, fileName)
      if (!publicUrl) {
        setUploadError('Upload bukti bayar gagal. Silakan coba lagi.')
        setSaving(false)
        return
      }
      payload.bukti_bayar = publicUrl
    }

    if (editId) {
      await db.update('pembayaran', editId, payload)
    } else {
      await db.insert('pembayaran', payload)
    }
    setSaving(false)
    setModal(false)
    setProofFile(null)
    load()
  }

  const handleDelete = async (row) => {
    if (!confirm('Hapus data pembayaran ini?')) return
    await db.remove('pembayaran', row.id)
    load()
  }

  const filtered = filterStatus ? data.filter(d => d.status === filterStatus) : data

  // Summaries
  const totalLunas       = data.filter(d => d.status === 'lunas').reduce((s, d) => s + Number(d.jumlah || 0), 0)
  const totalBelum       = data.filter(d => d.status === 'belum_dibayar').reduce((s, d) => s + Number(d.jumlah || 0), 0)
  const countLunas       = data.filter(d => d.status === 'lunas').length
  const countBelum       = data.filter(d => d.status === 'belum_dibayar').length
  const countBatal       = data.filter(d => d.status === 'batal').length

  const columns = [
    {
      key: 'pelanggan', label: 'Pelanggan',
      render: (r) => (
        <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 13 }}>
          {getNamaPelanggan(r.reservasi_id)}
        </div>
      )
    },
    {
      key: 'jumlah', label: 'Jumlah',
      render: (r) => (
        <span style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: 13 }}>
          Rp {Number(r.jumlah || 0).toLocaleString('id-ID')}
        </span>
      )
    },
    {
      key: 'metode', label: 'Metode',
      render: (r) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          {METODE_ICONS[r.metode] || '💰'} {r.metode}
        </span>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (r) => <span className={`badge badge-${r.status || 'belum_dibayar'}`}>{r.status || 'belum_dibayar'}</span>
    },
    {
      key: 'tanggal_bayar', label: 'Tgl Bayar',
      render: (r) => (
        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
          {r.tanggal_bayar
            ? new Date(r.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : <span style={{ color: 'var(--gray-300)', fontStyle: 'italic' }}>Belum dibayar</span>
          }
        </span>
      )
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
        <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium">＋ Tambah Pembayaran</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-2xl">💰</div>
          <div className="text-3xl font-bold text-blue-600 mb-2">Rp {totalLunas.toLocaleString('id-ID')}</div>
          <div className="text-sm text-gray-500">Total Lunas ({countLunas})</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-2xl">⏳</div>
          <div className="text-3xl font-bold text-blue-600 mb-2">Rp {totalBelum.toLocaleString('id-ID')}</div>
          <div className="text-sm text-gray-500">Belum Dibayar ({countBelum})</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-2xl">🚫</div>
          <div className="text-3xl font-bold text-blue-600 mb-2">{countBatal}</div>
          <div className="text-sm text-gray-500">Dibatalkan</div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <select className="px-4 py-2 border border-gray-200 rounded-xl bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="lunas">✅ Lunas</option>
            <option value="belum_dibayar">⏳ Belum Dibayar</option>
            <option value="batal">🚫 Batal</option>
          </select>
          {filterStatus && (
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl" onClick={() => setFilterStatus('')}>✕ Reset Filter</button>
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

      {/* Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit Pembayaran' : 'Tambah Pembayaran Baru'}
        subtitle="Input data transaksi pembayaran"
        icon="💳"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reservasi <span className="text-red-500">*</span></label>
            <select className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white" value={form.reservasi_id} onChange={set('reservasi_id')} required>
              <option value="">-- Pilih Reservasi --</option>
              {reservasi.map((r) => (
                <option key={r.id} value={r.id}>{getReservasiLabel(r)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Jumlah Pembayaran (Rp) <span className="text-red-500">*</span></label>
            <input className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white" type="number" placeholder="Contoh: 150000" value={form.jumlah} onChange={set('jumlah')} required min={0} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Metode Pembayaran</label>
              <select className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white" value={form.metode} onChange={set('metode')}>
                <option value="tunai">💵 Tunai</option>
                <option value="transfer">🏦 Transfer Bank</option>
                <option value="qris">📱 QRIS</option>
                <option value="e-wallet">💳 E-Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white" value={form.status} onChange={set('status')}>
                <option value="belum_dibayar">⏳ Belum Dibayar</option>
                <option value="lunas">✅ Lunas</option>
                <option value="batal">🚫 Batal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Bukti Bayar</label>
            <input className="w-full" type="file" accept="image/*" onChange={(e) => { setProofFile(e.target.files?.[0] || null) }} />
            {proofFile && <p className="text-sm mt-2">{proofFile.name}</p>}
            {uploadError && <p className="text-sm mt-2 text-red-600">{uploadError}</p>}
          </div>

          {form.status === 'lunas' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal Bayar</label>
              <input className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white" type="date" value={form.tanggal_bayar} onChange={set('tanggal_bayar')} />
            </div>
          )}

          {form.jumlah && (
            <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-md">
              💰 Total: <strong>Rp {Number(form.jumlah || 0).toLocaleString('id-ID')}</strong> via <strong>{METODE_ICONS[form.metode]} {form.metode}</strong>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl" onClick={() => setModal(false)}>Batal</button>
            <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium" disabled={saving}>{saving ? '⏳ Menyimpan...' : editId ? '✔ Simpan' : '＋ Tambah'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
