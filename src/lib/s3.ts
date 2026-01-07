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

// Helper function to get image URL directly from S3
export const getImageUrl = (key: string): string => {
  return `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`
}

// Helper function to get optimized image URL (same as base URL since we're not using CloudFront)
export const getOptimizedImageUrl = (key: string, width?: number, height?: number, quality?: number): string => {
  // Without CloudFront, we just return the base S3 URL
  // You can implement client-side resizing or use an image processing service if needed
  return getImageUrl(key)
}