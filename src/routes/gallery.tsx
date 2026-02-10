import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PhotoGrid from '../components/PhotoGrid'
import GalleryInfoPopup from '../components/GalleryInfoPopup'
import { getPhotos, getPhotosByCategory, getCategories, photoQueryKeys } from '../data/photos'

export const Route = createFileRoute('/gallery')({
  component: GalleryPage,
})

function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Fetch categories with caching
  const { data: categories = [] } = useQuery({
    queryKey: photoQueryKeys.categories(),
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  // Fetch photos based on selected category with caching
  const { data: photos = [] } = useQuery({
    queryKey: photoQueryKeys.list(selectedCategory),
    queryFn: () => selectedCategory === 'all' ? getPhotos() : getPhotosByCategory(selectedCategory),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const filteredPhotos = photos

  return (
    <div className="min-h-screen bg-[#f6f4f2] py-16">
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
        <div className="flex flex-wrap justify-center gap-3 mb-12">
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

        {/* Photo Grid */}
        <PhotoGrid photos={filteredPhotos} categoryId={selectedCategory} />
      </div>
    </div>
  )
}