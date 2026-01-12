import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID

export default function GATracker() {
  const location = useLocation()

  useEffect(() => {
    // Initialize gtag on first load
    if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
      window.dataLayer = window.dataLayer || []
      window.gtag = function() {
        window.dataLayer.push(arguments)
      }
      window.gtag('js', new Date())
      window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false,
      })
    }
  }, [])

  useEffect(() => {
    // Track page views with Google Analytics on route changes
    const trackPageView = () => {
      if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
        window.gtag('config', GA_MEASUREMENT_ID, {
          page_path: location.pathname,
          page_location: window.location.href,
        })
      }
    }

    // Small delay to ensure gtag is loaded
    const timer = setTimeout(trackPageView, 200)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return null
}
