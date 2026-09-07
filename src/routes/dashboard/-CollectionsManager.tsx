import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { DashboardCard } from '../../components/dashboard/DashboardCard'
import { EditableEntityList } from '../../components/dashboard/EditableEntityList'
import type { Photo } from '../../data/photos'
import type { Collection } from '../../lib/supabase'

interface CollectionsManagerProps {
  collections: Collection[]
  photos: Photo[]
  fetchCollections: () => Promise<void>
  createCollection: (name: string, description?: string) => Promise<Collection | null>
  updateCollection: (id: number, name: string, description?: string | null) => Promise<Collection | null>
  removeCollection: (id: number) => Promise<void>
  refreshPhotos: () => Promise<void>
}

export function CollectionsManager({
  collections,
  photos,
  fetchCollections,
  createCollection,
  updateCollection,
  removeCollection,
  refreshPhotos,
}: CollectionsManagerProps) {
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [renamingCollection, setRenamingCollection] = useState<number | null>(null)
  const [renameCollectionName, setRenameCollectionName] = useState('')
  const [renameCollectionDescription, setRenameCollectionDescription] = useState('')

  return (
    <DashboardCard title="Collections">
      <EditableEntityList
        addForm={
          <div className="space-y-2 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Collection Name</label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="e.g. Street Series"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                  placeholder="Short description"
                />
              </div>
              <button
                onClick={async () => {
                  if (!newCollectionName.trim()) return
                  try {
                    await createCollection(newCollectionName, newCollectionDescription)
                    setNewCollectionName('')
                    setNewCollectionDescription('')
                    await fetchCollections()
                  } catch (error: any) {
                    console.error('Failed to add collection:', error)
                    alert(`Failed to add collection: ${error?.message || error || 'Unknown error'}`)
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        }
        items={collections}
        getKey={(collection) => collection.id}
        isEditing={(collection) => renamingCollection === collection.id}
        renderEditing={(collection) => (
          <div className="space-y-2">
            <input
              type="text"
              value={renameCollectionName}
              onChange={(e) => setRenameCollectionName(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="Collection Name"
              autoFocus
            />
            <input
              type="text"
              value={renameCollectionDescription}
              onChange={(e) => setRenameCollectionDescription(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              placeholder="Description (optional)"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!renameCollectionName.trim()) return
                  try {
                    await updateCollection(collection.id, renameCollectionName, renameCollectionDescription)
                    setRenamingCollection(null)
                    await fetchCollections()
                    await refreshPhotos()
                  } catch (error: any) {
                    console.error('Failed to rename collection:', error)
                    alert(`Failed to rename collection: ${error?.message || error || 'Unknown error'}`)
                  }
                }}
                className="text-xs px-2 py-1 bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setRenamingCollection(null)}
                className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        renderDisplay={(collection) => {
          const count = photos.filter((photo) => Number(photo.collectionId ?? 1) === collection.id).length
          return (
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">#{collection.id}</span>
                  <span className="text-sm font-medium text-gray-800 truncate">{collection.name}</span>
                  {collection.id === 1 ? (
                    <span className="text-[10px] uppercase tracking-wider bg-blue-50 text-blue-600 font-semibold px-1.5 py-0.5 rounded">Default</span>
                  ) : null}
                </div>
                {collection.description ? <p className="text-xs text-gray-500 truncate mt-0.5">{collection.description}</p> : null}
                <p className="text-[11px] text-gray-400 mt-0.5">{count} {count === 1 ? 'photo' : 'photos'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setRenamingCollection(collection.id)
                    setRenameCollectionName(collection.name)
                    setRenameCollectionDescription(collection.description || '')
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {collection.id !== 1 ? (
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete collection "${collection.name}"? Photos in this collection will be moved to Default Collection.`)) return
                      try {
                        await removeCollection(collection.id)
                        await fetchCollections()
                        await refreshPhotos()
                      } catch (error: any) {
                        console.error('Failed to delete collection:', error)
                        alert(`Failed to delete collection: ${error?.message || error || 'Unknown error'}`)
                      }
                    }}
                    className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          )
        }}
        emptyState={<p className="text-gray-500 text-sm py-2">No collections yet.</p>}
        listClassName="divide-y divide-gray-100 max-h-80 overflow-y-auto"
      />
    </DashboardCard>
  )
}
