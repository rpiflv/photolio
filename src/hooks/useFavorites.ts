import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else {
      setFavorites(new Set())
      setLoading(false)
    }
  }, [user])

  const loadFavorites = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('favorites')
      .select('photo_id')
      .eq('user_id', user.id)

    if (!error && data) {
      setFavorites(new Set(data.map(f => f.photo_id)))
    }
    setLoading(false)
  }

  const toggleFavorite = async (photoId: string) => {
    if (!user) return false

    const isFavorited = favorites.has(photoId)

    if (isFavorited) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('photo_id', photoId)

      if (!error) {
        setFavorites(prev => {
          const newSet = new Set(prev)
          newSet.delete(photoId)
          return newSet
        })
        return true
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          photo_id: photoId
        })

      if (!error) {
        setFavorites(prev => new Set(prev).add(photoId))
        return true
      }
    }

    return false
  }

  const isFavorited = (photoId: string) => favorites.has(photoId)

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorited
  }
}