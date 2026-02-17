import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAdmin } from '../hooks/useAdmin'
import { useState, useEffect, useRef } from 'react'
import { getPhotos, uploadPhoto, deletePhoto, getCameras, addCamera, updatePhoto } from '../data/photos'
import { getMyContactInfo, updateContactInfo } from '../data/contactInfo'
import { getMyHomeInfo, updateHomeInfo } from '../data/homeInfo'
import type { Photo } from '../data/photos'
import type { Camera, ContactInfo, AboutInfo } from '../lib/supabase'
import { BarChart3, Heart, Loader2, Upload, Trash2, X, Pencil, Settings } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
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
  const [customCamera, setCustomCamera] = useState('')
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [editForm, setEditForm] = useState({ title: '', category: '', camera: '' })
  const [editCustomCamera, setEditCustomCamera] = useState('')
  const [saving, setSaving] = useState(false)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [showContactEdit, setShowContactEdit] = useState(false)
  const [contactForm, setContactForm] = useState({
    email: '',
    phone: '',
    location: '',
    twitter_handle: '',
    twitter_url: '',
    instagram_handle: '',
    instagram_url: '',
    heading: '',
    subheading: '',
  })
  const [savingContact, setSavingContact] = useState(false)
  const [aboutInfo, setAboutInfo] = useState<AboutInfo | null>(null)
  const [showAboutEdit, setShowAboutEdit] = useState(false)
  const [aboutForm, setAboutForm] = useState({ hero_title: '', hero_subtitle: '', featured_title: '', featured_subtitle: '', about_title: '', about_bio: '' })
  const [savingAbout, setSavingAbout] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCamera, setFilterCamera] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCameras = async () => {
    try {
      const data = await getCameras()
      setCameras(data)
    } catch (error) {
      console.error('Error fetching cameras:', error)
    }
  }

  const fetchContactInfo = async () => {
    try {
      const data = await getMyContactInfo()
      setContactInfo(data)
    } catch (error) {
      console.error('Error fetching contact info:', error)
    }
  }

  const fetchAboutInfo = async () => {
    try {
      const data = await getMyHomeInfo()
      setAboutInfo(data)
    } catch (error) {
      console.error('Error fetching home info:', error)
    }
  }

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
      fetchCameras()
      fetchContactInfo()
      fetchAboutInfo()
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
      let cameraValue = uploadForm.camera === '__other__' ? customCamera.trim() : uploadForm.camera

      // If adding a new camera, insert it into the cameras table
      if (uploadForm.camera === '__other__' && cameraValue) {
        try {
          await addCamera(cameraValue)
        } catch {
          // Camera may already exist, that's fine
        }
      }

      await uploadPhoto(selectedFile, {
        id: photoId,
        title: uploadForm.title,
        description: uploadForm.description || undefined,
        category: uploadForm.category,
        location: uploadForm.location || undefined,
        camera: cameraValue || undefined,
        lens: uploadForm.lens || undefined,
      })

      console.log('Upload successful, refreshing photos...')
      // Refresh photos list and cameras
      await fetchPhotos()
      await fetchCameras()
      
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
      setCustomCamera('')
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

  const handleEdit = async () => {
    if (!editingPhoto || !editForm.title) return

    setSaving(true)
    try {
      let cameraValue = editForm.camera === '__other__' ? editCustomCamera.trim() : editForm.camera

      // If adding a new camera, insert it into the cameras table
      if (editForm.camera === '__other__' && cameraValue) {
        try {
          await addCamera(cameraValue)
        } catch {
          // Camera may already exist
        }
      }

      await updatePhoto(editingPhoto.id, {
        title: editForm.title,
        category: editForm.category,
        camera: cameraValue || null,
      })

      await fetchPhotos()
      await fetchCameras()
      setEditingPhoto(null)
      alert('Photo updated successfully!')
    } catch (error) {
      console.error('Error updating photo:', error)
      alert('Failed to update photo. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAboutSave = async () => {
    if (!aboutInfo) return
    setSavingAbout(true)
    try {
      await updateHomeInfo(aboutInfo.id, {
        hero_title: aboutForm.hero_title || null,
        hero_subtitle: aboutForm.hero_subtitle || null,
        featured_title: aboutForm.featured_title || null,
        featured_subtitle: aboutForm.featured_subtitle || null,
        about_title: aboutForm.about_title || null,
        about_bio: aboutForm.about_bio || null,
      })
      await fetchAboutInfo()
      setShowAboutEdit(false)
      alert('Home page info updated successfully!')
    } catch (error) {
      console.error('Error updating home info:', error)
      alert('Failed to update home page info. Please try again.')
    } finally {
      setSavingAbout(false)
    }
  }

  const handleContactSave = async () => {
    if (!contactInfo) return
    setSavingContact(true)
    try {
      await updateContactInfo(contactInfo.id, {
        email: contactForm.email || null,
        phone: contactForm.phone || null,
        location: contactForm.location || null,
        twitter_handle: contactForm.twitter_handle || null,
        twitter_url: contactForm.twitter_url || null,
        instagram_handle: contactForm.instagram_handle || null,
        instagram_url: contactForm.instagram_url || null,
        heading: contactForm.heading || null,
        subheading: contactForm.subheading || null,
      })
      await fetchContactInfo()
      setShowContactEdit(false)
      alert('Contact info updated successfully!')
    } catch (error) {
      console.error('Error updating contact info:', error)
      alert('Failed to update contact info. Please try again.')
    } finally {
      setSavingContact(false)
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

  // Derive unique categories from photos
  const categories = Array.from(new Set(photos.map(p => p.category))).sort()

  // Derive unique cameras from photos
  const photoCameras = Array.from(new Set(photos.map(p => p.metadata?.camera).filter(Boolean))).sort() as string[]

  // Filter photos by category and/or camera
  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = !filterCategory || photo.category === filterCategory
    const matchesCamera = !filterCamera || photo.metadata?.camera === filterCamera
    return matchesCategory && matchesCamera
  })

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
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
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

        {/* Contact Info Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Contact Page</h2>
            <button
              onClick={() => {
                setContactForm({
                  email: contactInfo?.email || '',
                  phone: contactInfo?.phone || '',
                  location: contactInfo?.location || '',
                  twitter_handle: contactInfo?.twitter_handle || '',
                  twitter_url: contactInfo?.twitter_url || '',
                  instagram_handle: contactInfo?.instagram_handle || '',
                  instagram_url: contactInfo?.instagram_url || '',
                  heading: contactInfo?.heading || '',
                  subheading: contactInfo?.subheading || '',
                })
                setShowContactEdit(true)
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm">Edit</span>
            </button>
          </div>
          <div className="p-6">
            {contactInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-600">{contactInfo.email || '—'}</span></div>
                <div><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-600">{contactInfo.phone || '—'}</span></div>
                <div><span className="font-medium text-gray-700">Location:</span> <span className="text-gray-600">{contactInfo.location || '—'}</span></div>
                <div><span className="font-medium text-gray-700">X (Twitter):</span> <span className="text-gray-600">{contactInfo.twitter_handle || '—'}</span></div>
                <div><span className="font-medium text-gray-700">Instagram:</span> <span className="text-gray-600">{contactInfo.instagram_handle || '—'}</span></div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No contact info set yet. Click Edit to add your details.</p>
            )}
          </div>
        </div>

        {/* Home Page Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Home Page</h2>
            <button
              onClick={() => {
                setAboutForm({
                  hero_title: aboutInfo?.hero_title || '',
                  hero_subtitle: aboutInfo?.hero_subtitle || '',
                  featured_title: aboutInfo?.featured_title || '',
                  featured_subtitle: aboutInfo?.featured_subtitle || '',
                  about_title: aboutInfo?.about_title || '',
                  about_bio: aboutInfo?.about_bio || '',
                })
                setShowAboutEdit(true)
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm">Edit</span>
            </button>
          </div>
          <div className="p-6">
            {aboutInfo ? (
              <div className="text-sm space-y-3">
                <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Hero Section</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><span className="font-medium text-gray-700">Title:</span> <span className="text-gray-600">{aboutInfo.hero_title || '—'}</span></div>
                  <div><span className="font-medium text-gray-700">Subtitle:</span> <span className="text-gray-600">{aboutInfo.hero_subtitle || '—'}</span></div>
                </div>
                <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider pt-2 border-t border-gray-100">Featured Work Section</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div><span className="font-medium text-gray-700">Title:</span> <span className="text-gray-600">{aboutInfo.featured_title || '—'}</span></div>
                  <div><span className="font-medium text-gray-700">Subtitle:</span> <span className="text-gray-600">{aboutInfo.featured_subtitle || '—'}</span></div>
                </div>
                <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider pt-2 border-t border-gray-100">About Section</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className="font-medium text-gray-700">Title:</span> <span className="text-gray-600">{aboutInfo.about_title || '—'}</span></div>
                  <div><span className="font-medium text-gray-700">Bio:</span> <span className="text-gray-600">{aboutInfo.about_bio || '—'}</span></div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No home page info set yet. Click Edit to add your details.</p>
            )}
          </div>
        </div>

        {/* Photos Table */}
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
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
                <select
                  value={filterCamera}
                  onChange={(e) => setFilterCamera(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="">All Cameras</option>
                  {photoCameras.map(cam => (
                    <option key={cam} value={cam}>{cam}</option>
                  ))}
                </select>
                {(filterCategory || filterCamera) && (
                  <button
                    onClick={() => { setFilterCategory(''); setFilterCamera('') }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
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
                  {filteredPhotos.map((photo) => (
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
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingPhoto(photo)
                              setEditForm({
                                title: photo.title,
                                category: photo.category,
                                camera: photo.metadata?.camera || '',
                              })
                              setEditCustomCamera('')
                            }}
                            className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                            title="Edit photo"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(photo.id, photo.title)}
                            className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                            title="Delete photo"
                          >
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

        {/* Contact Edit Modal */}
        {showContactEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Contact Info</h2>
                  <button onClick={() => setShowContactEdit(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Heading</label>
                    <input type="text" value={contactForm.heading} onChange={(e) => setContactForm({ ...contactForm, heading: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Get In Touch" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Subheading</label>
                    <input type="text" value={contactForm.subheading} onChange={(e) => setContactForm({ ...contactForm, subheading: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ready to capture your special moments?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="your.email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" value={contactForm.location} onChange={(e) => setContactForm({ ...contactForm, location: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Your City, Country" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Handle</label>
                    <input type="text" value={contactForm.twitter_handle} onChange={(e) => setContactForm({ ...contactForm, twitter_handle: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="@yourhandle" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
                    <input type="url" value={contactForm.twitter_url} onChange={(e) => setContactForm({ ...contactForm, twitter_url: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://x.com/yourhandle" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
                    <input type="text" value={contactForm.instagram_handle} onChange={(e) => setContactForm({ ...contactForm, instagram_handle: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="@yourhandle" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                    <input type="url" value={contactForm.instagram_url} onChange={(e) => setContactForm({ ...contactForm, instagram_url: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://instagram.com/yourhandle" />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleContactSave}
                      disabled={savingContact}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {savingContact ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /><span>Saving...</span></>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                    <button
                      onClick={() => setShowContactEdit(false)}
                      disabled={savingContact}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Home Page Edit Modal */}
        {showAboutEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Home Page</h2>
                  <button onClick={() => setShowAboutEdit(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 text-sm">Hero Section</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={aboutForm.hero_title}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, hero_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Capturing Moments"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={aboutForm.hero_subtitle}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Through the lenses of my camera..."
                    />
                  </div>

                  <hr className="border-gray-200" />
                  <h3 className="font-semibold text-gray-800 text-sm">Featured Work Section</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={aboutForm.featured_title}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, featured_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Featured Work"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={aboutForm.featured_subtitle}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, featured_subtitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="A selection of my favorite photographs"
                    />
                  </div>

                  <hr className="border-gray-200" />
                  <h3 className="font-semibold text-gray-800 text-sm">About Section</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={aboutForm.about_title}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, about_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="About the Photographer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={aboutForm.about_bio}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, about_bio: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Write about yourself..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleAboutSave}
                    disabled={savingAbout}
                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                  >
                    {savingAbout ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setShowAboutEdit(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <select
                      value={uploadForm.camera}
                      onChange={(e) => {
                        setUploadForm({ ...uploadForm, camera: e.target.value })
                        if (e.target.value !== '__other__') setCustomCamera('')
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a camera</option>
                      {cameras.map((cam) => (
                        <option key={cam.id} value={cam.name}>{cam.name}</option>
                      ))}
                      <option value="__other__">Other (add new)</option>
                    </select>
                    {uploadForm.camera === '__other__' && (
                      <input
                        type="text"
                        value={customCamera}
                        onChange={(e) => setCustomCamera(e.target.value)}
                        className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new camera name"
                      />
                    )}
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

        {/* Edit Modal */}
        {editingPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Photo</h2>
                  <button
                    onClick={() => setEditingPhoto(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
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

                  {/* Camera */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Camera
                    </label>
                    <select
                      value={editForm.camera}
                      onChange={(e) => {
                        setEditForm({ ...editForm, camera: e.target.value })
                        if (e.target.value !== '__other__') setEditCustomCamera('')
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No camera</option>
                      {cameras.map((cam) => (
                        <option key={cam.id} value={cam.name}>{cam.name}</option>
                      ))}
                      <option value="__other__">Other (add new)</option>
                    </select>
                    {editForm.camera === '__other__' && (
                      <input
                        type="text"
                        value={editCustomCamera}
                        onChange={(e) => setEditCustomCamera(e.target.value)}
                        className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new camera name"
                      />
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleEdit}
                      disabled={!editForm.title || saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                    <button
                      onClick={() => setEditingPhoto(null)}
                      disabled={saving}
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
