#!/usr/bin/env node
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
)

async function fixDatabaseKeys() {
  console.log('Fetching all photos...\n')
  
  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${photos.length} photos\n`)
  
  // Show current state
  photos.forEach((photo, i) => {
    console.log(`${i + 1}. ${photo.title}`)
    console.log(`   s3_key: ${photo.s3_key || 'NULL'}`)
  })
  
  // Count photos with null s3_key
  const nullKeys = photos.filter(p => !p.s3_key || p.s3_key === 'null' || p.s3_key === 'undefined')
  
  if (nullKeys.length > 0) {
    console.log(`\n❌ Found ${nullKeys.length} photos with missing/invalid s3_key`)
    console.log('\nThese photos need to be re-uploaded with the upload-photos.js script.')
    console.log('Or you need to manually update the s3_key values in Supabase.')
  } else {
    console.log('\n✅ All photos have valid s3_key values')
  }
}

fixDatabaseKeys().catch(console.error)
