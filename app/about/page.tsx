import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About - battery.mom',
  description: 'Independent EV comparison tool for Southeast Asia. Real numbers, no sponsorships, no bullshit.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <section className="max-w-3xl mx-auto">
          {/* Hero Title */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-gray-900 tracking-tight">
              battery.mom
            </h1>
          </div>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-xl md:text-2xl leading-relaxed text-gray-800 mb-8 font-medium">
              We're obsessed with one simple idea: <strong className="text-ev-primary font-bold">batteries are the new oil</strong>.
          </p>

            <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
              <p>
                In the next decade, lithium-ion (and the chemistries that come after it) will reshape transportation, homes, and entire electric grids. Electric vehicles are just the beginning. The real revolution happens when every home, business, and community can store its own energy — turning intermittent solar and wind into reliable, 24/7 power.
              </p>

              <p>
                That revolution is already happening faster than most people realise — but good, up-to-date information in one place is still surprisingly hard to find.
              </p>

              <p className="text-xl font-semibold text-gray-900">
                battery.mom exists to solve exactly that.
              </p>

              <p>
                We collect, verify, and publish the clearest possible numbers — real costs, real payback periods, real adoption rates, real policy changes — with a special focus on Southeast Asia and the rest of the planet.
              </p>

              <p>
                Our only job is to give homeowners, businesses, installers, and policymakers the data they actually need to make faster, better decisions.
              </p>

              <p className="text-lg font-semibold text-gray-900 border-l-4 border-ev-primary pl-4 py-2 bg-gray-50 rounded-r">
                No sponsorships. No affiliate links. No ads. Ever.
              </p>

              <p>
                Just clean, updated data every month so the transition can move as quickly as possible.
            </p>
          </div>

            {/* What you'll find section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                What you'll find here
              </h2>

              <ul className="space-y-4 text-gray-700 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-ev-primary font-bold mt-1">•</span>
                  <span>Live country-by-country adoption scoreboards and payback calculators</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-ev-primary font-bold mt-1">•</span>
                  <span>Side-by-side comparisons of batteries and EVs using local prices and incentives</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-ev-primary font-bold mt-1">•</span>
                  <span>Monthly-updated datasets and interactive maps</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-ev-primary font-bold mt-1">•</span>
                  <span>Straightforward breakdowns for consumers and businesses</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-ev-primary font-bold mt-1">•</span>
                  <span className="font-semibold text-gray-900">Zero hype. Just facts.</span>
                </li>
              </ul>
          </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-base">
                battery.mom is a <a href="https://lamonade.xyz" className="text-yellow-500 hover:text-yellow-600 font-semibold transition-colors underline decoration-2 underline-offset-2">Lamonade</a> project.
          </p>
              <p className="text-gray-600 text-base mt-2">
                Data starts now — full launch 2026.
          </p>
            </div>

            {/* Back Button */}
            <div className="mt-12">
          <Link 
            href="/" 
                className="inline-flex items-center px-6 py-3 bg-ev-primary text-white rounded-lg hover:bg-ev-primary/90 transition-colors font-medium"
          >
            ← Back to Home
          </Link>
        </div>
          </div>
        </section>
      </div>
    </main>
  )
}

