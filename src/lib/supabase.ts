import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for your database
export interface Photo {
  id: string
  user_id: string
  title: string
  description: string | null
  s3_key: string
  category: string
  date: string
  featured: boolean
  tags: string[]
  location: string | null
  camera: string | null
  lens: string | null
  settings: {
    aperture?: string
    shutter?: string
    iso?: number
    focalLength?: string
  } | null
  dimensions: {
    width: number
    height: number
  } | null
  price: number | null
  likes_count: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  description: string
  user_id: string
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: 'pending' | 'completed' | 'cancelled'
  stripe_payment_id: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  photo_id: string
  price: number
}

export interface Camera {
  id: string
  name: string
  created_at: string
}

export interface ContactInfo {
  id: string
  user_id: string
  email: string | null
  phone: string | null
  location: string | null
  twitter_handle: string | null
  twitter_url: string | null
  instagram_handle: string | null
  instagram_url: string | null
  heading: string | null
  subheading: string | null
  updated_at: string
}

export interface AboutInfo {
  id: string
  user_id: string
  hero_title: string | null
  hero_subtitle: string | null
  featured_title: string | null
  featured_subtitle: string | null
  about_title: string | null
  about_bio: string | null
  updated_at: string
}