import { useState } from 'react'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'
import { DashboardCard } from '../../components/dashboard/DashboardCard'
import { EditableEntityList } from '../../components/dashboard/EditableEntityList'
import { getImageUrl } from '../../lib/s3'
import type { Camera } from '../../lib/supabase'

interface CamerasManagerProps {
  cameras: Camera[]
  fetchCameras: () => Promise<void>
  createCamera: (name: string, file: File | null) => Promise<Camera | null>
  updateCameraName: (id: string, name: string) => Promise<Camera | null>
  uploadCameraFile: (id: string, file: File) => Promise<Camera | null>
  removeCamera: (id: string) => Promise<void>
  refreshPhotos: () => Promise<void>
}

export function CamerasManager({
  cameras,
  fetchCameras,
  createCamera,
  updateCameraName,
  uploadCameraFile,
  removeCamera,
  refreshPhotos,
}: CamerasManagerProps) {
  const [newCameraName, setNewCameraName] = useState('')
  const [newCameraImage, setNewCameraImage] = useState<File | null>(null)
  const [renamingCamera, setRenamingCamera] = useState<string | null>(null)
  const [renameCameraName, setRenameCameraName] = useState('')

  return (
    <DashboardCard title="Cameras">
      <EditableEntityList
        addForm={
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Camera Name</label>
              <input
                type="text"
                value={newCameraName}
                onChange={(e) => setNewCameraName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="e.g. Canon EOS R5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewCameraImage(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
            <button
              onClick={async () => {
                if (!newCameraName.trim()) return
                try {
                  await createCamera(newCameraName, newCameraImage)
                  setNewCameraName('')
                  setNewCameraImage(null)
                  await fetchCameras()
                } catch (error) {
                  alert('Failed to add camera. It may already exist.')
                }
              }}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        }
        items={cameras}
        getKey={(camera) => camera.id}
        isEditing={(camera) => renamingCamera === camera.id}
        renderEditing={(camera) => (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={renameCameraName}
              onChange={(e) => setRenameCameraName(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              autoFocus
            />
            <button
              onClick={async () => {
                if (!renameCameraName.trim()) return
                try {
                  await updateCameraName(camera.id, renameCameraName)
                  setRenamingCamera(null)
                  await fetchCameras()
                  await refreshPhotos()
                } catch (error) {
                  alert('Failed to rename camera.')
                }
              }}
              className="text-xs px-2 py-1 bg-gray-900 text-white rounded-md hover:bg-gray-800 cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => setRenamingCamera(null)}
              className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
        renderDisplay={(camera) => (
          <>
            <div className="flex items-center gap-2">
              {camera.image_s3_key ? <img src={getImageUrl(camera.image_s3_key)} alt={camera.name} className="h-8 w-8 rounded object-cover" /> : null}
              <span className="text-sm text-gray-700">{camera.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" title="Upload image">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      await uploadCameraFile(camera.id, file)
                      await fetchCameras()
                    } catch (error) {
                      alert('Failed to upload camera image.')
                    }
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                onClick={() => {
                  setRenamingCamera(camera.id)
                  setRenameCameraName(camera.name)
                }}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                title="Rename"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Delete camera "${camera.name}"? Photos using this camera won't be deleted, but they'll have an unlinked camera.`)) return
                  try {
                    await removeCamera(camera.id)
                    await fetchCameras()
                  } catch (error) {
                    alert('Failed to delete camera.')
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
        emptyState={<p className="text-gray-500 text-sm py-2">No cameras yet. Add one above.</p>}
        rowClassName="flex items-center justify-between py-2"
      />
    </DashboardCard>
  )
}
