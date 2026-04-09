import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAdmin } from '../hooks/useAdmin'
import { useState, useEffect, useRef } from 'react'
import { getPhotos, uploadPhoto, deletePhoto, getCameras, addCamera, renameCamera, deleteCamera, updateCameraImage, updatePhoto, getRawCategories, addCategory, renameCategory, deleteCategory } from '../data/photos'
import { getMyContactInfo, updateContactInfo } from '../data/contactInfo'
import { getMyHomeInfo, updateHomeInfo } from '../data/homeInfo'
import type { Photo } from '../data/photos'
import type { Camera, ContactInfo, AboutInfo, Category } from '../lib/supabase'
import { uploadImageWithPresignedUrl } from '../lib/imageService'
import { getImageUrl } from '../lib/s3'
import { BarChart3, Heart, Loader2, Upload, Trash2, X, Pencil, Settings, Plus, Share2, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCameraName, setNewCameraName] = useState('')
  const [newCameraImage, setNewCameraImage] = useState<File | null>(null)
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null)
  const [renameCategoryName, setRenameCategoryName] = useState('')
  const [renamingCamera, setRenamingCamera] = useState<string | null>(null)
  const [renameCameraName, setRenameCameraName] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'other' as string,
    location: '',
    camera: '',
    lens: '',
  })
  const [uploadStep, setUploadStep] = useState<1 | 2>(1)
  const [socialAccounts, setSocialAccounts] = useState<{ x: { id: string; label: string }[]; instagram: { id: string; label: string }[] }>({ x: [], instagram: [] })
  const [socialPostForm, setSocialPostForm] = useState({
    enabled: false,
    xAccountIds: [] as string[],
    igAccountIds: [] as string[],
    caption: '',
  })
  const [socialPostResults, setSocialPostResults] = useState<Record<string, { success: boolean; error?: string; postUrl?: string }> | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [editForm, setEditForm] = useState({ title: '', category: '', camera: '' })
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
  const [aboutForm, setAboutForm] = useState({ site_name: '', hero_title: '', hero_subtitle: '', featured_title: '', featured_subtitle: '', about_title: '', about_bio: '' })
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

  const fetchCategories = async () => {
    try {
      const data = await getRawCategories()
      setDbCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
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

  const fetchSocialAccounts = async () => {
    try {
      const response = await fetch('/api/social-accounts')
      if (response.ok) {
        const data = await response.json() as { x: { id: string; label: string }[]; instagram: { id: string; label: string }[] }
        setSocialAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching social accounts:', error)
    }
  }

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchPhotos()
      fetchCameras()
      fetchCategories()
      fetchContactInfo()
      fetchAboutInfo()
      fetchSocialAccounts()
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

      const uploadedPhoto = await uploadPhoto(selectedFile, {
        id: photoId,
        title: uploadForm.title,
        description: uploadForm.description || undefined,
        category: uploadForm.category,
        location: uploadForm.location || undefined,
        camera: uploadForm.camera || undefined,
        lens: uploadForm.lens || undefined,
      })

      console.log('Upload successful, refreshing photos...')

      // Social media posting
      let socialResults: Record<string, { success: boolean; error?: string; postUrl?: string }> | null = null
      if (socialPostForm.enabled && (socialPostForm.xAccountIds.length > 0 || socialPostForm.igAccountIds.length > 0)) {
        try {
          const s3Key = uploadedPhoto?.s3Key || `gallery/${uploadForm.category}/${photoId}.${selectedFile.name.split('.').pop()}`
          const imageUrl = getImageUrl(s3Key)
          const platforms: { platform: string; accountId: string }[] = []
          for (const accountId of socialPostForm.xAccountIds) {
            platforms.push({ platform: 'x', accountId })
          }
          for (const accountId of socialPostForm.igAccountIds) {
            platforms.push({ platform: 'instagram', accountId })
          }

          const response = await fetch('/api/social-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl,
              caption: socialPostForm.caption,
              platforms,
            }),
          })

          if (response.ok) {
            const data = await response.json() as { results: Record<string, { success: boolean; error?: string; postUrl?: string }> }
            console.log('Social post results:', data.results)
            socialResults = data.results
          } else {
            console.error('Social post API error:', response.status, await response.text())
          }
        } catch (socialError) {
          console.error('Social media posting error:', socialError)
        }
      }

      // Refresh photos list
      await fetchPhotos()
      
      // Reset form
      setShowUploadModal(false)
      setSelectedFile(null)
      setUploadError(null)
      setUploadStep(1)
      setUploadForm({
        title: '',
        description: '',
        category: 'other',
        location: '',
        camera: '',
        lens: '',
      })
      setSocialPostForm({ enabled: false, xAccountIds: [], igAccountIds: [], caption: '' })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Show results
      if (socialResults) {
        setSocialPostResults(socialResults)
      } else {
        alert('Photo uploaded successfully!')
      }
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
      await updatePhoto(editingPhoto.id, {
        title: editForm.title,
        category: editForm.category,
        camera: editForm.camera || null,
      })

      await fetchPhotos()
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
        site_name: aboutForm.site_name || null,
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

  // Derive unique cameras from photos (use cameraId for filtering)
  const photoCameras = Array.from(new Set(photos.map(p => p.metadata?.cameraId).filter(Boolean))).sort() as string[]
  const cameraNameMap = Object.fromEntries(cameras.map(c => [c.id, c.name]))

  // Filter photos by category and/or camera
  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = !filterCategory || photo.category === filterCategory
    const matchesCamera = !filterCamera || photo.metadata?.cameraId === filterCamera
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
                  site_name: aboutInfo?.site_name || '',
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

        {/* Categories & Cameras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Categories Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Gallery Categories</h2>
          </div>
          <div className="p-6">
            {/* Add new category */}
            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="e.g. Street Photography"
                />
              </div>
              <button
                onClick={async () => {
                  if (!newCategoryName.trim()) return
                  const slug = newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                  try {
                    await addCategory(slug, newCategoryName)
                    setNewCategoryName('')
                    await fetchCategories()
                  } catch (error) {
                    alert('Failed to add category. It may already exist.')
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Category list */}
            <div className="divide-y divide-gray-100">
              {dbCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-2">
                  {renamingCategory === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={renameCategoryName}
                        onChange={(e) => setRenameCategoryName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          if (!renameCategoryName.trim()) return
                          try {
                            await renameCategory(cat.id, renameCategoryName)
                            setRenamingCategory(null)
                            await fetchCategories()
                          } catch (error) {
                            alert('Failed to rename category.')
                          }
                        }}
                        className="text-xs px-2 py-1 bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setRenamingCategory(null)}
                        className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setRenamingCategory(cat.id)
                            setRenameCategoryName(cat.name)
                          }}
                          className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                          title="Rename"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete category "${cat.name}"? Photos in this category won't be deleted, but they'll have an unlinked category.`)) return
                            try {
                              await deleteCategory(cat.id)
                              await fetchCategories()
                            } catch (error) {
                              alert('Failed to delete category.')
                            }
                          }}
                          className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {dbCategories.length === 0 && (
                <p className="text-gray-500 text-sm py-2">No categories yet. Add one above.</p>
              )}
            </div>
          </div>
        </div>

        {/* Cameras Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cameras</h2>
          </div>
          <div className="p-6">
            {/* Add new camera */}
            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Camera Name</label>
                <input
                  type="text"
                  value={newCameraName}
                  onChange={(e) => setNewCameraName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="e.g. Canon EOS R5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewCameraImage(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
              <button
                onClick={async () => {
                  if (!newCameraName.trim()) return
                  try {
                    const slug = newCameraName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    let imageS3Key: string | undefined
                    if (newCameraImage) {
                      const ext = newCameraImage.name.split('.').pop()?.toLowerCase() || 'jpg'
                      imageS3Key = `cameras/${slug}.${ext}`
                      await uploadImageWithPresignedUrl(newCameraImage, imageS3Key)
                    }
                    await addCamera(slug, newCameraName.trim(), imageS3Key)
                    setNewCameraName('')
                    setNewCameraImage(null)
                    await fetchCameras()
                  } catch (error) {
                    alert('Failed to add camera. It may already exist.')
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Camera list */}
            <div className="divide-y divide-gray-100">
              {cameras.map((cam) => (
                <div key={cam.id} className="flex items-center justify-between py-2">
                  {renamingCamera === cam.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={renameCameraName}
                        onChange={(e) => setRenameCameraName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          if (!renameCameraName.trim()) return
                          try {
                            await renameCamera(cam.id, renameCameraName)
                            setRenamingCamera(null)
                            await fetchCameras()
                            await fetchPhotos()
                          } catch (error) {
                            alert('Failed to rename camera.')
                          }
                        }}
                        className="text-xs px-2 py-1 bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setRenamingCamera(null)}
                        className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        {cam.image_s3_key && (
                          <img src={getImageUrl(cam.image_s3_key)} alt={cam.name} className="h-8 w-8 rounded object-cover" />
                        )}
                        <span className="text-sm text-gray-700">{cam.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label
                          className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                          title="Upload image"
                        >
                          <Upload className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              try {
                                const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
                                const imageS3Key = `cameras/${cam.id}.${ext}`
                                await uploadImageWithPresignedUrl(file, imageS3Key)
                                await updateCameraImage(cam.id, imageS3Key)
                                await fetchCameras()
                              } catch (error) {
                                alert('Failed to upload camera image.')
                              }
                              e.target.value = ''
                            }}
                          />
                        </label>
                        <button
                          onClick={() => {
                            setRenamingCamera(cam.id)
                            setRenameCameraName(cam.name)
                          }}
                          className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                          title="Rename"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete camera "${cam.name}"? Photos using this camera won't be deleted, but they'll have an unlinked camera.`)) return
                            try {
                              await deleteCamera(cam.id)
                              await fetchCameras()
                            } catch (error) {
                              alert('Failed to delete camera.')
                            }
                          }}
                          className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {cameras.length === 0 && (
                <p className="text-gray-500 text-sm py-2">No cameras yet. Add one above.</p>
              )}
            </div>
          </div>
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
                  {dbCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <select
                  value={filterCamera}
                  onChange={(e) => setFilterCamera(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="">All Cameras</option>
                  {photoCameras.map(cam => (
                    <option key={cam} value={cam}>{cameraNameMap[cam] || cam}</option>
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
                                camera: photo.metadata?.cameraId || '',
                              })
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
                  <h3 className="font-semibold text-gray-800 text-sm">Site Branding</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                    <input
                      type="text"
                      value={aboutForm.site_name}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, site_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="My Photography"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shown in the header and browser tab</p>
                  </div>

                  <hr className="border-gray-200" />
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
                  <div className="flex items-center space-x-3">
                    {uploadStep === 2 && (
                      <button
                        onClick={() => setUploadStep(1)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900">
                      {uploadStep === 1 ? 'Upload New Photo' : 'Social Media Posting'}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowUploadModal(false)
                      setSelectedFile(null)
                      setUploadStep(1)
                      setSocialPostForm({ enabled: false, xAccountIds: [], igAccountIds: [], caption: '' })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Step indicator */}
                <div className="flex items-center mb-6">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${uploadStep === 1 ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>
                    {uploadStep === 1 ? '1' : '✓'}
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${uploadStep === 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${uploadStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    2
                  </div>
                </div>

                {uploadStep === 1 && (
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
                      {dbCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
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
                      onChange={(e) => setUploadForm({ ...uploadForm, camera: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a camera</option>
                      {cameras.map((cam) => (
                        <option key={cam.id} value={cam.id}>{cam.name}</option>
                      ))}
                    </select>
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
                      onClick={() => {
                        if (!selectedFile || !uploadForm.title) {
                          setUploadError('Please select a file and provide a title')
                          return
                        }
                        setUploadError(null)
                        setSocialPostForm(prev => ({
                          ...prev,
                          caption: prev.caption || uploadForm.title + (uploadForm.description ? '\n\n' + uploadForm.description : ''),
                        }))
                        setUploadStep(2)
                      }}
                      disabled={!selectedFile || !uploadForm.title}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Continue</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUploadModal(false)
                        setSelectedFile(null)
                        setUploadStep(1)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                )}

                {uploadStep === 2 && (
                <div className="space-y-4">
                  {/* Error Message */}
                  {uploadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium">Upload Error:</p>
                      <p className="text-sm">{uploadError}</p>
                    </div>
                  )}

                  {/* Summary of photo being uploaded */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Uploading: <span className="font-medium text-gray-900">{uploadForm.title}</span></p>
                    {selectedFile && (
                      <p className="text-xs text-gray-500 mt-1">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    )}
                  </div>

                  {/* Social media toggle */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Share2 className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Post to social media</p>
                          <p className="text-xs text-gray-500">Share this photo on X and/or Instagram</p>
                        </div>
                      </div>
                      <div
                        onClick={() => setSocialPostForm(prev => ({ ...prev, enabled: !prev.enabled, xAccountIds: !prev.enabled ? prev.xAccountIds : [], igAccountIds: !prev.enabled ? prev.igAccountIds : [] }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${socialPostForm.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${socialPostForm.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                    </label>
                  </div>

                  {socialPostForm.enabled && (socialAccounts.x.length > 0 || socialAccounts.instagram.length > 0) && (
                    <>
                      {/* X Account selection */}
                      {socialAccounts.x.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-700">X (Twitter) accounts</p>
                          </div>
                          <div className="space-y-1.5 pl-6">
                            {socialAccounts.x.map((account) => (
                              <label key={account.id} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={socialPostForm.xAccountIds.includes(account.id)}
                                  onChange={(e) => {
                                    setSocialPostForm(prev => ({
                                      ...prev,
                                      xAccountIds: e.target.checked
                                        ? [...prev.xAccountIds, account.id]
                                        : prev.xAccountIds.filter(id => id !== account.id),
                                    }))
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{account.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Instagram Account selection */}
                      {socialAccounts.instagram.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-700">Instagram accounts</p>
                          </div>
                          <div className="space-y-1.5 pl-6">
                            {socialAccounts.instagram.map((account) => (
                              <label key={account.id} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={socialPostForm.igAccountIds.includes(account.id)}
                                  onChange={(e) => {
                                    setSocialPostForm(prev => ({
                                      ...prev,
                                      igAccountIds: e.target.checked
                                        ? [...prev.igAccountIds, account.id]
                                        : prev.igAccountIds.filter(id => id !== account.id),
                                    }))
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{account.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Caption */}
                      {(socialPostForm.xAccountIds.length > 0 || socialPostForm.igAccountIds.length > 0) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Caption
                          </label>
                          <textarea
                            value={socialPostForm.caption}
                            onChange={(e) => setSocialPostForm(prev => ({ ...prev, caption: e.target.value }))}
                            rows={4}
                            maxLength={2200}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Write your post caption..."
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {socialPostForm.caption.length}/2200 characters
                            {socialPostForm.xAccountIds.length > 0 && socialPostForm.caption.length > 280 && (
                              <span className="text-amber-600 ml-2">(X posts are limited to 280 characters)</span>
                            )}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {socialPostForm.enabled && socialAccounts.x.length === 0 && socialAccounts.instagram.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
                      <p className="text-sm">No social media accounts configured. Add <code>TWITTER_ACCOUNTS</code> or <code>INSTAGRAM_ACCOUNTS</code> to your environment variables.</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || (socialPostForm.enabled && (socialPostForm.xAccountIds.length > 0 || socialPostForm.igAccountIds.length > 0) && !socialPostForm.caption.trim())}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{socialPostForm.enabled && (socialPostForm.xAccountIds.length > 0 || socialPostForm.igAccountIds.length > 0) ? 'Uploading & Posting...' : 'Uploading...'}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>{socialPostForm.enabled && (socialPostForm.xAccountIds.length > 0 || socialPostForm.igAccountIds.length > 0) ? 'Upload & Post' : 'Upload Photo'}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowUploadModal(false)
                        setSelectedFile(null)
                        setUploadStep(1)
                        setSocialPostForm({ enabled: false, xAccountIds: [], igAccountIds: [], caption: '' })
                      }}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Social Post Results Modal */}
        {socialPostResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Upload Complete</h2>
                  <button
                    onClick={() => setSocialPostResults(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-green-600">
                    <span className="text-lg">✓</span>
                    <span className="text-sm font-medium">Photo uploaded successfully</span>
                  </div>

                  {Object.entries(socialPostResults).map(([key, result]) => {
                    const [platform, accountId] = key.split(':')
                    const platformLabel = platform === 'x' ? 'X' : 'Instagram'
                    const allAccounts = platform === 'x' ? socialAccounts.x : socialAccounts.instagram
                    const accountLabel = allAccounts.find(a => a.id === accountId)?.label || accountId
                    const displayName = `${platformLabel} (${accountLabel})`

                    return (
                      <div key={key} className={`flex items-start space-x-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="text-lg">{result.success ? '✓' : '✗'}</span>
                        <div>
                          <span className="text-sm font-medium">
                            {result.success ? `Posted to ${displayName}` : `${displayName} posting failed`}
                          </span>
                          {result.postUrl && (
                            <a href={result.postUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline mt-0.5">
                              View post
                            </a>
                          )}
                          {result.error && (
                            <p className="text-xs text-red-500 mt-0.5">{result.error}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setSocialPostResults(null)}
                    className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Done
                  </button>
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
                      {dbCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Camera */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Camera
                    </label>
                    <select
                      value={editForm.camera}
                      onChange={(e) => setEditForm({ ...editForm, camera: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No camera</option>
                      {cameras.map((cam) => (
                        <option key={cam.id} value={cam.id}>{cam.name}</option>
                      ))}
                    </select>
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
