'use client'
import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'

export default function GATracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page views with Google Analytics on route changes
    const trackPageView = () => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'G-8BELM31L2S', {
          page_path: location.pathname,
          page_location: window.location.href,
        })
        console.log('[GA] Page view tracked:', location.pathname)
      } else {
        console.warn('[GA] gtag not available yet')
      }
    }

    // Small delay to ensure gtag is loaded
    const timer = setTimeout(trackPageView, 100)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return null
}
