import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { DashboardCard } from '../../components/dashboard/DashboardCard'
import { EditableEntityList } from '../../components/dashboard/EditableEntityList'
import type { Category } from '../../lib/supabase'

interface CategoriesManagerProps {
  dbCategories: Category[]
  fetchCategories: () => Promise<void>
  createCategory: (name: string) => Promise<Category | null>
  updateCategory: (id: string, name: string) => Promise<Category | null>
  removeCategory: (id: string) => Promise<void>
}

export function CategoriesManager({
  dbCategories,
  fetchCategories,
  createCategory,
  updateCategory,
  removeCategory,
}: CategoriesManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null)
  const [renameCategoryName, setRenameCategoryName] = useState('')

  return (
    <DashboardCard title="Gallery Categories">
      <EditableEntityList
        addForm={
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="e.g. Street Photography"
              />
            </div>
            <button
              onClick={async () => {
                if (!newCategoryName.trim()) return
                try {
                  await createCategory(newCategoryName)
                  setNewCategoryName('')
                  await fetchCategories()
                } catch (error) {
                  alert('Failed to add category. It may already exist.')
                }
              }}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        }
        items={dbCategories}
        getKey={(category) => category.id}
        isEditing={(category) => renamingCategory === category.id}
        renderEditing={(category) => (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={renameCategoryName}
              onChange={(e) => setRenameCategoryName(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              autoFocus
            />
            <button
              onClick={async () => {
                if (!renameCategoryName.trim()) return
                try {
                  await updateCategory(category.id, renameCategoryName)
                  setRenamingCategory(null)
                  await fetchCategories()
                } catch (error) {
                  alert('Failed to rename category.')
                }
              }}
              className="text-xs px-2 py-1 bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => setRenamingCategory(null)}
              className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
        renderDisplay={(category) => (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">{category.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRenamingCategory(category.id)
                  setRenameCategoryName(category.name)
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                title="Rename"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Delete category "${category.name}"? Photos in this category won't be deleted, but they'll have an unlinked category.`)) return
                  try {
                    await removeCategory(category.id)
                    await fetchCategories()
                  } catch (error) {
                    alert('Failed to delete category.')
                  }
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
        emptyState={<p className="text-gray-500 text-sm py-2">No categories yet. Add one above.</p>}
        rowClassName="flex items-center justify-between py-2"
      />
    </DashboardCard>
  )
}
