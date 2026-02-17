import { supabase } from '../lib/supabase'
import type { AboutInfo } from '../lib/supabase'

// Fetch home info (public - gets the first available row)
export async function getHomeInfo(): Promise<AboutInfo | null> {
  const { data, error } = await supabase
    .from('home_info')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching home info:', error)
    return null
  }

  return data
}

// Fetch home info for the current logged-in user
export async function getMyHomeInfo(): Promise<AboutInfo | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('home_info')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // No row yet - create one with defaults
    if (error.code === 'PGRST116') {
      const { data: newRow, error: insertError } = await supabase
        .from('home_info')
        .insert({
          user_id: user.id,
          hero_title: 'Capturing Moments',
          hero_subtitle: 'Through the lenses of my camera, I tell stories that words cannot express.',
          featured_title: 'Featured Work',
          featured_subtitle: 'A selection of my favorite photographs',
          about_title: 'About the Photographer',
          about_bio: 'I\'m a passionate photographer who believes in the power of visual storytelling. Every image tells a story, captures an emotion, and preserves a moment in time. Through my lens, I aim to showcase the beauty in everyday moments and extraordinary scenes alike.',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating home info:', insertError)
        return null
      }
      return newRow
    }
    console.error('Error fetching home info:', error)
    return null
  }

  return data
}

// Update home info
export async function updateHomeInfo(
  id: string,
  updates: Partial<Omit<AboutInfo, 'id' | 'user_id' | 'updated_at'>>
): Promise<AboutInfo | null> {
  const { data, error } = await supabase
    .from('home_info')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating home info:', error)
    throw error
  }

  return data
}
