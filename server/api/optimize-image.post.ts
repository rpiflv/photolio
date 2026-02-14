import { defineEventHandler, readBody, createError } from 'h3'
import sharp from 'sharp'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

// Image size configurations - matches scripts/imageOptimizer.js
const IMAGE_SIZES = {
  thumbnail: { width: 400, height: 400, quality: 75, fit: 'cover' as const },
  medium: { width: 1200, quality: 80, fit: 'inside' as const },
  large: { width: 1920, quality: 85, fit: 'inside' as const },
}

function getEnv(key: string): string {
  return process.env[key] || ''
}

function createS3Client() {
  return new S3Client({
    region: getEnv('VITE_AWS_REGION'),
    credentials: {
      accessKeyId: getEnv('VITE_AWS_ACCESS_KEY_ID'),
      secretAccessKey: getEnv('VITE_AWS_SECRET_ACCESS_KEY'),
    },
  })
}

async function downloadFromS3(s3: S3Client, bucket: string, key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const response = await s3.send(command)
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function uploadToS3(
  s3: S3Client,
  bucket: string,
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  })
  await s3.send(command)
}

function getOptimizedS3Keys(baseS3Key: string) {
  const dotIndex = baseS3Key.lastIndexOf('.')
  if (dotIndex === -1) {
    return {
      large: baseS3Key,
      medium: `${baseS3Key}-medium`,
      thumbnail: `${baseS3Key}-thumb`,
    }
  }
  const keyBase = baseS3Key.slice(0, dotIndex)
  const keyExt = baseS3Key.slice(dotIndex)
  return {
    large: baseS3Key,
    medium: `${keyBase}-medium${keyExt}`,
    thumbnail: `${keyBase}-thumb${keyExt}`,
  }
}

async function optimizeImage(
  imageBuffer: Buffer,
  sizeName: 'thumbnail' | 'medium' | 'large'
): Promise<{ buffer: Buffer; sizeKB: number }> {
  const config = IMAGE_SIZES[sizeName]

  let pipeline = sharp(imageBuffer).rotate() // Auto-rotate based on EXIF

  if ('height' in config && config.height) {
    pipeline = pipeline.resize(config.width, config.height, {
      fit: config.fit,
      position: 'center',
    })
  } else {
    pipeline = pipeline.resize(config.width, undefined, {
      fit: config.fit,
      withoutEnlargement: true,
    })
  }

  const buffer = await pipeline
    .jpeg({ quality: config.quality, progressive: true, mozjpeg: true })
    .toBuffer()

  return { buffer, sizeKB: Math.round(buffer.length / 1024) }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ s3Key?: string }>(event)

  if (!body?.s3Key || typeof body.s3Key !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing s3Key in request body' })
  }

  const s3Key: string = body.s3Key
  const bucketName = getEnv('VITE_S3_BUCKET_NAME')

  if (!bucketName) {
    throw createError({ statusCode: 500, statusMessage: 'S3 bucket not configured' })
  }

  const s3 = createS3Client()
  const keys = getOptimizedS3Keys(s3Key)

  try {
    // 1. Download original from S3
    console.log(`[optimize-image] Downloading original: ${s3Key}`)
    const originalBuffer = await downloadFromS3(s3, bucketName, s3Key)

    // Get original dimensions and dominant color
    const image = sharp(originalBuffer)
    const metadata = await image.metadata()
    const dimensions = {
      width: metadata.width || 0,
      height: metadata.height || 0,
    }

    console.log(`[optimize-image] Original: ${dimensions.width}x${dimensions.height}, ${Math.round(originalBuffer.length / 1024)} KB`)

    // 2. Generate optimized versions
    const [thumbnail, medium, large] = await Promise.all([
      optimizeImage(originalBuffer, 'thumbnail'),
      optimizeImage(originalBuffer, 'medium'),
      optimizeImage(originalBuffer, 'large'),
    ])

    console.log(`[optimize-image] Thumbnail: ${thumbnail.sizeKB} KB`)
    console.log(`[optimize-image] Medium: ${medium.sizeKB} KB`)
    console.log(`[optimize-image] Large: ${large.sizeKB} KB`)

    // 3. Upload optimized versions to S3
    await Promise.all([
      uploadToS3(s3, bucketName, keys.thumbnail, thumbnail.buffer, 'image/jpeg'),
      uploadToS3(s3, bucketName, keys.medium, medium.buffer, 'image/jpeg'),
      uploadToS3(s3, bucketName, keys.large, large.buffer, 'image/jpeg'),
    ])

    console.log(`[optimize-image] All versions uploaded successfully`)

    return {
      thumbnailS3Key: keys.thumbnail,
      mediumS3Key: keys.medium,
      largeS3Key: keys.large,
      dimensions,
    }
  } catch (error: any) {
    console.error('[optimize-image] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Optimization failed: ${error.message}`,
    })
  }
})
