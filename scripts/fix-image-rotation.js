#!/usr/bin/env node
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from project root
dotenv.config({ path: join(__dirname, '..', '.env') })

// Access VITE_ prefixed variables directly from process.env
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'found' : 'MISSING')
  console.error('VITE_SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'found' : 'MISSING')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const s3Client = new S3Client({
  region: process.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = process.env.VITE_S3_BUCKET_NAME

// Images to rotate (title -> degrees)
const IMAGES_TO_ROTATE = {

  'building#6': 90
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

async function getImageFromS3(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  
  const response = await s3Client.send(command)
  return await streamToBuffer(response.Body)
}

async function uploadToS3(key, buffer, contentType, metadata) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
    CacheControl: 'public, max-age=31536000, immutable',
  })
  
  await s3Client.send(command)
}

async function rotateImage(buffer, degrees) {
  return await sharp(buffer)
    .rotate(degrees)
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer()
}

async function fixImageOrientation() {
  console.log('🔍 Finding images to rotate...\n')
  
  for (const [title, degrees] of Object.entries(IMAGES_TO_ROTATE)) {
    console.log(`📸 Processing: "${title}"`)
    
    // Find the photo in database
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('title', title)
      .single()
    
    if (fetchError || !photo) {
      console.error(`   ❌ Not found in database: ${title}`)
      console.error(`   Error: ${fetchError?.message}`)
      continue
    }
    
    console.log(`   Found: ${photo.s3_key}`)
    
    try {
      // Get all image variants
      const ext = photo.s3_key.slice(photo.s3_key.lastIndexOf('.'))
      const keyBase = photo.s3_key.slice(0, -ext.length)
      
      const keys = {
        large: photo.s3_key,
        medium: `${keyBase}-medium${ext}`,
        thumbnail: `${keyBase}-thumb${ext}`
      }
      
      // Process each size
      for (const [size, key] of Object.entries(keys)) {
        console.log(`   Rotating ${size}...`)
        
        // Download
        const buffer = await getImageFromS3(key)
        
        // Rotate
        const rotated = await rotateImage(buffer, degrees)
        
        // Get new dimensions
        const metadata = await sharp(rotated).metadata()
        
        // Upload
        await uploadToS3(
          key,
          rotated,
          'image/jpeg',
          { title: photo.title, size }
        )
        
        console.log(`   ✅ ${size}: ${metadata.width}x${metadata.height}`)
        
        // Update dimensions in database for large size
        if (size === 'large') {
          await supabase
            .from('photos')
            .update({
              dimensions: {
                width: metadata.width,
                height: metadata.height
              }
            })
            .eq('id', photo.id)
        }
      }
      
      console.log(`   ✅ Complete!\n`)
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`)
    }
  }
  
  console.log('🎉 Done!')
}

fixImageOrientation().catch(console.error)