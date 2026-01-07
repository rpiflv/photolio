import { createFileRoute } from '@tanstack/react-router'
import { Camera, Award, MapPin, Calendar, User } from 'lucide-react'

export const Route = createFileRoute('/about')({ component: AboutPage })

function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-32 h-32 rounded-full mx-auto mb-8 shadow-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <User className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Me</h1>
          <p className="text-xl text-gray-600">
            Passionate photographer capturing life's beautiful moments
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Story</h2>
          <div className="prose prose-lg text-gray-700 max-w-none">
            <p className="mb-4">
              Photography has been my passion for over a decade. What started as a hobby during college 
              has evolved into a deep love for capturing the world through my lens. I believe that every 
              photograph tells a story, freezes a moment in time, and preserves memories that last forever.
            </p>
            <p className="mb-4">
              My work spans across various genres including portrait photography, landscape captures, 
              street photography, and architectural studies. I'm constantly inspired by the interplay 
              of light and shadow, the emotions of people, and the raw beauty of nature.
            </p>
            <p>
              When I'm not behind the camera, you can find me exploring new locations, studying the 
              work of master photographers, or planning my next photography adventure. I believe that 
              continuous learning and experimentation are key to growth as an artist.
            </p>
          </div>
        </div>

        {/* Stats/Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Camera className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">10+</div>
            <div className="text-gray-600">Years Experience</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Award className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">50+</div>
            <div className="text-gray-600">Awards Won</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">25+</div>
            <div className="text-gray-600">Countries Visited</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">500+</div>
            <div className="text-gray-600">Photo Shoots</div>
          </div>
        </div>

        {/* Philosophy Section */}
        <div className="bg-gray-900 text-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">My Philosophy</h2>
          <blockquote className="text-lg italic mb-4">
            "Photography is the art of making memories tangible. It's about finding beauty in the 
            ordinary and capturing the extraordinary moments that make life meaningful."
          </blockquote>
          <p className="text-gray-300">
            I approach every shoot with curiosity, respect, and a commitment to authenticity. 
            Whether it's a wedding, a corporate event, or a personal portrait session, my goal 
            is to create images that resonate with emotion and tell your unique story.
          </p>
        </div>

        {/* Equipment Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Equipment & Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Camera Equipment</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Canon EOS R5 & Sony A7R IV</li>
                <li>• Various prime and zoom lenses (24-70mm, 85mm, 50mm)</li>
                <li>• Professional lighting equipment</li>
                <li>• Gimbal stabilizers and drones</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Portrait Photography</li>
                <li>• Landscape & Nature</li>
                <li>• Street Photography</li>
                <li>• Architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}