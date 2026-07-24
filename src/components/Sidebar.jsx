import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const menu = [
  {
    section: 'UTAMA',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    section: 'MANAJEMEN',
    items: [
      { to: '/pelanggan',  label: 'Pelanggan',      icon: '👥' },
      { to: '/jadwal',     label: 'Jadwal Lapangan', icon: '📅' },
      { to: '/pembayaran', label: 'Pembayaran',      icon: '💳' },
    ],
  },
  {
    section: 'SISTEM',
    items: [
      { to: '/laporan', label: 'Laporan',    icon: '📈' },
      { to: '/admin',   label: 'Data Admin', icon: '⚙️' },
    ],
  },
]

export default function Sidebar({ collapsed, mobileOpen }) {
  const { user, logout } = useAuth()

  return (
    <aside className={`w-64 bg-blue-900 text-white flex flex-col flex-shrink-0 transition-all duration-300 ${mobileOpen ? 'fixed z-30 inset-y-0 left-0' : ''}`}>
      <div className="h-16 flex items-center px-6 font-bold text-xl border-b border-blue-800">GOR TAKUR</div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {menu.map((group) => (
          <div key={group.section} className="mb-4">
            <div className="px-4 text-xs text-blue-200 font-semibold mb-2">{group.section}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md text-sm transition ${isActive ? 'bg-blue-800 border-l-4 border-white' : 'hover:bg-blue-800'}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-800 text-sm">
        {user && (
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold">{(user.nama_lengkap || user.username || 'A')[0].toUpperCase()}</div>
            <div>
              <div className="font-semibold">{user.nama_lengkap || user.username || 'Admin'}</div>
              <div className="text-xs text-blue-200">{user.role || 'Admin'}</div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-800 flex items-center gap-3"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
