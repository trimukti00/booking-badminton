import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Wajib true di awal biar Satpam nunggu dulu

  useEffect(() => {
    // 1. Fungsi untuk mengecek sesi login saat web pertama kali dibuka/refresh
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          nama_lengkap: session.user.user_metadata?.nama_lengkap || session.user.email,
          role: session.user.user_metadata?.role || 'admin',
        })
      }
      setLoading(false) // Loading selesai setelah dapat jawaban dari Supabase
    }

    getSession()

    // 2. Pasang pendengar (listener) otomatis kalau kamu login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          nama_lengkap: session.user.user_metadata?.nama_lengkap || session.user.email,
          role: session.user.user_metadata?.role || 'admin',
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Bersihkan pendengar kalau komponen ditutup
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    if (!supabase) throw new Error('Supabase client tidak terhubung.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    if (!supabase) throw new Error('Supabase client tidak terhubung.')
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)