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
          <div className="mb-8 max-w-4xl mx-auto">
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

