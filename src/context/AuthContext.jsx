import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const persistUser = (userData) => {
    setUser(userData || null)
  }

  const login = async (email, password) => {
    if (!supabase) throw new Error('Supabase client tidak terhubung.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Login gagal. Periksa kembali email dan password Anda.')

    const userData = {
      id: data.user.id,
      email: data.user.email,
      nama_lengkap: data.user.user_metadata?.nama_lengkap || data.user.email,
      role: data.user.user_metadata?.role || 'admin',
    }

    persistUser(userData)
    return userData
  }

  const logout = async () => {
    if (!supabase) throw new Error('Supabase client tidak terhubung.')
    await supabase.auth.signOut()
    persistUser(null)
  }

  const register = async ({ email, password, nama_lengkap }) => {
    if (!supabase) throw new Error('Supabase client tidak terhubung.')
    const { data, error } = await supabase.auth.signUp(
      { email, password },
      { data: { nama_lengkap, role: 'admin' } }
    )
    if (error) throw error
    return data.user
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
