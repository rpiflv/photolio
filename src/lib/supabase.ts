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