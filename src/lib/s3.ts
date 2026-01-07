import { S3Client } from '@aws-sdk/client-s3'

// S3 Configuration
export const s3Config = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  },
}

export const BUCKET_NAME = import.meta.env.VITE_S3_BUCKET_NAME || 'your-photo-portfolio-bucket'
export const CLOUDFRONT_DOMAIN = import.meta.env.VITE_CLOUDFRONT_DOMAIN || ''

// Create S3 client
export const s3Client = new S3Client(s3Config)

// Helper function to get image URL
export const getImageUrl = (key: string): string => {
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`
  }
  return `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`
}

// Helper function to get optimized image URL with CloudFront parameters
export const getOptimizedImageUrl = (key: string, width?: number, height?: number, quality?: number): string => {
  const baseUrl = getImageUrl(key)
  
  if (!CLOUDFRONT_DOMAIN || (!width && !height && !quality)) {
    return baseUrl
  }

  // If using CloudFront with image optimization
  const params = new URLSearchParams()
  if (width) params.append('w', width.toString())
  if (height) params.append('h', height.toString())
  if (quality) params.append('q', quality.toString())
  
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
}