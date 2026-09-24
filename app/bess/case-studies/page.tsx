import type { Metadata } from 'next'
import Link from 'next/link'
import { NextSteps } from '@/components/ui/NextSteps'

export const metadata: Metadata = {
  title: 'BESS case studies, battery.mom',
  description:
    'Battery installations from homes and businesses across Southeast Asia, with costs, savings, and what the owners learned.',
  alternates: { canonical: '/bess/case-studies' },
}

interface CaseStudy {
  id: string
  title: string
  location: string
  country: string
  type: 'residential' | 'commercial' | 'industrial'
  system: string
  capacity: string
  solarSize: string
  monthlySavings: string
  paybackYears: number
  installedDate: string
  summary: string
  highlights: string[]
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'klang-valley-powerwall',
    title: 'Zeroing the bill in Klang Valley',
    location: 'Klang Valley',
    country: 'MY',
    type: 'residential',
    system: 'Tesla Powerwall 3',
    capacity: '13.5 kWh',
    solarSize: '8 kWp',
    monthlySavings: 'RM 420/month',
    paybackYears: 7,
    installedDate: '2024-06',
    summary:
      'A family of four in Shah Alam paired an 8 kWp rooftop solar system with a Tesla Powerwall 3 to virtually eliminate their electricity bill. Before installation, their average monthly bill was RM 480. After 6 months, their average bill dropped to RM 60.',
    highlights: [
      'Monthly bill reduced from RM 480 to RM 60',
      'Self-consumption rate increased from 40% to 85%',
      'Battery covers overnight AC usage (2 split units)',
      'Exported only 3 kWh/day to grid under NEM 3.0',
    ],
  },
  {
    id: 'singapore-landed-byd',
    title: 'Landed property backup + savings in Singapore',
    location: 'Bukit Timah',
    country: 'SG',
    type: 'residential',
    system: 'BYD BatteryBox Premium HVS',
    capacity: '10.2 kWh',
    solarSize: '6 kWp',
    monthlySavings: 'S$180/month',
    paybackYears: 8,
    installedDate: '2024-03',
    summary:
      'A landed property in Bukit Timah installed a BYD BatteryBox Premium alongside a 6 kWp solar system. The primary motivation was backup power during grid outages, with cost savings as a secondary benefit.',
    highlights: [
      'Monthly bill reduced from S$320 to S$140',
      'Provides 6-8 hours of backup during outages',
      'LFP chemistry well-suited for Singapore heat',
      'Estimated 10-year warranty with 80% capacity retention',
    ],
  },
  {
    id: 'bkk-office-peak-shaving',
    title: 'Peak shaving for a Bangkok co-working space',
    location: 'Sukhumvit',
    country: 'TH',
    type: 'commercial',
    system: 'Huawei LUNA 2000',
    capacity: '30 kWh (3 × 10 kWh)',
    solarSize: '20 kWp',
    monthlySavings: '฿15,000/month',
    paybackYears: 5,
    installedDate: '2024-09',
    summary:
      'A co-working space in Sukhumvit installed three Huawei LUNA 2000 units to shave afternoon demand peaks. Combined with rooftop solar, demand charges dropped by 40%. The system also provides seamless backup for critical IT equipment.',
    highlights: [
      'Demand charges reduced by 40%',
      'System ROI in under 5 years',
      '3-phase setup covers all office circuits',
      'Remote monitoring via Huawei FusionSolar app',
    ],
  },
  {
    id: 'cebu-resort-off-grid',
    title: 'Off-grid solar + storage for a Cebu beach resort',
    location: 'Cebu',
    country: 'PH',
    type: 'commercial',
    system: 'Pylontech US5000 × 4',
    capacity: '19.2 kWh',
    solarSize: '15 kWp',
    monthlySavings: '₱25,000/month',
    paybackYears: 4,
    installedDate: '2023-11',
    summary:
      'A small beach resort on Cebu Island moved to a hybrid solar + battery system to reduce reliance on expensive diesel generators. The Pylontech stack provides reliable evening power for guest rooms and common areas.',
    highlights: [
      'Diesel generator runtime reduced by 70%',
      'Fuel cost savings of ₱25,000/month',
      'Silent operation improved guest experience',
      'Stack expandable to 38.4 kWh',
    ],
  },
  {
    id: 'jkt-factory-demand-management',
    title: 'Industrial demand management in Jakarta',
    location: 'Cikarang Industrial Estate',
    country: 'ID',
    type: 'industrial',
    system: 'BYD Battery-Box Commercial',
    capacity: '100 kWh',
    solarSize: '60 kWp',
    monthlySavings: 'Rp 18,000,000/month',
    paybackYears: 6,
    installedDate: '2024-01',
    summary:
      'A garment factory in Cikarang deployed a 100 kWh BYD commercial BESS to flatten demand peaks and reduce their peak demand tariff. Combined with rooftop solar, the factory reduced their overall electricity cost by 25%.',
    highlights: [
      'Peak demand reduced by 35%',
      'Overall electricity cost down 25%',
      'Battery provides 2-hour backup for critical machinery',
      'PLN demand tariff savings compound annually',
    ],
  },
]

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  residential: { label: 'Residential', color: 'bg-brand-50 text-brand-700 border-brand-200' },
  commercial: { label: 'Commercial', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  industrial: { label: 'Industrial', color: 'bg-purple-50 text-purple-700 border-purple-200' },
}

const COUNTRY_FLAGS: Record<string, string> = {
  SG: '🇸🇬',
  MY: '🇲🇾',
  ID: '🇮🇩',
  TH: '🇹🇭',
  VN: '🇻🇳',
  PH: '🇵🇭',
}

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/bess" className="text-sm text-brand-600 hover:text-brand-700">
              Battery Storage
            </Link>
            <span className="text-ink-400">/</span>
            <span className="text-sm text-ink-500">Case Studies</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-medium text-ink tracking-tight">
            Real-world case studies
          </h1>
          <p className="mt-4 text-lg text-ink-600 leading-relaxed">
            How homes, offices, and factories across Southeast Asia are using battery storage to cut costs and gain energy independence.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-paper-100 border border-ink/10 rounded-card p-4 text-center">
            <div className="text-2xl font-bold text-brand-600">{CASE_STUDIES.length}</div>
            <div className="text-xs text-ink-500 mt-1">Case Studies</div>
          </div>
          <div className="bg-paper-100 border border-ink/10 rounded-card p-4 text-center">
            <div className="text-2xl font-bold text-ink">
              {new Set(CASE_STUDIES.map((c) => c.country)).size}
            </div>
            <div className="text-xs text-ink-500 mt-1">Countries</div>
          </div>
          <div className="bg-paper-100 border border-ink/10 rounded-card p-4 text-center">
            <div className="text-2xl font-bold text-ink">
              {Math.round(CASE_STUDIES.reduce((sum, c) => sum + c.paybackYears, 0) / CASE_STUDIES.length)}y
            </div>
            <div className="text-xs text-ink-500 mt-1">Avg. Payback</div>
          </div>
        </div>

        {/* Case Studies */}
        <div className="space-y-6">
          {CASE_STUDIES.map((study) => {
            const typeInfo = TYPE_LABELS[study.type]
            return (
              <div
                key={study.id}
                className="bg-paper-100 border border-ink/10 rounded-card overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6 md:p-8">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className="text-sm">
                      {COUNTRY_FLAGS[study.country]} {study.location}
                    </span>
                    <span className="text-xs text-ink-400 ml-auto">
                      Installed {new Date(study.installedDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Title & Summary */}
                  <h2 className="text-xl font-bold text-ink mb-3">{study.title}</h2>
                  <p className="text-ink-600 leading-relaxed mb-5">{study.summary}</p>

                  {/* System Details */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                    <div className="bg-paper-200 rounded-lg p-3">
                      <div className="text-xs text-ink-500">System</div>
                      <div className="text-sm font-semibold text-ink mt-0.5">{study.system}</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-3">
                      <div className="text-xs text-ink-500">Capacity</div>
                      <div className="text-sm font-semibold text-ink mt-0.5">{study.capacity}</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-3">
                      <div className="text-xs text-ink-500">Solar</div>
                      <div className="text-sm font-semibold text-ink mt-0.5">{study.solarSize}</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-3">
                      <div className="text-xs text-ink-500">Monthly Savings</div>
                      <div className="text-sm font-semibold text-brand-600 mt-0.5">{study.monthlySavings}</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-3">
                      <div className="text-xs text-ink-500">Payback</div>
                      <div className="text-sm font-semibold text-ink mt-0.5">{study.paybackYears} years</div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="text-sm font-semibold text-ink-700 mb-2">Key results</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                      {study.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                          <svg className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit Your Story */}
        <div className="mt-12 bg-paper-200 border border-ink/10 rounded-card p-8 text-center">
          <h2 className="text-xl font-bold text-ink mb-2">Have a BESS installation story?</h2>
          <p className="text-ink-600 mb-4">
            These installations are from across Southeast Asia. Share the cost, the savings, and what you would change.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Share your story
          </Link>
        </div>
      </section>

      <NextSteps route="/bess/case-studies" />
    </main>
  )
}
