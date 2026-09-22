import type { Metadata } from 'next'
import Link from 'next/link'
import { NextSteps } from '@/components/ui/NextSteps'

export const metadata: Metadata = {
  title: 'About - battery.mom',
  description: 'Independent EV comparison tool for Southeast Asia. Real numbers and data.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
      <div className="max-w-4xl">
        {/* Hero Title */}
        <h1 className="font-display text-6xl md:text-7xl font-medium mb-10 text-ink tracking-tight">
          battery.mom
        </h1>

        {/* Intro */}
        <p className="text-xl md:text-2xl leading-relaxed text-ink-800 mb-10 font-medium">
          The line this site is built on: <strong className="text-ev-primary font-bold">batteries are the new oil</strong>.
        </p>

        {/* Body */}
        <div className="space-y-6 text-ink-700 leading-relaxed text-lg">
          <p>
            Lithium-ion batteries, and the chemistries after them, are changing cars, houses, and grids. An EV is one use. A home, a shop, or a town that stores solar and wind can use that power after dark.
          </p>

          <p>
            The hardware is already being installed. Current prices, tariffs, and adoption figures are still scattered.
          </p>

          <p className="text-xl font-semibold text-ink">
            battery.mom puts those figures in one place.
          </p>

          <p>
            We check costs, payback periods, adoption rates, and policy changes against primary sources, with the detail on Southeast Asia.
          </p>

          <p>
            Homeowners, businesses, installers, and policymakers can use the same numbers.
          </p>

          <p className="text-lg font-semibold text-ink border-l-4 border-ev-primary pl-4 py-2 bg-paper-200 rounded-r">
            No sponsorships. No affiliate links. No ads.
          </p>

          <p>
            The datasets are updated monthly.
          </p>
        </div>

        {/* What you'll find section */}
        <div className="mt-12 pt-8 border-t border-ink/10">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-6">
            What you&apos;ll find here
          </h2>

          <ul className="space-y-4 text-ink-700 text-lg list-none p-0 m-0">
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
              <span className="font-semibold text-ink">Zero hype. Just facts.</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-ink/10">
          <p className="text-ink-600 text-base">
            battery.mom is a <a href="https://lamonade.xyz" className="text-yellow-500 hover:text-yellow-600 font-semibold transition-colors underline decoration-2 underline-offset-2">Lamonade</a> project.
          </p>
          <p className="text-ink-600 text-base mt-2">
            Live and continuously updated as new data lands.
          </p>
        </div>

      </div>
      </section>

      <NextSteps route="/about" />
    </main>
  )
}

