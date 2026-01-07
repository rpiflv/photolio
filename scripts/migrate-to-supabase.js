#!/usr/bin/env node
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
)

async function migrate() {
  try {
    // Read existing photoDatabase.json
    const dbPath = join(__dirname, '../src/data/photoDatabase.json')
    const data = JSON.parse(readFileSync(dbPath, 'utf-8'))

    console.log(`🔄 Migrating ${data.photos.length} photos to Supabase...`)

    // Insert photos
    for (const photo of data.photos) {
      const { error } = await supabase.from('photos').insert({
        title: photo.title,
        description: photo.description || null,
        s3_key: photo.s3Key,
        category: photo.category,
        date: photo.date,
        featured: photo.featured,
        tags: photo.tags || [],
        location: photo.location || null,
        camera: photo.camera || null,
        lens: photo.lens || null,
        settings: photo.settings || {},
        price: null // Add prices later
      })

      if (error) {
        console.error(`❌ Failed to insert ${photo.title}:`, error.message)
      } else {
        console.log(`✅ Migrated: ${photo.title}`)
      }
    }

    console.log('\n✅ Migration complete!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

migrate()