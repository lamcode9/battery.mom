import { Suspense } from 'react'
import Hero from '@/components/Hero'
import CountrySelector from '@/components/CountrySelector'
import SearchBox from '@/components/SearchBox'
import VehicleSection from '@/components/VehicleSection'
import ComparisonTable from '@/components/ComparisonTable'
import { VehicleProvider } from '@/store/VehicleStore'

export default function Home() {
  return (
    <VehicleProvider>
      <main className="min-h-screen">
        <Hero />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <CountrySelector />
          </div>
          
          <div className="mb-8">
            <Suspense fallback={<div className="h-16 bg-gray-200 animate-pulse rounded-lg" />}>
              <SearchBox />
            </Suspense>
          </div>

          <Suspense fallback={<div className="h-64 bg-gray-200 animate-pulse rounded-lg mt-8" />}>
            <ComparisonTable />
          </Suspense>

          <VehicleSection />
        </div>
      </main>
    </VehicleProvider>
  )
}

