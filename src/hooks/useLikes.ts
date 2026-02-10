import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LIKES_STORAGE_KEY = 'photo-likes'

// Get likes from localStorage
const getLikesFromStorage = (): Set<string> => {
  try {
    const stored = localStorage.getItem(LIKES_STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch (error) {
    console.error('Error reading likes from localStorage:', error)
    return new Set()
  }
}

// Save likes to localStorage
const saveLikesToStorage = (likes: Set<string>) => {
  try {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(Array.from(likes)))
  } catch (error) {
    console.error('Error saving likes to localStorage:', error)
  }
}

// Track like in database
const trackLikeInDatabase = async (photoId: string, isLiked: boolean) => {
  try {
    if (isLiked) {
      // Increment like count
      const { error } = await supabase.rpc('increment_photo_likes', {
        photo_id: photoId
      })
      
      if (error) throw error
    } else {
      // Decrement like count
      const { error } = await supabase.rpc('decrement_photo_likes', {
        photo_id: photoId
      })
      
      if (error) throw error
    }
  } catch (error) {
    console.error('Error tracking like in database:', error)
  }
}

export const useLikes = () => {
  const [likes, setLikes] = useState<Set<string>>(() => getLikesFromStorage())

  // Sync with localStorage whenever likes change
  useEffect(() => {
    saveLikesToStorage(likes)
  }, [likes])

  const toggleLike = async (photoId: string) => {
    setLikes(prevLikes => {
      const newLikes = new Set(prevLikes)
      const wasLiked = newLikes.has(photoId)
      
      if (wasLiked) {
        newLikes.delete(photoId)
      } else {
        newLikes.add(photoId)
      }
      
      // Track in database (fire and forget)
      trackLikeInDatabase(photoId, !wasLiked)
      
      return newLikes
    })
  }

  const isLiked = (photoId: string): boolean => {
    return likes.has(photoId)
  }

  const getLikeCount = (): number => {
    return likes.size
  }

  return {
    toggleLike,
    isLiked,
    getLikeCount,
    likes: Array.from(likes)
  }
}
