import type { Metadata } from 'next'
import Link from 'next/link'
import PageTitleCard from '@/components/PageTitleCard'
import SunriseThread from '@/components/SunriseThread'

export const metadata: Metadata = {
  title: 'Calculators, battery.mom',
  description:
    'Calculators for a zero electricity bill, shared residential BESS payback, EV versus petrol cost, and solar payback.',
}

const CALCULATORS = [
  {
    title: 'Zero-bill home calculator',
    description:
      'Size a solar + battery system for your home. Find out if you can zero your electricity bill using real tariffs, real BESS products, and your actual household load.',
    href: '/bess/home',
    status: 'live' as const,
    category: 'Battery storage',
  },
  {
    title: 'Shared residential BESS',
    description:
      'Model a community solar + battery system for condos and apartments. See per-unit savings, developer ROI, payback periods, and bulk discount impacts.',
    href: '/bess/shared-residential',
    status: 'live' as const,
    category: 'Battery storage',
  },
  {
    title: 'EV vs ICE, total cost of ownership',
    description:
      'Compare the 5-year and 10-year cost of an electric vehicle and a petrol equivalent. Fuel, maintenance, depreciation, and incentives are included.',
    href: '/calculators/ev-vs-ice',
    status: 'live' as const,
    category: 'Electric vehicles',
  },
  {
    title: 'Solar payback calculator',
    description:
      'Enter your roof size, local solar yield, and electricity tariff to get an accurate payback period and 25-year savings projection.',
    href: '/calculators/solar-payback',
    status: 'live' as const,
    category: 'Solar',
  },
  {
    title: 'EV charging cost calculator',
    description:
      'Estimate your monthly and annual charging costs based on your EV\'s battery, local electricity rates, and daily driving distance.',
    href: '/calculators/ev-charging-cost',
    status: 'live' as const,
    category: 'Electric vehicles',
  },
]

export default function CalculatorsPage() {
  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <PageTitleCard
            eyebrow="Calculators · your number"
            title="Calculators"
            sub="No-login tools for EVs, solar, and battery storage, using tariffs and prices from your country."
          />
          <SunriseThread className="mt-5" />
        </div>

        {/* All Calculators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CALCULATORS.map((calc) => (
            <Link
              key={calc.href}
              href={calc.href}
              className="group bg-paper-100 border border-ink/10 rounded-card p-6 hover:border-brand-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-2.5 py-0.5">
                  {calc.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2 group-hover:text-brand-700 transition-colors">
                {calc.title}
              </h3>
              <p className="text-sm text-ink-600 leading-relaxed">{calc.description}</p>
              <div className="mt-4 flex items-center text-brand-600 text-sm font-medium">
                Open calculator
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
