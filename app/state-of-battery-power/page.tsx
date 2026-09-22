import type { Metadata } from 'next'
import { Badge, Button, Card, Container, Eyebrow, Section, Stat } from '@/components/ui'
import {
  BATTERY_ENERGY_MILESTONES,
  BATTERY_STORAGE_REGIONS,
  DATA_SOURCES,
  ENERGY_DEPLOYMENT_SNAPSHOT,
  GLOBAL_BATTERY_POWER_ADDITIONS,
  GLOBAL_RENEWABLE_GENERATION,
} from '@/data/energy-deployment-scoreboard'
import { BatteryBoomChart, BatteryRegionChart, GenerationMixChart } from './_components/charts'
import SunriseThread from '@/components/SunriseThread'

// --- Derived figures (computed from the dataset so they never drift) ---
const solar2015 = GLOBAL_RENEWABLE_GENERATION[0].solarPv
const solar2025 = GLOBAL_RENEWABLE_GENERATION[GLOBAL_RENEWABLE_GENERATION.length - 1].solarPv
const solarMultiple = (solar2025 / solar2015).toFixed(1)

const battery2020 = GLOBAL_BATTERY_POWER_ADDITIONS[0].utilityScaleGw
const battery2025 = GLOBAL_BATTERY_POWER_ADDITIONS[GLOBAL_BATTERY_POWER_ADDITIONS.length - 1].utilityScaleGw
const batteryMultiple = Math.round(battery2025 / battery2020)

const chinaRegion = BATTERY_STORAGE_REGIONS.find((r) => r.key === 'china')
const chinaUtil2025 = chinaRegion?.points.find((p) => p.year === 2025)?.utilityScaleGw ?? 0
const chinaSharePct = Math.round((chinaUtil2025 / battery2025) * 100)

const snap = ENERGY_DEPLOYMENT_SNAPSHOT
const forecastMultiple = Math.round(snap.forecast2035CumulativeGwh / snap.batteryCumulativeDisplayGwh)

const forecastBars = BATTERY_ENERGY_MILESTONES.filter((m) => typeof m.cumulativeGwh === 'number').map((m) => ({
  year: m.year,
  gwh: m.cumulativeGwh as number,
  forecast: m.status === 'forecast',
}))
const forecastMax = Math.max(...forecastBars.map((b) => b.gwh))

const ogImage =
  '/api/og?type=bess' +
  `&title=${encodeURIComponent('Where battery power stands')}` +
  `&subtitle=${encodeURIComponent('The state of the energy transition, in data.')}` +
  `&stat1Value=${encodeURIComponent(`${batteryMultiple}×`)}` +
  `&stat1Label=${encodeURIComponent('battery growth, 2020–2025')}` +
  `&stat2Value=${encodeURIComponent('885 GWh')}` +
  `&stat2Label=${encodeURIComponent('storage on the grid, 2025')}`

const title = 'Where battery power stands. The state of the energy transition'
const description =
  'Solar and wind became the cheapest power on record. Storage is now the constraint. Solar generation rose 10×, and grid batteries rose 23×.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/state-of-battery-power' },
  openGraph: {
    title,
    description,
    url: '/state-of-battery-power',
    type: 'article',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'Where battery power stands' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full align-middle"
      style={{ background: color }}
      aria-hidden
    />
  )
}

export default function StateOfBatteryPowerPage() {
  return (
    <main className="font-sans">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <Section tone="ink" size="lg" className="relative overflow-hidden">
        <Container width="wide">
          <Eyebrow className="text-brand-300">battery.mom · The state of the energy transition</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-medium leading-[1.04] tracking-tight text-paper sm:text-6xl lg:text-7xl">
            Where battery power stands.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-paper-300/90 sm:text-xl">
            Solar and wind became the cheapest electricity humanity has ever built. The question stopped
            being whether we can <em className="font-display italic">generate</em> clean power, and became
            whether we can <em className="font-display italic">store</em> it. This is where that race
            stands today.
          </p>

          <div className="mt-14 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-3">
            <Stat
              accent
              value={`${batteryMultiple}×`}
              label="Utility-scale battery additions, 2020 → 2025"
              sub={`${battery2020} GW → ${battery2025} GW added per year`}
            />
            <Stat
              accent
              value="885 GWh"
              label="Battery storage on the grid, end of 2025"
              sub="up from ~12 GWh added in 2020"
            />
            <Stat
              accent
              value={`${snap.lowCarbonSharePct}%`}
              label="Of the world's electricity is now low-carbon"
              sub="renewables + nuclear, 2025"
            />
          </div>
        </Container>
      </Section>

      {/* ── Standfirst ───────────────────────────────────────── */}
      <Section tone="paper" size="md">
        <Container width="prose">
          <p className="font-display text-2xl leading-snug text-ink sm:text-3xl">
            For a century, electricity meant burning coal, gas, or oil. The last decade
            changed that.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-ink-600">
            What follows is the story in numbers: how clean generation overtook the growth of fossil power,
            why batteries are what make that power usable, and how fast they are now being built.
            Every figure here comes from public IEA, IRENA, and BloombergNEF data, sourced at the bottom.
          </p>
        </Container>
      </Section>

      {/* ── Scene 1: The grid tipped ─────────────────────────── */}
      <Section tone="raised" size="md" className="border-y border-ink/5">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="reveal">
              <Eyebrow>01. Generation</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
                The grid tipped toward clean power.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-600">
                In 2015, the world&apos;s solar farms generated 245 TWh of electricity. In 2025 they
                generated 2,653, a <strong className="text-ink">{solarMultiple}×</strong> rise in a decade.
                Wind more than tripled. Add nuclear, and{' '}
                <strong className="text-ink">{snap.lowCarbonSharePct}%</strong>{' '}of the planet&apos;s
                electricity is now low-carbon.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-ink-600">
                The line that matters most: in 2025, the <em>growth</em> in clean generation outpaced the
                growth in fossil generation for the first time. Coal and oil output fell.
              </p>
            </div>
            <Card className="p-5 sm:p-6">
              <div className="text-sm font-semibold text-ink">Total electricity generation by source</div>
              <div className="mb-4 text-xs text-ink-400">Terawatt-hours generated each year · 2015–2025 · annual totals, not additions</div>
              <GenerationMixChart />
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-600">
                <span className="inline-flex items-center gap-2">
                  <Dot color="#0E9F6E" /> Low-carbon (renewables + nuclear)
                </span>
                <span className="inline-flex items-center gap-2">
                  <Dot color="#A7AFA4" /> Fossil (coal, gas, oil)
                </span>
              </div>
              <p className="mt-3 text-[11px] text-ink-400">Source: IEA Global Energy Review 2026.</p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ── Scene 2: The missing piece (pull quote) ──────────── */}
      <Section tone="ink" size="md">
        <Container width="default">
          <p className="font-display text-3xl font-light leading-snug text-paper sm:text-4xl">
            <span className="text-brand-300">"</span>A solar panel is useless at night. A turbine is
            useless when the air is still. Batteries are what turn an intermittent supply into power you
            can count on. Until recently, there was very little of it.<span className="text-brand-300">"</span>
          </p>
        </Container>
      </Section>

      {/* ── Scene 3: The battery boom ────────────────────────── */}
      <Section tone="paper" size="md">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <Card className="order-2 p-5 sm:p-6 lg:order-1">
              <div className="text-sm font-semibold text-ink">Annual battery power additions</div>
              <div className="mb-4 text-xs text-ink-400">Gigawatts added per year · 2020–2025</div>
              <BatteryBoomChart />
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-600">
                <span className="inline-flex items-center gap-2">
                  <Dot color="#0E9F6E" /> Utility-scale
                </span>
                <span className="inline-flex items-center gap-2">
                  <Dot color="#5DD9A6" /> Behind-the-meter
                </span>
              </div>
              <p className="mt-3 text-[11px] text-ink-400">Source: IEA Global Energy Review 2026.</p>
            </Card>
            <div className="order-1 reveal lg:order-2">
              <Eyebrow>02. Storage</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
                Then annual additions jumped.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-600">
                Cheap clean power created a new problem: it arrives when the weather cooperates, not when
                you flip a switch. The fix is storage, and annual additions jumped. Annual
                utility-scale battery additions climbed from {battery2020} GW in 2020 to {battery2025} GW in
                2025, a <strong className="text-ink">{batteryMultiple}× jump</strong>.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-ink-600">
                In 2025 alone the world added {snap.batteryPowerAdditionsGw} GW of battery power and{' '}
                {snap.batteryEnergyAdditionsGwh} GWh of capacity. {snap.lfpDeploymentSharePct}% of it was
                lithium iron phosphate (LFP), the cheaper, longer-lived chemistry that finally made grid
                storage pencil out.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Badge tone="brand">{snap.lfpDeploymentSharePct}% LFP chemistry</Badge>
                <Badge tone="neutral">{snap.utilityScalePowerSharePct}% utility-scale</Badge>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── Scene 4: Where it's being built ──────────────────── */}
      <Section tone="raised" size="md" className="border-y border-ink/5">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="reveal">
              <Eyebrow>03. Geography</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
                One country is building most of it.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-600">
                The boom is not evenly shared. China alone added{' '}
                <strong className="text-ink">{chinaUtil2025} GW</strong> of utility-scale storage in 2025,
                about <strong className="text-ink">{chinaSharePct}%</strong>{' '}of the global total, pairing
                it with the world&apos;s largest solar build-out. The United States is a distant second.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-ink-600">
                The technology is global. The deployment, for now, is concentrated, which is why
                where <em>your</em> region stands is worth watching closely.
              </p>
            </div>
            <Card className="p-5 sm:p-6">
              <div className="text-sm font-semibold text-ink">Utility-scale storage added in 2025</div>
              <div className="mb-4 text-xs text-ink-400">Gigawatts · by region · China highlighted</div>
              <BatteryRegionChart />
              <p className="mt-3 text-[11px] text-ink-400">Source: IEA Global Energy Review 2026.</p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ── Scene 5: Where we are, 2025 ──────────────────────── */}
      <Section tone="ink" size="md">
        <Container width="wide">
          <Eyebrow className="text-brand-300">04. The snapshot</Eyebrow>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-medium leading-tight tracking-tight text-paper sm:text-4xl">
            Where the energy transition stands, end of 2025.
          </h2>
          <div className="mt-12 grid gap-x-8 gap-y-10 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
            <Stat accent value={`${snap.batteryPowerAdditionsGw} GW`} label="Battery power added in 2025" sub="utility-scale + behind-the-meter" />
            <Stat accent value={`${snap.batteryEnergyAdditionsGwh} GWh`} label="Storage capacity added in 2025" />
            <Stat accent value={`${snap.batteryCumulativeDisplayGwh} GWh`} label="Cumulative storage on the grid" sub="estimated 855–913 GWh" />
            <Stat accent value={`${snap.lowCarbonSharePct}%`} label="Low-carbon share of electricity" sub="renewables + nuclear" />
            <Stat accent value={`+${snap.solarGenerationGrowthTwh} TWh`} label="Solar generation growth, 2025" sub="largest single-source gain" />
            <Stat accent value={`${snap.renewableCapacityAdditionsGw} GW`} label="Renewable capacity added in 2025" sub="≈86% of all new capacity (IRENA)" />
          </div>
        </Container>
      </Section>

      {/* ── Scene 6: Where it's heading ──────────────────────── */}
      <Section tone="paper" size="md">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="reveal">
              <Eyebrow>05. The road ahead</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
                The backbone is still being built.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-600">
                BloombergNEF projects cumulative grid storage will reach{' '}
                <strong className="text-ink">{snap.forecast2035CumulativeGwh.toLocaleString()} GWh</strong>{' '}
                by 2035, roughly <strong className="text-ink">{forecastMultiple}×</strong>{' '}today&apos;s 885.
                If that holds, grid batteries move from an add-on to part of the grid itself during the 2020s.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-ink-600">
                The harder questions are next. How fast should it scale,
                who is left out, and what comes after lithium. That&apos;s where this story goes from
                here.
              </p>
            </div>
            <Card className="p-6 sm:p-8">
              <div className="mb-6 text-sm font-semibold text-ink">
                Cumulative grid storage · GWh
              </div>
              <div className="space-y-5">
                {forecastBars.map((b) => (
                  <div key={b.year}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-medium text-ink">
                        {b.year}
                        {b.forecast ? (
                          <span className="ml-2 text-xs font-normal text-ink-400">forecast</span>
                        ) : null}
                      </span>
                      <span className="font-display text-ink">{b.gwh.toLocaleString()}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-pill bg-ink/5">
                      <div
                        className="h-full rounded-pill"
                        style={{
                          width: `${Math.max((b.gwh / forecastMax) * 100, 2)}%`,
                          background: b.forecast ? '#E0A33C' : '#0E9F6E',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[11px] text-ink-400">
                Source: BloombergNEF 2H 2025 Energy Storage Outlook; historical via IEA.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ── Sources ──────────────────────────────────────────── */}
      <Section tone="warm" size="sm" className="border-t border-ink/5">
        <Container width="default">
          <Eyebrow>Sources &amp; method</Eyebrow>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-600">
            battery.mom takes no ads, no sponsors, and no affiliate money. Every figure on this page is
            traceable to a public source:
          </p>
          <ul className="mt-6 space-y-3">
            {DATA_SOURCES.map((s) => (
              <li key={s.url} className="text-sm leading-relaxed">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500"
                >
                  {s.label}
                </a>
                <span className="text-ink-500">. {s.note}</span>
              </li>
            ))}
          </ul>
          <SunriseThread className="mt-8" />
        </Container>
      </Section>

      {/* ── Explore the tools ────────────────────────────────── */}
      <Section tone="paper" size="md" className="border-t border-ink/5">
        <Container width="default" className="text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl">
            Now explore the numbers yourself.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-600">
            The story above runs on the same open data behind every tool on battery.mom.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/scoreboard/energy" variant="ink">
              See the live data dashboard
            </Button>
            <Button href="/ev" variant="ghost">
              Compare EVs
            </Button>
            <Button href="/calculators" variant="ghost">
              Run the calculators
            </Button>
          </div>
        </Container>
      </Section>
    </main>
  )
}
