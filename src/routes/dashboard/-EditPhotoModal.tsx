import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '../../components/dashboard/Modal'
import { QuickAddCollection } from '../../components/dashboard/QuickAddCollection'
import type { Photo } from '../../data/photos'
import type { Camera, Category, Collection } from '../../lib/supabase'
import type { EditPhotoForm } from './-types'

interface EditPhotoModalProps {
  editingPhoto: Photo | null
  editForm: EditPhotoForm
  setEditForm: React.Dispatch<React.SetStateAction<EditPhotoForm>>
  handleEdit: () => Promise<void>
  saving: boolean
  dbCategories: Category[]
  cameras: Camera[]
  collections: Collection[]
  fetchCollections: () => Promise<void>
  createCollection: (name: string, description?: string) => Promise<Collection | null>
  onClose: () => void
}

export function EditPhotoModal({
  editingPhoto,
  editForm,
  setEditForm,
  handleEdit,
  saving,
  dbCategories,
  cameras,
  collections,
  fetchCollections,
  createCollection,
  onClose,
}: EditPhotoModalProps) {
  const [showQuickAddCollectionInEdit, setShowQuickAddCollectionInEdit] = useState(false)
  const [quickCollectionNameInEdit, setQuickCollectionNameInEdit] = useState('')
  const [quickCollectionDescInEdit, setQuickCollectionDescInEdit] = useState('')

  if (!editingPhoto) {
    return null
  }

  return (
    <Modal title="Edit Photo" onClose={onClose} panelClassName="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dbCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Camera</label>
          <select
            value={editForm.camera}
            onChange={(e) => setEditForm({ ...editForm, camera: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No camera</option>
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>{camera.name}</option>
            ))}
          </select>
        </div>

        <div>
          <QuickAddCollection
            labelClassName="block text-sm font-semibold text-gray-700"
            show={showQuickAddCollectionInEdit}
            onToggle={() => setShowQuickAddCollectionInEdit((prev) => !prev)}
            name={quickCollectionNameInEdit}
            description={quickCollectionDescInEdit}
            onNameChange={setQuickCollectionNameInEdit}
            onDescriptionChange={setQuickCollectionDescInEdit}
            onCreate={async () => {
              if (!quickCollectionNameInEdit.trim()) return
              try {
                const created = await createCollection(quickCollectionNameInEdit, quickCollectionDescInEdit)
                if (created) {
                  await fetchCollections()
                  setEditForm((prev) => ({ ...prev, collection: String(created.id) }))
                  setQuickCollectionNameInEdit('')
                  setQuickCollectionDescInEdit('')
                  setShowQuickAddCollectionInEdit(false)
                }
              } catch (error: any) {
                console.error('Failed to create collection:', error)
                alert(`Failed to create collection: ${error?.message || error || 'Unknown error'}`)
              }
            }}
          />

          <select
            value={editForm.collection}
            onChange={(e) => setEditForm({ ...editForm, collection: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            {collections.length === 0 ? <option value="1">Default Collection</option> : null}
            {collections.map((collection) => (
              <option key={collection.id} value={String(collection.id)}>{collection.name}</option>
            ))}
          </select>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            onClick={() => void handleEdit()}
            disabled={!editForm.title || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
          <button onClick={onClose} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
