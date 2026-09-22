import type { Metadata } from 'next'
import Link from 'next/link'
import { ARTICLES } from '@/content/articles'

export const metadata: Metadata = {
  title: 'Insights, battery.mom',
  description:
    'Data-driven analysis, explainers, and market snapshots on EVs, battery storage, and solar across Southeast Asia.',
}

const CATEGORY_COLORS: Record<string, string> = {
  Explainer: 'bg-blue-50 text-blue-700 border-blue-200',
  'Market Data': 'bg-purple-50 text-purple-700 border-purple-200',
  'Deep Dive': 'bg-amber-50 text-amber-700 border-amber-200',
}

const PLANNED_TOPICS = [
  {
    category: 'Coming next',
    articles: [
      'V2H and V2L explained: can your EV power your home?',
      'Net metering in Southeast Asia: who pays what for solar export?',
      'Thailand vs Indonesia: the EV manufacturing race',
      'Home battery storage costs: 2024 vs 2026 by country',
      'True 5-year cost of owning a BYD Atto 3 in Singapore',
      'Grid-scale BESS in the Philippines: what the tenders tell us',
    ],
  },
]

export default function InsightsPage() {
  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-medium text-ink tracking-tight">
            Insights
          </h1>
          <p className="mt-4 text-lg text-ink-600 leading-relaxed">
            Explainers and market notes on EVs, batteries, and solar in Southeast Asia. The numbers, and the context around them.
          </p>
        </div>

        {/* Published articles */}
        <div className="mb-14">
          <h2 className="text-lg font-semibold text-ink mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            Latest
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={`/insights/${article.slug}`}
                className="group bg-paper-100 border border-ink/10 rounded-card p-6 hover:border-brand-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      CATEGORY_COLORS[article.category] || 'bg-paper-200 text-ink-700 border-ink/10'
                    }`}
                  >
                    {article.category}
                  </span>
                  <span className="text-[11px] text-ink-400">{article.readingTime} min</span>
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2 group-hover:text-brand-700 transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="text-sm text-ink-600 leading-relaxed line-clamp-3">{article.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <time className="text-xs text-ink-400" dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                  <span className="text-brand-600 text-sm font-medium flex items-center">
                    Read
                    <svg className="ml-1 w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Coming next */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-ink mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Coming next
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLANNED_TOPICS[0].articles.map((title) => (
              <div
                key={title}
                className="flex items-start gap-2 p-3 bg-paper-200 rounded-lg"
              >
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-ink/15 mt-2" />
                <span className="text-sm text-ink-600 leading-relaxed">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8 border-t border-ink/10">
          <p className="text-ink-600 text-sm mb-4">
            Want to crunch the numbers yourself?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/calculators"
              className="inline-flex items-center px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Open Calculators
            </Link>
            <Link
              href="/ev"
              className="inline-flex items-center px-5 py-2.5 bg-paper-100 text-ink-800 border border-ink/15 rounded-lg hover:bg-paper-200 transition-colors text-sm font-medium"
            >
              Compare EVs
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

