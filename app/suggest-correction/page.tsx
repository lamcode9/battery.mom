import { Metadata } from 'next'
import SuggestCorrectionClient from './page-client'

export const metadata: Metadata = {
  title: 'Suggest a correction, battery.mom',
  description: 'Help improve our EV and BESS data accuracy. Submit corrections for vehicle specs, pricing, or battery information.',
  alternates: { canonical: '/suggest-correction' },
  openGraph: {
    title: 'Suggest a correction, battery.mom',
    description: 'Help improve our EV and BESS data accuracy by submitting corrections.',
    type: 'website',
  },
}

export default function SuggestCorrectionPage() {
  return (
    <main className="min-h-screen pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight mb-4">
            Suggest a Correction
          </h1>
          <p className="text-lg text-ink-600 max-w-2xl mx-auto">
            Help us maintain the most accurate EV and BESS data in Southeast Asia.
            Your corrections help thousands of buyers make informed decisions.
          </p>
        </div>

        <SuggestCorrectionClient />
      </section>
    </main>
  )
}