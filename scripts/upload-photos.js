#!/usr/bin/env node
import 'dotenv/config'
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join, extname, basename } from 'path'
import { uploadImageToS3, getImageSizes } from '../src/lib/imageService.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration
const UPLOAD_FOLDER = join(__dirname, 'uploads') // Put images here to upload
const DATABASE_PATH = join(__dirname, '../src/data/photoDatabase.json')

// Supported image formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp']

// Function to generate S3 key from filename and category
function generateS3Key(filename, category) {
  const ext = extname(filename).toLowerCase()
  const name = basename(filename, ext)
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  return `gallery/${category}/${cleanName}${ext}`
}

// Function to prompt for photo metadata
function promptForMetadata(filename) {
  // In a real implementation, you'd use a library like 'inquirer' for interactive prompts
  // For now, we'll return default metadata
  const category = 'other' // You can make this interactive
  
  return {
    id: `photo-${Date.now()}`,
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

// Function to upload photos and update database
async function uploadPhotos() {
  try {
    // Check if upload folder exists
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

    // Load existing database
    let database
    try {
      const dbContent = readFileSync(DATABASE_PATH, 'utf8')
      database = JSON.parse(dbContent)
    } catch (error) {
      console.log('Creating new photo database...')
      database = { photos: [], categories: [] }
    }

    const uploadedFiles = []

    // Upload each image
    for (const filename of imageFiles) {
      console.log(`Processing ${filename}...`)
      
      const filePath = join(UPLOAD_FOLDER, filename)
      const imageBuffer = readFileSync(filePath)
      
      // Get metadata (in a real app, you'd prompt the user)
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
        
        // Add to database
        const photoEntry = {
          ...metadata,
          s3Key: s3Key,
          url: url
        }
        
        database.photos.push(photoEntry)
        console.log(`✅ Uploaded: ${filename} -> ${s3Key}`)
        
        // Track successfully uploaded files
        uploadedFiles.push(filePath)
      } catch (error) {
        console.error(`❌ Failed to upload ${filename}:`, error.message)
      }
    }

    // Update category counts
    const categoryMap = {}
    database.photos.forEach(photo => {
      categoryMap[photo.category] = (categoryMap[photo.category] || 0) + 1
    })

    database.categories = [
      { id: 'all', name: 'All Photos', description: 'All photographs in the portfolio' },
      { id: 'portrait', name: 'Portrait', description: 'Professional portrait photography' },
      { id: 'landscape', name: 'Landscape', description: 'Natural landscape photography' },
      { id: 'street', name: 'Street', description: 'Urban street photography' },
      { id: 'nature', name: 'Nature', description: 'Wildlife and nature photography' },
      { id: 'architecture', name: 'Architecture', description: 'Architectural photography' },
      { id: 'other', name: 'Other', description: 'Miscellaneous photography' }
    ]

    // Save updated database
    writeFileSync(DATABASE_PATH, JSON.stringify(database, null, 2))
    console.log(`\n✅ Updated database with ${uploadedFiles.length} new photo(s)`)
    
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
    
    console.log('\n📝 Please review and edit the photo metadata in photoDatabase.json')

  } catch (error) {
    console.error('Error uploading photos:', error)
  }
}

// Run the upload script
uploadPhotos()