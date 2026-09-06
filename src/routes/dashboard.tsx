import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'
import { BarChart3, Loader2, Upload } from 'lucide-react'
import { useAdmin } from '../hooks/useAdmin'
import { useAboutInfo } from '../hooks/useAboutInfo'
import { useCameras } from '../hooks/useCameras'
import { useCategories } from '../hooks/useCategories'
import { useCollections } from '../hooks/useCollections'
import { useContactInfo } from '../hooks/useContactInfo'
import { useDashboardPhotos } from '../hooks/useDashboardPhotos'
import { usePhotoUpload } from '../hooks/usePhotoUpload'
import { useSocialAccounts } from '../hooks/useSocialAccounts'
import { supabase } from '../lib/supabase'
import { CamerasManager } from './dashboard/-CamerasManager'
import { CategoriesManager } from './dashboard/-CategoriesManager'
import { CollectionsManager } from './dashboard/-CollectionsManager'
import { ContactSection } from './dashboard/-ContactSection'
import { EditPhotoModal } from './dashboard/-EditPhotoModal'
import { HomeInfoSection } from './dashboard/-HomeInfoSection'
import { PhotosTable } from './dashboard/-PhotosTable'
import { SocialPostResultsModal } from './dashboard/-SocialPostResultsModal'
import { StatsCards } from './dashboard/-StatsCards'
import { UploadModal } from './dashboard/-UploadModal'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const collections = useCollections()
  const cameras = useCameras()
  const categories = useCategories()
  const contactInfo = useContactInfo()
  const aboutInfo = useAboutInfo()
  const socialAccounts = useSocialAccounts()
  const photoUpload = usePhotoUpload()
  const photos = useDashboardPhotos(collections.collections, cameras.cameras)

  const fetchCollectionInfo = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }
    } catch (error) {
      console.error('Error fetching collection info:', error)
    }
  }, [])

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      void photos.fetchPhotos()
      void cameras.fetchCameras()
      void categories.fetchCategories()
      void collections.fetchCollections()
      void contactInfo.fetchContactInfo()
      void aboutInfo.fetchAboutInfo()
      void fetchCollectionInfo()
      void socialAccounts.fetchSocialAccounts()
    }
  }, [
    aboutInfo.fetchAboutInfo,
    adminLoading,
    cameras.fetchCameras,
    categories.fetchCategories,
    collections.fetchCollections,
    contactInfo.fetchContactInfo,
    fetchCollectionInfo,
    isAdmin,
    photos.fetchPhotos,
    socialAccounts.fetchSocialAccounts,
  ])

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" />
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={photoUpload.openUploadModal}
              className="flex items-center space-x-2 border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Photo</span>
            </button>
          </div>
          <p className="text-gray-600">Photo engagement analytics</p>
        </div>

        <StatsCards photos={photos.photos} />

        <ContactSection
          contactInfo={contactInfo.contactInfo}
          savingContact={contactInfo.savingContact}
          handleContactSave={contactInfo.handleContactSave}
        />

        <HomeInfoSection
          aboutInfo={aboutInfo.aboutInfo}
          savingAbout={aboutInfo.savingAbout}
          handleAboutSave={aboutInfo.handleAboutSave}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <CollectionsManager
            collections={collections.collections}
            photos={photos.photos}
            fetchCollections={collections.fetchCollections}
            createCollection={collections.createCollection}
            updateCollection={collections.updateCollection}
            removeCollection={collections.removeCollection}
            refreshPhotos={photos.fetchPhotos}
          />
          <CategoriesManager
            dbCategories={categories.dbCategories}
            fetchCategories={categories.fetchCategories}
            createCategory={categories.createCategory}
            updateCategory={categories.updateCategory}
            removeCategory={categories.removeCategory}
          />
          <CamerasManager
            cameras={cameras.cameras}
            fetchCameras={cameras.fetchCameras}
            createCamera={cameras.createCamera}
            updateCameraName={cameras.updateCameraName}
            uploadCameraFile={cameras.uploadCameraFile}
            removeCamera={cameras.removeCamera}
            refreshPhotos={photos.fetchPhotos}
          />
        </div>

        <PhotosTable
          loading={photos.loading}
          filteredPhotos={photos.filteredPhotos}
          dbCategories={categories.dbCategories}
          collections={collections.collections}
          photoCameras={photos.photoCameras}
          cameraNameMap={photos.cameraNameMap}
          filterCategory={photos.filterCategory}
          setFilterCategory={photos.setFilterCategory}
          filterCollection={photos.filterCollection}
          setFilterCollection={photos.setFilterCollection}
          filterCamera={photos.filterCamera}
          setFilterCamera={photos.setFilterCamera}
          onEdit={photos.openEditModal}
          onDelete={photos.handleDelete}
          getPhotoCollectionName={photos.getPhotoCollectionName}
        />

        <UploadModal
          showUploadModal={photoUpload.showUploadModal}
          selectedFile={photoUpload.selectedFile}
          uploadError={photoUpload.uploadError}
          setUploadError={photoUpload.setUploadError}
          uploadForm={photoUpload.uploadForm}
          setUploadForm={photoUpload.setUploadForm}
          uploadStep={photoUpload.uploadStep}
          setUploadStep={photoUpload.setUploadStep}
          socialAccounts={socialAccounts.socialAccounts}
          socialPostForm={photoUpload.socialPostForm}
          setSocialPostForm={photoUpload.setSocialPostForm}
          uploading={photoUpload.uploading}
          fileInputRef={photoUpload.fileInputRef}
          collections={collections.collections}
          dbCategories={categories.dbCategories}
          cameras={cameras.cameras}
          fetchCollections={collections.fetchCollections}
          createCollection={collections.createCollection}
          closeUploadModal={photoUpload.closeUploadModal}
          cancelUploadStepOne={photoUpload.cancelUploadStepOne}
          handleFileSelect={photoUpload.handleFileSelect}
          handleUpload={() => photoUpload.handleUpload(photos.fetchPhotos)}
          suggestCaption={photoUpload.suggestCaption}
          suggestingCaption={photoUpload.suggestingCaption}
          captionError={photoUpload.captionError}
        />

        <SocialPostResultsModal
          results={photoUpload.socialPostResults}
          socialAccounts={socialAccounts.socialAccounts}
          onClose={() => photoUpload.setSocialPostResults(null)}
        />

        <EditPhotoModal
          editingPhoto={photos.editingPhoto}
          editForm={photos.editForm}
          setEditForm={photos.setEditForm}
          handleEdit={photos.handleEdit}
          saving={photos.saving}
          dbCategories={categories.dbCategories}
          cameras={cameras.cameras}
          collections={collections.collections}
          fetchCollections={collections.fetchCollections}
          createCollection={collections.createCollection}
          onClose={photos.closeEditModal}
          handleReplaceImage={photos.handleReplaceImage}
          replacingImage={photos.replacingImage}
        />
      </div>
    </div>
  )
}
