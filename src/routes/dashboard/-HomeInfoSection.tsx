import { useState } from 'react'
import { Settings } from 'lucide-react'
import { DashboardCard } from '../../components/dashboard/DashboardCard'
import { Modal } from '../../components/dashboard/Modal'
import type { AboutInfo } from '../../lib/supabase'
import type { AboutForm } from './-types'

interface HomeInfoSectionProps {
  aboutInfo: AboutInfo | null
  savingAbout: boolean
  handleAboutSave: (form: AboutForm, onSuccess?: () => void) => Promise<void>
}

const EMPTY_ABOUT_FORM: AboutForm = {
  site_name: '',
  hero_title: '',
  hero_subtitle: '',
  featured_title: '',
  featured_subtitle: '',
  about_title: '',
  about_bio: '',
}

export function HomeInfoSection({ aboutInfo, savingAbout, handleAboutSave }: HomeInfoSectionProps) {
  const [showAboutEdit, setShowAboutEdit] = useState(false)
  const [aboutForm, setAboutForm] = useState<AboutForm>(EMPTY_ABOUT_FORM)

  return (
    <>
      <DashboardCard
        title="Home Page"
        className="mb-8"
        action={
          <button
            onClick={() => {
              setAboutForm({
                site_name: aboutInfo?.site_name || '',
                hero_title: aboutInfo?.hero_title || '',
                hero_subtitle: aboutInfo?.hero_subtitle || '',
                featured_title: aboutInfo?.featured_title || '',
                featured_subtitle: aboutInfo?.featured_subtitle || '',
                about_title: aboutInfo?.about_title || '',
                about_bio: aboutInfo?.about_bio || '',
              })
              setShowAboutEdit(true)
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm">Edit</span>
          </button>
        }
      >
        {aboutInfo ? (
          <div className="text-sm space-y-3">
            <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Hero Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><span className="font-medium text-gray-700">Title:</span> <span className="text-gray-600">{aboutInfo.hero_title || '—'}</span></div>
              <div><span className="font-medium text-gray-700">Subtitle:</span> <span className="text-gray-600">{aboutInfo.hero_subtitle || '—'}</span></div>
            </div>
            <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider pt-2 border-t border-gray-100">Featured Work Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><span className="font-medium text-gray-700">Title:</span> <span className="text-gray-600">{aboutInfo.featured_title || '—'}</span></div>
              <div><span className="font-medium text-gray-700">Subtitle:</span> <span className="text-gray-600">{aboutInfo.featured_subtitle || '—'}</span></div>
            </div>
            <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider pt-2 border-t border-gray-100">About Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="font-medium text-gray-700">Title:</span> <span className="text-gray-600">{aboutInfo.about_title || '—'}</span></div>
              <div><span className="font-medium text-gray-700">Bio:</span> <span className="text-gray-600">{aboutInfo.about_bio || '—'}</span></div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No home page info set yet. Click Edit to add your details.</p>
        )}
      </DashboardCard>

      {showAboutEdit ? (
        <Modal
          title="Edit Home Page"
          onClose={() => setShowAboutEdit(false)}
          panelClassName="max-w-lg max-h-[90vh] overflow-y-auto"
          closeButtonClassName="text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Site Branding</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input
                type="text"
                value={aboutForm.site_name}
                onChange={(e) => setAboutForm((prev) => ({ ...prev, site_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="My Photography"
              />
              <p className="text-xs text-gray-500 mt-1">Shown in the header and browser tab</p>
            </div>

            <hr className="border-gray-200" />
            <h3 className="font-semibold text-gray-800 text-sm">Hero Section</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={aboutForm.hero_title}
                onChange={(e) => setAboutForm((prev) => ({ ...prev, hero_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="Capturing Moments"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={aboutForm.hero_subtitle}
                onChange={(e) => setAboutForm((prev) => ({ ...prev, hero_subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="Through the lenses of my camera..."
              />
            </div>

            <hr className="border-gray-200" />
            <h3 className="font-semibold text-gray-800 text-sm">Featured Work Section</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={aboutForm.featured_title}
                onChange={(e) => setAboutForm((prev) => ({ ...prev, featured_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="Featured Work"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={aboutForm.featured_subtitle}
                onChange={(e) => setAboutForm((prev) => ({ ...prev, featured_subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="A selection of my favorite photographs"
              />
            </div>

            <hr className="border-gray-200" />
            <h3 className="font-semibold text-gray-800 text-sm">About Section</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={aboutForm.about_title}
                onChange={(e) => setAboutForm((prev) => ({ ...prev, about_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="About the Photographer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={aboutForm.about_bio}
                onChange={(e) => setAboutForm((prev) => ({ ...prev, about_bio: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="Write about yourself..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => void handleAboutSave(aboutForm, () => setShowAboutEdit(false))}
              disabled={savingAbout}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
            >
              {savingAbout ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setShowAboutEdit(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
