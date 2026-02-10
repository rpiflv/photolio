import { useState, useEffect } from 'react'
import { Cookie, X } from 'lucide-react'

const CONSENT_KEY = 'cookie-consent'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) {
      // Small delay before showing banner for better UX
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md shadow-2xl border-t border-gray-200 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Content */}
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-gray-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Cookie Notice
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies and local storage to remember your preferences (like favorite photos and liked images) 
                and to analyze site traffic with Google Analytics. By clicking "Accept", you consent to our use of cookies.
              </p>
              <a 
                href="/contact" 
                className="text-sm text-gray-900 underline hover:text-gray-700 inline-block mt-1"
              >
                Learn more
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to check if user has given consent for analytics
export function useCookieConsent() {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    setHasConsent(consent === 'accepted')
  }, [])

  return hasConsent
}
