import { useCallback, useRef, useState } from 'react'
import { uploadPhoto } from '../data/photos'
import { getImageUrl } from '../lib/s3'
import type { SocialPostResults, UploadForm } from '../routes/dashboard/-types'

function createInitialUploadForm(): UploadForm {
  return {
    title: '',
    description: '',
    category: 'other',
    collection: '1',
    location: '',
    camera: '',
    lens: '',
  }
}

function createInitialSocialPostForm() {
  return {
    enabled: false,
    xAccountIds: [] as string[],
    igAccountIds: [] as string[],
    caption: '',
  }
}

export function usePhotoUpload() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState<UploadForm>(createInitialUploadForm)
  const [uploadStep, setUploadStep] = useState<1 | 2>(1)
  const [socialPostForm, setSocialPostForm] = useState(createInitialSocialPostForm)
  const [socialPostResults, setSocialPostResults] = useState<SocialPostResults | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openUploadModal = useCallback(() => {
    setShowUploadModal(true)
  }, [])

  const closeUploadModal = useCallback(() => {
    setShowUploadModal(false)
    setSelectedFile(null)
    setUploadStep(1)
    setSocialPostForm(createInitialSocialPostForm())
  }, [])

  const cancelUploadStepOne = useCallback(() => {
    setShowUploadModal(false)
    setSelectedFile(null)
    setUploadStep(1)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setUploadForm((prev) => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }))
    }
  }, [])

  const handleUpload = useCallback(async (fetchPhotos: () => Promise<void>) => {
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
        collection_id: uploadForm.collection ? Number(uploadForm.collection) : 1,
        location: uploadForm.location || undefined,
        camera: uploadForm.camera || undefined,
        lens: uploadForm.lens || undefined,
      })

      console.log('Upload successful, refreshing photos...')

      let socialResults: SocialPostResults | null = null
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
            const data = await response.json() as { results: SocialPostResults }
            console.log('Social post results:', data.results)
            socialResults = data.results
          } else {
            console.error('Social post API error:', response.status, await response.text())
          }
        } catch (socialError) {
          console.error('Social media posting error:', socialError)
        }
      }

      await fetchPhotos()

      setShowUploadModal(false)
      setSelectedFile(null)
      setUploadError(null)
      setUploadStep(1)
      setUploadForm(createInitialUploadForm())
      setSocialPostForm(createInitialSocialPostForm())
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

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
  }, [selectedFile, socialPostForm, uploadForm])

  return {
    showUploadModal,
    setShowUploadModal,
    selectedFile,
    setSelectedFile,
    uploadError,
    setUploadError,
    uploadForm,
    setUploadForm,
    uploadStep,
    setUploadStep,
    socialPostForm,
    setSocialPostForm,
    socialPostResults,
    setSocialPostResults,
    uploading,
    fileInputRef,
    openUploadModal,
    closeUploadModal,
    cancelUploadStepOne,
    handleFileSelect,
    handleUpload,
  }
}
