// Image URL helpers — no AWS credentials needed on the client.
// Images are served publicly via CloudFront or direct S3 bucket URL.

const cloudFrontDomain = import.meta.env.VITE_CLOUDFRONT_DOMAIN as string | undefined

// Helper function to get image URL directly from S3 or CloudFront
export const getImageUrl = (key: string): string => {
  if (cloudFrontDomain) {
    return `https://${cloudFrontDomain}/${key}`
  }
  // Fallback: fetch bucket info from server at build time won't work,
  // so CloudFront is required when AWS creds are server-only.
  // If no CloudFront, we use a relative API path that the server can proxy.
  return `/api/image/${encodeURIComponent(key)}`
}

// Helper function to get optimized image URL with different sizes
export const getOptimizedImageUrl = (key: string, size?: 'thumbnail' | 'medium' | 'large' | 'full'): string => {
  if (!key) {
    console.warn('getOptimizedImageUrl called with empty key')
    return ''
  }
  
  if (!size || size === 'full' || size === 'large') {
    return getImageUrl(key)
  }
  
  // Generate the key for different sizes
  // Assumes files are named like: gallery/landscape/photo-name-thumb.jpg
  const ext = key.lastIndexOf('.')
  if (ext === -1) return getImageUrl(key)
  
  const suffix = size === 'thumbnail' ? '-thumb' : size === 'medium' ? '-medium' : ''
  const optimizedKey = key.slice(0, ext) + suffix + key.slice(ext)
  
  return getImageUrl(optimizedKey)
}

// Helper to get srcset for responsive images
export const getImageSrcSet = (key: string): string => {
  const medium = getOptimizedImageUrl(key, 'medium')
  const large = getOptimizedImageUrl(key, 'large')
  const full = getOptimizedImageUrl(key, 'full')
  
  return `${medium} 1200w, ${large} 1920w, ${full} 2400w`
}

// Helper to get thumbnail URL
export const getThumbnailUrl = (key: string): string => {
  return getOptimizedImageUrl(key, 'thumbnail')
}