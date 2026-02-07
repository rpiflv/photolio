import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Heart, Loader2 } from 'lucide-react'
import { getPhotos, getPhotosByCategory, photoQueryKeys } from '../data/photos'
import { useLikes } from '../hooks/useLikes'

export const Route = createFileRoute('/photo/$photoId')({
  component: PhotoCarouselPage,
  validateSearch: (search) => ({
    category: typeof search.category === 'string' ? search.category : 'all',
  }),
})

function PhotoCarouselPage() {
  const { photoId } = Route.useParams()
  const { category } = Route.useSearch()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isLandscape, setIsLandscape] = useState(false)
  const { toggleLike, isLiked } = useLikes()
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const { data: photos = [], isLoading } = useQuery({
    queryKey: photoQueryKeys.list(category),
    queryFn: () => category === 'all' ? getPhotos() : getPhotosByCategory(category),
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    const index = photos.findIndex(photo => photo.id === photoId)
    if (index !== -1) {
      setCurrentIndex(index)
    }
  }, [photoId, photos])

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 100)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)
    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  const handleImageLoad = (currentPhotoId: string) => {
    setLoadedImages(prev => new Set(prev).add(currentPhotoId))
  }

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

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) return
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const touchStart = touchStartRef.current
    const touch = event.changedTouches[0]
    if (!touchStart || !touch) return

    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const swipeThreshold = 50

    if (absDeltaX > absDeltaY && absDeltaX > swipeThreshold) {
      if (deltaX > 0) {
        goToPrevious()
      } else {
        goToNext()
      }
    }

    touchStartRef.current = null
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
      </div>
    )
  }

  const currentPhoto = photos[currentIndex]

  if (!currentPhoto) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-white">
        Photo not found
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button
        onClick={() => toggleLike(currentPhoto.id)}
        className={`transition-colors z-20 rounded-full p-2 fixed top-8 left-8 sm:left-16 md:left-24 hover:bg-white/10 ${
          isLiked(currentPhoto.id) ? 'text-red-500' : 'text-white hover:text-red-400'
        }`}
        aria-label={isLiked(currentPhoto.id) ? 'Unlike photo' : 'Like photo'}
      >
        <Heart size={28} fill={isLiked(currentPhoto.id) ? 'currentColor' : 'none'} />
      </button>

      <button
        onClick={goToPrevious}
        className="flex fixed left-4 top-1/2 -translate-y-1/2 text-white hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
        aria-label="Previous photo"
      >
        <ChevronLeft size={48} />
      </button>

      <button
        onClick={goToNext}
        className="flex fixed right-4 top-1/2 -translate-y-1/2 text-white hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
        aria-label="Next photo"
      >
        <ChevronRight size={48} />
      </button>

      <div className="w-full flex flex-col items-center">
        <div
          className="relative flex items-center justify-center h-screen w-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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
            className={`${isLandscape ? 'w-screen h-screen' : 'max-w-full max-h-screen'} object-contain block transition-all duration-500 ease-in-out ${
              loadedImages.has(currentPhoto.id) ? '' : 'opacity-0'
            } ${isTransitioning ? 'blur-md scale-99' : 'blur-0 scale-100'}`}
            onLoad={() => handleImageLoad(currentPhoto.id)}
          />
        </div>

        {!isLandscape && (
          <>
            <div className="flex justify-center gap-8 mt-4 mb-2">
              <button
                onClick={goToPrevious}
                className="text-white hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full"
                aria-label="Previous photo"
              >
                <ChevronLeft size={40} />
              </button>
              <button
                onClick={goToNext}
                className="text-white hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full"
                aria-label="Next photo"
              >
                <ChevronRight size={40} />
              </button>
            </div>

            <div className="bg-white/95 w-full p-4 mt-2">
              <div className={`text-gray-800 text-center transition-opacity duration-300 ease-in-out delay-500 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}>
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
        )}
      </div>
    </div>
  )
}
