import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import NewsletterSignup from '@/components/NewsletterSignup'
import FeaturedStory from '@/components/home/FeaturedStory'
import HeroFilmLoop from '@/components/home/HeroFilmLoop'
import { Eyebrow } from '@/components/ui'

export const metadata: Metadata = {
  title: 'battery.mom - Battery and solar adoption data',
  description:
    'Independent data for tracking battery, solar, EV, and storage adoption across Southeast Asia and the wider energy transition.',
  alternates: { canonical: '/' },
}

const decisionPaths = [
  {
    eyebrow: 'Residential systems',
    title: 'Solar + battery economics',
    description:
      'Model tariffs, rooftop solar, storage size, EV charging load, bill impact, and payback using local assumptions.',
    href: '/bess/home',
    cta: 'Open planner',
  },
  {
    eyebrow: 'Transport batteries',
    title: 'EV battery and cost signals',
    description:
      'Compare local EV prices, usable range, efficiency, battery chemistry, charging, and ownership assumptions.',
    href: '/ev',
    cta: 'Open EV data',
  },
  {
    eyebrow: 'Building + grid storage',
    title: 'BESS across sectors',
    description:
      'Explore shared residential, commercial, and grid-scale storage for economics, peak demand, and deployment fit.',
    href: '/bess',
    cta: 'Open BESS desk',
  },
]

const trackingLayers = [
  {
    label: 'Deployment',
    metric: 'GWh / GW',
    title: 'Battery capacity in the real world',
    description: 'Stationary storage already online, annual battery additions, and where new capacity is being built.',
  },
  {
    label: 'Adoption',
    metric: 'Homes / EVs / sites',
    title: 'Who is actually using it',
    description: 'EV uptake, home batteries, shared residential systems, commercial storage, grid projects, and charging hubs.',
  },
  {
    label: 'Energy mix',
    metric: 'TWh',
    title: 'What storage is shifting',
    description: 'Battery deployment shown beside solar, wind, hydro, nuclear, coal, gas, and oil electricity generation.',
  },
  {
    label: 'Readiness',
    metric: 'Policy + price',
    title: 'Whether the market can scale',
    description: 'Tariffs, incentives, battery pricing, solar yield, charging density, payback, and source coverage.',
  },
]

const lenses = [
  { href: '/scoreboard/energy', label: 'Energy', sub: 'global lens' },
  { href: '/scoreboard/bess', label: 'BESS', sub: 'sector lens' },
  { href: '/scoreboard/ev', label: 'EV', sub: 'transport lens' },
  { href: '/calculators', label: 'ROI', sub: 'economics lens' },
]

const proofPoints = [
  'Monthly refresh rhythm',
  'Country-specific assumptions',
  'No ads, sponsors, or affiliate pressure',
  'Correction path for bad or stale data',
]

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

export default function Home() {
  return (
    <main className="home-page min-h-screen overflow-hidden bg-paper pt-12 text-ink md:pt-14">
      <section className="home-hero relative isolate min-h-[72svh] overflow-hidden bg-ink text-paper">
        <Image
          src="/images/home-energy-transition-map-poster.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          className="home-hero-poster object-cover object-center"
        />
        <HeroFilmLoop />
        <div className="home-hero-scrim absolute inset-0" />
        <div className="home-grain absolute inset-0" />

        <div className="container relative z-10 mx-auto grid min-h-[72svh] max-w-7xl content-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="home-hero-copy max-w-4xl">
            <span className="inline-flex items-center rounded-pill bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-200 backdrop-blur-md">
              Independent adoption data
            </span>

            <h1 className="mt-7 max-w-3xl text-balance text-6xl font-bold leading-[0.88] tracking-tight sm:text-7xl lg:text-8xl">
              battery.mom
            </h1>
            <p className="mt-6 max-w-2xl text-balance font-display text-3xl font-medium leading-[1.1] text-paper md:text-5xl">
              Track the battery and solar transition as it deploys.
            </p>
            <p className="mt-5 max-w-xl text-base leading-7 text-paper-300 md:text-lg">
              A living view of storage GWh, solar buildout, EV adoption, BESS sectors, and the power mix behind them.
            </p>
            <p className="mt-6 font-display text-lg italic text-gold-light/90">
              The swarm starts on a rooftop. Start with yours.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/state-of-battery-power"
                className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-paper px-6 py-3 text-sm font-semibold text-ink shadow-raised transition hover:-translate-y-0.5 hover:bg-white sm:w-auto"
              >
                See the big picture
                <ArrowIcon />
              </Link>
              <Link
                href="/scoreboard/energy"
                className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-white/10 px-6 py-3 text-sm font-semibold text-paper backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/16 sm:w-auto"
              >
                Explore battery deployment
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FeaturedStory />

      <section className="bg-paper py-16 md:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
            <div>
              <Eyebrow>Pick the first question</Eyebrow>
              <h2 className="mt-4 text-balance font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-5xl">
                Track the transition from adoption data to system economics.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {decisionPaths.map((path, index) => (
                <Link
                  key={path.href}
                  href={path.href}
                  className="home-reveal group flex min-h-[20rem] flex-col justify-between rounded-card border border-ink/10 bg-paper-100 p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-raised"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                      {path.eyebrow}
                    </span>
                    <h3 className="mt-4 font-display text-2xl font-medium leading-tight tracking-tight text-ink">{path.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-ink-500">{path.description}</p>
                  </div>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                    {path.cta}
                    <ArrowIcon />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The invitation: the feature film (storyboard §04, T3) ── */}
      <section className="relative overflow-hidden bg-ink py-20 text-paper md:py-28">
        <div className="home-grain absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />
        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span aria-hidden className="h-px w-12 bg-gold/50" />
            <span className="font-display text-sm italic text-paper-300/80">The feature · a scrolling film · ~12 minutes</span>
          </div>
          <h2 className="mt-5 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
            The long sunrise
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-paper-300 md:text-lg">
            Half a million years of energy, and the century that changes it. From the first tended fire to
            terawatt solar, grid batteries, orbital compute, and the work still left.
          </p>
          <Link
            href="/sunrise"
            className="group mt-8 inline-flex items-center gap-3 font-display text-lg italic text-gold-light transition hover:text-paper"
          >
            Begin in the dark
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      <section className="home-method relative overflow-hidden bg-ink py-16 text-paper md:py-24">
        <div className="home-grain absolute inset-0 opacity-70" />
        <div className="container relative z-10 mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">What we track</p>
            <h2 className="mt-4 text-balance font-display text-3xl font-medium leading-[1.05] tracking-tight md:text-5xl">
              The battery transition needs more than one number.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-paper-300">
              battery.mom follows the shift from fossil-heavy electricity toward solar, storage, and electrified transport.
              The useful view is deployment, adoption, market readiness, and the power mix around the hardware.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {lenses.map((lens) => (
                <Link
                  key={lens.href}
                  href={lens.href}
                  className="rounded-card bg-white/[0.05] p-4 transition hover:bg-white/[0.1]"
                >
                  <div className="text-2xl font-semibold text-white">{lens.label}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-brand-300">{lens.sub}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trackingLayers.map((layer, index) => (
              <article
                key={layer.title}
                className="home-reveal rounded-card bg-white/[0.05] p-6 backdrop-blur-md"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">{layer.label}</p>
                  <span className="rounded-pill bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-gold-light">
                    {layer.metric}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-medium leading-tight tracking-tight text-white">{layer.title}</h3>
                <p className="mt-3 leading-7 text-paper-300">{layer.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper-100 py-16 md:py-24">
        <div className="container mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:px-8">
          <div>
            <Eyebrow>Why trust it</Eyebrow>
            <h2 className="mt-4 text-balance font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-5xl">
              Clear data beats confident sales talk.
            </h2>
            <p className="mt-5 text-base leading-7 text-ink-500">
              battery.mom is deliberately plain about uncertainty. Prices change, incentives move, and product claims age. The point is to keep the assumptions visible.
            </p>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:-translate-y-0.5 hover:bg-ink-800">
              Read the mission
              <ArrowIcon />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {proofPoints.map((point) => (
              <div key={point} className="home-reveal rounded-card border border-ink/10 bg-paper p-6 shadow-card">
                <div className="mb-4 h-1.5 w-12 rounded-pill bg-brand" />
                <p className="text-lg font-medium leading-snug text-ink">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-paper md:py-20">
        <div className="container mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">Monthly data digest</p>
            <h2 className="mt-4 text-balance font-display text-3xl font-medium leading-[1.05] tracking-tight md:text-4xl">
              When the numbers move, you get the note.
            </h2>
            <p className="mt-4 text-sm leading-6 text-paper-300">
              EV launches, battery pricing, policy updates, calculator changes, and Southeast Asia adoption signals.
            </p>
          </div>
          <NewsletterSignup className="home-reveal bg-paper-100 text-ink" />
        </div>
      </section>
    </main>
  )
}
