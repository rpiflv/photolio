import { Link } from '@tanstack/react-router'
import { Aperture, Menu, X, User, LogOut, BarChart3 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAdmin } from '../hooks/useAdmin'
import { useQuery } from '@tanstack/react-query'
import { getHomeInfo } from '../data/homeInfo'
import { getCollectionsWithCovers, photoQueryKeys } from '../data/photos'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false)
  const collectionHoverTimeoutRef = useRef<number | null>(null)
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdmin()

  const clearCollectionHoverTimeout = () => {
    if (collectionHoverTimeoutRef.current) {
      window.clearTimeout(collectionHoverTimeoutRef.current)
      collectionHoverTimeoutRef.current = null
    }
  }

  const openCollectionsMenu = () => {
    clearCollectionHoverTimeout()
    setIsCollectionsOpen(true)
  }

  const closeCollectionsMenu = () => {
    clearCollectionHoverTimeout()
    collectionHoverTimeoutRef.current = window.setTimeout(() => {
      setIsCollectionsOpen(false)
    }, 120)
  }

  useEffect(() => {
    return () => clearCollectionHoverTimeout()
  }, [])

  const { data: homeInfo } = useQuery({
    queryKey: ['homeInfo'],
    queryFn: getHomeInfo,
    staleTime: 1000 * 60 * 10,
  })

  const { data: collections = [] } = useQuery({
    queryKey: photoQueryKeys.collectionsWithCovers(),
    queryFn: getCollectionsWithCovers,
    staleTime: 1000 * 60 * 5,
  })

  const siteName = homeInfo?.site_name || import.meta.env.VITE_SITE_NAME || 'Photo Portfolio'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Aperture className="h-8 w-8 text-gray-900" />
            <span className="text-xl font-bold text-gray-900">{siteName}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              activeProps={{ className: 'text-gray-900 bg-gray-100' }}
            >
              Home
            </Link>

            <div
              className="relative flex h-16 items-center"
              onMouseEnter={openCollectionsMenu}
              onMouseLeave={closeCollectionsMenu}
              onFocus={openCollectionsMenu}
              onBlur={closeCollectionsMenu}
            >
              <button
                type="button"
                onClick={() => {
                  setIsCollectionsOpen((prev) => !prev)
                  clearCollectionHoverTimeout()
                }}
                aria-expanded={isCollectionsOpen}
                aria-haspopup="menu"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out hover:bg-gray-50"
              >
                Collections
              </button>

              <div
                className={`absolute left-0 top-full w-56 origin-top bg-white/90 backdrop-blur-md transition-all duration-200 ease-out ${
                  isCollectionsOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-95 opacity-0'
                }`}
                onMouseEnter={openCollectionsMenu}
                onMouseLeave={closeCollectionsMenu}
              >
                <div className="flex flex-col py-1">
                  {collections.length > 0 ? (
                    collections.map((collection) => (
                      <Link
                        key={collection.id}
                        to="/collection/$collectionId"
                        params={{ collectionId: String(collection.id) }}
                        onClick={() => setIsCollectionsOpen(false)}
                        className="px-3 py-2.5 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
                      >
                        {collection.name}
                      </Link>
                    ))
                  ) : (
                    <span className="px-3 py-2.5 text-sm text-gray-500">No collections yet</span>
                  )}
                </div>
              </div>
            </div>

            {user && (
              <Link
                to="/favorites"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                activeProps={{ className: 'text-gray-900 bg-gray-100' }}
              >
                Favorites
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                activeProps={{ className: 'text-gray-900 bg-gray-100' }}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            )}
            <Link
              to="/contact"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              activeProps={{ className: 'text-gray-900 bg-gray-100' }}
            >
              Contact
            </Link>

            {/* Auth buttons */}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <User className="h-4 w-4" />
                <span>Sign in</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm pb-4">
            <div className="flex flex-col space-y-2 pt-3">
              <Link
                to="/"
                className="text-gray-700 hover:text-gray-900 px-3 py-2.5 rounded-lg text-base font-medium transition-colors duration-150 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsCollectionsOpen((prev) => !prev)
                    clearCollectionHoverTimeout()
                  }}
                  aria-expanded={isCollectionsOpen}
                  className="block w-full px-3 py-2.5 text-left text-base font-medium text-gray-700 transition-colors duration-150 hover:bg-white"
                >
                  Collections
                </button>

                {isCollectionsOpen && (
                  <div
                    className="border-t border-gray-200 bg-white"
                    onMouseEnter={openCollectionsMenu}
                    onMouseLeave={closeCollectionsMenu}
                  >
                    {collections.length > 0 ? (
                      collections.map((collection) => (
                        <Link
                          key={collection.id}
                          to="/collection/$collectionId"
                          params={{ collectionId: String(collection.id) }}
                          className="block border-b border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 transition-colors duration-150 last:border-b-0 hover:bg-gray-50 hover:text-gray-900"
                          onClick={() => {
                            setIsMenuOpen(false)
                            setIsCollectionsOpen(false)
                          }}
                        >
                          {collection.name}
                        </Link>
                      ))
                    ) : (
                      <span className="block border-b border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 last:border-b-0">No collections yet</span>
                    )}
                  </div>
                )}
              </div>

              {user && (
                <Link
                  to="/favorites"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2.5 rounded-lg text-base font-medium transition-colors duration-150 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Favorites
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2.5 rounded-lg text-base font-medium transition-colors duration-150 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/contact"
                className="text-gray-700 hover:text-gray-900 px-3 py-2.5 rounded-lg text-base font-medium transition-colors duration-150 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>

              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-600">{user.email}</div>
                  <button
                    onClick={() => {
                      signOut()
                      setIsMenuOpen(false)
                    }}
                    className="text-left text-gray-700 hover:text-gray-900 px-3 py-2.5 rounded-lg text-base font-medium transition-colors duration-150 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2.5 rounded-lg text-base font-medium transition-colors duration-150 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
