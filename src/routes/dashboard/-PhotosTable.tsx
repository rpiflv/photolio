import type { Dispatch, SetStateAction } from 'react'
import { Heart, Loader2, Pencil, Trash2 } from 'lucide-react'
import type { Photo } from '../../data/photos'
import type { Category, Collection } from '../../lib/supabase'

interface PhotosTableProps {
  loading: boolean
  filteredPhotos: Photo[]
  dbCategories: Category[]
  collections: Collection[]
  photoCameras: string[]
  cameraNameMap: Record<string, string>
  filterCategory: string
  setFilterCategory: Dispatch<SetStateAction<string>>
  filterCollection: string
  setFilterCollection: Dispatch<SetStateAction<string>>
  filterCamera: string
  setFilterCamera: Dispatch<SetStateAction<string>>
  onEdit: (photo: Photo) => void
  onDelete: (photoId: string, photoTitle: string) => void
  getPhotoCollectionName: (photo: Photo) => string
}

export function PhotosTable({
  loading,
  filteredPhotos,
  dbCategories,
  collections,
  photoCameras,
  cameraNameMap,
  filterCategory,
  setFilterCategory,
  filterCollection,
  setFilterCollection,
  filterCamera,
  setFilterCamera,
  onEdit,
  onDelete,
  getPhotoCollectionName,
}: PhotosTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Photos by Popularity</h2>
          <div className="flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="">All Categories</option>
              {dbCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={filterCollection}
              onChange={(e) => setFilterCollection(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="">All Collections</option>
              {collections.map((collection) => (
                <option key={collection.id} value={String(collection.id)}>{collection.name}</option>
              ))}
            </select>
            <select
              value={filterCamera}
              onChange={(e) => setFilterCamera(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="">All Cameras</option>
              {photoCameras.map((camera) => (
                <option key={camera} value={camera}>{cameraNameMap[camera] || camera}</option>
              ))}
            </select>
            {(filterCategory || filterCollection || filterCamera) ? (
              <button
                onClick={() => {
                  setFilterCategory('')
                  setFilterCollection('')
                  setFilterCamera('')
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPhotos.map((photo) => (
                <tr key={photo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={photo.thumbnailSrc || photo.src} alt={photo.alt} className="h-16 w-16 object-cover rounded-lg shadow" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{photo.title}</div>
                    {photo.description ? <div className="text-sm text-gray-500 truncate max-w-xs">{photo.description}</div> : null}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {dbCategories.find((category) => category.id === photo.category)?.name || photo.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getPhotoCollectionName(photo)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(photo.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Heart className={`h-5 w-5 ${(photo.likesCount || 0) > 0 ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold text-gray-900">{photo.likesCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => onEdit(photo)} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" title="Edit photo">
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button onClick={() => onDelete(photo.id, photo.title)} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" title="Delete photo">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
