import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAdmin } from '../hooks/useAdmin'
import { useState, useEffect, useRef } from 'react'
import { getPhotos, uploadPhoto, deletePhoto } from '../data/photos'
import type { Photo } from '../data/photos'
import { BarChart3, Heart, Loader2, Upload, Trash2, X } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'other' as 'portrait' | 'landscape' | 'street' | 'nature' | 'architecture' | 'other',
    location: '',
    camera: '',
    lens: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchPhotos()
    }
  }, [isAdmin, adminLoading])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setUploadForm(prev => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title) {
      setUploadError('Please select a file and provide a title')
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const photoId = crypto.randomUUID()
      
      console.log('Starting upload for:', selectedFile.name)
      await uploadPhoto(selectedFile, {
        id: photoId,
        title: uploadForm.title,
        description: uploadForm.description || undefined,
        category: uploadForm.category,
        location: uploadForm.location || undefined,
        camera: uploadForm.camera || undefined,
        lens: uploadForm.lens || undefined,
      })

      console.log('Upload successful, refreshing photos...')
      // Refresh photos list
      await fetchPhotos()
      
      // Reset form
      setShowUploadModal(false)
      setSelectedFile(null)
      setUploadError(null)
      setUploadForm({
        title: '',
        description: '',
        category: 'other',
        location: '',
        camera: '',
        lens: '',
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      alert('Photo uploaded successfully!\n\nIMPORTANT: Run "npm run optimize-existing" in the terminal to generate thumbnails and optimized versions.')
    } catch (error) {
      console.error('Error uploading photo:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo. Please try again.'
      setUploadError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photoId: string, photoTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${photoTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deletePhoto(photoId)
      
      // Refresh photos list
      await fetchPhotos()
      
      alert('Photo deleted successfully!')
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Failed to delete photo. Please try again.')
    }
  }

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
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Photo</span>
            </button>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(photo.id, photo.title)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Upload New Photo</h2>
                  <button
                    onClick={() => {
                      setShowUploadModal(false)
                      setSelectedFile(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Error Message */}
                  {uploadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium">Upload Error:</p>
                      <p className="text-sm">{uploadError}</p>
                    </div>
                  )}

                  {/* File Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Image
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter photo title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter photo description"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as any })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                      <option value="street">Street</option>
                      <option value="nature">Nature</option>
                      <option value="architecture">Architecture</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={uploadForm.location}
                      onChange={(e) => setUploadForm({ ...uploadForm, location: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., New York, USA"
                    />
                  </div>

                  {/* Camera */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Camera
                    </label>
                    <input
                      type="text"
                      value={uploadForm.camera}
                      onChange={(e) => setUploadForm({ ...uploadForm, camera: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Canon EOS R5"
                    />
                  </div>

                  {/* Lens */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lens
                    </label>
                    <input
                      type="text"
                      value={uploadForm.lens}
                      onChange={(e) => setUploadForm({ ...uploadForm, lens: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., RF 24-70mm f/2.8L"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFile || !uploadForm.title || uploading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>Upload Photo</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowUploadModal(false)
                        setSelectedFile(null)
                      }}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
