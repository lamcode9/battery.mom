import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EVCompare SEA - Compare Electric Vehicles in Singapore & Malaysia',
  description: 'Compare electric vehicles (EVs) available in Singapore and Malaysia. Compare battery specs, efficiency, range, pricing, and more.',
  keywords: ['electric vehicles', 'EV comparison', 'Singapore', 'Malaysia', 'Tesla', 'BYD', 'EV specs'],
  openGraph: {
    title: 'EVCompare SEA - Compare Electric Vehicles',
    description: 'Compare electric vehicles available in Singapore and Malaysia',
    type: 'website',
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

