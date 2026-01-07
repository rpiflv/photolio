import { getImageUrl, getOptimizedImageUrl } from '../lib/s3'
import photoDatabase from './photoDatabase.json'

export interface Photo {
  id: string
  title: string
  description?: string
  src: string
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

// Convert JSON photo data to Photo interface
function jsonPhotoToPhoto(jsonPhoto: any): Photo {
  return {
    id: jsonPhoto.id,
    title: jsonPhoto.title,
    description: jsonPhoto.description,
    src: getImageUrl(jsonPhoto.s3Key),
    alt: jsonPhoto.description || jsonPhoto.title,
    category: jsonPhoto.category,
    date: jsonPhoto.date,
    featured: jsonPhoto.featured || false,
    dimensions: jsonPhoto.dimensions,
    thumbnailSrc: getOptimizedImageUrl(jsonPhoto.s3Key, 400, 400, 80),
    s3Key: jsonPhoto.s3Key,
    metadata: {
      location: jsonPhoto.location,
      camera: jsonPhoto.camera,
      lens: jsonPhoto.lens,
      settings: jsonPhoto.settings,
    }
  }
}

// Load photos from the database
export const photos: Photo[] = photoDatabase.photos.map((photo: any) => jsonPhotoToPhoto(photo))

export const categories = [
  { id: 'all', name: 'All Photos', count: photos.length },
  { id: 'portrait', name: 'Portrait', count: photos.filter(p => p.category === 'portrait').length },
  { id: 'landscape', name: 'Landscape', count: photos.filter(p => p.category === 'landscape').length },
  { id: 'street', name: 'Street', count: photos.filter(p => p.category === 'street').length },
  { id: 'nature', name: 'Nature', count: photos.filter(p => p.category === 'nature').length },
  { id: 'architecture', name: 'Architecture', count: photos.filter(p => p.category === 'architecture').length },
  { id: 'other', name: 'Other', count: photos.filter(p => p.category === 'other').length },
]

export const getFeaturedPhotos = () => photos.filter(photo => photo.featured)

export const getPhotosByCategory = (category: string) => 
  category === 'all' ? photos : photos.filter(photo => photo.category === category)

export const getPhotoById = (id: string) => photos.find(photo => photo.id === id)

// Get responsive image URLs for different screen sizes
export const getResponsiveImageUrls = (s3Key: string) => ({
  small: getOptimizedImageUrl(s3Key, 400, undefined, 75),
  medium: getOptimizedImageUrl(s3Key, 800, undefined, 80),
  large: getOptimizedImageUrl(s3Key, 1200, undefined, 85),
  xlarge: getOptimizedImageUrl(s3Key, 1920, undefined, 90),
  original: getImageUrl(s3Key)
})