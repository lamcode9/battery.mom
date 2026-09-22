import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'API documentation, battery.mom',
  description: 'Access battery.mom data programmatically. REST API for EV and BESS data across Southeast Asia.',
  alternates: { canonical: '/api-docs' },
  openGraph: {
    title: 'API documentation, battery.mom',
    description: 'Programmatic access to EV and BESS data across Southeast Asia.',
    type: 'website',
  },
}

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-4xl">
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-ink-500 mb-4">
            <Link href="/" className="hover:text-ink-700">Home</Link>
            <span>/</span>
            <span className="text-ink">API documentation</span>
          </nav>

          <h1 className="font-display text-4xl md:text-5xl font-medium text-ink tracking-tight mb-4">
            API Documentation
          </h1>
          <p className="text-lg text-ink-600 mb-6">
            Access battery.mom data programmatically. Build your own EV comparison tools,
            integrate with your applications, or analyze Southeast Asian EV market data.
          </p>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="text-brand-600 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-brand-900 mb-1">Rate limits</h3>
                <p className="text-brand-800 text-sm">
                  100 requests per hour per IP address. Contact us for higher limits.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Base URL */}
        <div className="bg-paper-200 border border-ink/10 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-ink mb-2">Base URL</h3>
          <code className="text-sm bg-paper-100 px-2 py-1 rounded border">
            https://battery.mom/api
          </code>
        </div>

        {/* Endpoints */}
        <div className="space-y-8">
          {/* Get Vehicles */}
          <div className="bg-paper-100 border border-ink/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">GET</span>
              <h3 className="text-lg font-semibold text-ink">/vehicles</h3>
            </div>
            <p className="text-ink-600 mb-4">
              Retrieve electric vehicle data. Filter by country, availability, and search terms.
            </p>

            <h4 className="font-medium text-ink mb-2">Query parameters</h4>
            <div className="bg-paper-200 rounded p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className="text-left py-2 font-medium">Parameter</th>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2"><code>country</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">Filter by country (SG, MY, ID, TH, VN, PH)</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>available</code></td>
                    <td className="py-2 text-ink-600">boolean</td>
                    <td className="py-2 text-ink-600">Show only available vehicles (default: true)</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>search</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">Search in vehicle names</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>limit</code></td>
                    <td className="py-2 text-ink-600">number</td>
                    <td className="py-2 text-ink-600">Maximum results (default: 50, max: 1000)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="font-medium text-ink mb-2">Example request</h4>
            <div className="bg-ink text-paper-200 rounded p-4 mb-4 font-mono text-sm">
              {`curl "https://battery.mom/api/vehicles?country=SG&available=true&limit=10"`}
            </div>

            <h4 className="font-medium text-ink mb-2">Example response</h4>
            <div className="bg-ink text-paper-200 rounded p-4 font-mono text-sm overflow-x-auto">
{`[
  {
    "id": "uuid",
    "country": "SG",
    "name": "Tesla Model 3",
    "modelTrim": "Long Range",
    "batteryCapacityKwh": 75,
    "rangeWltpKm": 580,
    "efficiencyKwhPer100km": 13.0,
    "basePriceLocalCurrency": 85000,
    "batteryTechnology": "NMC",
    "isAvailable": true,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]`}
            </div>
          </div>

          {/* Get Single Vehicle */}
          <div className="bg-paper-100 border border-ink/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">GET</span>
              <h3 className="text-lg font-semibold text-ink">/vehicles/[id]</h3>
            </div>
            <p className="text-ink-600 mb-4">
              Get detailed information for a specific vehicle by ID.
            </p>

            <h4 className="font-medium text-ink mb-2">Example request</h4>
            <div className="bg-ink text-paper-200 rounded p-4 mb-4 font-mono text-sm">
              {`curl "https://battery.mom/api/vehicles/550e8400-e29b-41d4-a716-446655440000"`}
            </div>
          </div>

          {/* Suggest a correction */}
          <div className="bg-paper-100 border border-ink/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">POST</span>
              <h3 className="text-lg font-semibold text-ink">/suggest-correction</h3>
            </div>
            <p className="text-ink-600 mb-4">
              Submit a correction for vehicle or BESS data. All submissions are reviewed before being applied.
            </p>

            <h4 className="font-medium text-ink mb-2">Request body</h4>
            <div className="bg-paper-200 rounded p-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className="text-left py-2 font-medium">Field</th>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Required</th>
                    <th className="text-left py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2"><code>type</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">Yes</td>
                    <td className="py-2 text-ink-600">{`"ev" or "bess"`}</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>country</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">Yes</td>
                    <td className="py-2 text-ink-600">Country code (SG, MY, ID, TH, VN, PH)</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>vehicleName</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">Yes</td>
                    <td className="py-2 text-ink-600">Vehicle or product name</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>field</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">Yes</td>
                    <td className="py-2 text-ink-600">Field being corrected</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>currentValue</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">Yes</td>
                    <td className="py-2 text-ink-600">Current value in database</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>suggestedValue</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">Yes</td>
                    <td className="py-2 text-ink-600">Suggested correction</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>source</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">No</td>
                    <td className="py-2 text-ink-600">Source URL</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>email</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">No</td>
                    <td className="py-2 text-ink-600">Contact email</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>notes</code></td>
                    <td className="py-2 text-ink-600">string</td>
                    <td className="py-2 text-ink-600">No</td>
                    <td className="py-2 text-ink-600">Additional notes</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="font-medium text-ink mb-2">Example request</h4>
            <div className="bg-ink text-paper-200 rounded p-4 font-mono text-sm overflow-x-auto">
{`curl -X POST "https://battery.mom/api/suggest-correction" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "ev",
    "country": "SG",
    "vehicleName": "Tesla Model 3 Long Range",
    "field": "Battery capacity",
    "currentValue": "75",
    "suggestedValue": "82",
    "source": "https://tesla.com/model3/specs",
    "email": "user@example.com"
  }'`}
            </div>
          </div>
        </div>

        {/* Data License */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Data license and attribution</h3>
          <p className="text-blue-800 mb-4">
            Our data is compiled from publicly available sources and manufacturer specifications.
            When using battery.mom data in your applications, please attribute us appropriately.
          </p>
          <div className="bg-paper-100 rounded p-4 border border-blue-200">
            <p className="text-sm text-ink-600 mb-2">Suggested attribution:</p>
            <code className="text-sm">
              Data provided by <a href="https://battery.mom" className="text-blue-600 hover:underline">battery.mom</a>
            </code>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center">
          <p className="text-ink-600 mb-4">
            Need help with the API or have questions about the data?
          </p>
          <Link
            href="/suggest-correction"
            className="inline-flex items-center px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  )
}