import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PhotoGrid from '../components/PhotoGrid'
import { ProtectedRoute } from '../components/ProtectedRoute'
import type { Photo } from '../data/photos'
import { getImageUrl, getThumbnailUrl } from '../lib/s3'

export const Route = createFileRoute('/favorites')({
  component: FavoritesPage,
})

function FavoritesPage() {
  return (
    <ProtectedRoute>
      <FavoritesContent />
    </ProtectedRoute>
  )
}

function FavoritesContent() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadFavoritePhotos()
    }
  }, [user])

  const loadFavoritePhotos = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        photo_id,
        photos (*)
      `)
      .eq('user_id', user.id)

    if (!error && data) {
      const favoritePhotos: Photo[] = data
        .filter(f => f.photos)
        .map((f: any) => ({
          id: f.photos.id,
          title: f.photos.title,
          description: f.photos.description,
          src: getImageUrl(f.photos.s3_key),
          alt: f.photos.description || f.photos.title,
          category: f.photos.category,
          date: f.photos.date,
          featured: f.photos.featured,
          thumbnailSrc: getThumbnailUrl(f.photos.s3_key),
          s3Key: f.photos.s3_key,
          price: f.photos.price,
          metadata: {
            location: f.photos.location,
            camera: f.photos.camera,
            lens: f.photos.lens,
            settings: f.photos.settings,
          }
        }))

      setPhotos(favoritePhotos)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading favorites...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Favorites</h1>
          <p className="text-xl text-gray-600">
            {photos.length > 0 
              ? `You have ${photos.length} favorite photo${photos.length > 1 ? 's' : ''}`
              : 'You have no favorite photos yet'}
          </p>
        </div>

        {photos.length > 0 ? (
          <PhotoGrid photos={photos} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Start adding photos to your favorites by clicking the heart icon on any photo!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
