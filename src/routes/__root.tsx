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
        title: 'PhotoFolio - Professional Photography Portfolio',
      },
      {
        name: 'description',
        content: 'A stunning photography portfolio showcasing professional photography work across various categories including portraits, landscapes, and street photography.',
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
