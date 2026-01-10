import { createFileRoute } from '@tanstack/react-router'
import { Camera, Award, MapPin, Calendar, User } from 'lucide-react'

export const Route = createFileRoute('/about')({ component: AboutPage })

function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* All content commented out */}
      </div>
    </div>
  )
}