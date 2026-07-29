import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            nama_lengkap: session.user.user_metadata?.nama_lengkap || session.user.email,
            role: session.user.user_metadata?.role || 'admin',
          })
        }
      } catch (e) {
        console.error('Error cek sesi:', e)
      } finally {
        setLoading(false)
      }
    }

    getSession()

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

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    if (!supabase) throw new Error('Supabase client tidak terhubung.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    // KUNCI PENTING: Paksa catat user langsung di sini biar nggak telat!
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        nama_lengkap: data.user.user_metadata?.nama_lengkap || data.user.email,
        role: data.user.user_metadata?.role || 'admin',
      })
    }
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