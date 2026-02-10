import { useEffect, useState } from 'react'
import PhotoModal from './PhotoModal'
import { Star, Loader2 } from 'lucide-react' // Changed from Heart to Star
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../contexts/AuthContext'
import type { Photo } from '../data/photos'
import { useNavigate } from '@tanstack/react-router'

interface PhotoGridProps {
  photos: Photo[]
  categoryId?: string
}

export default function PhotoGrid({ photos, categoryId }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024)
  const { user } = useAuth()
  const { isFavorited, toggleFavorite } = useFavorites()
  const navigate = useNavigate()

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId))
  }

  const handleFavoriteClick = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation()
    if (!user) {
      // Redirect to login or show message
      alert('Please sign in to save favorites')
      return
    }
    await toggleFavorite(photoId)
  }

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    return () => window.removeEventListener('resize', updateIsMobile)
  }, [])

  const handlePhotoOpen = (photo: Photo) => {
    if (isMobile) {
      navigate({
        to: '/photo/$photoId',
        params: { photoId: photo.id },
        search: { category: categoryId ?? 'all' },
      })
      return
    }

    setSelectedPhoto(photo)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-gray-100"
            onClick={() => handlePhotoOpen(photo)}
          >
            {/* Loading Spinner */}
            {!loadedImages.has(photo.id) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
            
            <img
              src={photo.src}
              srcSet={photo.srcset}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              alt={photo.alt}
              loading="lazy"
              onLoad={() => handleImageLoad(photo.id)}
              onError={(e) => {
                // Fallback to main src if thumbnail fails
                const img = e.target as HTMLImageElement
                if (img.src !== photo.src) {
                  img.src = photo.src
                }
              }}
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
                loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            {/* Favorite Button - Changed to Star */}
            {user && (
              <button
                onClick={(e) => handleFavoriteClick(e, photo.id)}
                className="absolute top-4 right-4 p-2 hover:opacity-80 hover:bg-white rounded-full transition-all z-10"
              >
                <Star
                  className={`h-5 w-5 ${
                    isFavorited(photo.id)
                      ? 'fill-yellow-400 text-yellow-400' // Changed from red to yellow
                      : 'text-gray-600'
                  }`}
                />
              </button>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-lg font-semibold mb-1">{photo.title}</h3>
                {photo.description && (
                  <p className="text-sm text-gray-200 line-clamp-2">
                    {photo.description}
                  </p>
                )}
                <p className="text-xs text-gray-300 mt-2 capitalize">
                  {photo.category}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && !isMobile && (
        <PhotoModal
          photo={selectedPhoto}
          photos={photos}
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  )
}