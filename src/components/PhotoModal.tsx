import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Photo } from '../data/photos'
import { useState, useEffect, useRef } from 'react'

interface PhotoModalProps {
  photo: Photo | null
  photos: Photo[]
  isOpen: boolean
  onClose: () => void
}

export default function PhotoModal({ photo, photos, isOpen, onClose }: PhotoModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (photo) {
      const index = photos.findIndex(p => p.id === photo.id)
      return index !== -1 ? index : 0
    }
    return 0
  })
  const [isTransitioning, setIsTransitioning] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (photo) {
      const index = photos.findIndex(p => p.id === photo.id)
      if (index !== -1) {
        setCurrentIndex(index)
      }
    }
  }, [photo, photos])

  const currentPhoto = photos[currentIndex] || photo

  // Add blur transition when photo changes
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  if (!isOpen || !photo) return null

  const goToPrevious = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
    }, 0)
  }

  const goToNext = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
    }, 0)
  }

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
              ref={imgRef}
              key={currentPhoto.id}
              src={currentPhoto.src}
              alt={currentPhoto.alt}
              className={`max-w-full max-h-[70vh] object-contain block shadow-[0_0_30px_rgba(0,0,0,0.7)] transition-all duration-[300ms] ${isTransitioning ? 'blur-xl scale-95' : 'blur-0 scale-100'}`}
            />
          </div>

          <div className="text-gray-800 text-center mt-10 px-4 min-h-[120px]">
            <div className={`transition-opacity duration-[500ms] ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              <h2 className="text-xl font-semibold mt-20">{currentPhoto.title}</h2>
              {currentPhoto.description && (
                <p className="text-sm text-gray-600">{currentPhoto.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {currentPhoto.category}
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