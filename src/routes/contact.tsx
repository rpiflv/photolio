import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Loader2 } from 'lucide-react'
import { FaInstagram } from 'react-icons/fa'
import { getContactInfo } from '../data/contactInfo'
import type { ContactInfo } from '../lib/supabase'

export const Route = createFileRoute('/contact')({ component: ContactPage })

function ContactPage() {
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const data = await getContactInfo()
        setContact(data)
      } catch (error) {
        console.error('Error fetching contact info:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchContact()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {contact?.heading || 'Get In Touch'}
          </h1>
          <p className="text-xl text-gray-600">
            {contact?.subheading || 'Ready to capture your special moments?'}
          </p>
        </div>

        <div className="flex justify-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Contact Info</h2>
            <div className="space-y-4">
              {contact?.email && (
                <div className="flex items-center space-x-4">
                  <Mail className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <div className="text-gray-600">{contact.email}</div>
                  </div>
                </div>
              )}
              {contact?.phone && (
                <div className="flex items-center space-x-4">
                  <Phone className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Phone</div>
                    <div className="text-gray-600">{contact.phone}</div>
                  </div>
                </div>
              )}
              {contact?.location && (
                <div className="flex items-center space-x-4">
                  <MapPin className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Location</div>
                    <div className="text-gray-600">{contact.location}</div>
                  </div>
                </div>
              )}
              {contact?.twitter_handle && (
                <div className="flex items-center space-x-4">
                  <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">X (Twitter)</div>
                    <a href={contact.twitter_url || '#'} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                      {contact.twitter_handle}
                    </a>
                  </div>
                </div>
              )}
              {contact?.instagram_handle && (
                <div className="flex items-center space-x-4">
                  <FaInstagram className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Instagram</div>
                    <a href={contact.instagram_url || '#'} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
                      {contact.instagram_handle}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}