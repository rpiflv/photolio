import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
  const siteName = import.meta.env.VITE_SITE_NAME || 'Photo Portfolio'
  const siteUrl = import.meta.env.VITE_SITE_URL || ''

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 9, 2026</p>

        <div className="space-y-6 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>{siteName} ({siteUrl}) is a photography portfolio website. This privacy policy explains how we collect, use, and protect your information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Contact form submissions:</strong> name, email address, and message content when you contact us.</li>
              <li><strong className="text-white">Analytics data:</strong> anonymous usage data via Google Analytics (page views, device type, browser).</li>
              <li><strong className="text-white">Cookies:</strong> essential cookies for site functionality and analytics cookies with your consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To respond to your inquiries via the contact form.</li>
              <li>To understand how visitors use our website and improve it.</li>
              <li>To share photos on connected social media platforms (Instagram) as part of our portfolio management.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong className="text-white">Google Analytics</strong> — for anonymous website usage statistics.</li>
              <li><strong className="text-white">Instagram / Meta</strong> — for publishing photos to our Instagram account.</li>
              <li><strong className="text-white">Supabase</strong> — for secure data storage.</li>
              <li><strong className="text-white">Amazon Web Services (S3/CloudFront)</strong> — for image hosting and delivery.</li>
              <li><strong className="text-white">Vercel</strong> — for website hosting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>Contact form submissions are retained only as long as necessary to respond to your inquiry. Analytics data is retained according to Google Analytics default settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p>You have the right to request access to, correction of, or deletion of your personal data. Contact us to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
            <p>For privacy-related questions, please use the <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">contact form</a> on our website.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
