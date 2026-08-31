import { useCallback, useState } from 'react'
import { addCategory, deleteCategory, getRawCategories, renameCategory } from '../data/photos'
import type { Category } from '../lib/supabase'
import { slugify } from '../lib/slugify'

export function useCategories() {
  const [dbCategories, setDbCategories] = useState<Category[]>([])

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getRawCategories()
      setDbCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  const createCategory = useCallback((name: string) => {
    return addCategory(slugify(name), name)
  }, [])

  const updateCategory = useCallback((id: string, name: string) => {
    return renameCategory(id, name)
  }, [])

  const removeCategory = useCallback((id: string) => {
    return deleteCategory(id)
  }, [])

  return {
    dbCategories,
    fetchCategories,
    createCategory,
    updateCategory,
    removeCategory,
  }
}
