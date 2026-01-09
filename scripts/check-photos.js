#!/usr/bin/env node
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
)

async function checkPhotos() {
  console.log('Checking photos in database...\n')
  
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, title, s3_key, category')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching photos:', error)
    return
  }
  
  if (!photos || photos.length === 0) {
    console.log('No photos found in database.')
    return
  }
  
  console.log(`Found ${photos.length} photos:\n`)
  
  photos.forEach((photo, index) => {
    console.log(`${index + 1}. ${photo.title}`)
    console.log(`   ID: ${photo.id}`)
    console.log(`   Category: ${photo.category}`)
    console.log(`   S3 Key: ${photo.s3_key || 'NULL/MISSING'}`)
    
    // Check if s3_key is null or undefined
    if (!photo.s3_key) {
      console.log(`   ⚠️  WARNING: Missing S3 key!`)
    }
    
    // Generate expected URL
    const bucketName = process.env.VITE_S3_BUCKET_NAME
    const region = process.env.VITE_AWS_REGION
    if (photo.s3_key) {
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/${photo.s3_key}`
      console.log(`   URL: ${url}`)
    }
    console.log()
  })
  
  // Check for photos with missing s3_key
  const missingKeys = photos.filter(p => !p.s3_key)
  if (missingKeys.length > 0) {
    console.log(`\n❌ Found ${missingKeys.length} photos with missing S3 keys!`)
    console.log('These photos will not display correctly.')
  } else {
    console.log('\n✅ All photos have S3 keys.')
  }
  
  // Show bucket configuration
  console.log('\n📦 S3 Configuration:')
  console.log(`   Bucket: ${process.env.VITE_S3_BUCKET_NAME}`)
  console.log(`   Region: ${process.env.VITE_AWS_REGION}`)
  console.log(`   CloudFront: ${process.env.VITE_CLOUDFRONT_DOMAIN || 'Not configured'}`)
  
  console.log('\n💡 To fix broken images:')
  console.log('   1. Make sure your S3 bucket has public read access enabled')
  console.log('   2. Check that the bucket policy allows GetObject for all objects')
  console.log('   3. If s3_key is NULL, re-upload those photos using upload-photos.js')
}

checkPhotos().catch(console.error)
