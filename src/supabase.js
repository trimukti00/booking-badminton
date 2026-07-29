import { createClient } from '@supabase/supabase-js';

// Mengambil kunci rahasia dari file .env yang barusan lu buat
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Membuat "jembatan" koneksi ke Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);