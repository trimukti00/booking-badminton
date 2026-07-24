import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { db } from '../lib/db'
import Modal from '../components/Modal'

const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

const STATUS_OPTIONS = [
  { value: 'menunggu',     label: 'Menunggu',     color: '#f59e0b' },
  { value: 'dikonfirmasi', label: 'Dikonfirmasi', color: '#0ea5e9' },
  { value: 'selesai',      label: 'Selesai',      color: '#22c55e' },
  { value: 'dibatalkan',   label: 'Dibatalkan',   color: '#94a3b8' },
]

const LEGEND = [
  { color: '#e2e8f0', border: '#cbd5e1', label: 'Tersedia' },
  { color: '#f59e0b', label: 'Menunggu' },
  { color: '#0ea5e9', label: 'Dikonfirmasi' },
  { color: '#22c55e', label: 'Selesai' },
  { color: '#94a3b8', label: 'Dibatalkan' },
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
      setLapangan(l)
      setReservasi(r.filter((res) => res.tanggal === tanggal))
      setPelanggan(p)
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
    reservasi.find((r) => r.lapangan_id === lapanganId && r.jam_mulai === jam && r.status !== 'dibatalkan')

  const getNamaPelanggan = (id) =>
    pelanggan.find((p) => p.id === id)?.nama || '-'

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
    await db.insert('reservasi', { ...form, tanggal, status: 'menunggu' })
    setSaving(false)
    setModal(false)
    load()
  }

  const handleUpdateStatus = async (id, status) => {
    await db.update('reservasi', id, { status })
    setDetailModal(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus reservasi ini?')) return
    await db.remove('reservasi', id)
    setDetailModal(false)
    load()
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
            <button onClick={() => setTanggal(addDays(tanggal, -1))} className="px-3 py-2 rounded-xl bg-gray-100">‹</button>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl bg-white" />
            <button onClick={() => setTanggal(addDays(tanggal, 1))} className="px-3 py-2 rounded-xl bg-gray-100">›</button>
          </div>
          <button onClick={() => setTanggal(new Date().toISOString().slice(0, 10))} className="bg-gray-100 px-3 py-2 rounded-xl">Hari Ini</button>
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
              <div style={{ width: 14, height: 14, background: l.color, borderRadius: 6, border: l.border ? `1px dashed ${l.border}` : undefined }} />
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
                  <div className="font-semibold text-gray-800">🏸 {l.nama}</div>
                  <div className="text-sm text-gray-500">ID: {l.id?.toString().slice(0, 12)}</div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {HOURS.map((jam) => {
                    const booking = getBooking(l.id, jam)
                    return (
                      <div
                        key={jam}
                        onClick={() => booking ? openDetail(booking) : openAdd(l.id, jam)}
                        className={`border rounded-lg p-3 text-center cursor-pointer transition ${booking ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-blue-50'}`}
                      >
                        <div className="text-sm font-medium text-gray-700">{jam}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {booking ? `${getNamaPelanggan(booking.pelanggan_id)} • ${STATUS_OPTIONS.find(s => s.value === booking.status)?.label || 'Menunggu'}` : 'Tersedia'}
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
        subtitle={`Lapangan ${lapangan.find(l => l.id === form.lapangan_id)?.nama || ''} &mdash; ${tanggal}`}
        icon="📅"
      >
        <form onSubmit={handleSave} className="form-grid">
          <div className="form-group">
            <label className="form-label">Pelanggan <span className="required">*</span></label>
            <select
              className="form-control"
              value={form.pelanggan_id}
              onChange={(e) => setForm({ ...form, pelanggan_id: e.target.value })}
              required
            >
              <option value="">-- Pilih Pelanggan --</option>
              {pelanggan.map((p) => (
                <option key={p.id} value={p.id}>{p.nama} &mdash; {p.telepon}</option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Jam Mulai</label>
              <input className="form-control" value={form.jam_mulai} readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Jam Selesai</label>
              <select
                className="form-control"
                value={form.jam_selesai}
                onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })}
              >
                {HOURS.filter(h => h > form.jam_mulai).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan (opsional)</label>
            <textarea
              className="form-control"
              placeholder="Catatan tambahan..."
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              rows={2}
            />
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--primary-700)', border: '1px solid var(--primary-200)' }}>
            📅 <strong>Tanggal:</strong> {formatDateID(tanggal)} &bull;{' '}
            🕐 <strong>{form.jam_mulai} - {form.jam_selesai}</strong>
          </div>

          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>
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
        maxWidth={440}
      >
        {selectedBooking && (
          <div className="form-grid">
            {[
              { label: 'Pelanggan', value: getNamaPelanggan(selectedBooking.pelanggan_id) },
              { label: 'Lapangan', value: lapangan.find(l => l.id === selectedBooking.lapangan_id)?.nama || '-' },
              { label: 'Tanggal', value: formatDateID(selectedBooking.tanggal) },
              { label: 'Jam', value: `${selectedBooking.jam_mulai?.slice(0,5)} - ${selectedBooking.jam_selesai?.slice(0,5) || '..'}` },
              { label: 'Status', value: <span className={`badge badge-${selectedBooking.status || 'menunggu'}`}>{selectedBooking.status || 'menunggu'}</span> },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gray-500)' }}>{label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--gray-800)' }}>{value}</span>
              </div>
            ))}

            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>Update Status</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleUpdateStatus(selectedBooking.id, s.value)}
                    style={{
                      padding: '7px 14px', border: `1.5px solid ${s.color}`,
                      background: selectedBooking.status === s.value ? s.color : 'white',
                      color: selectedBooking.status === s.value ? 'white' : s.color,
                      borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-footer">
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleDelete(selectedBooking.id)}
              >
                🗑️ Hapus Reservasi
              </button>
              <button type="button" className="btn-secondary" onClick={() => setDetailModal(false)}>
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
