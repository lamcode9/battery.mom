'use client'

import { useState, useMemo } from 'react'
import InfoTooltip from '@/components/InfoTooltip'
import type { Country } from '@/types/bess'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'
import { CO2_GRID_FACTOR } from '@/data/rates'

const GRID_EMISSION_FACTOR = CO2_GRID_FACTOR

/* ── Baseline adoption assumptions ────────────────────────────────── */
const BASELINE: Record<Country, {
  currentCapacityMwh: number   // installed grid BESS MWh
  peakDemandGw: number         // national peak demand
  gridLossPct: number          // T&D losses
  annualGrowthPct: number      // demand growth
}> = {
  SG: { currentCapacityMwh: 1200, peakDemandGw: 7.3, gridLossPct: 3, annualGrowthPct: 1.5 },
  MY: { currentCapacityMwh: 250, peakDemandGw: 19.1, gridLossPct: 6, annualGrowthPct: 3 },
  ID: { currentCapacityMwh: 100, peakDemandGw: 42, gridLossPct: 9, annualGrowthPct: 4.5 },
  TH: { currentCapacityMwh: 150, peakDemandGw: 30.5, gridLossPct: 5, annualGrowthPct: 2.5 },
  VN: { currentCapacityMwh: 80, peakDemandGw: 45, gridLossPct: 8, annualGrowthPct: 6 },
  PH: { currentCapacityMwh: 60, peakDemandGw: 15.5, gridLossPct: 10, annualGrowthPct: 4 },
}

const CURRENCY: Record<Country, string> = {
  MY: 'RM', SG: 'S$', ID: 'Rp', TH: '฿', VN: '₫', PH: '₱',
}

function fmtShort(n: number, country: Country): string {
  const c = CURRENCY[country]
  if (country === 'ID' || country === 'VN') {
    if (Math.abs(n) >= 1e12) return `${c}${(n / 1e12).toFixed(1)}T`
    if (Math.abs(n) >= 1e9) return `${c}${(n / 1e9).toFixed(1)}B`
    if (Math.abs(n) >= 1e6) return `${c}${(n / 1e6).toFixed(1)}M`
    return `${c}${(n / 1e3).toFixed(0)}K`
  }
  if (Math.abs(n) >= 1e9) return `${c}${(n / 1e9).toFixed(1)}B`
  if (Math.abs(n) >= 1e6) return `${c}${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `${c}${(n / 1e3).toFixed(1)}K`
  return `${c}${n.toFixed(0)}`
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  country: Country
}

export default function PolicyImpactSimulator({ country }: Props) {
  // Policy levers the user can toggle
  const [fitRate, setFitRate] = useState(50) // $/MWh feed-in tariff
  const [subsidyPct, setSubsidyPct] = useState(20) // % capex subsidy
  const [netMetering, setNetMetering] = useState(true)
  const [fastPermitting, setFastPermitting] = useState(false)
  const [taxBreak, setTaxBreak] = useState(false)

  const results = useMemo(() => {
    const base = BASELINE[country]
    const ef = GRID_EMISSION_FACTOR[country]

    /*
     * Simple adoption model:
     * Each "lever" contributes to a multiplier on new annual installations.
     * Base = 50 MWh/year new capacity per GW of national peak demand.
     */
    const baseAnnualMwh = base.peakDemandGw * 50

    // Each lever adds a multiplier
    let multiplier = 1
    multiplier += (fitRate / 100) * 1.2          // Higher FiT → more revenue incentive
    multiplier += (subsidyPct / 100) * 1.5        // Subsidy reduces upfront cost barrier
    if (netMetering) multiplier += 0.3
    if (fastPermitting) multiplier += 0.25
    if (taxBreak) multiplier += 0.2

    // 10-year projection
    const years: {
      year: string
      newCapacity: number
      cumulativeCapacity: number
      co2Avoided: number
      peakReduction: number
    }[] = []

    let cumCapacity = base.currentCapacityMwh
    let cumCO2 = 0

    for (let y = 1; y <= 10; y++) {
      const annualNew = baseAnnualMwh * multiplier * Math.pow(1.1, y - 1) // 10% compound growth
      cumCapacity += annualNew
      // Each MWh of storage cycles ~365 times/year, displaces coal/gas
      const annualEnergyMwh = annualNew * 365 * 0.85 // round-trip eff
      const co2Tonnes = (annualEnergyMwh * ef) / 1000
      cumCO2 += co2Tonnes

      // Peak reduction: 1 MWh ≈ 0.25 MW for 4-hour discharge
      const peakReductionMw = cumCapacity * 0.25 / 1000

      years.push({
        year: `Y${y}`,
        newCapacity: Math.round(annualNew),
        cumulativeCapacity: Math.round(cumCapacity),
        co2Avoided: Math.round(cumCO2),
        peakReduction: Math.round(peakReductionMw * 10) / 10,
      })
    }

    const yr10 = years[years.length - 1]
    const gridLoadReductionPct = (yr10.peakReduction / base.peakDemandGw) * 100

    return { years, yr10, gridLoadReductionPct, multiplier }
  }, [country, fitRate, subsidyPct, netMetering, fastPermitting, taxBreak])

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
      <h2 className="text-lg font-semibold text-ink mb-1">
        Policy Impact Simulator{' '}
        <InfoTooltip content="Toggle policy levers to see how different incentive combinations could accelerate BESS adoption in your country. The model estimates new capacity additions, CO₂ reductions, and peak demand shaving over a 10-year horizon." />
      </h2>
      <p className="text-sm text-ink-500 mb-6">
        Adjust policy levers to project BESS adoption, grid load reduction, and CO₂ impact over 10 years.
      </p>

      {/* ── Policy levers ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {/* FiT rate */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Feed-in tariff ($/MWh){' '}
            <InfoTooltip content="Price paid to BESS operators for dispatching stored energy back to the grid. Higher FiT = stronger revenue incentive = faster adoption." />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range" min="0" max="120" step="5" value={fitRate}
              onChange={(e) => setFitRate(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <span className="text-sm font-medium text-ink w-16 text-right">${fitRate}/MWh</span>
          </div>
        </div>

        {/* Subsidy % */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Capex subsidy (%){' '}
            <InfoTooltip content="Percentage of upfront capital cost covered by government grants. Singapore's ESP offers up to 50%. Higher subsidy = lower barrier to entry for developers." />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range" min="0" max="60" step="5" value={subsidyPct}
              onChange={(e) => setSubsidyPct(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <span className="text-sm font-medium text-ink w-12 text-right">{subsidyPct}%</span>
          </div>
        </div>

        {/* Net metering */}
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-ink-700">
            Net metering{' '}
            <InfoTooltip content="Allow BESS operators to offset consumption with stored solar/wind exports. Reduces payback period and encourages hybrid solar+storage projects." />
          </label>
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => setNetMetering(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                netMetering ? 'bg-brand-600 text-white' : 'bg-paper-200 text-ink-600 hover:bg-paper-300'
              }`}
            >
              Enabled
            </button>
            <button
              onClick={() => setNetMetering(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                !netMetering ? 'bg-ink text-white' : 'bg-paper-200 text-ink-600 hover:bg-paper-300'
              }`}
            >
              Disabled
            </button>
          </div>
        </div>

        {/* Fast permitting */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="fastPermit"
            checked={fastPermitting}
            onChange={() => setFastPermitting(!fastPermitting)}
            className="rounded border-ink/15 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="fastPermit" className="text-sm text-ink-700">
            Fast-track permitting{' '}
            <InfoTooltip content="Streamlined approval process (< 6 months) for grid-connected BESS projects. Reduces project delays and developer uncertainty." />
          </label>
        </div>

        {/* Tax break */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="taxBreak"
            checked={taxBreak}
            onChange={() => setTaxBreak(!taxBreak)}
            className="rounded border-ink/15 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="taxBreak" className="text-sm text-ink-700">
            Tax incentive (CIT exemption){' '}
            <InfoTooltip content="Corporate income tax exemption on BESS investment for 5-10 years. Common in Malaysia (Pioneer Status) and Thailand (BOI promotion)." />
          </label>
        </div>
      </div>

      {/* ── Results summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-brand-50 rounded-card p-4">
          <div className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1">New capacity (Y10)</div>
          <div className="text-xl font-bold text-brand-900">
            {(results.yr10.cumulativeCapacity / 1000).toFixed(1)} GWh
          </div>
          <div className="text-xs text-brand-600 mt-0.5">
            {results.multiplier.toFixed(1)}× baseline rate
          </div>
        </div>
        <div className="bg-blue-50 rounded-card p-4">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Peak demand cut</div>
          <div className="text-xl font-bold text-blue-900">
            {results.yr10.peakReduction.toFixed(1)} GW
          </div>
          <div className="text-xs text-blue-600 mt-0.5">
            {results.gridLoadReductionPct.toFixed(1)}% of national peak
          </div>
        </div>
        <div className="bg-purple-50 rounded-card p-4">
          <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">CO₂ avoided (10 yr)</div>
          <div className="text-xl font-bold text-purple-900">
            {(results.yr10.co2Avoided / 1000).toFixed(1)} kt
          </div>
          <div className="text-xs text-purple-600 mt-0.5">
            Cumulative GHG reduction
          </div>
        </div>
        <div className="bg-amber-50 rounded-card p-4">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Year 10 annual</div>
          <div className="text-xl font-bold text-amber-900">
            {results.years[9].newCapacity.toLocaleString()} MWh
          </div>
          <div className="text-xs text-amber-600 mt-0.5">
            New installations in year 10
          </div>
        </div>
      </div>

      {/* ── 10-year chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">Cumulative BESS capacity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={results.years}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(1)} GWh`} />
              <ChartHoverTooltip
                formatter={(v: number) => [`${(v / 1000).toFixed(2)} GWh`, 'Cumulative BESS']}
              />
              <Bar dataKey="cumulativeCapacity" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">CO₂ avoided &amp; peak shaving</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={results.years}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="co2" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)} kt`} />
              <YAxis yAxisId="gw" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} GW`} />
              <ChartHoverTooltip
                formatter={(v: number, name: string) =>
                  name === 'co2Avoided'
                    ? [`${(v / 1000).toFixed(1)} kt`, 'CO₂ avoided']
                    : [`${v.toFixed(1)} GW`, 'Peak reduction']
                }
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="co2" type="monotone" dataKey="co2Avoided" stroke="#8b5cf6" strokeWidth={2} name="CO₂ avoided" />
              <Line yAxisId="gw" type="monotone" dataKey="peakReduction" stroke="#f59e0b" strokeWidth={2} name="Peak reduction" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
