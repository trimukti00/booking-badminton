import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { db } from '../lib/db'
import { supabase } from '../lib/supabase'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

const emptyLapangan = { nama: '', deskripsi: '', harga_per_jam: '', status: 'tersedia', foto_url: '' }

export default function Admin() {
  const { user } = useAuth()
  const [tab, setTab] = useState('admins')

  const [admins, setAdmins]     = useState([])
  const [lapangan, setLapangan] = useState([])
  const [loading, setLoading]   = useState(true)

  const [lapModal, setLapModal] = useState(false)
  const [lapForm, setLapForm]   = useState(emptyLapangan)
  const [lapEditId, setLapEditId] = useState(null)
  const [savingLap, setSavingLap] = useState(false)
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [a, l] = await Promise.all([db.query('profiles', { filters: { role: 'admin' } }), db.query('lapangan')])
      setAdmins(Array.isArray(a) ? a : [])
      setLapangan(Array.isArray(l) ? l : [])
    } catch (error) {
      console.error(error)
      setAdmins([])
      setLapangan([])
    } finally {
      setLoading(false)
    }
  }

  // Admin handlers
  const deleteAdmin = async (row) => {
    if (row.id === user?.id) { alert('Tidak bisa menghapus akun sendiri!'); return }
    if (!confirm(`Hapus admin "${row.nama_lengkap || row.email}"?`)) return
    await db.remove('profiles', row.id)
    load()
  }

  // Lapangan handlers
  const openAddLap = () => { setLapForm(emptyLapangan); setLapEditId(null); setLapModal(true) }
  const openEditLap = (row) => {
    setLapForm({ nama: row.nama, deskripsi: row.deskripsi || '', harga_per_jam: row.harga_per_jam, status: row.status, foto_url: row.foto_url || '' })
    setLapEditId(row.id)
    setLapModal(true)
  }
  const saveLap = async (e) => {
    e.preventDefault()
    setSavingLap(true)
    try {
      if (lapEditId) {
        const updates = { ...lapForm }
        if (photos && photos.length) {
          const uploads = photos.map((file, idx) => {
            const ext = file.name.split('.').pop()
            const fileName = `lapangan_${Date.now()}_${idx}.${ext}`
            const path = `lapangan/${fileName}`
            return db.uploadFile('foto-lapangan', file, path)
          })
          const urls = await Promise.all(uploads)
          updates.foto_url = JSON.stringify(urls)
        }
        await db.update('lapangan', lapEditId, updates)
      } else {
        let fotoUrl = ''
        if (photos && photos.length) {
          const uploads = photos.map((file, idx) => {
            const ext = file.name.split('.').pop()
            const fileName = `lapangan_${Date.now()}_${idx}.${ext}`
            const path = `lapangan/${fileName}`
            return db.uploadFile('foto-lapangan', file, path)
          })
          const urls = await Promise.all(uploads)
          fotoUrl = JSON.stringify(urls)
        }
        const payload = { nama: lapForm.nama, deskripsi: lapForm.deskripsi || '', harga_per_jam: lapForm.harga_per_jam, foto_url: fotoUrl, status: lapForm.status }
        const { data, error } = await supabase.from('lapangan').insert(payload).select()
        if (error) throw error
      }
      setLapModal(false)
      setLapForm(emptyLapangan)
      photoPreviews.forEach(u => { try { URL.revokeObjectURL(u) } catch (e) {} })
      setPhotos([])
      setPhotoPreviews([])
      load()
      alert('Berhasil menyimpan lapangan.')
    } catch (error) {
      console.error(error)
      alert(error?.message || 'Gagal menyimpan lapangan.')
    } finally {
      setSavingLap(false)
    }
  }
  const deleteLap = async (row) => {
    if (!confirm(`Hapus "${row.nama}"?`)) return
    await db.remove('lapangan', row.id)
    load()
  }

  const adminCols = [
    {
      key: 'admin', label: 'Admin',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white" style={{ background: r.role === 'superadmin' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}>
            {(r.nama_lengkap || r.email || 'A')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-800">
              {r.nama_lengkap || '-'} {r.id === user?.id && <span className="ml-2 text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">Anda</span>}
            </div>
            <div className="text-xs text-gray-500">{r.email ? `@${r.email}` : ''}</div>
          </div>
        </div>
      )
    },
    { key: 'role', label: 'Role', render: (r) => <span className="text-sm text-gray-600">{r.role}</span> },
    { key: 'created_at', label: 'Terdaftar', render: (r) => <span className="text-sm text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span> },
  ]

  const getLapanganPhotoUrl = (foto_url) => {
    if (!foto_url) return 'https://via.placeholder.com/80?text=No+Image'
    if (typeof foto_url !== 'string') return 'https://via.placeholder.com/80?text=No+Image'
    try {
      const parsed = JSON.parse(foto_url)
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') return parsed[0]
    } catch (err) {}
    if (foto_url.includes(',')) {
      const first = foto_url.split(',').map(p => p.trim()).find(Boolean)
      if (first) return first
    }
    return foto_url
  }

  const lapCols = [
    {
      key: 'nama', label: 'Lapangan',
      render: (r) => {
        const thumbnail = getLapanganPhotoUrl(r.foto_url)
        const thumbnailUrl = typeof thumbnail === 'string' ? thumbnail : 'https://via.placeholder.com/80?text=No+Image'
        return (
          <div className="flex items-center gap-3">
            <img src={thumbnailUrl} alt={r.nama || 'Lapangan'} className="w-13 h-13 object-cover rounded-lg border" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image' }} />
            <div>
              <div className="font-semibold text-sm text-gray-800">{r.nama}</div>
              <div className="text-xs text-gray-400">ID: {r.id?.toString().slice(0, 12)}...</div>
            </div>
          </div>
        )
      }
    },
    { key: 'harga_per_jam', label: 'Harga / Jam', render: (r) => <span className="font-semibold text-sm text-green-600">Rp {Number(r.harga_per_jam || 0).toLocaleString('id-ID')}</span> },
    { key: 'status', label: 'Status', render: (r) => <span className="text-sm text-gray-600">{r.status === 'tersedia' ? '✅ Tersedia' : r.status === 'perbaikan' ? '🔧 Perbaikan' : '🚫 Tidak Tersedia'}</span> },
  ]

  const tabs = [
    { id: 'admins',   label: 'Admin',    icon: '👤',  count: admins.length },
    { id: 'lapangan', label: 'Lapangan', icon: '🏸', count: lapangan.length },
  ]

  return (
    <div className="space-y-6">
      <SEO title="Data Admin" />

      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Admin</h1>
          <p className="text-gray-500">Kelola akun admin dan data lapangan GOR TAKUR</p>
        </div>
        <div />
      </header>

      {user && (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-sky-50 to-blue-50 border border-blue-100 rounded-2xl">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}>{(user.nama_lengkap || user.username || 'A')[0].toUpperCase()}</div>
          <div>
            <div className="font-semibold text-gray-800">Masuk sebagai: {user.nama_lengkap || user.username}</div>
            <div className="text-sm text-gray-500">@{user.username} • <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{user.role}</span></div>
          </div>
          <div className="ml-auto text-sm text-gray-400">Login aktif</div>
        </div>
      )}

      <div className="flex gap-3">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${tab === t.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 border border-gray-200'}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${tab === t.id ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'admins' ? (
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Daftar Admin</h2>
              <p className="text-sm text-gray-500">{admins.length} akun admin terdaftar</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
            <div className="p-6">
              <DataTable columns={adminCols} data={admins} onDelete={deleteAdmin} loading={loading} emptyIcon="👤" emptyText="Belum ada admin terdaftar." />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Data Lapangan</h2>
              <p className="text-sm text-gray-500">{lapangan.length} lapangan terdaftar</p>
            </div>
            <button onClick={openAddLap} className="bg-blue-600 text-white px-4 py-2 rounded-xl">＋ Tambah Lapangan</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
            <div className="p-6">
              <DataTable columns={lapCols} data={lapangan} onEdit={openEditLap} onDelete={deleteLap} loading={loading} emptyIcon="🏸" emptyText="Belum ada lapangan terdaftar." />
            </div>
          </div>
        </div>
      )}

      <Modal open={lapModal} onClose={() => setLapModal(false)} title={lapEditId ? 'Edit Lapangan' : 'Tambah Lapangan Baru'} subtitle="Kelola data lapangan badminton" icon="🏸">
        <form onSubmit={saveLap} className="flex flex-col max-h-[90vh] min-w-[320px]">
          <div className="overflow-y-auto p-6 flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Lapangan <span className="text-red-500">*</span></label>
              <input className="w-full px-4 py-2 border border-gray-200 rounded-xl" placeholder="Contoh: Lapangan 1" value={lapForm.nama} onChange={(e) => setLapForm({ ...lapForm, nama: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
              <textarea className="w-full px-4 py-2 border border-gray-200 rounded-xl" placeholder="Deskripsi singkat lapangan (opsional)" value={lapForm.deskripsi} onChange={(e) => setLapForm({ ...lapForm, deskripsi: e.target.value })} rows={3} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Foto Lapangan</label>
              <input className="w-full" type="file" accept="image/*" multiple onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 5) { alert('Maksimal 5 foto yang diperbolehkan!') }
                const limited = files.slice(0, 5)
                const previews = limited.map(f => URL.createObjectURL(f))
                photoPreviews.forEach(u => { try { URL.revokeObjectURL(u) } catch (e) {} })
                setPhotos(limited)
                setPhotoPreviews(previews)
              }} />
              {photoPreviews && photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {photoPreviews.map((src, i) => (
                    <img key={i} src={src} alt={`preview-${i}`} className="w-full h-24 object-cover rounded-md border" />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Harga / Jam (Rp) <span className="text-red-500">*</span></label>
                <input className="w-full px-4 py-2 border border-gray-200 rounded-xl" type="number" placeholder="Contoh: 50000" value={lapForm.harga_per_jam} onChange={(e) => setLapForm({ ...lapForm, harga_per_jam: e.target.value })} required min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-xl" value={lapForm.status} onChange={(e) => setLapForm({ ...lapForm, status: e.target.value })}>
                  <option value="tersedia">✅ Tersedia</option>
                  <option value="perbaikan">🔧 Dalam Perbaikan</option>
                  <option value="tidak_tersedia">🚫 Tidak Tersedia</option>
                </select>
              </div>
            </div>

            {lapForm.harga_per_jam && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-md text-green-700">💰 Harga: <strong>Rp {Number(lapForm.harga_per_jam || 0).toLocaleString('id-ID')} / jam</strong></div>
            )}
          </div>

          <div className="p-6 border-t mt-auto flex justify-end gap-3">
            <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl" onClick={() => setLapModal(false)}>Batal</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl" disabled={savingLap}>{savingLap ? '⏳ Menyimpan...' : lapEditId ? '✔ Simpan' : '＋ Tambah Lapangan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
