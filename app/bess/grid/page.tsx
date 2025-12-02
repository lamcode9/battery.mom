import CountrySelector from '@/components/CountrySelector'
import { VehicleProvider } from '@/store/VehicleStore'

export default function BESSGridPage() {
  return (
    <VehicleProvider>
      <main className="min-h-screen pt-12 md:pt-14">
        <section className="container mx-auto px-4 pt-12 pb-8 max-w-7xl">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-left">
            Grid / Industrial BESS
          </h2>
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <CountrySelector />
              </div>
            </div>
          </div>

          <div className="text-center py-16">
            <p className="text-lg text-gray-600">Coming Soon</p>
          </div>
        </section>
      </main>
    </VehicleProvider>
  )
}

