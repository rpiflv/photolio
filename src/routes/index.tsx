import { createFileRoute, Link } from '@tanstack/react-router'
import { Camera, Eye, Heart } from 'lucide-react'
import { getFeaturedPhotos, getPhotos } from '../data/photos'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [featuredPhotos, allPhotos] = await Promise.all([
      getFeaturedPhotos(),
      getPhotos()
    ])
    return { featuredPhotos, heroPhoto: allPhotos[0] || null }
  },
  component: HomePage
})

function HomePage() {
  const { featuredPhotos, heroPhoto } = Route.useLoaderData()

  return (
    <div className="min-h-screen"> {/* Removed bg-gray-50 */}
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          {heroPhoto ? (
            <img
              src={heroPhoto.src}
              alt={heroPhoto.alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700"></div>
          )}
          <div className="absolute inset-0 bg-opacity-40"></div>
        </div>
        
        <div className="relative text-center text-white px-4 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Capturing Moments
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Through the lenses of my camera, I tell stories that words cannot express.
          </p>
          <Link
            to="/gallery"
            className="inline-flex items-center px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            View Gallery
            <Eye className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Featured Photos */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Work</h2>
            <p className="text-xl text-gray-600">
              A selection of my favorite photographs
            </p>
          </div>

          {featuredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPhotos.map((photo) => (
                <Link
                  key={photo.id}
                  to="/gallery"
                  className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-lg font-semibold mb-2">{photo.title}</h3>
                      {photo.description && <p className="text-sm text-gray-200">{photo.description}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-xl">No photos available yet. Upload some photos to get started!</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/gallery"
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              View All Photos
              <Camera className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 bg-white/90 backdrop-blur-sm"> {/* Changed from bg-white to semi-transparent */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">About the Photographer</h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            I'm a passionate photographer who believes in the power of visual storytelling. 
            Every image tells a story, captures an emotion, and preserves a moment in time. 
            Through my lens, I aim to showcase the beauty in everyday moments and extraordinary scenes alike.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center px-6 py-3 border border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-900 hover:text-white transition-colors"
          >
            Learn More
            <Heart className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
