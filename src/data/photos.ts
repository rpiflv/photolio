import { getImageUrl, getOptimizedImageUrl, getThumbnailUrl, getImageSrcSet } from '../lib/s3'
import { supabase } from '../lib/supabase'
import type { Photo as DBPhoto } from '../lib/supabase'

// Query keys for TanStack Query
export const photoQueryKeys = {
  all: ['photos'] as const,
  lists: () => [...photoQueryKeys.all, 'list'] as const,
  list: (filters?: string) => [...photoQueryKeys.lists(), filters] as const,
  details: () => [...photoQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...photoQueryKeys.details(), id] as const,
  featured: () => [...photoQueryKeys.all, 'featured'] as const,
  categories: () => ['categories'] as const,
}

export interface Photo {
  id: string
  title: string
  description?: string
  src: string
  srcset?: string
  alt: string
  category: 'portrait' | 'landscape' | 'street' | 'nature' | 'architecture' | 'other'
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

// Get responsive image URLs
export const getResponsiveImageUrls = (s3Key: string) => ({
  small: getThumbnailUrl(s3Key),
  medium: getOptimizedImageUrl(s3Key, 'medium'),
  large: getOptimizedImageUrl(s3Key, 'large'),
  xlarge: getOptimizedImageUrl(s3Key, 'full'),
  original: getImageUrl(s3Key)
})