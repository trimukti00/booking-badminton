import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { supabase } from '../supabase' 

function generateHours(start = 8, end = 22) {
  const hours = []
  for (let h = start; h <= end; h++) {
    const label = String(h).padStart(2, '0') + ':00'
    hours.push(label)
  }
  return hours
}

export default function DetailLapangan() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [lapangan, setLapangan] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  })
  
  const [selectedSlots, setSelectedSlots] = useState([])
  const [filledSlots, setFilledSlots] = useState([])

  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favorites') || '[]'))
  const [hasBooked, setHasBooked] = useState(false)

  const hours = useMemo(() => generateHours(8, 22), [])
  const carouselRef = useRef(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [photoIndex, setPhotoIndex] = useState(null)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    if (!id) return
    const savedReviews = localStorage.getItem(`reviews_${id}`)
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews))
      } catch (e) {
        setReviews(getDefaultReviews())
      }
    } else {
      setReviews(getDefaultReviews())
    }
  }, [id])

  function getDefaultReviews() {
    return [
      {
        id: 1,
        nama: 'Budi Santoso',
        waktu: '2 hari yang lalu',
        rating: 5,
        komentar: 'Lapangannya bersih banget, karpetnya masih baru dan gak licin. Pencahayaannya juga pas, gak bikin silau pas mau smash. Mantap pokoknya!',
        inisial: 'B',
        warnaBg: 'bg-blue-100 text-blue-600'
      },
      {
        id: 2,
        nama: 'Andi Wijaya',
        waktu: '1 minggu yang lalu',
        rating: 4,
        komentar: 'Fasilitas lengkap, parkir aman. Cuma kadang agak panas kalau main siang hari. Overall bagus buat mabar sama teman kantor.',
        inisial: 'A',
        warnaBg: 'bg-green-100 text-green-600'
      }
    ]
  }

  const totalRatingSum = reviews.reduce((acc, curr) => acc + curr.rating, 0)
  const dynamicRating = reviews.length > 0 ? (totalRatingSum / reviews.length).toFixed(1) : (lapangan?.rating || '4.8')
  const dynamicReviewCount = reviews.length

  useEffect(() => {
    const riwayat = JSON.parse(localStorage.getItem('riwayatBooking') || '[]')
    const sudahPernahBooking = riwayat.some((itemPesanan) => {
      const courtId = itemPesanan.lapangan?.id || itemPesanan.id
      return String(courtId) === String(id)
    })
    setHasBooked(sudahPernahBooking)
  }, [id])

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (userRating === 0) return alert('Mohon berikan rating bintang terlebih dahulu!');
    if (!reviewText.trim()) return alert('Mohon tulis ulasan Anda!');

    const waktuDetail = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).replace('.', ':');

    const newReview = {
      id: Date.now(),
      nama: 'Anda (Pengguna Saat Ini)',
      waktu: waktuDetail,
      rating: userRating,
      komentar: reviewText,
      inisial: 'A',
      warnaBg: 'bg-purple-100 text-purple-600'
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${id}`, JSON.stringify(updatedReviews));

    alert('Terima kasih! Ulasan dan rating Anda berhasil ditambahkan.');
    setUserRating(0);
    setHoverRating(0);
    setReviewText('');
  }

  const toggleSlot = (slot) => {
    if (filledSlots.includes(slot)) return
    setSelectedSlots((curr) =>
      curr.includes(slot) ? curr.filter((s) => s !== slot) : [...curr, slot]
    )
  }

  const toggleFavorite = () => {
    if (!lapangan || !lapangan.id) return
    const courtId = lapangan.id
    const already = favorites.includes(courtId)
    const newFavorites = already ? favorites.filter((f) => f !== courtId) : [...favorites, courtId]
    setFavorites(newFavorites)
    try {
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
    } catch (e) {}
  }

  const isFavorite = lapangan ? favorites.includes(lapangan.id) : false

  const handleShare = async (e) => {
    e.stopPropagation()
    const shareUrl = window.location.href
    const shareTitle = lapangan?.nama || 'Lapangan'
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl })
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link disalin!')
      } else {
        window.prompt('Copy this link', shareUrl)
      }
    } catch (err) {
      console.error('Share failed', err)
    }
  }

  // AMBIL DATA LAPANGAN DARI SUPABASE
  useEffect(() => {
    const fetchLapangan = async () => {
      setIsLoading(true)
      try {
        if (!supabase) throw new Error('Supabase not configured')
        const { data, error } = await supabase.from('lapangan').select('*').eq('id', id).single()
        if (error) {
          console.error(error)
          setLapangan(null)
        } else {
          setLapangan(data)
        }
      } catch (err) {
        console.error('Fetch lapangan error', err)
        setLapangan(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchLapangan()
    else setIsLoading(false)
  }, [id])

  // CEK JADWAL DENGAN ALAT PELACAK (DEBUGGING)
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!id) return;
      try {
        console.log('--- DEBUG JADWAL MULAI ---');
        console.log('1. Tanggal yang dipilih:', selectedDate);
        console.log('2. ID Lapangan yang dibuka:', id);

        // Ambil SEMUA data reservasi di tanggal tersebut biar keliatan
        const { data, error } = await supabase
          .from('reservasi')
          .select('*') 
          .eq('tanggal', selectedDate);

        if (error) {
          console.error('3. WADUH ADA ERROR DARI SUPABASE:', error);
          throw error;
        }

        console.log('4. Data mentah dari Database:', data);

        const bookedHours = (data || [])
          .filter(item => {
            if (!item.lapangan_id) return false;
            const dbId = String(item.lapangan_id).trim();
            const currentId = String(id).trim();
            
            const isMatch = dbId === currentId || dbId.includes(currentId) || currentId.includes(dbId);
            
            if (isMatch) {
               console.log('5. COCOK! Lapangan ID sama:', dbId, 'Jam:', item.jam_mulai);
            }
            return isMatch;
          })
          .map(item => item.jam_mulai ? item.jam_mulai.substring(0, 5) : '');

        console.log('6. Hasil akhir jam yang akan di-abu-abu:', bookedHours);
        console.log('--- DEBUG SELESAI ---');

        setFilledSlots(bookedHours);
      } catch (error) {
        console.error('Gagal mengambil jadwal lapangan:', error.message);
      }
    };

    if (selectedDate && id) {
      setSelectedSlots([]); 
      fetchBookedSlots();   
    }
  }, [selectedDate, id, lapangan]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Memuat data lapangan...
      </div>
    )
  }

  const item = lapangan || {
    nama: 'Lapangan tidak ditemukan',
    harga_per_jam: 0,
    lokasi: 'Lokasi belum diatur',
    foto: 'https://via.placeholder.com/1200x800?text=Lapangan+Badminton'
  }

  let photos = []
  if (lapangan?.foto_url) {
    try {
      photos = JSON.parse(lapangan.foto_url)
      if (!Array.isArray(photos)) photos = [lapangan.foto_url]
    } catch (e) {
      photos = [lapangan.foto_url]
    }
  } else if (item.foto) {
    photos = [item.foto]
  }

  photos = Array.isArray(photos) && photos.length > 0 ? photos : [item.foto]
  const totalPrice = selectedSlots.length * (lapangan?.harga_per_jam || 0)

  const handleLanjutBooking = () => {
    if (selectedSlots.length === 0) {
      return alert('Silakan pilih minimal 1 sesi jam terlebih dahulu!')
    }

    navigate('/checkout', {
      state: {
        lapangan: item,
        tanggal: selectedDate,
        jamTerpilih: selectedSlots,
        totalHarga: totalPrice,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 relative">
      <SEO title={`Detail - ${item.nama}`} />

      <div className="relative w-full h-72 group bg-gray-900">
        <div className="flex overflow-x-auto snap-x snap-mandatory h-full hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {photos.map((photo, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 snap-center">
              <img
                src={photo}
                alt={`${lapangan?.nama || item.nama} - Foto ${index + 1}`}
                onClick={() => setPhotoIndex(index)}
                className="w-full h-full object-contain cursor-pointer"
              />
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <div className="absolute bottom-10 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium z-20">
            {photos.length} Foto
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 rounded-full p-2 shadow-md cursor-pointer"
          aria-label="Kembali"
        >
          <svg className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="bg-white p-6 md:p-8 flex flex-col gap-6 w-full shadow-sm border-b border-gray-100">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{item.nama}</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">{lapangan?.lokasi || item.lokasi}</p>
              
              <div className="flex items-center gap-1.5 mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold text-gray-800 text-sm">{dynamicRating}</span>
                <span className="text-sm text-gray-500 ml-1">({dynamicReviewCount} ulasan)</span>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleShare(e) }}
                className="p-2 rounded-lg bg-gray-100 text-gray-700 cursor-pointer"
                aria-label="Bagikan"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                  <path d="M12 3v13" />
                  <path d="M9 6h6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
                className={`p-2 rounded-lg cursor-pointer ${isFavorite ? 'bg-white text-red-500' : 'bg-gray-100 text-gray-400'}`}
                aria-label={isFavorite ? 'Hapus favorit' : 'Tambah favorit'}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L4.94 13l7.06 7.06L19.06 13l.78-.78a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="text-xl font-bold text-blue-600">
            Rp {Number(lapangan?.harga_per_jam || 0).toLocaleString('id-ID')}
            <span className="text-sm text-gray-500 font-normal"> / jam</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-800 mb-3">Pilih Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Pilih Jam</h3>
              <div className="text-sm text-gray-500">Pilih beberapa jam sesuai kebutuhan</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {hours.map((hour) => {
                const isFilled = filledSlots.includes(hour)
                const isSelected = selectedSlots.includes(hour)

                const baseClass = 'rounded-lg py-2 text-center text-sm font-medium'
                let cls = baseClass + ' border '
                if (isFilled) cls += 'bg-gray-100 text-gray-400 cursor-not-allowed line-through border-gray-200'
                else if (isSelected) cls += 'bg-blue-600 text-white border-blue-600'
                else cls += 'text-gray-700 border-gray-300 hover:border-blue-600 cursor-pointer'

                const nextHour = String(parseInt(hour, 10) + 1).padStart(2, '0') + ':00'
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => toggleSlot(hour)}
                    disabled={isFilled}
                    className={cls}
                  >
                    {`${hour} - ${nextHour}`}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <hr className="border-gray-100 my-2 mt-6" />

        <div className="flex flex-col gap-4 mt-2">
          <h3 className="font-bold text-gray-900 text-lg">Ulasan Pelanggan</h3>

          {hasBooked ? (
            <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm mt-2 mb-4">
              <p className="font-semibold text-gray-800 text-sm mb-2">Bagikan pengalaman Anda</p>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => {
                  const ratingValue = i + 1
                  const isFilled = hoverRating ? ratingValue <= hoverRating : ratingValue <= userRating
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setUserRating(ratingValue)}
                      onMouseEnter={() => setHoverRating(ratingValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-colors cursor-pointer"
                      aria-label={`Beri rating ${ratingValue} bintang`}
                    >
                      <svg className={`w-7 h-7 ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  )
                })}
              </div>
              <textarea 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-gray-50 text-gray-800" 
                rows="3" 
                placeholder="Apakah lapangannya nyaman? Bagaimana dengan fasilitasnya?"
              ></textarea>
              <div className="flex justify-end mt-3">
                <button 
                  type="button"
                  onClick={handleSubmitReview}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
                >
                  Kirim Ulasan
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mt-2 mb-4">
              <span className="text-xl">🔒</span>
              <p className="font-semibold text-amber-900 text-sm mt-1">Ulasan Terkunci</p>
              <p className="text-xs text-amber-700 mt-0.5">Anda harus melakukan pemesanan dan bermain di lapangan ini terlebih dahulu sebelum dapat mengirimkan ulasan.</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${review.warnaBg} flex items-center justify-center font-bold text-lg`}>
                        {review.inisial}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{review.nama}</p>
                        <p className="text-xs text-gray-500">{review.waktu}</p>
                      </div>
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{review.komentar}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-3 px-4 z-50 shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Total Harga</div>
            <div className="text-lg font-semibold text-gray-800">Rp {Number(totalPrice).toLocaleString('id-ID')}</div>
          </div>
          <div>
            <button
              type="button"
              onClick={handleLanjutBooking}
              className={`px-4 py-2 rounded-xl text-white font-semibold cursor-pointer ${selectedSlots.length === 0 ? 'bg-blue-200' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Lanjut Booking
            </button>
          </div>
        </div>
      </div>

      {photoIndex !== null && photos.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center backdrop-blur-sm"
          onClick={() => setPhotoIndex(null)}
        >
          <button 
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white p-2 hover:bg-white/20 rounded-full z-50 transition cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setPhotoIndex(null); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="absolute top-6 left-6 text-white font-semibold text-xl z-50 drop-shadow-md">
            {photoIndex + 1} / {photos.length}
          </div>

          {photoIndex > 0 && (
            <button 
              className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 rounded-full text-white border border-white/20 z-50 transition-all cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setPhotoIndex(photoIndex - 1); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}

          <img 
            src={photos[photoIndex]} 
            alt={`Preview ${photoIndex + 1}`} 
            className="max-w-[90vw] max-h-[85vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()} 
          />

          {photoIndex < photos.length - 1 && (
            <button 
              className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 rounded-full text-white border border-white/20 z-50 transition-all cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setPhotoIndex(photoIndex + 1); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}