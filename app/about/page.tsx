import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About - EVCompare SEA',
  description: 'Learn about EVCompare SEA, our data sources, update frequency, and disclaimers.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-ev-primary">About EVCompare SEA</h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">What is EVCompare SEA?</h2>
          <p className="text-lg text-gray-700 mb-4">
            EVCompare SEA is a comprehensive comparison tool for electric vehicles (EVs) available in 
            Singapore and Malaysia. Our goal is to help both casual browsers and serious buyers understand 
            key EV fundamentals like battery packs, efficiency, and overall value when comparing models.
          </p>
          <p className="text-lg text-gray-700">
            We believe in making EV information accessible to everyone, using simple language and clear 
            visualizations to help you make informed decisions.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Data Sources</h2>
          <p className="text-lg text-gray-700 mb-4">
            Our vehicle data is sourced from multiple reliable sources:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Official manufacturer websites and specifications</li>
            <li>Singapore: sgcarmart.com, onemotoring.sg (government rebates)</li>
            <li>Malaysia: carlist.my, paultan.org (VEP, road tax information)</li>
            <li>Global EV databases: ev-database.org</li>
            <li>Industry teardown data (e.g., Munro & Associates) for manufacturer cost estimates</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Update Frequency</h2>
          <p className="text-lg text-gray-700 mb-4">
            Our database is automatically updated daily via automated processes that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Fetch latest listings and specifications from our data sources</li>
            <li>Compare against existing records to identify new models</li>
            <li>Update prices, specifications, and availability status</li>
            <li>Mark discontinued models as unavailable</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Important Disclaimers</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-gray-700 font-semibold mb-2">⚠️ Price Information</p>
            <p className="text-gray-700">
              All prices shown are estimates based on publicly available information as of the last update. 
              Prices may vary by dealer, location, and time. Always consult official dealers for the most 
              current pricing and availability.
            </p>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-gray-700 font-semibold mb-2">ℹ️ Specifications</p>
            <p className="text-gray-700">
              Technical specifications are based on manufacturer data and may vary by trim level, region, 
              and model year. Range estimates are based on WLTP/EPA standards and actual range may vary 
              based on driving conditions, weather, and usage patterns.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Contact & Feedback</h2>
          <p className="text-lg text-gray-700 mb-4">
            Have questions, suggestions, or found an error? We&apos;d love to hear from you!
          </p>
          <p className="text-gray-700">
            Please note: This is an independent comparison tool. We are not affiliated with any 
            manufacturer or dealer.
          </p>
        </section>

        <div className="mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-ev-primary text-white rounded-lg hover:bg-ev-primary/90 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}

