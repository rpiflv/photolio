import { ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client, BUCKET_NAME } from './s3'

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

// Generate presigned URL for viewing an image
export async function getPresignedImageUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  return getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour
}

// List all images in the S3 bucket with presigned URLs
export async function listS3Images(prefix: string = 'gallery/'): Promise<S3Image[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents) {
      return []
    }

    const images = await Promise.all(
      response.Contents
        .filter(obj => obj.Key && obj.Size && obj.LastModified)
        .map(async (obj) => {
          const presignedUrl = await getPresignedImageUrl(obj.Key!)
          
          return {
            key: obj.Key!,
            url: presignedUrl,
            thumbnailUrl: presignedUrl, // Use same URL for now
            size: obj.Size!,
            lastModified: obj.LastModified!,
            contentType: obj.Key!.toLowerCase().endsWith('.jpg') || obj.Key!.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 
                         obj.Key!.toLowerCase().endsWith('.png') ? 'image/png' :
                         obj.Key!.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg'
          }
        })
    )

    return images
  } catch (error) {
    console.error('Error listing S3 images:', error)
    return []
  }
}

// Generate a presigned URL for uploading
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour
}

// Upload image to S3 (for server-side usage)
export async function uploadImageToS3(
  key: string, 
  imageBuffer: Buffer, 
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      Metadata: metadata,
      CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
    })

    await s3Client.send(command)
    return await getPresignedImageUrl(key)
  } catch (error) {
    console.error('Error uploading to S3:', error)
    throw error
  }
}

// Get image with different sizes (using presigned URLs)
export async function getImageSizes(key: string) {
  const url = await getPresignedImageUrl(key)
  return {
    full: url,
    large: url,
    medium: url,
    small: url,
    thumbnail: url,
  }
}

// Delete image from S3
export async function deleteImageFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('Error deleting from S3:', error)
    throw error
  }
}

// Upload image using presigned URL (client-side)
export async function uploadImageWithPresignedUrl(
  file: File,
  key: string
): Promise<void> {
  try {
    console.log('Getting presigned URL for:', key)
    const uploadUrl = await getUploadUrl(key, file.type)
    
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