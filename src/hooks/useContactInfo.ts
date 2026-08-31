import { useCallback, useState } from 'react'
import { getMyContactInfo, updateContactInfo } from '../data/contactInfo'
import type { ContactInfo } from '../lib/supabase'
import type { ContactForm } from '../routes/dashboard/-types'

export function useContactInfo() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [savingContact, setSavingContact] = useState(false)

  const fetchContactInfo = useCallback(async () => {
    try {
      const data = await getMyContactInfo()
      setContactInfo(data)
    } catch (error) {
      console.error('Error fetching contact info:', error)
    }
  }, [])

  const handleContactSave = useCallback(async (contactForm: ContactForm, onSuccess?: () => void) => {
    if (!contactInfo) return

    setSavingContact(true)
    try {
      await updateContactInfo(contactInfo.id, {
        email: contactForm.email || null,
        phone: contactForm.phone || null,
        location: contactForm.location || null,
        twitter_handle: contactForm.twitter_handle || null,
        twitter_url: contactForm.twitter_url || null,
        instagram_handle: contactForm.instagram_handle || null,
        instagram_url: contactForm.instagram_url || null,
        heading: contactForm.heading || null,
        subheading: contactForm.subheading || null,
      })
      await fetchContactInfo()
      onSuccess?.()
      alert('Contact info updated successfully!')
    } catch (error) {
      console.error('Error updating contact info:', error)
      alert('Failed to update contact info. Please try again.')
    } finally {
      setSavingContact(false)
    }
  }, [contactInfo, fetchContactInfo])

  return {
    contactInfo,
    savingContact,
    fetchContactInfo,
    handleContactSave,
  }
}
