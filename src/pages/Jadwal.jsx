import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { db } from '../lib/db'
import Modal from '../components/Modal'

const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

const STATUS_OPTIONS = [
  { value: 'menunggu',     label: 'Menunggu',     color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
  { value: 'dikonfirmasi', label: 'Dikonfirmasi', color: '#0ea5e9', bg: '#e0f2fe', border: '#7dd3fc' },
  { value: 'selesai',      label: 'Selesai',      color: '#22c55e', bg: '#dcfce7', border: '#86efac' },
  { value: 'dibatalkan',   label: 'Dibatalkan',   color: '#94a3b8', bg: '#f1f5f9', border: '#cbd5e1' },
]

const LEGEND = [
  { color: '#ffffff', border: '#cbd5e1', label: 'Tersedia' },
  { color: '#fef3c7', border: '#fcd34d', text: '#f59e0b', label: 'Menunggu' },
  { color: '#e0f2fe', border: '#7dd3fc', text: '#0ea5e9', label: 'Dikonfirmasi' },
  { color: '#dcfce7', border: '#86efac', text: '#22c55e', label: 'Selesai' },
  { color: '#f1f5f9', border: '#cbd5e1', text: '#94a3b8', label: 'Dibatalkan' },
]

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDateID(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
  })
}

export default function Jadwal() {
  const [lapangan, setLapangan]   = useState([])
  const [reservasi, setReservasi] = useState([])
  const [pelanggan, setPelanggan] = useState([])
  const [tanggal, setTanggal]     = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading]     = useState(true)

  const [modal, setModal]   = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedSlot, setSelectedSlot]       = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [form, setForm]   = useState({ pelanggan_id: '', lapangan_id: '', jam_mulai: '', jam_selesai: '', catatan: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [tanggal])

  const load = async () => {
    setLoading(true)
    try {
      const [l, r, p] = await Promise.all([
        db.query('lapangan'),
        db.query('reservasi'),
        db.query('pelanggan'),
      ])
      setLapangan(l || [])
      setReservasi((r || []).filter((res) => res.tanggal === tanggal))
      setPelanggan(p || [])
    } catch (error) {
      console.error(error)
      setLapangan([])
      setReservasi([])
      setPelanggan([])
    } finally {
      setLoading(false)
    }
  }

  const getBooking = (lapanganId, jam) =>
    reservasi.find((r) => 
      String(r.lapangan_id) === String(lapanganId) && 
      r.jam_mulai?.slice(0, 5) === jam.slice(0, 5) && 
      r.status !== 'dibatalkan'
    )

  const getNamaPelanggan = (id) => {
    const found = pelanggan.find((p) => String(p.id) === String(id))
    return found?.nama || '-'
  }

  const openAdd = (lapanganId, jam) => {
    const jamIdx = HOURS.indexOf(jam)
    const jamSelesai = HOURS[jamIdx + 1] || `${String(Number(jam.split(':')[0]) + 1).padStart(2, '0')}:00`
    setForm({ pelanggan_id: '', lapangan_id: lapanganId, jam_mulai: jam, jam_selesai: jamSelesai, catatan: '' })
    setSelectedSlot({ lapanganId, jam })
    setModal(true)
  }

  const openDetail = (booking) => {
    setSelectedBooking(booking)
    setDetailModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await db.insert('reservasi', { ...form, tanggal, status: 'menunggu' })
      setModal(false)
      load()
    } catch (err) {
      alert('Gagal menyimpan reservasi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await db.update('reservasi', id, { status })
      setDetailModal(false)
      load()
    } catch (err) {
      alert('Gagal update status: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus reservasi ini?')) return
    try {
      await db.remove('reservasi', id)
      setDetailModal(false)
      load()
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  const totalBooked = reservasi.filter(r => r.status !== 'dibatalkan').length
  const totalSlots  = lapangan.length * HOURS.length

  return (
    <div className="space-y-6">
      <SEO title="Jadwal Lapangan" />

      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jadwal Lapangan</h1>
          <p className="text-gray-500">Klik slot tersedia untuk membuat reservasi — {totalBooked} dari {totalSlots} slot terisi</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setTanggal(addDays(tanggal, -1))} className="px-3 py-2 rounded-xl bg-gray-100 cursor-pointer">‹</button>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-800" />
            <button onClick={() => setTanggal(addDays(tanggal, 1))} className="px-3 py-2 rounded-xl bg-gray-100 cursor-pointer">›</button>
          </div>
          <button onClick={() => setTanggal(new Date().toISOString().slice(0, 10))} className="bg-gray-100 px-3 py-2 rounded-xl cursor-pointer text-gray-700">Hari Ini</button>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl">📅</div>
          <div>
            <div className="font-semibold text-gray-800">{formatDateID(tanggal)}</div>
            <div className="text-sm text-gray-500">{totalBooked} reservasi aktif • {totalSlots - totalBooked} slot kosong</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {LEGEND.map((l, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
              <div style={{ width: 14, height: 14, background: l.color, borderRadius: 6, border: `1px solid ${l.border}` }} />
              <div>{l.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {loading ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">Memuat jadwal...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {lapangan.map((l) => (
              <div key={l.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-800 text-base">🏸 {l.nama}</div>
                  <div className="text-xs text-gray-400">ID: {l.id?.toString().slice(0, 8)}</div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {HOURS.map((jam) => {
                    const booking = getBooking(l.id, jam)
                    const statusObj = STATUS_OPTIONS.find(s => s.value === (booking?.status || 'menunggu'))
                    
                    // Menentukan warna kotak berdasarkan status booking
                    const slotStyle = booking ? {
                      backgroundColor: statusObj?.bg || '#fef3c7',
                      borderColor: statusObj?.border || '#fcd34d',
                    } : {
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                    }

                    return (
                      <div
                        key={jam}
                        onClick={() => booking ? openDetail(booking) : openAdd(l.id, jam)}
                        style={slotStyle}
                        className="border rounded-xl p-3 text-center cursor-pointer transition hover:opacity-80 shadow-xs"
                      >
                        <div className="text-sm font-semibold text-gray-700">{jam}</div>
                        <div className="text-xs mt-1 truncate font-medium" style={{ color: booking ? statusObj?.color || '#2563eb' : '#9ca3af' }}>
                          {booking ? (getNamaPelanggan(booking.pelanggan_id) !== '-' ? getNamaPelanggan(booking.pelanggan_id) : 'Dibooking') : 'Tersedia'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Reservation Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Buat Reservasi Baru"
        subtitle={`Lapangan ${lapangan.find(l => String(l.id) === String(form.lapangan_id))?.nama || ''} — ${tanggal}`}
        icon="📅"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pelanggan <span className="text-red-500">*</span></label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-800"
              value={form.pelanggan_id}
              onChange={(e) => setForm({ ...form, pelanggan_id: e.target.value })}
              required
            >
              <option value="">-- Pilih Pelanggan --</option>
              {pelanggan.map((p) => (
                <option key={p.id} value={p.id}>{p.nama} — {p.telepon}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
              <input className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-800" value={form.jam_mulai} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-800"
                value={form.jam_selesai}
                onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })}
              >
                {HOURS.filter(h => h > form.jam_mulai).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-800"
              placeholder="Catatan tambahan..."
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl cursor-pointer" onClick={() => setModal(false)}>Batal</button>
            <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-medium cursor-pointer disabled:opacity-50" disabled={saving}>
              {saving ? '⏳ Menyimpan...' : '✔ Simpan Reservasi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail/Edit Modal */}
      <Modal
        open={detailModal}
        onClose={() => setDetailModal(false)}
        title="Detail Reservasi"
        subtitle="Lihat & kelola status reservasi"
        icon="📋"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl space-y-2 text-sm border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500">Pelanggan</span><span className="font-semibold text-gray-800">{getNamaPelanggan(selectedBooking.pelanggan_id)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Lapangan</span><span className="font-semibold text-gray-800">{lapangan.find(l => String(l.id) === String(selectedBooking.lapangan_id))?.nama || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span className="font-semibold text-gray-800">{formatDateID(selectedBooking.tanggal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Jam</span><span className="font-semibold text-blue-600">{selectedBooking.jam_mulai?.slice(0,5)} - {selectedBooking.jam_selesai?.slice(0,5) || '..'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-semibold capitalize text-gray-800">{selectedBooking.status || 'menunggu'}</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleUpdateStatus(selectedBooking.id, s.value)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                      selectedBooking.status === s.value 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition cursor-pointer"
                onClick={() => handleDelete(selectedBooking.id)}
              >
                🗑️ Hapus Reservasi
              </button>
              <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer" onClick={() => setDetailModal(false)}>
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}