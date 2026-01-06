export interface Photo {
  id: string
  title: string
  description?: string
  src: string
  alt: string
  category: 'portrait' | 'landscape' | 'street' | 'nature' | 'architecture'
  date: string
  featured?: boolean
  dimensions?: {
    width: number
    height: number
  }
}

export const photos: Photo[] = [
  {
    id: '1',
    title: 'Golden Hour Portrait',
    description: 'A stunning portrait captured during golden hour',
    src: 'https://images.unsplash.com/photo-1494790108755-2616c80ca2ad?w=800&h=1200&fit=crop',
    alt: 'Portrait of a woman during golden hour',
    category: 'portrait',
    date: '2024-03-15',
    featured: true,
    dimensions: { width: 800, height: 1200 }
  },
  {
    id: '2',
    title: 'Mountain Landscape',
    description: 'Breathtaking mountain vista at sunrise',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    alt: 'Mountain landscape at sunrise',
    category: 'landscape',
    date: '2024-03-10',
    featured: true,
    dimensions: { width: 1200, height: 800 }
  },
  {
    id: '3',
    title: 'Urban Street Life',
    description: 'Capturing the essence of city life',
    src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=1200&fit=crop',
    alt: 'Street photography in urban setting',
    category: 'street',
    date: '2024-03-08',
    featured: true,
    dimensions: { width: 800, height: 1200 }
  },
  {
    id: '4',
    title: 'Forest Path',
    description: 'A peaceful walk through nature',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop',
    alt: 'Forest path surrounded by trees',
    category: 'nature',
    date: '2024-03-05',
    dimensions: { width: 1200, height: 800 }
  },
  {
    id: '5',
    title: 'Modern Architecture',
    description: 'Clean lines and geometric beauty',
    src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=1200&fit=crop',
    alt: 'Modern architectural building',
    category: 'architecture',
    date: '2024-03-02',
    dimensions: { width: 800, height: 1200 }
  },
  {
    id: '6',
    title: 'Ocean Waves',
    description: 'The power and beauty of the ocean',
    src: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=800&fit=crop',
    alt: 'Ocean waves crashing on shore',
    category: 'landscape',
    date: '2024-02-28',
    dimensions: { width: 1200, height: 800 }
  },
  {
    id: '7',
    title: 'City Night Portrait',
    description: 'Portrait with urban nighttime backdrop',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop',
    alt: 'Portrait in city at night',
    category: 'portrait',
    date: '2024-02-25',
    dimensions: { width: 800, height: 1200 }
  },
  {
    id: '8',
    title: 'Autumn Forest',
    description: 'Fall colors in their full glory',
    src: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1200&h=800&fit=crop',
    alt: 'Autumn forest with colorful leaves',
    category: 'nature',
    date: '2024-02-20',
    dimensions: { width: 1200, height: 800 }
  }
]

export const categories = [
  { id: 'all', name: 'All Photos', count: photos.length },
  { id: 'portrait', name: 'Portrait', count: photos.filter(p => p.category === 'portrait').length },
  { id: 'landscape', name: 'Landscape', count: photos.filter(p => p.category === 'landscape').length },
  { id: 'street', name: 'Street', count: photos.filter(p => p.category === 'street').length },
  { id: 'nature', name: 'Nature', count: photos.filter(p => p.category === 'nature').length },
  { id: 'architecture', name: 'Architecture', count: photos.filter(p => p.category === 'architecture').length },
]

export const getFeaturedPhotos = () => photos.filter(photo => photo.featured)
export const getPhotosByCategory = (category: string) => 
  category === 'all' ? photos : photos.filter(photo => photo.category === category)