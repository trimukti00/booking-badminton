import { supabase } from './supabase'

const STORAGE_BUCKET = 'bukti-bayar'

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.')
  }
}

function genId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

export const db = {
  async query(table, params = {}) {
    ensureClient()
    let query = supabase.from(table).select('*')
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    if (params.match) query = query.match(params.match)
    if (params.orderBy) query = query.order(params.orderBy.column, { ascending: params.orderBy.ascending !== false })
    if (params.limit) query = query.limit(params.limit)
    const { data, error } = await query
    if (error) {
      console.error('Supabase query error', table, error)
      throw error
    }
    return data || []
  },

  async insert(table, record) {
    ensureClient()
    const row = { id: genId(), created_at: new Date().toISOString(), ...record }
    const { data, error } = await supabase.from(table).insert(row).select()
    if (error) {
      console.error('Supabase insert error', table, error)
      throw error
    }
    return data?.[0] || null
  },

  async update(table, id, updates) {
    ensureClient()
    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select()
    if (error) {
      console.error('Supabase update error', table, error)
      throw error
    }
    return data?.[0] || null
  },

  async remove(table, id) {
    ensureClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      console.error('Supabase delete error', table, error)
      throw error
    }
    return true
  },

  async getById(table, id) {
    ensureClient()
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
    if (error) {
      console.error('Supabase getById error', table, error)
      throw error
    }
    return data || null
  },

  async uploadProof(file, path) {
    ensureClient()
    if (!file) return null
    const filePath = path.replace(/^\//, '')
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: true })
    if (error) {
      console.error('Supabase storage upload error', error)
      throw error
    }
    const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
    return publicData?.publicUrl || null
  },
  async uploadFile(bucket, file, path) {
    ensureClient()
    if (!file) return null
    const filePath = path.replace(/^\//, '')
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: true })
    if (error) {
      console.error('Supabase storage upload error', error)
      throw error
    }
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return publicData?.publicUrl || null
  },
}
