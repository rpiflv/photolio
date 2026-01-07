#!/usr/bin/env node
import 'dotenv/config'
import { readFileSync, readdirSync, unlinkSync } from 'fs'
import { join, extname, basename } from 'path'
import { uploadImageToS3 } from '../src/lib/imageService.js'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

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
      const s3Key = generateS3Key(filename, metadata.category)
      
      try {
        // Upload to S3
        console.log(`Uploading to S3: ${s3Key}`)
        const url = await uploadImageToS3(
          s3Key, 
          imageBuffer, 
          `image/${extname(filename).slice(1)}`,
          {
            title: metadata.title,
            category: metadata.category,
            date: metadata.date
          }
        )
        
        // Insert into Supabase
        const { error } = await supabase.from('photos').insert({
          title: metadata.title,
          description: metadata.description || null,
          s3_key: s3Key,
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