import { useCallback, useState } from 'react'
import { addCamera, deleteCamera, getCameras, renameCamera, updateCameraImage } from '../data/photos'
import type { Camera } from '../lib/supabase'
import { uploadImageWithPresignedUrl } from '../lib/imageService'
import { slugify } from '../lib/slugify'

export function useCameras() {
  const [cameras, setCameras] = useState<Camera[]>([])

  const fetchCameras = useCallback(async () => {
    try {
      const data = await getCameras()
      setCameras(data)
    } catch (error) {
      console.error('Error fetching cameras:', error)
    }
  }, [])

  const createCamera = useCallback(async (name: string, file: File | null) => {
    const trimmedName = name.trim()
    const slug = slugify(trimmedName)
    let imageS3Key: string | undefined

    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      imageS3Key = `cameras/${slug}.${ext}`
      await uploadImageWithPresignedUrl(file, imageS3Key)
    }

    return addCamera(slug, trimmedName, imageS3Key)
  }, [])

  const updateCameraName = useCallback((id: string, name: string) => {
    return renameCamera(id, name)
  }, [])

  const uploadCameraFile = useCallback(async (id: string, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const imageS3Key = `cameras/${id}.${ext}`
    await uploadImageWithPresignedUrl(file, imageS3Key)
    return updateCameraImage(id, imageS3Key)
  }, [])

  const removeCamera = useCallback((id: string) => {
    return deleteCamera(id)
  }, [])

  return {
    cameras,
    fetchCameras,
    createCamera,
    updateCameraName,
    uploadCameraFile,
    removeCamera,
  }
}
