// Image service — all S3 operations go through server API routes.
// No AWS credentials are exposed to the browser.

export interface S3Image {
  key: string
  url: string
  thumbnailUrl: string
  size: number
  lastModified: Date
  contentType: string
}

export interface PhotoMetadata {
  id: string
  title: string
  description?: string
  category: 'portrait' | 'landscape' | 'street' | 'nature' | 'architecture' | 'other'
  date: string
  featured?: boolean
  tags?: string[]
  location?: string
  camera?: string
  lens?: string
  settings?: {
    aperture?: string
    shutter?: string
    iso?: number
    focalLength?: string
  }
}

export interface S3Photo extends PhotoMetadata {
  s3Key: string
  url: string
  thumbnailUrl: string
  dimensions?: {
    width: number
    height: number
  }
}

// Delete image from S3 via server API
export async function deleteImageFromS3(key: string): Promise<void> {
  const response = await fetch('/api/delete-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete image: ${response.status} ${errorText}`)
  }
}

// Upload image using server-generated presigned URL (client-side)
export async function uploadImageWithPresignedUrl(
  file: File,
  key: string
): Promise<void> {
  try {
    console.log('Getting presigned URL for:', key)
    // Get presigned URL from server
    const presignResponse = await fetch('/api/presigned-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, contentType: file.type }),
    })

    if (!presignResponse.ok) {
      const errorText = await presignResponse.text()
      throw new Error(`Failed to get presigned URL: ${presignResponse.status} ${errorText}`)
    }

    const { url: uploadUrl } = await presignResponse.json() as { url: string }
    
    console.log('Uploading file to S3...')
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('S3 upload failed:', response.status, errorText)
      throw new Error(`Upload failed: ${response.status} ${response.statusText}. ${errorText}`)
    }
    console.log('File uploaded successfully to S3')
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}