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
    <div className="min-h-screen bg-gray-50 py-16">
      <GalleryInfoPopup />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Photo Gallery</h1>
          <p className="text-xl text-gray-600">
            Explore my collection of photographs
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                selectedCategory === category.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Photo Grid */}
        <PhotoGrid photos={filteredPhotos} />
      </div>
    </div>
  )
}