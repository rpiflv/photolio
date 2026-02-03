import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAdmin } from '../hooks/useAdmin'
import { useState, useEffect } from 'react'
import { getPhotos } from '../data/photos'
import type { Photo } from '../data/photos'
import { BarChart3, Heart, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const data = await getPhotos()
        // Sort by likes count descending
        const sortedPhotos = [...data].sort((a, b) => 
          (b.likesCount || 0) - (a.likesCount || 0)
        )
        setPhotos(sortedPhotos)
      } catch (error) {
        console.error('Error fetching photos:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!adminLoading && isAdmin) {
      fetchPhotos()
    }
  }, [isAdmin, adminLoading])

  // Show loading while checking admin status
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
      </div>
    )
  }

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/" />
  }

  const totalLikes = photos.reduce((sum, photo) => sum + (photo.likesCount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <BarChart3 className="h-8 w-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Photo engagement analytics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Photos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{photos.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Likes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalLikes}</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg Likes/Photo</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {photos.length > 0 ? (totalLikes / photos.length).toFixed(1) : 0}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Photos Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Photos by Popularity</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Likes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {photos.map((photo) => (
                    <tr key={photo.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={photo.thumbnailSrc || photo.src}
                          alt={photo.alt}
                          className="h-16 w-16 object-cover rounded-lg shadow"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{photo.title}</div>
                        {photo.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {photo.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {photo.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(photo.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Heart
                            className={`h-5 w-5 ${
                              (photo.likesCount || 0) > 0 ? 'text-red-500 fill-red-500' : 'text-gray-400'
                            }`}
                          />
                          <span className="text-sm font-semibold text-gray-900">
                            {photo.likesCount || 0}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
