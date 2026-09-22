export interface Article {
  slug: string
  title: string
  description: string
  category: 'Explainer' | 'Market Data' | 'Deep Dive'
  publishedAt: string // ISO date
  readingTime: number // minutes
  author: string
  tags: string[]
}

export const ARTICLES: Article[] = [
  {
    slug: 'lfp-vs-nmc-tropical-climates',
    title: 'What is LFP vs NMC? Why battery chemistry matters in tropical climates',
    description:
      'What LFP and NMC are, and why Southeast Asia's heat changes which one you want in an EV or a home battery.',
    category: 'Explainer',
    publishedAt: '2025-02-15',
    readingTime: 8,
    author: 'battery.mom',
    tags: ['battery chemistry', 'LFP', 'NMC', 'thermal management', 'BESS'],
  },
  {
    slug: 'can-13kwh-battery-zero-bill-malaysia',
    title: 'Can a 13.5 kWh battery zero your electricity bill in Malaysia?',
    description:
      'The numbers for a typical Malaysian household with rooftop solar and a 13.5 kWh home battery: self-consumption, net metering, payback, and the cases that miss a zero bill.',
    category: 'Deep Dive',
    publishedAt: '2025-02-12',
    readingTime: 10,
    author: 'battery.mom',
    tags: ['Malaysia', 'home battery', 'zero bill', 'solar', 'net metering'],
  },
  {
    slug: 'ev-adoption-southeast-asia-2024-review',
    title: 'EV adoption in Southeast Asia: 2024 year in review',
    description:
      'EV sales, chargers, and policy across SG, MY, TH, ID, VN, and PH in 2024, and what those figures implied for 2025.',
    category: 'Market Data',
    publishedAt: '2025-02-08',
    readingTime: 12,
    author: 'battery.mom',
    tags: ['EV adoption', 'Southeast Asia', 'market data', '2024 review'],
  },
]

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

export function getArticlesByCategory(category: Article['category']): Article[] {
  return ARTICLES.filter((a) => a.category === category)
}
