import { useCallback, useState } from 'react'
import { getMyHomeInfo, updateHomeInfo } from '../data/homeInfo'
import type { AboutInfo } from '../lib/supabase'
import type { AboutForm } from '../routes/dashboard/-types'

export function useAboutInfo() {
  const [aboutInfo, setAboutInfo] = useState<AboutInfo | null>(null)
  const [savingAbout, setSavingAbout] = useState(false)

  const fetchAboutInfo = useCallback(async () => {
    try {
      const data = await getMyHomeInfo()
      setAboutInfo(data)
    } catch (error) {
      console.error('Error fetching home info:', error)
    }
  }, [])

  const handleAboutSave = useCallback(async (aboutForm: AboutForm, onSuccess?: () => void) => {
    if (!aboutInfo) return

    setSavingAbout(true)
    try {
      await updateHomeInfo(aboutInfo.id, {
        site_name: aboutForm.site_name || null,
        hero_title: aboutForm.hero_title || null,
        hero_subtitle: aboutForm.hero_subtitle || null,
        featured_title: aboutForm.featured_title || null,
        featured_subtitle: aboutForm.featured_subtitle || null,
        about_title: aboutForm.about_title || null,
        about_bio: aboutForm.about_bio || null,
      })
      await fetchAboutInfo()
      onSuccess?.()
      alert('Home page info updated successfully!')
    } catch (error) {
      console.error('Error updating home info:', error)
      alert('Failed to update home page info. Please try again.')
    } finally {
      setSavingAbout(false)
    }
  }, [aboutInfo, fetchAboutInfo])

  return {
    aboutInfo,
    savingAbout,
    fetchAboutInfo,
    handleAboutSave,
  }
}
