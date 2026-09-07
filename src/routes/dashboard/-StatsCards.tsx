import { BarChart3, Heart } from 'lucide-react'
import type { Photo } from '../../data/photos'

interface StatsCardsProps {
  photos: Photo[]
}

export function StatsCards({ photos }: StatsCardsProps) {
  const totalLikes = photos.reduce((sum, photo) => sum + (photo.likesCount || 0), 0)

  return (
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
  )
}
