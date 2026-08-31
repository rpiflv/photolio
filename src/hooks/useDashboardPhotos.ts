import { useCallback, useMemo, useState } from 'react'
import { deletePhoto, getPhotos, replacePhotoImage, updatePhoto } from '../data/photos'
import type { Photo } from '../data/photos'
import type { Camera, Collection } from '../lib/supabase'
import type { EditPhotoForm } from '../routes/dashboard/-types'

export function useDashboardPhotos(collections: Collection[], cameras: Camera[]) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCamera, setFilterCamera] = useState('')
  const [filterCollection, setFilterCollection] = useState('')
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [editForm, setEditForm] = useState<EditPhotoForm>({ title: '', category: '', camera: '', collection: '1' })
  const [saving, setSaving] = useState(false)
  const [replacingImage, setReplacingImage] = useState(false)

  const fetchPhotos = useCallback(async () => {
    try {
      const data = await getPhotos()
      const sortedPhotos = [...data].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
      setPhotos(sortedPhotos)
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDelete = useCallback(async (photoId: string, photoTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${photoTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deletePhoto(photoId)
      await fetchPhotos()
      alert('Photo deleted successfully!')
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Failed to delete photo. Please try again.')
    }
  }, [fetchPhotos])

  const openEditModal = useCallback((photo: Photo) => {
    setEditingPhoto(photo)
    setEditForm({
      title: photo.title,
      category: photo.category,
      camera: photo.metadata?.cameraId || '',
      collection: String(photo.collectionId ?? 1),
    })
  }, [])

  const closeEditModal = useCallback(() => {
    setEditingPhoto(null)
  }, [])

  const handleEdit = useCallback(async () => {
    if (!editingPhoto || !editForm.title) return

    setSaving(true)
    try {
      await updatePhoto(editingPhoto.id, {
        title: editForm.title,
        category: editForm.category,
        camera: editForm.camera || null,
        collection_id: editForm.collection ? Number(editForm.collection) : 1,
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
  }, [editForm, editingPhoto, fetchPhotos])

  const handleReplaceImage = useCallback(async (file: File) => {
    if (!editingPhoto) return

    setReplacingImage(true)
    try {
      const updated = await replacePhotoImage(editingPhoto.id, file)
      await fetchPhotos()
      if (updated) {
        setEditingPhoto(updated)
      }
    } catch (error) {
      console.error('Error replacing photo image:', error)
      alert('Failed to replace photo image. Please try again.')
    } finally {
      setReplacingImage(false)
    }
  }, [editingPhoto, fetchPhotos])

  const totalLikes = useMemo(() => photos.reduce((sum, photo) => sum + (photo.likesCount || 0), 0), [photos])

  const photoCameras = useMemo(
    () => Array.from(new Set(photos.map((photo) => photo.metadata?.cameraId).filter(Boolean))).sort() as string[],
    [photos],
  )

  const cameraNameMap = useMemo(
    () => Object.fromEntries(cameras.map((camera) => [camera.id, camera.name])),
    [cameras],
  )

  const filteredPhotos = useMemo(
    () => photos.filter((photo) => {
      const matchesCategory = !filterCategory || photo.category === filterCategory
      const matchesCamera = !filterCamera || photo.metadata?.cameraId === filterCamera
      const matchesCollection = !filterCollection || String(photo.collectionId ?? 1) === filterCollection
      return matchesCategory && matchesCamera && matchesCollection
    }),
    [filterCamera, filterCategory, filterCollection, photos],
  )

  const getPhotoCollectionName = useCallback((photo: Photo) => {
    const collectionId = Number(photo.collectionId ?? 1) || 1
    const mappedName = collections.find((collection) => Number(collection.id) === collectionId)?.name
    const nameFromPhoto = typeof photo.collectionName === 'string' && !/^\d+$/.test(photo.collectionName.trim())
      ? photo.collectionName
      : undefined

    return mappedName || nameFromPhoto || (collectionId === 1 ? 'Default Collection' : `Collection ${collectionId}`)
  }, [collections])

  return {
    photos,
    loading,
    filterCategory,
    setFilterCategory,
    filterCamera,
    setFilterCamera,
    filterCollection,
    setFilterCollection,
    fetchPhotos,
    handleDelete,
    handleEdit,
    filteredPhotos,
    totalLikes,
    photoCameras,
    cameraNameMap,
    getPhotoCollectionName,
    editingPhoto,
    openEditModal,
    closeEditModal,
    editForm,
    setEditForm,
    saving,
    handleReplaceImage,
    replacingImage,
  }
}
