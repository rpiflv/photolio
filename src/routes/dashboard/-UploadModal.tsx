import { useState } from 'react'
import { ArrowLeft, Loader2, Share2, Upload } from 'lucide-react'
import { Modal } from '../../components/dashboard/Modal'
import { QuickAddCollection } from '../../components/dashboard/QuickAddCollection'
import type { Category, Collection, Camera } from '../../lib/supabase'
import type { SocialAccounts, UploadForm } from './-types'

interface UploadModalProps {
  showUploadModal: boolean
  selectedFile: File | null
  uploadError: string | null
  setUploadError: (value: string | null) => void
  uploadForm: UploadForm
  setUploadForm: React.Dispatch<React.SetStateAction<UploadForm>>
  uploadStep: 1 | 2
  setUploadStep: React.Dispatch<React.SetStateAction<1 | 2>>
  socialAccounts: SocialAccounts
  socialPostForm: {
    enabled: boolean
    xAccountIds: string[]
    igAccountIds: string[]
    caption: string
  }
  setSocialPostForm: React.Dispatch<React.SetStateAction<{
    enabled: boolean
    xAccountIds: string[]
    igAccountIds: string[]
    caption: string
  }>>
  uploading: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  collections: Collection[]
  dbCategories: Category[]
  cameras: Camera[]
  fetchCollections: () => Promise<void>
  createCollection: (name: string, description?: string) => Promise<Collection | null>
  closeUploadModal: () => void
  cancelUploadStepOne: () => void
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleUpload: () => Promise<void>
}

export function UploadModal({
  showUploadModal,
  selectedFile,
  uploadError,
  setUploadError,
  uploadForm,
  setUploadForm,
  uploadStep,
  setUploadStep,
  socialAccounts,
  socialPostForm,
  setSocialPostForm,
  uploading,
  fileInputRef,
  collections,
  dbCategories,
  cameras,
  fetchCollections,
  createCollection,
  closeUploadModal,
  cancelUploadStepOne,
  handleFileSelect,
  handleUpload,
}: UploadModalProps) {
  const [showQuickAddCollectionInUpload, setShowQuickAddCollectionInUpload] = useState(false)
  const [quickCollectionNameInUpload, setQuickCollectionNameInUpload] = useState('')
  const [quickCollectionDescInUpload, setQuickCollectionDescInUpload] = useState('')

  if (!showUploadModal) {
    return null
  }

  return (
    <Modal
      title={uploadStep === 1 ? 'Upload New Photo' : 'Social Media Posting'}
      onClose={closeUploadModal}
      headerStart={uploadStep === 2 ? (
        <button onClick={() => setUploadStep(1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : undefined}
      panelClassName="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center mb-6">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${uploadStep === 1 ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>
          {uploadStep === 1 ? '1' : '✓'}
        </div>
        <div className={`flex-1 h-0.5 mx-2 ${uploadStep === 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${uploadStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
          2
        </div>
      </div>

      {uploadStep === 1 ? (
        <div className="space-y-4">
          {uploadError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">Upload Error:</p>
              <p className="text-sm">{uploadError}</p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            />
            {selectedFile ? <p className="mt-2 text-sm text-gray-600">Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter photo title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter photo description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={uploadForm.category}
              onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {dbCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <QuickAddCollection
              show={showQuickAddCollectionInUpload}
              onToggle={() => setShowQuickAddCollectionInUpload((prev) => !prev)}
              name={quickCollectionNameInUpload}
              description={quickCollectionDescInUpload}
              onNameChange={setQuickCollectionNameInUpload}
              onDescriptionChange={setQuickCollectionDescInUpload}
              onCreate={async () => {
                if (!quickCollectionNameInUpload.trim()) return
                try {
                  const created = await createCollection(quickCollectionNameInUpload, quickCollectionDescInUpload)
                  if (created) {
                    await fetchCollections()
                    setUploadForm((prev) => ({ ...prev, collection: String(created.id) }))
                    setQuickCollectionNameInUpload('')
                    setQuickCollectionDescInUpload('')
                    setShowQuickAddCollectionInUpload(false)
                  }
                } catch (error: any) {
                  console.error('Failed to create collection:', error)
                  alert(`Failed to create collection: ${error?.message || error || 'Unknown error'}`)
                }
              }}
            />

            <select
              value={uploadForm.collection}
              onChange={(e) => setUploadForm({ ...uploadForm, collection: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {collections.length === 0 ? <option value="1">Default Collection</option> : null}
              {collections.map((collection) => (
                <option key={collection.id} value={String(collection.id)}>{collection.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={uploadForm.location}
              onChange={(e) => setUploadForm({ ...uploadForm, location: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., New York, USA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Camera</label>
            <select
              value={uploadForm.camera}
              onChange={(e) => setUploadForm({ ...uploadForm, camera: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a camera</option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>{camera.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lens</label>
            <input
              type="text"
              value={uploadForm.lens}
              onChange={(e) => setUploadForm({ ...uploadForm, lens: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., RF 24-70mm f/2.8L"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => {
                if (!selectedFile || !uploadForm.title) {
                  setUploadError('Please select a file and provide a title')
                  return
                }
                setUploadError(null)
                setSocialPostForm((prev) => ({
                  ...prev,
                  caption: prev.caption || uploadForm.title + (uploadForm.description ? '\n\n' + uploadForm.description : ''),
                }))
                setUploadStep(2)
              }}
              disabled={!selectedFile || !uploadForm.title}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>Continue</span>
            </button>
            <button onClick={cancelUploadStepOne} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {uploadStep === 2 ? (
        <div className="space-y-4">
          {uploadError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">Upload Error:</p>
              <p className="text-sm">{uploadError}</p>
            </div>
          ) : null}

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Uploading: <span className="font-medium text-gray-900">{uploadForm.title}</span></p>
            {selectedFile ? <p className="text-xs text-gray-500 mt-1">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p> : null}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <Share2 className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Post to social media</p>
                  <p className="text-xs text-gray-500">Share this photo on X and/or Instagram</p>
                </div>
              </div>
              <div
                onClick={() => setSocialPostForm((prev) => ({ ...prev, enabled: !prev.enabled, xAccountIds: !prev.enabled ? prev.xAccountIds : [], igAccountIds: !prev.enabled ? prev.igAccountIds : [] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${socialPostForm.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${socialPostForm.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>

          {socialPostForm.enabled && (socialAccounts.x.length > 0 || socialAccounts.instagram.length > 0) ? (
            <>
              {socialAccounts.x.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    <p className="text-sm font-medium text-gray-700">X (Twitter) accounts</p>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {socialAccounts.x.map((account) => (
                      <label key={account.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={socialPostForm.xAccountIds.includes(account.id)}
                          onChange={(e) => setSocialPostForm((prev) => ({ ...prev, xAccountIds: e.target.checked ? [...prev.xAccountIds, account.id] : prev.xAccountIds.filter((id) => id !== account.id) }))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{account.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {socialAccounts.instagram.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                    <p className="text-sm font-medium text-gray-700">Instagram accounts</p>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {socialAccounts.instagram.map((account) => (
                      <label key={account.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={socialPostForm.igAccountIds.includes(account.id)}
                          onChange={(e) => setSocialPostForm((prev) => ({ ...prev, igAccountIds: e.target.checked ? [...prev.igAccountIds, account.id] : prev.igAccountIds.filter((id) => id !== account.id) }))}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{account.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {(socialPostForm.xAccountIds.length > 0 || socialPostForm.igAccountIds.length > 0) ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                  <textarea
                    value={socialPostForm.caption}
                    onChange={(e) => setSocialPostForm((prev) => ({ ...prev, caption: e.target.value }))}
                    rows={4}
                    maxLength={2200}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write your post caption..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {socialPostForm.caption.length}/2200 characters
                    {socialPostForm.xAccountIds.length > 0 && socialPostForm.caption.length > 280 ? <span className="text-amber-600 ml-2">(X posts are limited to 280 characters)</span> : null}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          {socialPostForm.enabled && socialAccounts.x.length === 0 && socialAccounts.instagram.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
              <p className="text-sm">No social media accounts configured. Add <code>TWITTER_ACCOUNTS</code> or <code>INSTAGRAM_ACCOUNTS</code> to your environment variables.</p>
            </div>
          ) : null}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => void handleUpload()}
              disabled={uploading || (socialPostForm.enabled && (socialPostForm.xAccountIds.length > 0 || socialPostForm.igAccountIds.length > 0) && !socialPostForm.caption.trim())}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{socialPostForm.enabled && (socialPostForm.xAccountIds.length > 0 || socialPostForm.igAccountIds.length > 0) ? 'Uploading & Posting...' : 'Uploading...'}</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>{socialPostForm.enabled && (socialPostForm.xAccountIds.length > 0 || socialPostForm.igAccountIds.length > 0) ? 'Upload & Post' : 'Upload Photo'}</span>
                </>
              )}
            </button>
            <button onClick={closeUploadModal} disabled={uploading} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
