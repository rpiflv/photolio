import { getImageUrl, getOptimizedImageUrl, getThumbnailUrl, getImageSrcSet } from '../lib/s3'
import { supabase } from '../lib/supabase'
import type { Photo as DBPhoto, Camera as DBCamera, Category as DBCategory } from '../lib/supabase'
import { deleteImageFromS3, uploadImageWithPresignedUrl } from '../lib/imageService'

// Query keys for TanStack Query
export const photoQueryKeys = {
  all: ['photos'] as const,
  lists: () => [...photoQueryKeys.all, 'list'] as const,
  list: (filters?: string) => [...photoQueryKeys.lists(), filters] as const,
  details: () => [...photoQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...photoQueryKeys.details(), id] as const,
  featured: () => [...photoQueryKeys.all, 'featured'] as const,
  categories: () => ['categories'] as const,
  cameras: () => ['cameras'] as const,
}

export interface Photo {
  id: string
  title: string
  description?: string
  src: string
  srcset?: string
  alt: string
  category: string
  date: string
  featured?: boolean
  dimensions?: {
    width: number
    height: number
  }
  thumbnailSrc?: string
  s3Key?: string
  price?: number
  likesCount?: number
  metadata?: {
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
}

// Convert database photo to Photo interface
function dbPhotoToPhoto(dbPhoto: DBPhoto): Photo {
  return {
    id: dbPhoto.id,
    title: dbPhoto.title,
    description: dbPhoto.description || undefined,
    src: getImageUrl(dbPhoto.s3_key),
    srcset: getImageSrcSet(dbPhoto.s3_key),
    alt: dbPhoto.description || dbPhoto.title,
    category: dbPhoto.category as any,
    date: dbPhoto.date,
    featured: dbPhoto.featured,
    thumbnailSrc: getThumbnailUrl(dbPhoto.s3_key),
    s3Key: dbPhoto.s3_key,
    price: dbPhoto.price || undefined,
    likesCount: dbPhoto.likes_count || 0,
    dimensions: dbPhoto.dimensions || undefined,
    metadata: {
      location: dbPhoto.location || undefined,
      camera: dbPhoto.camera || undefined,
      lens: dbPhoto.lens || undefined,
      settings: dbPhoto.settings || undefined,
    }
  }
}

// Fetch all photos from Supabase
export async function getPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching photos:', error)
    return []
  }

  const photos = data.map(dbPhotoToPhoto)
  
  // Sort by category: other, street, then alphabetically
  const categoryOrder: Record<string, number> = {
    'other': 0,
    'street': 1,
    'portrait': 2,
    'landscape': 3,
    'nature': 4,
    'architecture': 5
  }
  
  return photos.sort((a, b) => {
    const orderA = categoryOrder[a.category] ?? 999
    const orderB = categoryOrder[b.category] ?? 999
    return orderA - orderB
  })
}

// Get featured photos (randomly select 3)
export async function getFeaturedPhotos(): Promise<Photo[]> {
  const photos = await getPhotos()
  
  // Use today's date as seed for consistent daily selection
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  
  const shuffled = [...photos].sort((a, b) => {
    const hashA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), seed)
    const hashB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), seed)
    return Math.sin(hashA) - Math.sin(hashB)
  })
  
  return shuffled.slice(0, Math.min(3, shuffled.length))
}

// Get photos by category
export async function getPhotosByCategory(category: string): Promise<Photo[]> {
  if (category === 'all') {
    return getPhotos()
  }

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('category', category)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching photos by category:', error)
    return []
  }

  return data.map(dbPhotoToPhoto)
}

// Get photo by ID
export async function getPhotoById(id: string): Promise<Photo | null> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching photo:', error)
    return null
  }

  return dbPhotoToPhoto(data)
}

// Get categories with counts
export async function getCategories() {
  const { data: categories } = await supabase.from('categories').select('*')
  const { data: photos } = await supabase.from('photos').select('category')

  const counts: Record<string, number> = {}
  photos?.forEach(photo => {
    counts[photo.category] = (counts[photo.category] || 0) + 1
  })

  return [
    { id: 'all', name: 'All Photos', count: photos?.length || 0 },
    ...(categories?.filter(cat => cat.id !== 'all').map(cat => ({
      id: cat.id,
      name: cat.name,
      count: counts[cat.id] || 0
    })) || [])
  ]
}

// Get raw categories (for management)
export async function getRawCategories(): Promise<DBCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

// Add a new category
export async function addCategory(id: string, name: string): Promise<DBCategory | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ id: id.trim().toLowerCase(), name: name.trim() })
    .select()
    .single()

  if (error) {
    console.error('Error adding category:', error)
    throw error
  }

  return data
}

// Rename a category
export async function renameCategory(id: string, newName: string): Promise<DBCategory | null> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: newName.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error renaming category:', error)
    throw error
  }

  return data
}

// Delete a category
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

// Get responsive image URLs
export const getResponsiveImageUrls = (s3Key: string) => ({
  small: getThumbnailUrl(s3Key),
  medium: getOptimizedImageUrl(s3Key, 'medium'),
  large: getOptimizedImageUrl(s3Key, 'large'),
  xlarge: getOptimizedImageUrl(s3Key, 'full'),
  original: getImageUrl(s3Key)
})

// Create a new photo
export async function createPhoto(photoData: {
  id: string
  title: string
  description?: string
  s3Key: string
  thumbnailS3Key?: string
  mediumS3Key?: string
  category: string
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
  dimensions?: {
    width: number
    height: number
  }
  price?: number
}): Promise<Photo | null> {
  const { data, error } = await supabase
    .from('photos')
    .insert({
      id: photoData.id,
      title: photoData.title,
      description: photoData.description || null,
      s3_key: photoData.s3Key,
      thumbnail_s3_key: photoData.thumbnailS3Key || null,
      medium_s3_key: photoData.mediumS3Key || null,
      category: photoData.category,
      date: photoData.date,
      featured: photoData.featured || false,
      tags: photoData.tags || [],
      location: photoData.location || null,
      camera: photoData.camera || null,
      lens: photoData.lens || null,
      settings: photoData.settings || null,
      dimensions: photoData.dimensions || null,
      price: photoData.price || null,
      likes_count: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating photo:', error)
    throw error
  }

  return dbPhotoToPhoto(data)
}

// Delete a photo (removes from database and S3)
export async function deletePhoto(photoId: string): Promise<void> {
  // First get the photo to retrieve the S3 key and optimized keys
  const { data: dbPhoto, error: fetchError } = await supabase
    .from('photos')
    .select('id, s3_key, thumbnail_s3_key, medium_s3_key')
    .eq('id', photoId)
    .single()

  if (fetchError || !dbPhoto?.s3_key) {
    throw new Error('Photo not found or missing S3 key')
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (dbError) {
    console.error('Error deleting photo from database:', dbError)
    throw dbError
  }

  // Delete all versions from S3
  const keysToDelete = [dbPhoto.s3_key]
  if (dbPhoto.thumbnail_s3_key) keysToDelete.push(dbPhoto.thumbnail_s3_key)
  if (dbPhoto.medium_s3_key) keysToDelete.push(dbPhoto.medium_s3_key)

  for (const key of keysToDelete) {
    try {
      await deleteImageFromS3(key)
    } catch (error) {
      console.warn(`Failed to delete S3 object ${key}:`, error)
    }
  }
}

// Upload photo to S3 and create database entry
export async function uploadPhoto(
  file: File,
  photoData: {
    id: string
    title: string
    description?: string
    category: string
    date?: string
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
    price?: number
  }
): Promise<Photo | null> {
  const s3Key = `gallery/${photoData.category}/${photoData.id}.${file.name.split('.').pop()}`
  
  console.log('Starting photo upload process...')
  console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type)
  console.log('S3 Key:', s3Key)
  
  try {
    // Step 1: Upload original to S3
    console.log('Step 1: Uploading original to S3...')
    await uploadImageWithPresignedUrl(file, s3Key)
    
    // Step 2: Call server-side optimization API (uses Sharp)
    console.log('Step 2: Optimizing image server-side...')
    const optimizeResponse = await fetch('/api/optimize-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s3Key }),
    })

    if (!optimizeResponse.ok) {
      const errorData = await optimizeResponse.text()
      console.error('Optimization API error:', errorData)
      throw new Error(`Image optimization failed: ${optimizeResponse.status}`)
    }

    const optimized = await optimizeResponse.json() as {
      thumbnailS3Key: string
      mediumS3Key: string
      dimensions: { width: number; height: number }
    }
    console.log('Optimization complete:', optimized)
    
    // Step 3: Create database entry with all S3 keys
    console.log('Step 3: Creating database entry...')
    const photo = await createPhoto({
      ...photoData,
      s3Key,
      thumbnailS3Key: optimized.thumbnailS3Key,
      mediumS3Key: optimized.mediumS3Key,
      date: photoData.date || new Date().toISOString(),
      dimensions: optimized.dimensions,
    })
    
    console.log('Photo upload completed successfully with all optimized versions')
    return photo
  } catch (error) {
    console.error('Error in uploadPhoto:', error)
    throw error
  }
}

// Fetch all cameras from the cameras table
export async function getCameras(): Promise<DBCamera[]> {
  const { data, error } = await supabase
    .from('cameras')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching cameras:', error)
    return []
  }

  return data
}

// Add a new camera to the cameras table
export async function addCamera(name: string): Promise<DBCamera | null> {
  const { data, error } = await supabase
    .from('cameras')
    .insert({ name: name.trim() })
    .select()
    .single()

  if (error) {
    console.error('Error adding camera:', error)
    throw error
  }

  return data
}

// Rename a camera
export async function renameCamera(id: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('cameras')
    .update({ name: newName.trim() })
    .eq('id', id)

  if (error) {
    console.error('Error renaming camera:', error)
    throw error
  }
}

// Delete a camera
export async function deleteCamera(id: string): Promise<void> {
  const { error } = await supabase
    .from('cameras')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting camera:', error)
    throw error
  }
}

// Update a photo's metadata
export async function updatePhoto(
  photoId: string,
  updates: {
    title?: string
    category?: string
    camera?: string | null
  }
): Promise<Photo | null> {
  const { data, error } = await supabase
    .from('photos')
    .update(updates)
    .eq('id', photoId)
    .select()
    .single()

  if (error) {
    console.error('Error updating photo:', error)
    throw error
  }

  return dbPhotoToPhoto(data)
}

