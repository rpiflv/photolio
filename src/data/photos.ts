import { getImageUrl, getOptimizedImageUrl, getThumbnailUrl, getImageSrcSet } from '../lib/s3'
import { supabase } from '../lib/supabase'
import type { Photo as DBPhoto, Camera as DBCamera, Category as DBCategory, Collection as DBCollection } from '../lib/supabase'
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
  collections: () => ['collections'] as const,
  collectionsWithCovers: () => ['collections', 'withCovers'] as const,
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
  collectionId?: number
  collectionName?: string
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
    cameraId?: string
    lens?: string
    settings?: {
      aperture?: string
      shutter?: string
      iso?: number
      focalLength?: string
    }
  }
}

function normalizeCollectionId(value: unknown): number {
  if (value === null || value === undefined || value === '') return 1
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

// Convert database photo to Photo interface
// cameraMap resolves camera slug (stored in DB) to display name
function dbPhotoToPhoto(dbPhoto: DBPhoto, cameraMap?: Record<string, string>, collectionMap?: Record<number, string>): Photo {
  const cameraSlug = dbPhoto.camera || undefined
  const cameraDisplayName = cameraSlug && cameraMap ? (cameraMap[cameraSlug] || cameraSlug) : cameraSlug
  const rawCollectionId = dbPhoto.collection_id ?? dbPhoto.collection ?? dbPhoto.collections?.id ?? 1
  const collectionId = normalizeCollectionId(rawCollectionId)
  const joinedCollectionName = dbPhoto.collections?.name || undefined
  const collectionName =
    (joinedCollectionName && !/^\d+$/.test(joinedCollectionName.trim()) ? joinedCollectionName : undefined) ||
    collectionMap?.[collectionId] ||
    collectionMap?.[String(collectionId) as unknown as number] ||
    (collectionId === 1 ? 'Default Collection' : `Collection ${collectionId}`)
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
    collectionId,
    collectionName,
    thumbnailSrc: getThumbnailUrl(dbPhoto.s3_key),
    s3Key: dbPhoto.s3_key,
    price: dbPhoto.price || undefined,
    likesCount: dbPhoto.likes_count || 0,
    dimensions: dbPhoto.dimensions || undefined,
    metadata: {
      location: dbPhoto.location || undefined,
      camera: cameraDisplayName,
      cameraId: cameraSlug,
      lens: dbPhoto.lens || undefined,
      settings: dbPhoto.settings || undefined,
    }
  }
}

// Fetch camera slug -> name lookup map
async function getCameraMap(): Promise<Record<string, string>> {
  const cameras = await getCameras()
  const map: Record<string, string> = {}
  for (const cam of cameras) {
    map[cam.id] = cam.name
  }
  return map
}

// Get all collections
export async function getCollections(): Promise<DBCollection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching collections:', error)
    return []
  }

  return data || []
}

// Add a new collection
export async function addCollection(name: string, description?: string): Promise<DBCollection | null> {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Collection name is required')

  const { data, error } = await supabase
    .from('collections')
    .insert({ name: trimmedName, description: description?.trim() || null })
    .select()
    .single()

  if (error) {
    console.error('Error adding collection:', error)
    // Fallback if table doesn't use identity auto-increment
    const { data: allCollections } = await supabase
      .from('collections')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)

    const nextId = allCollections && allCollections.length > 0 ? (Number(allCollections[0].id) + 1) : 1

    const fallback = await supabase
      .from('collections')
      .insert({ id: nextId, name: trimmedName, description: description?.trim() || null })
      .select()
      .single()

    if (fallback.error) {
      console.error('Error adding collection with explicit id:', fallback.error)
      throw fallback.error
    }

    return fallback.data
  }

  return data
}

// Rename a collection
export async function renameCollection(id: number, newName: string, description?: string | null): Promise<DBCollection | null> {
  const updatePayload: { name: string; description?: string | null } = { name: newName.trim() }
  if (description !== undefined) {
    updatePayload.description = description ? description.trim() : null
  }

  const { data, error } = await supabase
    .from('collections')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error renaming collection:', error)
    throw error
  }

  return data
}

// Delete a collection
export async function deleteCollection(id: number): Promise<void> {
  if (id === 1) {
    throw new Error('Cannot delete default collection')
  }

  // Re-assign photos in this collection to default collection (1)
  await supabase
    .from('photos')
    .update({ collection_id: 1, collection: 1 })
    .eq('collection_id', id)

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting collection:', error)
    throw error
  }
}

async function getCollectionMap(): Promise<Record<number, string>> {
  const collections = await getCollections()
  return Object.fromEntries(collections.map(collection => [collection.id, collection.name]))
}

export interface CollectionWithCover {
  id: number
  name: string
  description: string | null
  coverPhoto: Photo | null
  photoCount: number
}

// Get all collections along with a random cover photo and photo count for each,
// used on the public home page / navigation
export async function getCollectionsWithCovers(): Promise<CollectionWithCover[]> {
  const [collections, photos] = await Promise.all([getCollections(), getPhotos()])

  return collections
    .map(collection => {
      const collectionPhotos = photos.filter(p => p.collectionId === collection.id)
      const coverPhoto = collectionPhotos.length > 0
        ? collectionPhotos[Math.floor(Math.random() * collectionPhotos.length)]
        : null

      return {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        coverPhoto,
        photoCount: collectionPhotos.length,
      }
    })
    .filter(collection => collection.photoCount > 0)
}

// Get photos belonging to a collection identified by its stable ID.
// (Using the ID rather than a name-derived slug means renaming a
// collection never breaks existing links/routes to it.)
export async function getPhotosByCollectionId(collectionId: number): Promise<{ collection: DBCollection; photos: Photo[] } | null> {
  const [collections, photos] = await Promise.all([getCollections(), getPhotos()])
  const collection = collections.find(c => c.id === collectionId)
  if (!collection) return null

  return {
    collection,
    photos: photos.filter(p => p.collectionId === collection.id),
  }
}

// Fetch all photos from Supabase
export async function getPhotos(): Promise<Photo[]> {
  const [{ data, error }, cameraMap, collectionMap] = await Promise.all([
    supabase.from('photos').select('*').order('date', { ascending: false }),
    getCameraMap(),
    getCollectionMap(),
  ])

  if (error) {
    console.error('Error fetching photos:', error)
    return []
  }

  const photos = data.map(p => dbPhotoToPhoto(p, cameraMap, collectionMap))
  
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

  const [{ data, error }, cameraMap, collectionMap] = await Promise.all([
    supabase.from('photos').select('*').eq('category', category).order('date', { ascending: false }),
    getCameraMap(),
    getCollectionMap(),
  ])

  if (error) {
    console.error('Error fetching photos by category:', error)
    return []
  }

  return data.map(p => dbPhotoToPhoto(p, cameraMap, collectionMap))
}

// Get photo by ID
export async function getPhotoById(id: string): Promise<Photo | null> {
  const [{ data, error }, cameraMap, collectionMap] = await Promise.all([
    supabase.from('photos').select('*').eq('id', id).single(),
    getCameraMap(),
    getCollectionMap(),
  ])

  if (error) {
    console.error('Error fetching photo:', error)
    return null
  }

  return dbPhotoToPhoto(data, cameraMap, collectionMap)
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

// Get cameras with photo counts (for gallery filter)
export async function getCamerasWithCounts() {
  const { data: cameras } = await supabase.from('cameras').select('*').order('name', { ascending: true })
  const { data: photos } = await supabase.from('photos').select('camera')

  const counts: Record<string, number> = {}
  photos?.forEach(photo => {
    if (photo.camera) {
      counts[photo.camera] = (counts[photo.camera] || 0) + 1
    }
  })

  return [
    { id: 'all', name: 'All Cameras', count: photos?.length || 0, imageUrl: undefined as string | undefined },
    ...(cameras?.filter(cam => cam.id !== 'all').map(cam => ({
      id: cam.id,
      name: cam.name,
      count: counts[cam.id] || 0,
      imageUrl: cam.image_s3_key ? getImageUrl(cam.image_s3_key) : undefined,
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
  collection?: number | null
  collection_id?: number | null
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
  const collectionId = photoData.collection_id ?? photoData.collection ?? 1
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
      collection: collectionId,
      collection_id: collectionId,
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
    collection?: number | null
    collection_id?: number | null
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

// Add a new camera to the cameras table (slug-based ID, like categories)
export async function addCamera(id: string, name: string, imageS3Key?: string): Promise<DBCamera | null> {
  const { data, error } = await supabase
    .from('cameras')
    .insert({ id, name: name.trim(), image_s3_key: imageS3Key || null })
    .select()
    .single()

  if (error) {
    console.error('Error adding camera:', error)
    throw error
  }

  return data
}

// Update a camera's image
export async function updateCameraImage(id: string, imageS3Key: string | null): Promise<DBCamera | null> {
  const { data, error } = await supabase
    .from('cameras')
    .update({ image_s3_key: imageS3Key })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating camera image:', error)
    throw error
  }

  return data
}

// Rename a camera (updates display name only, slug/id stays the same — like categories)
export async function renameCamera(id: string, newName: string): Promise<DBCamera | null> {
  const { data, error } = await supabase
    .from('cameras')
    .update({ name: newName.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error renaming camera:', error)
    throw error
  }

  return data
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
    collection?: number | null
    collection_id?: number | null
  }
): Promise<Photo | null> {
  const payload: Record<string, any> = {}
  if (updates.title !== undefined) payload.title = updates.title
  if (updates.category !== undefined) payload.category = updates.category
  if (updates.camera !== undefined) payload.camera = updates.camera
  if (updates.collection_id !== undefined) {
    payload.collection_id = updates.collection_id
    payload.collection = updates.collection_id
  } else if (updates.collection !== undefined) {
    payload.collection_id = updates.collection
    payload.collection = updates.collection
  }

  const [{ data, error }, cameraMap, collectionMap] = await Promise.all([
    supabase
      .from('photos')
      .update(payload)
      .eq('id', photoId)
      .select('*')
      .single(),
    getCameraMap(),
    getCollectionMap(),
  ])

  if (error) {
    console.error('Error updating photo:', error)
    return null
  }

  return dbPhotoToPhoto(data, cameraMap, collectionMap)
}

// Replace a photo's image file: uploads the new file to S3, re-optimizes it,
// updates the DB with the new S3 keys/dimensions, and cleans up the old S3 objects.
export async function replacePhotoImage(photoId: string, file: File): Promise<Photo | null> {
  // Fetch the existing photo to know its category (for the S3 key path) and old S3 keys to clean up
  const { data: existing, error: fetchError } = await supabase
    .from('photos')
    .select('id, category, s3_key, thumbnail_s3_key, medium_s3_key')
    .eq('id', photoId)
    .single()

  if (fetchError || !existing) {
    throw new Error('Photo not found')
  }

  const oldKeys = [existing.s3_key, existing.thumbnail_s3_key, existing.medium_s3_key].filter(Boolean) as string[]

  const s3Key = `gallery/${existing.category}/${photoId}-${Date.now()}.${file.name.split('.').pop()}`

  // Step 1: Upload the new original to S3
  await uploadImageWithPresignedUrl(file, s3Key)

  // Step 2: Optimize server-side (generates thumbnail/medium versions + dimensions)
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

  // Step 3: Update the DB record with the new keys/dimensions
  const [{ data, error: updateError }, cameraMap, collectionMap] = await Promise.all([
    supabase
      .from('photos')
      .update({
        s3_key: s3Key,
        thumbnail_s3_key: optimized.thumbnailS3Key,
        medium_s3_key: optimized.mediumS3Key,
        dimensions: optimized.dimensions,
      })
      .eq('id', photoId)
      .select('*')
      .single(),
    getCameraMap(),
    getCollectionMap(),
  ])

  if (updateError) {
    console.error('Error updating photo image:', updateError)
    throw updateError
  }

  // Step 4: Clean up the old S3 objects (best-effort, non-blocking on failure)
  for (const key of oldKeys) {
    try {
      await deleteImageFromS3(key)
    } catch (cleanupError) {
      console.warn(`Failed to delete old S3 object ${key}:`, cleanupError)
    }
  }

  return dbPhotoToPhoto(data, cameraMap, collectionMap)
}
