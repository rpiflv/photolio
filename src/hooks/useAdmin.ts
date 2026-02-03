import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export const useAdmin = () => {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsAdmin(false)
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setProfile(data)
        setIsAdmin(data.role === 'admin')
      } catch (error) {
        console.error('Error fetching profile:', error)
        setIsAdmin(false)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  return { isAdmin, loading, profile, user }
}
