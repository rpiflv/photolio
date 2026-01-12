import { X, ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2 } from 'lucide-react'
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
  const [isFullScreen, setIsFullScreen] = useState(false)
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
      if (e.key === 'Escape') {
        // If in fullscreen, exit fullscreen first, then close modal
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, currentIndex])

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await document.documentElement.requestFullscreen()
        setIsFullScreen(true)
      } else {
        // Exit fullscreen
        await document.exitFullscreen()
        setIsFullScreen(false)
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 overflow-y-auto ${
      isFullScreen ? 'p-0' : 'p-4'
    }`}>
      {/* Close button - fixed on mobile, absolute in desktop normal mode */}
      <button
        onClick={onClose}
        className={`transition-colors z-20 rounded-full p-2 ${
          isFullScreen
            ? 'fixed top-8 right-8 sm:right-16 md:right-24 lg:right-16 text-white hover:text-gray-300 hover:bg-white/10' 
            : 'fixed top-8 right-8 sm:right-16 md:right-24 lg:hidden text-black hover:bg-black/10'
        }`}
        aria-label="Close"
      >
        <X size={32} />
      </button>

      {/* Full Screen Toggle Button */}
      <button
        onClick={toggleFullScreen}
        className={`transition-colors z-20 rounded-full p-2 ${
          isFullScreen
            ? 'fixed top-8 right-24 sm:right-32 md:right-40 lg:right-32 text-white hover:text-gray-300 hover:bg-white/10'
            : 'fixed top-8 right-24 sm:right-32 md:right-40 lg:hidden text-black hover:bg-black/10'
        }`}
        aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
      >
        {isFullScreen ? <Minimize2 size={28} /> : <Maximize2 size={28} />}
      </button>

      {/* Desktop navigation buttons - fixed on sides */}
      <button
        onClick={goToPrevious}
        className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
        aria-label="Previous photo"
      >
        <ChevronLeft size={48} />
      </button>

      <button
        onClick={goToNext}
        className="hidden lg:block fixed right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
        aria-label="Next photo"
      >
        <ChevronRight size={48} />
      </button>

      <div className={`w-full flex flex-col items-center ${isFullScreen ? '' : 'max-w-4xl max-h-full my-4'}`}>
        {isFullScreen ? (
          <>
            {/* Full screen mode - Image without white background */}
            <div className="relative flex items-center justify-center h-screen w-full">
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
                className={`max-w-full max-h-screen object-contain block transition-all duration-500 ease-in-out ${
                  loadedImages.has(currentPhoto.id) ? '' : 'opacity-0'
                } ${isTransitioning ? 'blur-md scale-99' : 'blur-0 scale-100'}`}
                onLoad={() => handleImageLoad(currentPhoto.id)}
              />
            </div>

            {/* Mobile navigation buttons below image */}
            <div className="lg:hidden flex justify-center gap-8 mt-4 mb-2">
              <button
                onClick={goToPrevious}
                className="text-white hover:text-gray-300 transition-colors p-3 hover:bg-white/10 rounded-full"
                aria-label="Previous photo"
              >
                <ChevronLeft size={40} />
              </button>
              <button
                onClick={goToNext}
                className="text-white hover:text-gray-300 transition-colors p-3 hover:bg-white/10 rounded-full"
                aria-label="Next photo"
              >
                <ChevronRight size={40} />
              </button>
            </div>

            {/* Full screen metadata shown below image */}
            <div className="bg-white/95 w-full p-4 mt-2 md:hidden">
              <div className={`text-gray-800 text-center transition-opacity duration-300 ease-in-out delay-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                <h2 className="text-lg font-semibold">{currentPhoto.title}</h2>
                {currentPhoto.description && (
                  <p className="text-sm text-gray-600 mt-1">{currentPhoto.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {currentPhoto.category}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {currentIndex + 1} / {photos.length}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Normal mode - Photo with passepartout */
          <div className="bg-white/95 p-4 pb-14 md:p-16 md:pb-12 shadow-2xl w-[90vw] max-w-5xl relative">
            {/* Desktop absolute positioned buttons inside white background */}
            <button
              onClick={onClose}
              className="hidden lg:block absolute top-4 right-4 text-black hover:bg-black/10 transition-colors z-20 rounded-full p-2"
              aria-label="Close"
            >
              <X size={32} />
            </button>

            <button
              onClick={toggleFullScreen}
              className="hidden lg:block absolute top-4 right-20 text-black hover:bg-black/10 transition-colors z-20 rounded-full p-2"
              aria-label="Enter full screen"
            >
              <Maximize2 size={28} />
            </button>

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

            {/* Mobile navigation buttons below image */}
            <div className="lg:hidden flex justify-center gap-8 mt-6 mb-4">
              <button
                onClick={goToPrevious}
                className="text-gray-800 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                aria-label="Previous photo"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={goToNext}
                className="text-gray-800 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                aria-label="Next photo"
              >
                <ChevronRight size={36} />
              </button>
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
        )}
      </div>
    </div>
  )
}