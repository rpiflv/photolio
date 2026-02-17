import { X, ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, Heart } from 'lucide-react'
import { Photo } from '../data/photos'
import { useState, useEffect, useRef } from 'react'
import { useLikes } from '../hooks/useLikes'

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
  const [isMobile, setIsMobile] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const { toggleLike, isLiked } = useLikes()

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

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    updateIsMobile()
    window.addEventListener('resize', updateIsMobile)
    return () => window.removeEventListener('resize', updateIsMobile)
  }, [])

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

  // Auto-enter fullscreen on mobile when modal opens
  useEffect(() => {
    if (isOpen && isMobile && !isFullScreen) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        toggleFullScreen()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isMobile, isFullScreen])

  const toggleFullScreen = async () => {
    try {
      if (!isFullScreen) {
        // Enter fullscreen - first exit if already in fullscreen
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
        await document.documentElement.requestFullscreen()
      } else {
        // Exit fullscreen
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
      // Sync state with actual fullscreen state if there's an error
      setIsFullScreen(!!document.fullscreenElement)
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto backdrop-blur-3xl ${
      isFullScreen || isMobile ? 'p-0 bg-black/93' : 'p-6 bg-black/90'
    }`}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="transition-colors z-20 rounded-full p-2 fixed top-8 right-8 sm:right-16 md:right-24 lg:right-16 text-neutral-200 hover:text-white hover:bg-white/10"
        aria-label="Close"
      >
        <X size={32} />
      </button>

      {/* Like Button */}
      <button
        onClick={() => toggleLike(currentPhoto.id)}
        className={`transition-colors z-20 rounded-full p-2 fixed top-8 left-8 sm:left-16 md:left-24 lg:left-16 hover:bg-white/10 ${
          isLiked(currentPhoto.id) ? 'text-neutral-100' : 'text-neutral-300 hover:text-white'
        }`}
        aria-label={isLiked(currentPhoto.id) ? "Unlike photo" : "Like photo"}
      >
        <Heart size={28} fill={isLiked(currentPhoto.id) ? 'currentColor' : 'none'} />
      </button>

      {/* Full Screen Toggle Button (desktop only) */}
      {isFullScreen && (
        <button
          onClick={toggleFullScreen}
          className="hidden lg:block fixed top-8 right-24 sm:right-32 md:right-40 lg:right-32 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors z-20 rounded-full p-2"
          aria-label="Exit full screen"
        >
          <Minimize2 size={28} />
        </button>
      )}

      {!isFullScreen && !isMobile && (
        <button
          onClick={toggleFullScreen}
          className="hidden lg:block fixed top-8 right-24 sm:right-32 md:right-40 lg:right-32 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors z-20 rounded-full p-2"
          aria-label="Enter full screen"
        >
          <Maximize2 size={28} />
        </button>
      )}

      {/* Desktop navigation buttons - fixed on sides */}
      <button
        onClick={goToPrevious}
        className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
        aria-label="Previous photo"
      >
        <ChevronLeft size={48} />
      </button>

      <button
        onClick={goToNext}
        className="hidden lg:block fixed right-4 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
        aria-label="Next photo"
      >
        <ChevronRight size={48} />
      </button>

      <div className={`w-full flex flex-col items-center ${isFullScreen || isMobile ? '' : 'max-w-6xl max-h-full my-6 px-6 md:px-10'}`}>
        {isFullScreen || isMobile ? (
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
                key={currentPhoto.id}
                src={currentPhoto.src}
                srcSet={currentPhoto.srcset}
                sizes="(max-width: 768px) 100vw, 1920px"
                alt={currentPhoto.alt}
                className={`max-w-full max-h-screen object-contain block transition-all duration-500 ease-in-out ${
                  loadedImages.has(currentPhoto.id) ? '' : 'opacity-0'
                } ${isTransitioning ? 'blur-md scale-99' : 'blur-0 scale-100'}`}
                style={{ border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
                onLoad={() => handleImageLoad(currentPhoto.id)}
              />
            </div>

            {/* Mobile navigation buttons below image */}
            <div className="lg:hidden flex justify-center gap-8 mt-4 mb-2">
              <button
                onClick={goToPrevious}
                className="text-neutral-300 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full"
                aria-label="Previous photo"
              >
                <ChevronLeft size={40} />
              </button>
              <button
                onClick={goToNext}
                className="text-neutral-300 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full"
                aria-label="Next photo"
              >
                <ChevronRight size={40} />
              </button>
            </div>

            {/* Full screen metadata shown below image */}
            <div className="w-full px-6 pb-6 mt-2 md:hidden">
              <div className={`text-neutral-300 text-center transition-opacity duration-300 ease-in-out delay-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                <h2 className="text-base tracking-wide">{currentPhoto.title}</h2>
                {currentPhoto.description && (
                  <p className="text-xs text-neutral-400 mt-1">{currentPhoto.description}</p>
                )}
                <p className="text-[11px] text-neutral-500 mt-2 uppercase tracking-[0.2em]">
                  {currentPhoto.category}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  {currentIndex + 1} / {photos.length}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="group w-full flex flex-col items-center">
            <div className="relative w-full flex items-center justify-center min-h-[60vh] max-h-[80vh]">
              {!loadedImages.has(currentPhoto.id) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                </div>
              )}

              <div
                className="inline-block"
                style={{ border: '55px solid rgba(255, 255, 255, 0.84)', boxShadow: '0 12px 60px rgba(0,0,0,0.7)' }}
              >
                <div className="relative leading-[0]">
                  <img
                    ref={imgRef}
                    key={currentPhoto.id}
                    src={currentPhoto.src}
                    srcSet={currentPhoto.srcset}
                    sizes="(max-width: 768px) 100vw, 1920px"
                    alt={currentPhoto.alt}
                    className={`max-w-full max-h-[80vh] object-contain block transition-all duration-500 ease-in-out ${
                      loadedImages.has(currentPhoto.id) ? '' : 'opacity-0'
                    } ${isTransitioning ? 'blur-md scale-99' : 'blur-0 scale-100'}`}
                    onLoad={() => handleImageLoad(currentPhoto.id)}
                  />
                  {/* Outward shadow from image edge onto the white border */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ boxShadow: '0 2px 15px rgba(0,0,0,0.35), 0 0 5px rgba(0,0,0,0.15)' }}
                  />
                </div>
              </div>
            </div>

            <div className="lg:hidden flex justify-center gap-8 mt-6 mb-4">
              <button
                onClick={goToPrevious}
                className="text-neutral-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                aria-label="Previous photo"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={goToNext}
                className="text-neutral-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                aria-label="Next photo"
              >
                <ChevronRight size={36} />
              </button>
            </div>

            <div className={`mt-6 text-center text-neutral-300 transition-opacity duration-500 ${
              isTransitioning ? 'opacity-0' : isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <h2 className="text-lg tracking-wide">{currentPhoto.title}</h2>
              {currentPhoto.description && (
                <p className="text-xs text-neutral-400 mt-1">{currentPhoto.description}</p>
              )}
              <p className="text-[11px] text-neutral-500 mt-2 uppercase tracking-[0.2em]">
                {currentPhoto.category}
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}