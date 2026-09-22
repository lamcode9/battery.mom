import type { Metadata, Viewport } from 'next'
import { Inter, Newsreader } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import SiteShell from '@/components/SiteShell'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
// Editorial display serif — exposed as the `--font-display` var so the
// `font-display` Tailwind token resolves site-wide (design system).
const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

// Hard-coded strings - reuse everywhere
const siteName = "battery.mom"
const tagline = "Clear data for the energy transition."
const description = "Monthly data on solar, battery storage, and electric vehicles. Costs, payback times, and adoption rates for Southeast Asia and the world."

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10b981',
}

export const metadata: Metadata = {
  title: `${siteName}. ${tagline}`,
  description: description,
  keywords: ['electric vehicles', 'EV comparison', 'battery storage', 'solar', 'Southeast Asia', 'Singapore', 'Malaysia', 'Tesla', 'BYD', 'EV specs', 'electric car', 'energy transition'],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://battery.mom'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${siteName}. ${tagline}`,
    description: description,
    type: 'website',
    locale: 'en_US',
    siteName: siteName,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${siteName}. ${tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName}. ${tagline}`,
    description: description,
    creator: '@batterymom',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="alternate" type="application/rss+xml" title="battery.mom, insights" href="/feed.xml" />
      </head>
      <body className={`${inter.className} ${newsreader.variable}`} suppressHydrationWarning>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}

