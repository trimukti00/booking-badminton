import { useState, useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'

const pageNames = {
  '/dashboard':  { label: 'Dashboard',       icon: '📊' },
  '/pelanggan':  { label: 'Data Pelanggan',  icon: '👥' },
  '/jadwal':     { label: 'Jadwal Lapangan', icon: '📅' },
  '/pembayaran': { label: 'Pembayaran',      icon: '💳' },
  '/laporan':    { label: 'Laporan',         icon: '📈' },
  '/admin':      { label: 'Data Admin',      icon: '⚙️' },
}

export default function Layout() {
  const { user, loading, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // 1. Loading kita nyalakan lagi
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-sm text-gray-600">Memuat sistem...</div>
      </div>
    )
  }

  // 2. Satpam kita bangunkan lagi (Wajib bawa tiket login)
  if (!user) return <Navigate to="/login" replace />

  const page = pageNames[location.pathname] || { label: 'Halaman', icon: '📄' }
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-20" onClick={() => setMobileOpen(false)} />
      )}

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} mobileOpen={mobileOpen} />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Topbar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth <= 768) { setMobileOpen((p) => !p) }
                else { setCollapsed((p) => !p) }
              }}
              title={'Buka menu'}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <span className="text-xl">☰</span>
            </button>

            <div className="flex items-center text-sm text-gray-600">
              <span className="font-semibold mr-2">GOR TAKUR</span>
              <span className="text-slate-400 mx-2">›</span>
              <span className="flex items-center gap-2">{page.icon} <span className="font-medium">{page.label}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 flex items-center">📅 <span className="ml-2">{dateStr}</span></div>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={logout}
              title={`Keluar (${user?.nama_lengkap || user?.username})`}
            >
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                {(user?.nama_lengkap || user?.username || 'A')[0].toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-sm text-gray-700">
                <span className="font-medium">{user?.nama_lengkap || user?.username}</span>
                <span className="text-xs text-gray-500">{user?.role || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div key={location.pathname} className="animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}