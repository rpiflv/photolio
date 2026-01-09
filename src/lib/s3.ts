import { S3Client } from '@aws-sdk/client-s3'

// Helper to get env variable (works in both Node.js and browser)
const getEnv = (key: string): string | undefined => {
  // Try process.env first (Node.js)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]
  }
  // Try import.meta.env (Vite/browser)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key]
  }
  return undefined
}

// S3 Configuration
const awsRegion = getEnv('VITE_AWS_REGION')
const awsAccessKeyId = getEnv('VITE_AWS_ACCESS_KEY_ID')
const awsSecretAccessKey = getEnv('VITE_AWS_SECRET_ACCESS_KEY')
const bucketName = getEnv('VITE_S3_BUCKET_NAME')
const cloudFrontDomain = getEnv('VITE_CLOUDFRONT_DOMAIN') // Optional CloudFront domain

if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey || !bucketName) {
  console.error('Missing AWS environment variables:', {
    region: awsRegion,
    accessKeyId: awsAccessKeyId ? 'set' : 'missing',
    secretAccessKey: awsSecretAccessKey ? 'set' : 'missing',
    bucketName: bucketName
  })
}

export const s3Config = {
  region: awsRegion || 'us-east-1',
  credentials: {
    accessKeyId: awsAccessKeyId || '',
    secretAccessKey: awsSecretAccessKey || '',
  },
}

export const BUCKET_NAME = bucketName || 'your-photo-portfolio-bucket'

// Create S3 client
export const s3Client = new S3Client(s3Config)

// Helper function to get image URL directly from S3 or CloudFront
export const getImageUrl = (key: string): string => {
  if (cloudFrontDomain) {
    return `https://${cloudFrontDomain}/${key}`
  }
  return `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`
}

// Helper function to get optimized image URL with different sizes
export const getOptimizedImageUrl = (key: string, size?: 'thumbnail' | 'medium' | 'large' | 'full'): string => {
  if (!size || size === 'full') {
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