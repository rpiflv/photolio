import { useState, useEffect } from 'react'
import { Heart, Star, X, Info } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const GALLERY_INFO_KEY = 'gallery-info-dismissed'

export default function GalleryInfoPopup() {
  const [showPopup, setShowPopup] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Check if user has already dismissed this popup
    const dismissed = localStorage.getItem(GALLERY_INFO_KEY)
    if (!dismissed) {
      // Show popup after a short delay
      setTimeout(() => setShowPopup(true), 800)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(GALLERY_INFO_KEY, 'true')
    setShowPopup(false)
  }

  if (!showPopup) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={handleDismiss}
      />
      
      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Welcome to the Gallery!
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p className="text-gray-600 text-sm leading-relaxed">
              Discover how you can interact with the photos and share your preferences:
            </p>

            {/* Like Option */}
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <Heart className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Like Photos</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Click the heart icon on any photo to like it. Your likes are stored locally in your browser 
                  and help me understand which photos resonate with visitors.
                </p>
              </div>
            </div>

            {/* Sign In Option */}
            {!user && (
              <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                <Star className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Save Favorites</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    <a href="/login" className="font-medium text-gray-900 underline hover:text-gray-700">
                      Sign in
                    </a>
                    {' '}to save your favorite photos and access them anytime from the Favorites section.
                  </p>
                </div>
              </div>
            )}

            {user && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <Star className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">You're Signed In!</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Your favorite photos are saved and accessible from the 
                    <a href="/favorites" className="font-medium text-gray-900 underline hover:text-gray-700 ml-1">
                      Favorites
                    </a>
                    {' '}page.
                  </p>
                </div>
              </div>
            )}

            {/* Privacy Note */}
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-700">Privacy:</strong> Likes are anonymous and only stored in your browser. 
                They help me track popular photos without any personal tracking.
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="mt-6">
            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
