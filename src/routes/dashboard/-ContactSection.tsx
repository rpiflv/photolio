import { useState } from 'react'
import { Settings, Loader2 } from 'lucide-react'
import { DashboardCard } from '../../components/dashboard/DashboardCard'
import { Modal } from '../../components/dashboard/Modal'
import type { ContactInfo } from '../../lib/supabase'
import type { ContactForm } from './-types'

interface ContactSectionProps {
  contactInfo: ContactInfo | null
  savingContact: boolean
  handleContactSave: (form: ContactForm, onSuccess?: () => void) => Promise<void>
}

const EMPTY_CONTACT_FORM: ContactForm = {
  email: '',
  phone: '',
  location: '',
  twitter_handle: '',
  twitter_url: '',
  instagram_handle: '',
  instagram_url: '',
  heading: '',
  subheading: '',
}

export function ContactSection({ contactInfo, savingContact, handleContactSave }: ContactSectionProps) {
  const [showContactEdit, setShowContactEdit] = useState(false)
  const [contactForm, setContactForm] = useState<ContactForm>(EMPTY_CONTACT_FORM)

  return (
    <>
      <DashboardCard
        title="Contact Page"
        className="mb-8"
        action={
          <button
            onClick={() => {
              setContactForm({
                email: contactInfo?.email || '',
                phone: contactInfo?.phone || '',
                location: contactInfo?.location || '',
                twitter_handle: contactInfo?.twitter_handle || '',
                twitter_url: contactInfo?.twitter_url || '',
                instagram_handle: contactInfo?.instagram_handle || '',
                instagram_url: contactInfo?.instagram_url || '',
                heading: contactInfo?.heading || '',
                subheading: contactInfo?.subheading || '',
              })
              setShowContactEdit(true)
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm">Edit</span>
          </button>
        }
      >
        {contactInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-600">{contactInfo.email || '—'}</span></div>
            <div><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-600">{contactInfo.phone || '—'}</span></div>
            <div><span className="font-medium text-gray-700">Location:</span> <span className="text-gray-600">{contactInfo.location || '—'}</span></div>
            <div><span className="font-medium text-gray-700">X (Twitter):</span> <span className="text-gray-600">{contactInfo.twitter_handle || '—'}</span></div>
            <div><span className="font-medium text-gray-700">Instagram:</span> <span className="text-gray-600">{contactInfo.instagram_handle || '—'}</span></div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No contact info set yet. Click Edit to add your details.</p>
        )}
      </DashboardCard>

      {showContactEdit ? (
        <Modal
          title="Edit Contact Info"
          onClose={() => setShowContactEdit(false)}
          panelClassName="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Heading</label>
              <input type="text" value={contactForm.heading} onChange={(e) => setContactForm({ ...contactForm, heading: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Get In Touch" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Subheading</label>
              <input type="text" value={contactForm.subheading} onChange={(e) => setContactForm({ ...contactForm, subheading: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ready to capture your special moments?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="your.email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="+1 (555) 123-4567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={contactForm.location} onChange={(e) => setContactForm({ ...contactForm, location: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Your City, Country" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Handle</label>
              <input type="text" value={contactForm.twitter_handle} onChange={(e) => setContactForm({ ...contactForm, twitter_handle: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="@yourhandle" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
              <input type="url" value={contactForm.twitter_url} onChange={(e) => setContactForm({ ...contactForm, twitter_url: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://x.com/yourhandle" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
              <input type="text" value={contactForm.instagram_handle} onChange={(e) => setContactForm({ ...contactForm, instagram_handle: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="@yourhandle" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
              <input type="url" value={contactForm.instagram_url} onChange={(e) => setContactForm({ ...contactForm, instagram_url: e.target.value })} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://instagram.com/yourhandle" />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => void handleContactSave(contactForm, () => setShowContactEdit(false))}
                disabled={savingContact}
                className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                {savingContact ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Saving...</span></>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
              <button
                onClick={() => setShowContactEdit(false)}
                disabled={savingContact}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
