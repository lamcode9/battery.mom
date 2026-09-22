import { Metadata } from 'next'
import EmbedPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Embed widgets, battery.mom',
  description: 'Add battery.mom widgets to your website. Free embeddable scoreboard, EV stats, and calculator widgets for blogs, news sites, and energy portals.',
  openGraph: {
    title: 'Embed widgets, battery.mom',
    description: 'Add battery.mom widgets to your website. Free embeddable scoreboard, EV stats, and calculator widgets.',
  },
}

export default function EmbedPage() {
  return <EmbedPageClient />
}
