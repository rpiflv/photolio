import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Photo } from '../data/photos'

interface PhotoModalProps {
  photo: Photo | null
  photos: Photo[]
  isOpen: boolean
  onClose: () => void
}

export default function PhotoModal({ photo, photos, isOpen, onClose }: PhotoModalProps) {
  if (!isOpen || !photo) return null

  const currentPhotoIndex = photos.findIndex(p => p.id === photo.id)
  
  const goToPrevious = () => {
    // Photo navigation could be implemented here
  }

  const goToNext = () => {
    // Photo navigation could be implemented here
  }

  const currentPhoto = photos[currentPhotoIndex] || photo

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <X size={32} />
      </button>

      <button
        onClick={goToPrevious}
        className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <ChevronLeft size={32} />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <ChevronRight size={32} />
      </button>

      <div className="max-w-4xl max-h-full flex flex-col items-center">
        <img
          src={currentPhoto.src}
          alt={currentPhoto.alt}
          className="max-w-full max-h-[80vh] object-contain"
        />
        <div className="text-white text-center mt-4 px-4">
          <h2 className="text-xl font-semibold mb-2">{currentPhoto.title}</h2>
          {currentPhoto.description && (
            <p className="text-gray-300">{currentPhoto.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-2">
            {new Date(currentPhoto.date).toLocaleDateString()} • {currentPhoto.category}
          </p>
        </div>
      </div>
    </div>
  )
}