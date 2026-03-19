import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import PhotoGrid from '../components/PhotoGrid'
import GalleryInfoPopup from '../components/GalleryInfoPopup'
import { getPhotos, getPhotosByCategory, getCategories, getCamerasWithCounts, photoQueryKeys } from '../data/photos'

export const Route = createFileRoute('/gallery')({
  component: GalleryPage,
})

function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCamera, setSelectedCamera] = useState('all')
  const [hoveredCamera, setHoveredCamera] = useState<string | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)

  const handleCameraMouseEnter = useCallback((cameraId: string) => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredCamera(cameraId)
    }, 1000)
  }, [])

  const handleCameraMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setHoveredCamera(null)
  }, [])

  const handleTouchStart = useCallback((cameraId: string) => {
    longPressTriggeredRef.current = false
    hoverTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      setHoveredCamera(cameraId)
    }, 1000)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setHoveredCamera(null)
  }, [])

  // Fetch categories with caching
  const { data: categories = [] } = useQuery({
    queryKey: photoQueryKeys.categories(),
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  // Fetch cameras with caching
  const { data: cameras = [] } = useQuery({
    queryKey: photoQueryKeys.cameras(),
    queryFn: getCamerasWithCounts,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  // Fetch photos based on selected category with caching
  const { data: photos = [] } = useQuery({
    queryKey: photoQueryKeys.list(selectedCategory),
    queryFn: () => selectedCategory === 'all' ? getPhotos() : getPhotosByCategory(selectedCategory),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const filteredPhotos = selectedCamera === 'all'
    ? photos
    : photos.filter(photo => photo.metadata?.cameraId === selectedCamera)

  return (
    <div className="min-h-screen bg-[#f6f4f2] pt-24 pb-16">
      <GalleryInfoPopup />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.08em] text-neutral-900 mb-4">
            Photo Gallery
          </h1>
          <p className="text-base md:text-lg text-neutral-500">
            A quiet selection of monochrome work
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-2 border rounded-full text-xs tracking-[0.2em] uppercase transition-colors ${
                selectedCategory === category.id
                  ? 'bg-neutral-900 text-neutral-100 border-neutral-900'
                  : 'bg-transparent text-neutral-600 border-neutral-300 hover:border-neutral-500'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Camera Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {cameras.map((camera) => (
            <div
              key={camera.id}
              className="relative"
              onMouseEnter={() => camera.imageUrl ? handleCameraMouseEnter(camera.id) : undefined}
              onMouseLeave={handleCameraMouseLeave}
              onTouchStart={() => camera.imageUrl ? handleTouchStart(camera.id) : undefined}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <button
                onClick={() => {
                  if (longPressTriggeredRef.current) {
                    longPressTriggeredRef.current = false
                    return
                  }
                  setSelectedCamera(camera.id)
                }}
                className={`px-5 py-2 border rounded-full text-xs tracking-[0.2em] uppercase transition-colors ${
                  selectedCamera === camera.id
                    ? 'bg-neutral-700 text-neutral-100 border-neutral-700'
                    : 'bg-transparent text-neutral-500 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                {camera.name} ({camera.count})
              </button>
              {hoveredCamera === camera.id && camera.imageUrl && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 animate-fade-in">
                  <div className="bg-[#f6f4f2] border border-neutral-200 rounded-xl shadow-xl p-2.5" style={{ width: '280px' }}>
                    <img
                      src={camera.imageUrl}
                      alt={camera.name}
                      className="w-full object-contain"
                    />
                    <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-400 text-center mt-1.5 font-light">
                      {camera.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Photo Grid */}
        <PhotoGrid photos={filteredPhotos} categoryId={selectedCategory} />
      </div>
    </div>
  )
}