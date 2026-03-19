import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Loader2, Send } from 'lucide-react'
import { FaInstagram } from 'react-icons/fa'
import { getContactInfo } from '../data/contactInfo'
import type { ContactInfo } from '../lib/supabase'

export const Route = createFileRoute('/contact')({ component: ContactPage })

function ContactPage() {
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.statusMessage || 'Failed to send message')
      }
      setSent(true)
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

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

        {/* Contact Form */}
        <div className="mt-16 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Send a Message</h2>

          {sent ? (
            <div className="text-center py-8">
              <p className="text-lg text-neutral-700">Thank you! Your message has been sent.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-neutral-500 underline hover:text-neutral-700"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  maxLength={200}
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 bg-white"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 bg-white"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  id="message"
                  required
                  maxLength={5000}
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 bg-white resize-none"
                  placeholder="Your message..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 text-neutral-100 rounded-lg text-sm tracking-wide hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}