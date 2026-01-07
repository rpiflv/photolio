#!/usr/bin/env node

/**
 * Image Management Script
 * 
 * This script helps manage your photo portfolio images:
 * - Sync new images with database
 * - Check for missing thumbnails
 * - List all images and their status
 * 
 * Usage:
 *   npm run images:sync     - Sync new images with database
 *   npm run images:check    - Check for missing thumbnails
 *   npm run images:list     - List all images
 */

import { imageManager } from '../src/utils/imageManager.js'

async function main() {
  const command = process.argv[2] || 'help'

  switch (command) {
    case 'sync':
      console.log('🔄 Syncing images with database...')
      const database = await imageManager.syncDatabase()
      console.log(`✅ Synced! Found ${database.images.length} total images`)
      break

    case 'check':
      console.log('🔍 Checking for missing thumbnails...')
      const missing = await imageManager.getImagesWithoutThumbnails()
      if (missing.length === 0) {
        console.log('✅ All images have thumbnails!')
      } else {
        console.log(`⚠️  Missing thumbnails for ${missing.length} images:`)
        missing.forEach(img => console.log(`   - ${img}`))
        console.log('\nℹ️  Create thumbnails and place them in: public/images/gallery/thumbnails/')
      }
      break

    case 'list':
      console.log('📋 Listing all images...')
      const images = await imageManager.getImageFiles()
      const thumbnails = await imageManager.getThumbnailFiles()
      
      console.log(`\nFound ${images.length} images:`)
      for (const img of images) {
        const hasThumb = thumbnails.includes(img)
        const status = hasThumb ? '✅' : '❌'
        console.log(`   ${status} ${img}`)
      }
      break

    case 'help':
    default:
      console.log(`
🖼️  Photo Portfolio Image Manager

Commands:
  sync    - Sync new images with database
  check   - Check for missing thumbnails  
  list    - List all images and their status
  help    - Show this help message

Examples:
  node scripts/images.js sync
  node scripts/images.js check
  node scripts/images.js list
      `)
      break
  }
}

main().catch(console.error)