#!/usr/bin/env node
import 'dotenv/config'
import { readFileSync, readdirSync, unlinkSync } from 'fs'
import { join, extname, basename } from 'path'
import { uploadImageToS3 } from '../src/lib/imageService.js'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { optimizeImage } from './imageOptimizer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
)

// Configuration
const UPLOAD_FOLDER = join(__dirname, 'uploads')
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp']

function generateS3Key(filename, category) {
  const ext = extname(filename).toLowerCase()
  const name = basename(filename, ext)
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  return `gallery/${category}/${cleanName}${ext}`
}

function promptForMetadata(filename) {
  const category = 'other'
  
  return {
    title: basename(filename, extname(filename)).replace(/[-_]/g, ' '),
    description: '',
    category: category,
    date: new Date().toISOString().split('T')[0],
    featured: false,
    tags: [],
    location: '',
    camera: '',
    lens: '',
    settings: {}
  }
}

async function uploadPhotos() {
  try {
    let files
    try {
      files = readdirSync(UPLOAD_FOLDER)
    } catch (error) {
      console.log('No uploads folder found. Please create an "uploads" folder and add your images.')
      return
    }

    const imageFiles = files.filter(file => 
      SUPPORTED_FORMATS.includes(extname(file).toLowerCase())
    )

    if (imageFiles.length === 0) {
      console.log('No supported image files found in uploads folder.')
      return
    }

    console.log(`Found ${imageFiles.length} image(s) to upload...`)

    const uploadedFiles = []

    for (const filename of imageFiles) {
      console.log(`Processing ${filename}...`)
      
      const filePath = join(UPLOAD_FOLDER, filename)
      const imageBuffer = readFileSync(filePath)
      
      const metadata = promptForMetadata(filename)
      const baseS3Key = generateS3Key(filename, metadata.category)
      
      try {
        // Optimize image to multiple sizes
        console.log(`Optimizing ${filename}...`)
        const optimized = await optimizeImage(imageBuffer, {
          sizes: ['thumbnail', 'medium', 'large'],
          format: 'jpeg'
        })
        
        console.log(`  Original: ${optimized.metadata.sizeKB || Math.round(imageBuffer.length / 1024)} KB`)
        console.log(`  Thumbnail: ${optimized.thumbnail.sizeKB} KB`)
        console.log(`  Medium: ${optimized.medium.sizeKB} KB`)
        console.log(`  Large: ${optimized.large.sizeKB} KB`)
        
        // Upload all sizes to S3
        const ext = extname(baseS3Key)
        const keyBase = baseS3Key.slice(0, -ext.length)
        
        // Upload thumbnail
        const thumbnailKey = `${keyBase}-thumb${ext}`
        console.log(`Uploading thumbnail: ${thumbnailKey}`)
        await uploadImageToS3(
          thumbnailKey,
          optimized.thumbnail.buffer,
          'image/jpeg',
          {
            title: metadata.title,
            size: 'thumbnail',
            originalSize: String(optimized.metadata.size)
          }
        )
        
        // Upload medium size
        const mediumKey = `${keyBase}-medium${ext}`
        console.log(`Uploading medium: ${mediumKey}`)
        await uploadImageToS3(
          mediumKey,
          optimized.medium.buffer,
          'image/jpeg',
          {
            title: metadata.title,
            size: 'medium',
            originalSize: String(optimized.metadata.size)
          }
        )
        
        // Upload large size (primary full-size image)
        const largeKey = baseS3Key
        console.log(`Uploading large: ${largeKey}`)
        const url = await uploadImageToS3(
          largeKey,
          optimized.large.buffer,
          'image/jpeg',
          {
            title: metadata.title,
            size: 'large',
            originalSize: String(optimized.metadata.size)
          }
        )
        
        // Insert into Supabase with all S3 keys
        const { error } = await supabase.from('photos').insert({
          title: metadata.title,
          description: metadata.description || null,
          s3_key: baseS3Key,
          category: metadata.category,
          date: metadata.date,
          featured: metadata.featured,
          tags: metadata.tags,
          location: metadata.location || null,
          camera: metadata.camera || null,
          lens: metadata.lens || null,
          settings: metadata.settings
        })

        if (error) {
          console.error(`❌ Failed to save to database: ${error.message}`)
        } else {
          console.log(`✅ Uploaded: ${filename} -> ${s3Key}`)
          uploadedFiles.push(filePath)
        }
      } catch (error) {
        console.error(`❌ Failed to upload ${filename}:`, error.message)
      }
    }

    // Delete successfully uploaded files
    if (uploadedFiles.length > 0) {
      console.log(`\n🗑️  Cleaning up uploaded files...`)
      uploadedFiles.forEach(filePath => {
        try {
          unlinkSync(filePath)
          console.log(`   Deleted: ${basename(filePath)}`)
        } catch (error) {
          console.error(`   Failed to delete ${basename(filePath)}:`, error.message)
        }
      })
    }
    
    console.log(`\n✅ Successfully uploaded ${uploadedFiles.length} photo(s)`)
    console.log('📝 You can edit photo metadata in Supabase dashboard')

  } catch (error) {
    console.error('Error uploading photos:', error)
  }
}

uploadPhotos()