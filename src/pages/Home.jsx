import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { supabase } from '../lib/supabase'

export default function Home() {
  const navigate = useNavigate()
  const [lapanganList, setLapanganList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchLapangan = async () => {
      setIsLoading(true)
      try {
        if (!supabase) {
          throw new Error('Supabase not configured')
        }
        const { data, error } = await supabase.from('lapangan').select('*')
        if (error) {
          console.error(error)
          setLapanganList([])
        } else {
          // Hitung rating dinamis untuk setiap lapangan berdasarkan localStorage
          const updatedData = (data || []).map(item => {
            const savedReviews = localStorage.getItem(`reviews_${item.id}`)
            if (savedReviews) {
              try {
                const reviewsArr = JSON.parse(savedReviews)
                if (reviewsArr.length > 0) {
                  const totalSum = reviewsArr.reduce((acc, curr) => acc + curr.rating, 0)
                  return {
                    ...item,
                    rating: (totalSum / reviewsArr.length).toFixed(1),
                    jumlah_ulasan: reviewsArr.length
                  }
                }
              } catch (e) {}
            }
            return item
          })
          setLapanganList(updatedData)
        }
      } catch (err) {
        console.error('Error fetching lapangan:', err)
        setLapanganList([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchLapangan()
  }, [])

  const filteredLapangan = lapanganList.filter(item => 
    item.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.lokasi?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <SEO title="Beranda - Booking Lapangan Badminton" />

      {/* Header Utama dengan Tombol Riwayat Pesanan */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">🏸 GOR Badminton</h1>
            <p className="text-xs text-gray-500">Sistem Booking Lapangan Resmi</p>
          </div>
          <button
            onClick={() => navigate('/riwayat')}
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer shadow-sm flex items-center gap-2"
          >
            <span>📜</span> Riwayat Pesanan
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Banner Sambutan & Pencarian */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl p-6 text-white shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-2">Temukan & Booking Lapanganmu!</h2>
            <p className="text-blue-100 text-sm mb-4">Main badminton jadi lebih mudah, cepat, dan terverifikasi.</p>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama GOR atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-gray-900 pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none shadow-sm placeholder-gray-400"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Daftar Lapangan */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-lg">Daftar Lapangan Tersedia</h3>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500 text-sm">Memuat daftar lapangan...</div>
          ) : filteredLapangan.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">Lapangan tidak ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLapangan.map((item) => {
                let photoUrl = item.foto;
                if (item.foto_url) {
                  try {
                    const parsed = JSON.parse(item.foto_url);
                    photoUrl = Array.isArray(parsed) ? parsed[0] : item.foto_url;
                  } catch {
                    photoUrl = item.foto_url;
                  }
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/detail/${item.id}`)}
                    className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col"
                  >
                    <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                      <img
                        src={photoUrl || 'https://via.placeholder.com/800x600?text=Lapangan'}
                        alt={item.nama}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                        ⭐ {item.rating || '4.8'}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{item.nama}</h4>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">📍 {item.lokasi || 'Lokasi strategis'}</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <div>
                          <span className="text-[11px] text-gray-400 block">Harga mulai</span>
                          <span className="font-bold text-blue-600 text-base">
                            Rp {Number(item.harga_per_jam || 0).toLocaleString('id-ID')}
                            <span className="text-xs text-gray-500 font-normal">/jam</span>
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/detail/${item.id}`);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow-sm cursor-pointer"
                        >
                          Pilih Jadwal
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}