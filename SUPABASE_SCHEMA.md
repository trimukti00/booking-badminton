# Supabase Schema for GOR TAKUR

## Required Tables

### admin
- `id` (text, primary key)
- `username` (text, unique)
- `nama_lengkap` (text)
- `password` (text)
- `role` (text)
- `created_at` (timestamp with time zone)

### pelanggan
- `id` (text, primary key)
- `nama` (text)
- `telepon` (text)
- `email` (text)
- `alamat` (text)
- `created_at` (timestamp with time zone)

### lapangan
- `id` (text, primary key)
- `nama` (text)
- `harga_per_jam` (numeric)
- `status` (text)
- `created_at` (timestamp with time zone)

### reservasi
- `id` (text, primary key)
- `pelanggan_id` (text)
- `lapangan_id` (text)
- `nama` (text)
- `telepon` (text)
- `lapangan` (text)
- `tanggal` (date or text)
- `jam_mulai` (text)
- `jam_selesai` (text)
- `durasi` (text)
- `harga_per_jam` (numeric)
- `total_biaya` (numeric)
- `status` (text)
- `created_at` (timestamp with time zone)

### pembayaran
- `id` (text, primary key)
- `reservasi_id` (text)
- `jumlah` (numeric)
- `metode` (text)
- `status` (text)
- `tanggal_bayar` (date or text)
- `bukti_bayar` (text)
- `created_at` (timestamp with time zone)

## Storage Bucket

- Bucket name: `bukti-bayar`
- File uploads are stored with a generated path and retrieved using public URLs.

## Environment Variables

Set these in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
