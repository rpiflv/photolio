import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import PhotoGrid from '../components/PhotoGrid'
import PhotoModal from '../components/PhotoModal'
import { listS3Images } from '../lib/imageService'
import type { Photo } from '../data/photos'

export const Route = createFileRoute('/gallery')({ component: GalleryPage })

function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function loadPhotos() {
      try {
        setLoading(true)
        const s3Images = await listS3Images('gallery/')

        // Convert S3 images to Photo format
        const photoList: Photo[] = s3Images.map((img, index) => ({
          id: img.key,
          title:
            img.key
              .split('/')
              .pop()
              ?.replace(/\.[^/.]+$/, '')
              .replace(/[-_]/g, ' ') || 'Untitled',
          description: '',
          src: img.url,
          alt: img.key.split('/').pop() || 'Photo',
          category: 'other' as const,
          date: img.lastModified.toISOString().split('T')[0],
          featured: false,
          thumbnailSrc: img.thumbnailUrl,
          s3Key: img.key,
        }))

        setPhotos(photoList)
        setError(null)
      } catch (err) {
        console.error('Error loading photos:', err)
        setError('Failed to load photos from S3')
      } finally {
        setLoading(false)
      }
    }

    loadPhotos()
  }, [])

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPhoto(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading photos from S3...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Photo Gallery</h1>
          <p className="text-xl text-gray-600">All photos from S3 bucket</p>
        </div>

        {/* Photo Grid */}
        <PhotoGrid photos={photos} onPhotoClick={handlePhotoClick} />

        {/* Photo Count */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            Showing {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>
      </div>

      {/* Photo Modal */}
      <PhotoModal
        photo={selectedPhoto}
        photos={photos}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}