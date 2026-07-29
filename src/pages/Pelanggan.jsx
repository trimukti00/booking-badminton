import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { db } from '../lib/db'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

const emptyForm = { nama: '', telepon: '', email: '', alamat: '' }

export default function Pelanggan() {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await db.query('pelanggan')
      setData(res || [])
    } catch (error) {
      console.error(error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true) }
  const openEdit = (row) => {
    setForm({ nama: row.nama || '', telepon: row.telepon || '', email: row.email || '', alamat: row.alamat || '' })
    setEditId(row.id)
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await db.update('pelanggan', editId, form)
      } else {
        await db.insert('pelanggan', form)
      }
      setModal(false)
      load()
    } catch (err) {
      alert('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row) => {
    if (!confirm(`Hapus pelanggan "${row.nama}"?`)) return
    try {
      await db.remove('pelanggan', row.id)
      load()
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  const filtered = data.filter((p) =>
    (p.nama?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.telepon || '').includes(search) ||
    (p.email?.toLowerCase() || '').includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'nama', label: 'Nama Pelanggan',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {(r.nama || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 13 }}>{r.nama}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.email || 'Tidak ada email'}</div>
          </div>
        </div>
      )
    },
    { key: 'telepon', label: 'Telepon', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.telepon}</span> },
    { key: 'alamat', label: 'Alamat', render: (r) => r.alamat || <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>-</span> },
    {
      key: 'created_at', label: 'Terdaftar',
      render: (r) => (
        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
          {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
        </span>
      )
    },
  ]

  return (
    <div className="space-y-6">
      <SEO title="Data Pelanggan" />

      <header>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Data Pelanggan</h1>
            <p className="text-gray-500">Kelola data pelanggan GOR TAKUR — {data.length} pelanggan terdaftar</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium cursor-pointer">＋ Tambah Pelanggan</button>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {[
          { label: 'Total Pelanggan', value: data.length, icon: '👥' },
          { label: 'Hasil Pencarian', value: filtered.length, icon: '🔍' },
          { label: 'Bulan Ini', value: data.filter(p => p.created_at?.slice(0, 7) === new Date().toISOString().slice(0, 7)).length, icon: '📅' },
        ].map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="text-2xl">{s.icon}</div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{s.value}</div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <input
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-gray-50 text-gray-800"
              placeholder="Cari nama, telepon, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl cursor-pointer" onClick={() => setSearch('')}>✕ Hapus Filter</button>
          )}
          <span className="ml-auto text-sm text-gray-500">{filtered.length} dari {data.length} data</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <DataTable
              columns={columns}
              data={filtered}
              onEdit={openEdit}
              onDelete={handleDelete}
              loading={loading}
              emptyIcon="👥"
              emptyText="Belum ada pelanggan terdaftar. Klik 'Tambah Pelanggan' untuk memulai."
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
        subtitle={editId ? 'Ubah informasi pelanggan' : 'Isi data pelanggan baru'}
        icon="👥"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Lengkap <span className="text-red-500">*</span></label>
            <input className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-800" placeholder="Nama pelanggan" value={form.nama} onChange={set('nama')} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">No. Telepon <span className="text-red-500">*</span></label>
              <input className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-800" placeholder="08xxxxxxxxxx" value={form.telepon} onChange={set('telepon')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-800" type="email" placeholder="email@contoh.com" value={form.email} onChange={set('email')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Alamat</label>
            <textarea className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-800" placeholder="Alamat lengkap pelanggan" value={form.alamat} onChange={set('alamat')} rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl cursor-pointer" onClick={() => setModal(false)}>Batal</button>
            <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium cursor-pointer disabled:opacity-50" disabled={saving}>
              {saving ? '⏳ Menyimpan...' : editId ? '✔ Simpan Perubahan' : '＋ Tambah Pelanggan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}