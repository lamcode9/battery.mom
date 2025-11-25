import { Suspense } from 'react'
import Hero from '@/components/Hero'
import CountrySelector from '@/components/CountrySelector'
import SearchBox from '@/components/SearchBox'
import VehicleSection from '@/components/VehicleSection'
import ComparisonTable from '@/components/ComparisonTable'
import StructuredData from '@/components/StructuredData'
import { VehicleProvider } from '@/store/VehicleStore'
import { SearchBoxSkeleton, ComparisonTableSkeleton } from '@/components/LoadingSkeleton'

export default function Home() {
  return (
    <VehicleProvider>
      <StructuredData />
      <main className="min-h-screen">
        <Hero />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <CountrySelector />
          </div>
          
          <div className="mb-8">
            <Suspense fallback={<SearchBoxSkeleton />}>
              <SearchBox />
            </Suspense>
          </div>

          <Suspense fallback={<ComparisonTableSkeleton />}>
            <ComparisonTable />
          </Suspense>

          <VehicleSection />
        </div>
      </main>
    </VehicleProvider>
  )
}

