import { useCallback, useState } from 'react'
import { addCollection, deleteCollection, getCollections, renameCollection } from '../data/photos'
import type { Collection } from '../lib/supabase'

export const DEFAULT_COLLECTION: Collection = {
  id: 1,
  name: 'Default Collection',
  description: null,
  created_at: '',
}

function getDefaultCollections() {
  return [{ ...DEFAULT_COLLECTION }]
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>(getDefaultCollections())

  const fetchCollections = useCallback(async () => {
    try {
      const data = await getCollections()
      setCollections(data.length > 0 ? data : getDefaultCollections())
    } catch (error) {
      console.error('Error fetching collections:', error)
      setCollections(getDefaultCollections())
    }
  }, [])

  const createCollection = useCallback((name: string, description?: string) => {
    return addCollection(name, description)
  }, [])

  const updateCollection = useCallback((id: number, name: string, description?: string | null) => {
    return renameCollection(id, name, description)
  }, [])

  const removeCollection = useCallback((id: number) => {
    return deleteCollection(id)
  }, [])

  return {
    collections,
    fetchCollections,
    createCollection,
    updateCollection,
    removeCollection,
  }
}
