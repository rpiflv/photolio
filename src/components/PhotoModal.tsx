import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
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
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const imgRef = useRef<HTMLImageElement>(null)

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId))
  }

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
      const timer = setTimeout(() => setIsTransitioning(false), 100)
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
        <div className="bg-white/95 p-4 pb-14 md:p-16 md:pb-12 shadow-2xl w-[90vw] max-w-5xl">
          <div className="relative h-[70vh] w-full flex items-center justify-center">
            {/* Loading Spinner */}
            {!loadedImages.has(currentPhoto.id) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
              </div>
            )}
            
            <img
              ref={imgRef}
              key={currentPhoto.id}
              src={currentPhoto.src}
              srcSet={currentPhoto.srcset}
              sizes="(max-width: 768px) 100vw, 1920px"
              alt={currentPhoto.alt}
              className={`max-w-full max-h-[70vh] object-contain block shadow-[0_0_30px_rgba(0,0,0,0.7)] transition-all duration-500 ease-in-out ${
                loadedImages.has(currentPhoto.id) ? '' : 'opacity-0'
              } ${isTransitioning ? 'blur-md scale-99' : 'blur-0 scale-100'}`}
              onLoad={() => handleImageLoad(currentPhoto.id)}
            />
          </div>

          <div className="text-gray-800 text-center mt-10 px-4 min-h-[120px]">
            <div className={`transition-opacity duration-300 ease-in-out delay-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
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