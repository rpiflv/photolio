#!/usr/bin/env node
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { uploadImageToS3 } from '../src/lib/imageService.js'
import { optimizeImage } from './imageOptimizer.js'
import { Readable } from 'stream'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
)

const s3Client = new S3Client({
  region: process.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = process.env.VITE_S3_BUCKET_NAME

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

async function optimizeExistingPhotos() {
  console.log('🔍 Fetching photos from database...')
  
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, title, s3_key, thumbnail_s3_key, medium_s3_key')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching photos:', error)
    return
  }
  
  console.log(`Found ${photos.length} photos`)
  
  let processed = 0
  let skipped = 0
  let failed = 0
  
  for (const photo of photos) {
    // Skip if already has optimized versions
    if (photo.thumbnail_s3_key && photo.medium_s3_key) {
      console.log(`⏭️  Skipping ${photo.title} (already optimized)`)
      skipped++
      continue
    }
    
    console.log(`\n📸 Processing: ${photo.title}`)
    console.log(`   S3 Key: ${photo.s3_key}`)
    
    try {
      // Download original from S3
      console.log('   Downloading from S3...')
      const imageBuffer = await getImageFromS3(photo.s3_key)
      
      // Optimize image
      console.log('   Optimizing...')
      const optimized = await optimizeImage(imageBuffer, {
        sizes: ['thumbnail', 'medium', 'large'],
        format: 'jpeg'
      })
      
      console.log(`   Original: ${Math.round(imageBuffer.length / 1024)} KB`)
      console.log(`   Thumbnail: ${optimized.thumbnail.sizeKB} KB`)
      console.log(`   Medium: ${optimized.medium.sizeKB} KB`)
      console.log(`   Large: ${optimized.large.sizeKB} KB`)
      
      // Generate S3 keys
      const ext = photo.s3_key.slice(photo.s3_key.lastIndexOf('.'))
      const keyBase = photo.s3_key.slice(0, -ext.length)
      
      const thumbnailKey = `${keyBase}-thumb${ext}`
      const mediumKey = `${keyBase}-medium${ext}`
      const largeKey = photo.s3_key // Keep original key for large version
      
      // Upload optimized versions
      console.log('   Uploading thumbnail...')
      await uploadImageToS3(
        thumbnailKey,
        optimized.thumbnail.buffer,
        'image/jpeg',
        { title: photo.title, size: 'thumbnail' }
      )
      
      console.log('   Uploading medium...')
      await uploadImageToS3(
        mediumKey,
        optimized.medium.buffer,
        'image/jpeg',
        { title: photo.title, size: 'medium' }
      )
      
      console.log('   Uploading large (optimized)...')
      await uploadImageToS3(
        largeKey,
        optimized.large.buffer,
        'image/jpeg',
        { title: photo.title, size: 'large' }
      )
      
      // Update database
      console.log('   Updating database...')
      const { error: updateError } = await supabase
        .from('photos')
        .update({
          thumbnail_s3_key: thumbnailKey,
          medium_s3_key: mediumKey,
          dimensions: {
            width: optimized.metadata.width,
            height: optimized.metadata.height
          }
        })
        .eq('id', photo.id)
      
      if (updateError) {
        console.error(`   ❌ Database update failed: ${updateError.message}`)
        failed++
      } else {
        console.log('   ✅ Complete!')
        processed++
      }
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`)
      failed++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`📊 Summary:`)
  console.log(`   Processed: ${processed}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total: ${photos.length}`)
}

optimizeExistingPhotos().catch(console.error)
