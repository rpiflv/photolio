import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Photo } from '../data/photos'
import { useState, useEffect } from 'react'

interface PhotoModalProps {
  photo: Photo | null
  photos: Photo[]
  isOpen: boolean
  onClose: () => void
}

export default function PhotoModal({ photo, photos, isOpen, onClose }: PhotoModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (photo) {
      const index = photos.findIndex(p => p.id === photo.id)
      if (index !== -1) {
        setCurrentIndex(index)
      }
    }
  }, [photo, photos])

  // Reset loading state when index changes
  useEffect(() => {
    setImageLoaded(false)
  }, [currentIndex])

  if (!isOpen || !photo) return null

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  const currentPhoto = photos[currentIndex] || photo

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, currentIndex])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Close"
      >
        <X size={32} />
      </button>

      <button
        onClick={goToPrevious}
        className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
        aria-label="Previous photo"
      >
        <ChevronLeft size={48} />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
        aria-label="Next photo"
      >
        <ChevronRight size={48} />
      </button>

      <div className="max-w-4xl max-h-full flex flex-col items-center">
        {/* Photo with passepartout */}
        <div className="bg-white/95 p-4 pb-14 md:p-16 md:pb-12 shadow-2xl">
          <div className="relative min-h-[50vh] flex items-center justify-center">
            <img
              src={currentPhoto.src}
              alt={currentPhoto.alt}
              className={`max-w-full max-h-[70vh] object-contain block shadow-[0_0_30px_rgba(0,0,0,0.7)] transition-all duration-[500ms] ${!imageLoaded ? 'blur-xl scale-105' : 'blur-0 scale-100'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <div className="text-gray-800 text-center mt-10 px-4 min-h-[120px]">
            <div className={`transition-opacity duration-[500ms] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-xl font-semibold mt-20">{currentPhoto.title}</h2>
              {currentPhoto.description && (
                <p className="text-gray-600">{currentPhoto.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {new Date(currentPhoto.date).toLocaleDateString()} • {currentPhoto.category}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}