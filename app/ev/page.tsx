import { Suspense } from 'react'
import { Metadata } from 'next'
import CountrySelector from '@/components/CountrySelector'
import SearchBox from '@/components/SearchBox'
import VehicleSection from '@/components/VehicleSection'
import ComparisonTable from '@/components/ComparisonTable'
import StructuredData from '@/components/StructuredData'
import QuickPickCards from '@/components/QuickPickCards'
import EVMethodologyFooter from '@/components/EVMethodologyFooter'
import { SearchBoxSkeleton, ComparisonTableSkeleton } from '@/components/LoadingSkeleton'
import { NextSteps } from '@/components/ui/NextSteps'

export const metadata: Metadata = {
  title: 'Compare electric vehicles, battery.mom',
  description:
    'Search and compare every electric vehicle available in Southeast Asia. Specs, range, efficiency, battery chemistry, local price, and side-by-side charts for Singapore, Malaysia, Indonesia, Thailand, Vietnam, and the Philippines.',
  alternates: { canonical: '/ev' },
  openGraph: {
    title: 'Compare electric vehicles, battery.mom',
    description:
      'Side-by-side EV comparison with local prices across Southeast Asia.',
    type: 'website',
  },
}

export default function EVPage() {
  return (
    <>
      <StructuredData />
      <main className="min-h-screen bg-paper pt-12 md:pt-14">
        <section className="container mx-auto px-4 pt-12 pb-8 max-w-7xl">
          <h2 className="text-2xl font-semibold text-ink mb-8 text-left">
            Search and compare electric vehicles
          </h2>

          {/* Hero Intro Section */}
          <div className="mb-8 max-w-7xl">
            <div className="border-l-4 border-brand pl-6 md:pl-8 py-6 bg-paper-200/60">
              <div className="space-y-5">
                <p className="font-display text-3xl md:text-4xl font-medium text-ink leading-tight tracking-tight">
                  EVs ranked as batteries first, cars second.
                </p>
                <p className="text-lg md:text-xl text-ink-600 leading-relaxed max-w-3xl">
                  Real range, real charging times, real solar fit.
                </p>
                <div className="pt-2 border-t border-ink/10">
                  <p className="text-base text-ink-500 leading-relaxed">
                    Select your country to see local pricing, incentives, and solar charging reality.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
            <CountrySelector />
          </div>
              <div className="flex-1 min-w-0">
                <Suspense fallback={<SearchBoxSkeleton />}>
              <SearchBox />
            </Suspense>
              </div>
            </div>
          </div>

          {/* Quick pick hero cards */}
          <QuickPickCards />

          <Suspense fallback={<ComparisonTableSkeleton />}>
            <ComparisonTable />
          </Suspense>

          <VehicleSection />

          {/* Methodology disclosure */}
          <EVMethodologyFooter />
        </section>

        <NextSteps
          route="/ev"
          heading="Found your shortlist? Run the numbers."
          eyebrow="Next step"
        />
      </main>
    </>
  )
}

