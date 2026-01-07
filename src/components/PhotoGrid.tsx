import { useState } from 'react'
import PhotoModal from './PhotoModal'
import { Heart } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../contexts/AuthContext'
import type { Photo } from '../data/photos'

interface PhotoGridProps {
  photos: Photo[]
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const { user } = useAuth()
  const { isFavorited, toggleFavorite } = useFavorites()

  const handleFavoriteClick = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation()
    if (!user) {
      // Redirect to login or show message
      alert('Please sign in to save favorites')
      return
    }
    await toggleFavorite(photoId)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-gray-100"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.thumbnailSrc || photo.src}
              alt={photo.alt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            
            {/* Favorite Button */}
            {user && (
              <button
                onClick={(e) => handleFavoriteClick(e, photo.id)}
                className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorited(photo.id)
                      ? 'fill-red-500 text-red-500'
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

      {selectedPhoto && (
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