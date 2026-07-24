import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { db } from '../lib/db'

const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

const prices = [
  {
    name: 'Main Sekali',
    amount: '5.000',
    period: '/orang',
    tagline: 'Main sepuasnya!',
    desc: 'Cocok untuk main santai, latihan, atau kumpul bareng teman.',
    features: ['Akses main sepuasnya', 'Parkir Rp5.000', 'Tidak termasuk kock & minum'],
    color: '#2563eb',
    light: '#eef2ff',
    icon: '🎯',
  },
  {
    name: 'Paket Member',
    amount: '50.000',
    period: '/team',
    tagline: 'Main sepuasnya + gratis parkir',
    desc: 'Solusi hemat untuk tim yang rutin latihan badminton.',
    features: ['Akses main sepuasnya (1 team)', 'Gratis parkir', 'Prioritas booking lapangan'],
    color: '#7c3aed',
    light: '#f5f3ff',
    featured: true,
    icon: '👑',
  },
  {
    name: 'Perlengkapan',
    amount: '12.000',
    period: '',
    tagline: 'Lengkapi kebutuhan main',
    desc: 'Tersedia shuttlecock dan minuman di tempat.',
    features: ['Shuttlecock (kock): Rp12.000', 'Air minum: Rp3.000 – Rp5.000', 'Beli di tempat'],
    color: '#0d9488',
    light: '#f0fdfa',
    icon: '🏸',
  },
]

const benefits = [
  { icon: '📅', title: 'Booking Online 24/7', desc: 'Pesan kapan saja dari HP. Tanpa telepon, tanpa antri.' },
  { icon: '⚡', title: 'Konfirmasi Cepat', desc: 'Admin konfirmasi via WhatsApp dalam hitungan menit.' },
  { icon: '💳', title: 'Pembayaran Fleksibel', desc: 'Tunai, transfer bank, QRIS, atau e-wallet.' },
  { icon: '📊', title: 'Riwayat Tersimpan', desc: 'Data reservasi & pembayaran tercatat rapi.' },
]

export default function Landing() {
  const [jadwal, setJadwal] = useState([])
  const [lapangan, setLapangan] = useState([])
  const [form, setForm] = useState({
    nama: '',
    telepon: '',
    tanggal: '',
    jam_mulai: '18:00',
    jam_selesai: '19:00',
    lapangan_id: '',
  })
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('info')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLapangan()
    loadJadwal()
  }, [])

  useEffect(() => {
    if (!form.lapangan_id && lapangan.length > 0) {
      setForm((prev) => ({ ...prev, lapangan_id: lapangan[0].id }))
    }
  }, [lapangan, form.lapangan_id])

  const loadLapangan = async () => {
    const data = await db.query('lapangan')
    if (data.length) {
      setLapangan(data)
    }
  }

  const loadJadwal = async () => {
    const reservasi = await db.query('reservasi')
    const today = new Date().toISOString().slice(0, 10)
    const upcoming = reservasi
      .filter((item) => item.tanggal >= today && item.status !== 'dibatalkan')
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || (a.jam_mulai || '').localeCompare(b.jam_mulai || ''))
      .slice(0, 6)
    setJadwal(upcoming)
  }

  const selectedLapangan = lapangan.find((item) => item.id === form.lapangan_id)
  const duration = selectedLapangan
    ? Math.max(1, Number(form.jam_selesai.split(':')[0]) - Number(form.jam_mulai.split(':')[0]))
    : 0
  const totalBiaya = selectedLapangan ? selectedLapangan.harga_per_jam * duration : 0

  const summary = useMemo(() => ({
    total: jadwal.length,
    next: jadwal[0]?.tanggal || 'Belum ada',
  }), [jadwal])

  const handleChange = (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [e.target.name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('Mengecek ketersediaan lapangan...')
    setStatusType('info')

    if (!form.nama || !form.telepon || !form.tanggal || !form.jam_mulai || !form.jam_selesai) {
      setStatus('Lengkapi semua data pemesanan terlebih dahulu.')
      setStatusType('error')
      setLoading(false)
      return
    }

    if (form.jam_selesai <= form.jam_mulai) {
      setStatus('Jam selesai harus lebih besar dari jam mulai.')
      setStatusType('error')
      setLoading(false)
      return
    }

    const reservasi = await db.query('reservasi')
    const conflict = reservasi.some((item) =>
      item.lapangan_id === form.lapangan_id &&
      item.tanggal === form.tanggal &&
      item.status !== 'dibatalkan' &&
      !(item.jam_selesai <= form.jam_mulai || item.jam_mulai >= form.jam_selesai)
    )

    if (conflict) {
      setStatus('Maaf, slot tersebut sudah dibooking. Silakan pilih waktu lain.')
      setStatusType('error')
      setLoading(false)
      return
    }

    if (!selectedLapangan) {
      setStatus('Data lapangan belum tersedia. Silakan hubungi admin.')
      setStatusType('error')
      setLoading(false)
      return
    }

    const pelangganData = await db.query('pelanggan')
    let customer = pelangganData.find((item) => item.telepon === form.telepon)
    if (!customer) {
      customer = await db.insert('pelanggan', {
        nama: form.nama,
        telepon: form.telepon,
        email: '',
        alamat: '',
      })
    }

    await db.insert('reservasi', {
      pelanggan_id: customer.id,
      nama: form.nama,
      telepon: form.telepon,
      lapangan_id: selectedLapangan.id,
      lapangan: selectedLapangan.nama,
      tanggal: form.tanggal,
      jam_mulai: form.jam_mulai,
      jam_selesai: form.jam_selesai,
      durasi: `${duration} jam`,
      harga_per_jam: selectedLapangan.harga_per_jam,
      total_biaya: totalBiaya,
      status: 'menunggu',
    })

    setStatus('Pemesanan berhasil! Tunggu konfirmasi admin.')
    setStatusType('success')
    setForm({ nama: '', telepon: '', tanggal: '', jam_mulai: '18:00', jam_selesai: '19:00', lapangan_id: selectedLapangan.id })
    await loadJadwal()
    setLoading(false)
  }

  return (
    <div className="landing-page">
      <SEO />

      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <span className="navbar-logo">🏸</span>
            <span className="navbar-name">GOR TAKUR</span>
          </div>
          <div className="navbar-menu">
            <a href="#harga">Harga</a>
            <a href="#fitur">Fitur</a>
            <a href="#booking">Booking</a>
            <Link to="/login" className="navbar-cta">Masuk Admin</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg">
          <div className="hero-circle c1" />
          <div className="hero-circle c2" />
          <div className="hero-circle c3" />
        </div>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-chip">🏸 Lapangan Badminton — Cilegon</div>
            <h1 className="hero-title">
              Main Badminton {' '}
              <span className="hero-gradient">Tanpa Ribet</span>
            </h1>
            <p className="hero-desc">
              Booking lapangan GOR TAKUR semudah pesan ojek online.
              Pilih jadwal, isi data, selesai. Harga bersahabat, konfirmasi cepat.
            </p>
            <div className="hero-actions">
              <a href="#booking" className="btn-utama">📅 Booking Sekarang</a>
              <a href="#harga" className="btn-second">Lihat Harga</a>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-card utama">
              <div className="hero-card-grid">
                <div className="hero-card-item">
                  <span className="hero-card-num">{summary.total}</span>
                  <span className="hero-card-label">Reservasi Aktif</span>
                </div>
                <div className="hero-card-divider" />
                <div className="hero-card-item">
                  <span className="hero-card-num">{lapangan.length}</span>
                  <span className="hero-card-label">Lapangan</span>
                </div>
                <div className="hero-card-divider" />
                <div className="hero-card-item">
                  <span className="hero-card-num">06–22</span>
                  <span className="hero-card-label">Jam Buka</span>
                </div>
              </div>
            </div>
            <div className="hero-card secondary">
              <span className="hero-card-small">Reservasi Terdekat</span>
              <span className="hero-card-big">{summary.next === 'Belum ada' ? '—' : summary.next}</span>
            </div>
            <div className="hero-shuttle">🏸</div>
          </div>
        </div>
      </section>

      <div className="strip">
        <div className="strip-item">
          <span className="strip-icon">⏱️</span>
          <div>
            <strong>Booking 2 Menit</strong>
            <span>Cukup isi form, langsung jadi</span>
          </div>
        </div>
        <div className="strip-line" />
        <div className="strip-item">
          <span className="strip-icon">✅</span>
          <div>
            <strong>Konfirmasi Cepat</strong>
            <span>Admin respon via WhatsApp</span>
          </div>
        </div>
        <div className="strip-line" />
        <div className="strip-item">
          <span className="strip-icon">🔄</span>
          <div>
            <strong>Bisa Reschedule</strong>
            <span>Hubungi admin untuk ubah jadwal</span>
          </div>
        </div>
      </div>

      <section id="harga" className="section-wrap">
        <div className="section-head">
          <span className="section-tag">PILIHAN PAKET</span>
          <h2 className="section-title">Harga Terjangkau</h2>
          <p className="section-desc">Dari main santai sampai latihan rutin, semua ada paketnya.</p>
        </div>
        <div className="price-grid">
          {prices.map((p) => (
            <div key={p.name} className={`price-card ${p.featured ? 'featured' : ''}`}>
              {p.featured && <div className="price-sticker">BEST</div>}
              <div className="price-icon" style={{ background: p.light }}>{p.icon}</div>
              <h3 className="price-name">{p.name}</h3>
              <div className="price-tagline">{p.tagline}</div>
              <div className="price-amount">
                <span className="price-rp">Rp</span>{p.amount}
                <span className="price-period">{p.period}</span>
              </div>
              <p className="price-desc">{p.desc}</p>
              <ul className="price-list">
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="fitur" className="section-wrap section-alt">
        <div className="section-head">
          <span className="section-tag">KENAPA KAMI</span>
          <h2 className="section-title">Mengapa GOR TAKUR?</h2>
          <p className="section-desc">Kami bikin reservasi lapangan badminton jadi lebih mudah dan modern.</p>
        </div>
        <div className="benefit-grid">
          {benefits.map((b, i) => (
            <div key={b.title} className="benefit-card" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="benefit-icon" style={{ background: [ '#eef2ff', '#fef2f2', '#f0fdfa', '#fefce8' ][i] }}>
                <span>{b.icon}</span>
              </div>
              <h4>{b.title}</h4>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="booking" className="section-wrap section-book">
        <div className="section-head">
          <span className="section-tag">RESERVASI</span>
          <h2 className="section-title">Booking Lapangan</h2>
          <p className="section-desc">Isi form di bawah, admin kami akan konfirmasi melalui WhatsApp.</p>
        </div>
        <div className="book-grid">
          <div className="book-card">
            <div className="book-head">
              <span className="book-head-icon">📋</span>
              <div>
                <h3>Form Pemesanan</h3>
                <p>Isi data diri dan pilih jadwal</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="book-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Nama Lengkap</label>
                  <input name="nama" value={form.nama} onChange={handleChange} required placeholder="Nama Anda" />
                </div>
                <div className="form-field">
                  <label>Nomor Telepon</label>
                  <input name="telepon" value={form.telepon} onChange={handleChange} required placeholder="08xxxxxxxxxx" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Tanggal Main</label>
                  <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Lapangan</label>
                  <select name="lapangan_id" value={form.lapangan_id} onChange={handleChange}>
                    {lapangan.map((item) => (
                      <option key={item.id} value={item.id}>{item.nama} - Rp {Number(item.harga_per_jam || 50000).toLocaleString('id-ID')} / jam</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Jam Mulai</label>
                  <select name="jam_mulai" value={form.jam_mulai} onChange={handleChange}>
                    {HOURS.slice(0, -1).map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Jam Selesai</label>
                  <select name="jam_selesai" value={form.jam_selesai} onChange={handleChange}>
                    {HOURS.filter((h) => h > form.jam_mulai).map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {form.tanggal && form.jam_mulai && (
                <div className="book-ringkasan">
                  📅 <strong>{form.tanggal}</strong> &bull; {form.jam_mulai}–{form.jam_selesai} &bull; {selectedLapangan.nama} &bull; Rp {totalBiaya.toLocaleString('id-ID')}
                </div>
              )}

              <button type="submit" className="book-submit" disabled={loading}>
                {loading ? '⏳ Memproses...' : '📩 Kirim Pemesanan'}
              </button>
            </form>
            {status && <div className={`status-box ${statusType}`}>{status}</div>}
          </div>

          <div className="book-card">
            <div className="book-head">
              <span className="book-head-icon">📅</span>
              <div>
                <h3>Jadwal Terbaru</h3>
                <p>Reservasi yang akan datang</p>
              </div>
            </div>
            {jadwal.length === 0 ? (
              <div className="book-empty">
                <span className="book-empty-icon">🎾</span>
                <p>Belum ada reservasi</p>
              </div>
            ) : (
              <div className="book-timeline">
                {jadwal.map((item) => (
                  <div key={item.id} className={`book-tl-item ${item.status === 'selesai' ? 'done' : item.status === 'dibatalkan' ? 'cancel' : 'wait'}`}>
                    <div className="book-tl-dot" />
                    <div>
                      <div className="book-tl-date">{item.tanggal} &bull; {item.jam_mulai || item.jam}–{item.jam_selesai || 'selesai'}</div>
                      <div className="book-tl-name">{item.nama || item.lapangan}</div>
                      <div className="book-tl-lap">{item.lapangan}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="book-admin">
              <Link to="/login">Kelola reservasi →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-bg">
          <div className="cta-circle c1" />
          <div className="cta-circle c2" />
        </div>
        <div className="cta-inner">
          <h2>Siap Main Badminton?</h2>
          <p>Booking sekarang dan rasakan kemudahan reservasi online GOR TAKUR.</p>
          <a href="#booking" className="cta-btn">📅 Booking Sekarang</a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-logo">🏸</span>
            <div>
              <strong>GOR TAKUR</strong>
              <span>Sistem Informasi Reservasi Lapangan Badminton</span>
            </div>
          </div>
          <div className="footer-mid">
            <a href="#harga">Harga</a>
            <a href="#fitur">Fitur</a>
            <a href="#booking">Booking</a>
            <Link to="/login">Admin</Link>
          </div>
          <div className="footer-right">&copy; {new Date().getFullYear()} GOR TAKUR</div>
        </div>
      </footer>
    </div>
  )
}
