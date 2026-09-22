import type { Metadata } from 'next'
import { PAGE_META } from '@/content/sunrise/script'
import SunriseClient from './page-client'

const ogImage =
  '/api/og?type=bess' +
  `&title=${encodeURIComponent('The long sunrise')}` +
  `&subtitle=${encodeURIComponent('Half a million years of energy, and the century that changes it.')}` +
  `&stat1Value=${encodeURIComponent('$76 → $0.09')}` +
  `&stat1Label=${encodeURIComponent('per watt of solar, 1977 → 2025')}` +
  `&stat2Value=${encodeURIComponent('K 0.73')}` +
  `&stat2Label=${encodeURIComponent('where civilization stands')}`

export const metadata: Metadata = {
  title: PAGE_META.title,
  description: PAGE_META.description,
  alternates: { canonical: '/sunrise' },
  openGraph: {
    title: PAGE_META.title,
    description: PAGE_META.description,
    url: '/sunrise',
    type: 'article',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'The long sunrise' }],
  },
  twitter: { card: 'summary_large_image', title: PAGE_META.title, description: PAGE_META.description, images: [ogImage] },
}

export default function SunrisePage() {
  return <SunriseClient />
}
