import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'EVCompare SEA - Compare Electric Vehicles in Singapore & Malaysia',
    template: '%s | EVCompare SEA',
  },
  description: 'Compare electric vehicles (EVs) available in Singapore and Malaysia. Compare battery specs, efficiency, range, pricing, and more. Find the perfect EV for you.',
  keywords: ['electric vehicles', 'EV comparison', 'Singapore', 'Malaysia', 'Tesla', 'BYD', 'EV specs', 'electric car', 'EV Singapore', 'EV Malaysia'],
  authors: [{ name: 'EVCompare SEA' }],
  creator: 'EVCompare SEA',
  publisher: 'EVCompare SEA',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://evcompare-sea.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'EVCompare SEA - Compare Electric Vehicles',
    description: 'Compare electric vehicles available in Singapore and Malaysia. Battery, efficiency, range, and pricing comparison.',
    type: 'website',
    locale: 'en_US',
    siteName: 'EVCompare SEA',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EVCompare SEA - Compare Electric Vehicles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EVCompare SEA - Compare Electric Vehicles',
    description: 'Compare electric vehicles available in Singapore and Malaysia',
    creator: '@evcomparesea',
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
      <body className={inter.className}>
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

