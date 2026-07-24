import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      textAlign: 'center',
      background: 'linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%)',
    }}>
      <SEO title="404 - Halaman Tidak Ditemukan" />
      <div style={{ fontSize: 80, marginBottom: 16 }}>🏸</div>
      <h1 style={{ fontSize: 48, fontWeight: 900, color: '#1e293b', marginBottom: 8 }}>404</h1>
      <p style={{ fontSize: 16, color: '#64748b', marginBottom: 24, maxWidth: 400 }}>
        Halaman yang Anda cari tidak ditemukan. Mungkin sudah dipindah atau dihapus.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/" className="btn-primary">🏠 Kembali ke Beranda</Link>
        <Link to="/login" className="btn-secondary">🔐 Masuk Admin</Link>
      </div>
    </div>
  )
}
