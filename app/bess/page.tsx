import type { Metadata } from 'next'
import Link from 'next/link'
import PageTitleCard from '@/components/PageTitleCard'
import SunriseThread from '@/components/SunriseThread'

export const metadata: Metadata = {
  title: 'Battery storage (BESS), battery.mom',
  description:
    'Explore battery energy storage systems for homes, shared residential, commercial, and grid-scale applications across Southeast Asia.',
}

const BESS_SECTIONS = [
  {
    title: 'Single home',
    description:
      'Size a solar + battery system for your home. Calculate if you can zero your electricity bill with real local tariffs and real products.',
    href: '/bess/home',
    status: 'live' as const,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    title: 'Shared Residential',
    description:
      'Model a shared solar and battery system for condos and apartments. Per-unit savings, payback, and developer ROI.',
    href: '/bess/shared-residential',
    status: 'live' as const,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    title: 'Commercial BESS',
    description:
      'Peak shaving, demand charge reduction, and revenue stacking calculators for offices, retail, and industrial facilities.',
    href: '/bess/commercial',
    status: 'live' as const,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
      </svg>
    ),
  },
  {
    title: 'Grid and industrial',
    description:
      'Utility-scale BESS data, LCOE/LCOS calculators, deployment maps, and policy trackers across Southeast Asia.',
    href: '/bess/grid',
    status: 'live' as const,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
]

export default function BESSPage() {
  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        <div className="max-w-2xl mb-12">
          <PageTitleCard
            eyebrow="Battery storage · from rooftop to grid"
            title="Battery energy storage"
            sub="Calculators and data for battery storage, from one rooftop to a national grid."
          />
          <SunriseThread className="mt-5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BESS_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group relative bg-paper-100 border border-ink/10 rounded-card p-6 shadow-card hover:border-brand-300 hover:shadow-raised transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-5 group-hover:bg-brand-100 transition-colors">
                {section.icon}
              </div>
              <h2 className="font-display text-xl font-medium text-ink mb-2">{section.title}</h2>
              <p className="text-sm text-ink-500 leading-relaxed">{section.description}</p>
              <div className="mt-4 flex items-center text-brand-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {section.status === 'live' ? 'Open tool' : 'Learn more'}
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
