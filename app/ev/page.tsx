import { Suspense } from 'react'
import CountrySelector from '@/components/CountrySelector'
import SearchBox from '@/components/SearchBox'
import VehicleSection from '@/components/VehicleSection'
import ComparisonTable from '@/components/ComparisonTable'
import StructuredData from '@/components/StructuredData'
import { VehicleProvider } from '@/store/VehicleStore'
import { SearchBoxSkeleton, ComparisonTableSkeleton } from '@/components/LoadingSkeleton'

export default function EVPage() {
  return (
    <VehicleProvider>
      <StructuredData />
      <main className="min-h-screen pt-12 md:pt-14">
        <section className="container mx-auto px-4 pt-12 pb-8 max-w-7xl">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-left">
            Search and Compare Electric Vehicles
          </h2>
          
          {/* Hero Intro Section */}
          <div className="mb-8 max-w-7xl">
            <div className="border-l-4 border-emerald-600 pl-6 md:pl-8 py-6 bg-gray-50/50">
              <div className="space-y-5">
                <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                  EVs ranked as batteries first, cars second.
                </p>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-3xl">
                  Real range, real charging times, real solar fit.
                </p>
                <div className="pt-2 border-t border-gray-200/60">
                  <p className="text-base text-gray-600 leading-relaxed">
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

          <Suspense fallback={<ComparisonTableSkeleton />}>
            <ComparisonTable />
          </Suspense>

          <VehicleSection />
        </section>
      </main>
    </VehicleProvider>
  )
}

