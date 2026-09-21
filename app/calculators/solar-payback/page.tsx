'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import InfoTooltip from '@/components/InfoTooltip'
import { NextSteps } from '@/components/ui/NextSteps'
import { COUNTRY_OPTIONS as COUNTRIES, formatCurrency as fmt, formatCompact as fmtShort } from '@/lib/constants'
import ShareResult from '@/components/ShareResult'
import type { Country } from '@/types/bess'
import { RESIDENTIAL_TARIFF, RESIDENTIAL_TARIFF_NOTE, RATE_VERIFIED_ON } from '@/data/rates'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'


// Solar yield per kW installed (kWh/kW/day)
const SOLAR_YIELD: Record<Country, number> = {
  MY: 4.6, SG: 4.2, ID: 4.8, TH: 4.7, VN: 4.5, PH: 4.6,
}

// Solar cost per kW (local currency, fully installed residential)
const SOLAR_COST_PER_KW: Record<Country, number> = {
  MY: 3200, SG: 2500, ID: 14000000, TH: 32000, VN: 19000000, PH: 38000,
}

const TARIFF = RESIDENTIAL_TARIFF

// Annual tariff inflation
const TARIFF_INFLATION = 0.03

// Panel degradation per year
const DEGRADATION = 0.005

// System lifespan
const SYSTEM_LIFE = 25

// Inverter replacement cost (% of system)
const INVERTER_REPLACEMENT_PCT = 0.12
const INVERTER_REPLACEMENT_YEAR = 12

// Panel density (kW per m² of usable roof)
const KW_PER_M2 = 0.17

const ROOF_QUALITY = {
  Ideal: 1.0,
  Average: 0.9,
  Shaded: 0.75,
}

// ── Component
// ── Component ─────────────────────────────────────────────────────────

export default function SolarPaybackPage() {
  const searchParams = useSearchParams()
  const [country, setCountry] = useState<Country>('MY')
  const [roofM2, setRoofM2] = useState(40)
  const [roofQuality, setRoofQuality] = useState<keyof typeof ROOF_QUALITY>('Average')
  const [monthlyBill, setMonthlyBill] = useState(300)

  // Restore state from shared URL
  useEffect(() => {
    const encoded = searchParams.get('s')
    if (!encoded) return
    try {
      const s = JSON.parse(atob(encoded))
      if (s.country) setCountry(s.country)
      if (s.roofM2) setRoofM2(Number(s.roofM2))
      if (s.roofQuality) setRoofQuality(s.roofQuality as keyof typeof ROOF_QUALITY)
      if (s.monthlyBill) setMonthlyBill(Number(s.monthlyBill))
    } catch { /* invalid state, use defaults */ }
  }, [searchParams])

  // Derive system size from roof area
  const systemKw = useMemo(() => {
    return Math.round(roofM2 * KW_PER_M2 * ROOF_QUALITY[roofQuality] * 10) / 10
  }, [roofM2, roofQuality])

  // ── Calculation ─────────────────────────────────────────────────────
  const results = useMemo(() => {
    const tariff = TARIFF[country]
    const yieldPerKw = SOLAR_YIELD[country]
    const costPerKw = SOLAR_COST_PER_KW[country]

    const systemCost = systemKw * costPerKw
    const inverterCost = systemCost * INVERTER_REPLACEMENT_PCT

    // Monthly consumption from bill
    const monthlyKwh = tariff > 0 ? monthlyBill / tariff : 0
    const annualKwh = monthlyKwh * 12

    // Year-by-year
    let cumulativeSavings = -systemCost
    let paybackYear: number | null = null
    const yearlyData: Array<{
      year: string
      generation: number
      savings: number
      cumulative: number
    }> = []

    let totalGeneration25 = 0
    let totalSavings25 = 0

    for (let y = 1; y <= SYSTEM_LIFE; y++) {
      const degradationFactor = Math.pow(1 - DEGRADATION, y - 1)
      const dailyGen = systemKw * yieldPerKw * degradationFactor
      const annualGen = dailyGen * 365

      // Self-consumption: can't save more than you use
      const selfConsumed = Math.min(annualGen * 0.75, annualKwh) // ~75% self-consumption without battery
      const tariffThisYear = tariff * Math.pow(1 + TARIFF_INFLATION, y - 1)
      const annualSavings = selfConsumed * tariffThisYear

      // Inverter replacement
      const extraCost = y === INVERTER_REPLACEMENT_YEAR ? inverterCost : 0

      cumulativeSavings += annualSavings - extraCost
      totalGeneration25 += annualGen
      totalSavings25 += annualSavings

      if (!paybackYear && cumulativeSavings >= 0) {
        paybackYear = y
      }

      yearlyData.push({
        year: `Y${y}`,
        generation: Math.round(annualGen),
        savings: Math.round(annualSavings - extraCost),
        cumulative: Math.round(cumulativeSavings),
      })
    }

    const roi25 = systemCost > 0 ? ((totalSavings25 - systemCost - inverterCost) / (systemCost + inverterCost)) * 100 : 0
    const monthlyGenYear1 = Math.round((systemKw * yieldPerKw * 365) / 12)
    const selfSufficiency = annualKwh > 0 ? Math.min(100, ((systemKw * yieldPerKw * 365 * 0.75) / annualKwh) * 100) : 0

    return {
      systemCost,
      inverterCost,
      paybackYear,
      totalSavings25: Math.round(totalSavings25),
      totalGeneration25: Math.round(totalGeneration25),
      netGain25: Math.round(cumulativeSavings),
      roi25: Math.round(roi25),
      monthlyGenYear1,
      selfSufficiency: Math.round(selfSufficiency),
      yearlyData,
    }
  }, [country, systemKw, monthlyBill])

  // Bill presets by country
  const billPresets: Record<Country, number[]> = {
    MY: [150, 300, 500, 800],
    SG: [100, 200, 350, 500],
    ID: [500000, 1000000, 2000000, 3500000],
    TH: [1500, 3000, 5000, 8000],
    VN: [800000, 1500000, 3000000, 5000000],
    PH: [3000, 5000, 8000, 12000],
  }

  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-medium text-ink tracking-tight">
            Solar Payback Calculator <InfoTooltip content="Calculates how many years it takes for electricity bill savings to cover the upfront cost of a rooftop solar system. After payback, all further savings are pure profit for the remaining 15-20+ years of the system's life." />
          </h1>
          <p className="mt-3 text-lg text-ink-600 leading-relaxed">
            Enter your roof size and monthly bill to see how fast solar pays for itself — with {SYSTEM_LIFE}-year projections using real local tariffs.
          </p>
          <div className="mt-4">
            <ShareResult
              title={`Solar Payback — ${systemKw} kWp system (${COUNTRIES.find(c => c.value === country)?.label})`}
              results={[
                { label: 'System cost', value: fmtShort(results.systemCost, country) },
                { label: 'Payback', value: results.paybackYear ? `${results.paybackYear} years` : 'N/A' },
                { label: '25-year net savings', value: fmtShort(results.netGain25, country) },
                { label: 'Self-sufficiency', value: `${results.selfSufficiency}%` },
              ]}
              path="/calculators/solar-payback"
              state={{ country, roofM2, roofQuality, monthlyBill }}
            />
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Country</label>
              <select
                value={country}
                onChange={(e) => {
                  const c = e.target.value as Country
                  setCountry(c)
                  setMonthlyBill(billPresets[c][1])
                }}
                className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.flag} {c.label}</option>
                ))}
              </select>
            </div>

            {/* Roof area */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Usable roof area <InfoTooltip content="The area of your roof that gets good sunlight and can physically hold panels. Not all roof space is usable — subtract areas covered by vents, water tanks, shadows from taller buildings, or tilted sections facing away from the sun. About 0.17 kW of solar fits per m²." /></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={150}
                  step={5}
                  value={roofM2}
                  onChange={(e) => setRoofM2(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-14 text-right">{roofM2} m²</span>
              </div>
              <p className="text-xs text-ink-400 mt-1">≈ {systemKw} kWp system <InfoTooltip content="kWp (kilowatt-peak) is the maximum power a solar panel can produce under ideal lab conditions (1000 W/m² irradiance, 25°C). Real-world output is typically 70-85% of kWp depending on temperature, weather, and panel orientation." /></p>
            </div>

            {/* Roof quality */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Roof quality <InfoTooltip content="Ideal: unshaded, north/south-facing, optimal tilt (100% yield). Average: minor shading or suboptimal orientation (90% yield). Shaded: significant obstruction from trees or buildings (75% yield)." /></label>
              <div className="flex gap-2">
                {(Object.keys(ROOF_QUALITY) as Array<keyof typeof ROOF_QUALITY>).map((q) => (
                  <button
                    key={q}
                    onClick={() => setRoofQuality(q)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      roofQuality === q
                        ? 'bg-brand-600 text-white'
                        : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly bill */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Current monthly bill</label>
              <input
                type="number"
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(Number(e.target.value))}
                className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <div className="flex gap-1.5 mt-1.5">
                {billPresets[country].map((p) => (
                  <button
                    key={p}
                    onClick={() => setMonthlyBill(p)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                      monthlyBill === p
                        ? 'bg-brand-50 border-brand-300 text-brand-700'
                        : 'border-ink/10 text-ink-400 hover:border-ink/15'
                    }`}
                  >
                    {fmtShort(p, country)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">System cost <InfoTooltip content="Fully installed price including panels, inverter, mounting, wiring, and labour. Based on average 2025 pricing for your country. Actual quotes may differ by ±15%." /></div>
            <div className="text-xl font-bold text-ink">{fmtShort(results.systemCost, country)}</div>
            <div className="text-xs text-ink-500 mt-0.5">{systemKw} kWp installed</div>
          </div>
          <div className={`rounded-card p-5 border ${
            results.paybackYear && results.paybackYear <= 8
              ? 'bg-brand-50 border-brand-200'
              : 'bg-paper-100 border-ink/10'
          }`}>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Payback <InfoTooltip content="The number of years until cumulative electricity savings equal the system cost. After this point, the system is 'free money'. Good systems in SEA typically pay back in 5-9 years." /></div>
            <div className="text-xl font-bold text-ink">
              {results.paybackYear ? `${results.paybackYear} years` : '25+ years'}
            </div>
            <div className="text-xs text-ink-500 mt-0.5">Break-even point</div>
          </div>
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">{SYSTEM_LIFE}-year savings <InfoTooltip content="Total electricity bill savings over 25 years minus the system cost and one inverter replacement. Includes 3% annual tariff inflation (electricity gets more expensive) and 0.5% annual panel degradation (panels slowly lose output)." /></div>
            <div className="text-xl font-bold text-brand-700">{fmtShort(results.netGain25, country)}</div>
            <div className="text-xs text-ink-500 mt-0.5">Net after system cost</div>
          </div>
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Self-sufficiency <InfoTooltip content="The percentage of your total electricity needs met by solar. Without a battery, this is typically capped at ~75% because solar only generates during daylight hours. Adding a home battery can push this to 85-95%." /></div>
            <div className="text-xl font-bold text-ink">{results.selfSufficiency}%</div>
            <div className="text-xs text-ink-500 mt-0.5">Without battery storage</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cumulative savings */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Cumulative net savings <InfoTooltip content="Shows the running total of savings after subtracting the upfront system cost. The line starts negative (you paid for the system) and crosses zero at the payback year. The dip around year 12 is the inverter replacement cost." /></h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={results.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtShort(v, country)} />
                <Tooltip formatter={(v: number) => fmt(v, country)} />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Net savings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Annual generation + savings */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Annual generation & savings</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={results.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtShort(v, country)} />
                <Tooltip formatter={(v: number) => fmt(v, country)} />
                <Legend />
                <Bar dataKey="savings" name="Annual savings" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assumptions */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Key assumptions <InfoTooltip content={`Default solar yield and installed cost are 2025 industry figures for your country. The tariff is the residential rate last verified ${RATE_VERIFIED_ON}. ${RESIDENTIAL_TARIFF_NOTE[country]} Solar yield = average daily kWh produced per kW of panels. Self-consumption at 75% means you use 3/4 of what you generate (rest goes to grid).`} /></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-xs text-ink-500">
            <div>Solar yield: {SOLAR_YIELD[country]} kWh/kWp/day</div>
            <div>Panel cost: {fmt(SOLAR_COST_PER_KW[country], country)}/kWp installed</div>
            <div className="flex items-center gap-1">Tariff: {fmt(TARIFF[country], country, 4)}/kWh <InfoTooltip content={RESIDENTIAL_TARIFF_NOTE[country]} /></div>
            <div>Tariff inflation: {TARIFF_INFLATION * 100}%/year</div>
            <div>Panel degradation: {DEGRADATION * 100}%/year</div>
            <div>Self-consumption: ~75% (no battery)</div>
            <div>Inverter replacement: year {INVERTER_REPLACEMENT_YEAR} ({INVERTER_REPLACEMENT_PCT * 100}% of system cost)</div>
            <div>System lifespan: {SYSTEM_LIFE} years</div>
            <div>Panel density: {KW_PER_M2} kWp/m²</div>
          </div>
          <p className="text-xs text-ink-400 mt-4">
            * {RESIDENTIAL_TARIFF_NOTE[country]} Actual yield varies with orientation, shading, and weather. Adding battery storage increases self-consumption to 85-95% — try the <a href="/bess/home" className="text-brand-600 underline">Zero‑Bill Calculator</a> for that. Rates last verified {RATE_VERIFIED_ON}.
          </p>
        </div>
      </section>

      <NextSteps route="/calculators/solar-payback" />
    </main>
  )
}
