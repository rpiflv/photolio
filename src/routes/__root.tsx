import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from "@vercel/analytics/react"
import { useEffect } from 'react'
import Header from '../components/Header'
import CookieConsent from '../components/CookieConsent'
import { AuthProvider } from '../contexts/AuthContext'
import GATracker from '../components/GATracker'
import { registerServiceWorker, initPWAInstall } from '../lib/pwa'

import appCss from '../styles.css?url'

// Create a client with optimized caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: `${import.meta.env.VITE_SITE_NAME || 'Photo Portfolio'} - Professional Photography Portfolio`,
      },
      {
        name: 'description',
        content: 'A stunning photography portfolio showcasing professional photography work across various categories including portraits, landscapes, and street photography.',
      },
      {
        property: 'og:title',
        content: `${import.meta.env.VITE_SITE_NAME || 'Photo Portfolio'} - Professional Photography Portfolio`,
      },
      {
        property: 'og:description',
        content: 'A stunning photography portfolio showcasing professional photography work across various categories including portraits, landscapes, and street photography.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: import.meta.env.VITE_SITE_URL || '',
      },
      {
        property: 'og:image',
        content: `${import.meta.env.VITE_SITE_URL || ''}/images/hero/hero-background.jpg`,
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        property: 'og:site_name',
        content: import.meta.env.VITE_SITE_NAME || 'Photo Portfolio',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: `${import.meta.env.VITE_SITE_NAME || 'Photo Portfolio'} - Professional Photography Portfolio`,
      },
      {
        name: 'twitter:description',
        content: 'A stunning photography portfolio showcasing professional photography work across various categories including portraits, landscapes, and street photography.',
      },
      {
        name: 'twitter:image',
        content: `${import.meta.env.VITE_SITE_URL || ''}/images/hero/hero-background.jpg`,
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/shutter.ico',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo512.png',
      },
    ],
    scripts: import.meta.env.VITE_GOOGLE_ANALYTICS_ID ? [
      {
        src: `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GOOGLE_ANALYTICS_ID}`,
        async: true,
      },
    ] : [],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // Initialize PWA only on client side
  useEffect(() => {
    registerServiceWorker()
    initPWAInstall()
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-gray-50">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Header />
            <main className="min-h-screen">
              <GATracker />
              {children}
            </main>
            <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
          </AuthProvider>
        </QueryClientProvider>
        <CookieConsent />
        {import.meta.env.PROD && <Analytics />}
        <Scripts />
      </body>
    </html>
  )
}
