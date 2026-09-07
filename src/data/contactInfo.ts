import { supabase } from '../lib/supabase'
import type { ContactInfo } from '../lib/supabase'

// Fetch contact info (public - gets the first available row)
export async function getContactInfo(): Promise<ContactInfo | null> {
  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching contact info:', error)
    return null
  }

  return data
}

// Fetch contact info for the current logged-in user
export async function getMyContactInfo(): Promise<ContactInfo | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('contact_info')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // No row yet - create one with placeholders
    if (error.code === 'PGRST116') {
      const { data: newRow, error: insertError } = await supabase
        .from('contact_info')
        .insert({
          user_id: user.id,
          email: 'your.email@example.com',
          location: 'Your City, Country',
          heading: 'Get In Touch',
          subheading: 'Ready to capture your special moments?',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating contact info:', insertError)
        return null
      }
      return newRow
    }
    console.error('Error fetching contact info:', error)
    return null
  }

  return data
}

// Update contact info
export async function updateContactInfo(
  id: string,
  updates: Partial<Omit<ContactInfo, 'id' | 'user_id' | 'updated_at'>>
): Promise<ContactInfo | null> {
  const { data, error } = await supabase
    .from('contact_info')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating contact info:', error)
    throw error
  }

  return data
}
