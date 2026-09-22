'use client'

import { useState, useMemo } from 'react'
import InfoTooltip from '@/components/InfoTooltip'
import type { Country } from '@/types/bess'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { CO2_GRID_FACTOR } from '@/data/rates'

const GRID_EMISSION_FACTOR = CO2_GRID_FACTOR

// Carbon credit prices (USD per tonne CO₂)
const CREDIT_STANDARDS = [
  { id: 'vcs', name: 'VCS (Verra)', price: 12, desc: 'Voluntary Carbon Standard. The most widely used voluntary market' },
  { id: 'gs', name: 'Gold Standard', price: 28, desc: 'Premium standard with co-benefit requirements (SDGs)' },
  { id: 'a6', name: 'Article 6.4', price: 45, desc: 'Paris Agreement compliance market. Highest price, strictest rules' },
  { id: 'acx', name: 'ACX (Asia)', price: 8, desc: 'Asia Climate Exchange. A regional market still taking shape' },
] as const

const CURRENCY: Record<Country, string> = {
  MY: 'RM', SG: 'S$', ID: 'Rp', TH: '฿', VN: '₫', PH: '₱',
}

// Approximate USD → local currency rates
const USD_RATE: Record<Country, number> = {
  MY: 4.7, SG: 1.35, ID: 15800, TH: 36, VN: 25400, PH: 56,
}

function fmtLocal(usd: number, country: Country, digits = 0): string {
  const local = usd * USD_RATE[country]
  return `${CURRENCY[country]}${local.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

function fmtShortUSD(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  country: Country
  systemSizeKwh?: number
  cyclesPerYear?: number
}

export default function CarbonCreditEstimator({
  country,
  systemSizeKwh = 500,
  cyclesPerYear = 365,
}: Props) {
  const [sizeKwh, setSizeKwh] = useState(systemSizeKwh)
  const [cycles, setCycles] = useState(cyclesPerYear)
  const [years, setYears] = useState(10)
  const [selectedStandard, setSelectedStandard] = useState<string>('vcs')

  const results = useMemo(() => {
    const ef = GRID_EMISSION_FACTOR[country]

    // Annual avoided CO₂
    // kWh × cycles × round-trip eff × grid emission factor → kg → tonnes
    const annualEnergyKwh = sizeKwh * cycles * 0.85
    const annualCO2Tonnes = (annualEnergyKwh * ef) / 1000

    // Build projection per standard
    const projections = CREDIT_STANDARDS.map((std) => {
      const yearlyData: { year: string; co2: number; revenue: number; cumRevenue: number }[] = []
      let cumRevenue = 0
      for (let y = 1; y <= years; y++) {
        const deg = Math.pow(0.975, y - 1) // 2.5% annual degradation
        const yearlyCO2 = annualCO2Tonnes * deg
        const yearlyRevenue = yearlyCO2 * std.price
        cumRevenue += yearlyRevenue
        yearlyData.push({
          year: `Y${y}`,
          co2: Math.round(yearlyCO2 * 10) / 10,
          revenue: Math.round(yearlyRevenue),
          cumRevenue: Math.round(cumRevenue),
        })
      }
      return {
        ...std,
        totalCO2: yearlyData.reduce((s, d) => s + d.co2, 0),
        totalRevenueUSD: cumRevenue,
        yearlyData,
      }
    })

    const selected = projections.find((p) => p.id === selectedStandard) || projections[0]

    return { annualCO2Tonnes, projections, selected }
  }, [country, sizeKwh, cycles, years, selectedStandard])

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
      <h2 className="text-lg font-semibold text-ink mb-1">
        Carbon Credit Estimator{' '}
        <InfoTooltip content="Calculate avoided CO₂ from your BESS system and estimate potential carbon credit revenue under different standards: VCS (Verra), Gold Standard, Article 6.4 (Paris Agreement), and ACX (Asia)." />
      </h2>
      <p className="text-sm text-ink-500 mb-6">
        Estimate carbon credit revenue from your battery system under{' '}
        {CREDIT_STANDARDS.length} major standards.
      </p>

      {/* ── Inputs ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            System size (kWh){' '}
            <InfoTooltip content="Total usable battery capacity. CO₂ avoided scales linearly with system size." />
          </label>
          <input
            type="number" value={sizeKwh}
            onChange={(e) => setSizeKwh(Math.max(10, Number(e.target.value)))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Cycles per year</label>
          <input
            type="number" value={cycles}
            onChange={(e) => setCycles(Math.max(100, Math.min(500, Number(e.target.value))))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Projection years</label>
          <input
            type="number" value={years}
            onChange={(e) => setYears(Math.max(1, Math.min(20, Number(e.target.value))))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* ── Standard selector ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CREDIT_STANDARDS.map((std) => (
          <button
            key={std.id}
            onClick={() => setSelectedStandard(std.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              selectedStandard === std.id
                ? 'bg-brand-600 text-white'
                : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
            }`}
          >
            {std.name}, ${std.price}/t
          </button>
        ))}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-brand-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-brand-700 uppercase tracking-wide mb-1">Annual CO₂</div>
          <div className="text-xl font-bold text-brand-900">
            {results.annualCO2Tonnes.toFixed(1)} t
          </div>
          <div className="text-[10px] text-brand-600">Tonnes avoided per year</div>
        </div>
        <div className="bg-blue-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Total CO₂ ({years}yr)</div>
          <div className="text-xl font-bold text-blue-900">
            {results.selected.totalCO2.toFixed(1)} t
          </div>
          <div className="text-[10px] text-blue-600">With 2.5%/yr degradation</div>
        </div>
        <div className="bg-purple-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide mb-1">
            {results.selected.name.split(' ')[0]} revenue
          </div>
          <div className="text-xl font-bold text-purple-900">
            {fmtShortUSD(results.selected.totalRevenueUSD)}
          </div>
          <div className="text-[10px] text-purple-600">
            ≈ {fmtLocal(results.selected.totalRevenueUSD, country)}
          </div>
        </div>
        <div className="bg-amber-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Rate</div>
          <div className="text-xl font-bold text-amber-900">
            ${results.selected.price}/t
          </div>
          <div className="text-[10px] text-amber-600">{results.selected.desc.split('. ')[0]}</div>
        </div>
      </div>

      {/* ── Comparison table: all standards ── */}
      <div className="bg-paper-200 rounded-card overflow-hidden mb-6">
        <div className="px-4 py-2.5 bg-paper-200 border-b border-ink/10 text-xs font-semibold text-ink-700">
          Revenue comparison across standards
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th className="text-left px-4 py-2 font-medium text-ink-500">Standard</th>
                <th className="text-right px-4 py-2 font-medium text-ink-500">Price/t CO₂</th>
                <th className="text-right px-4 py-2 font-medium text-ink-500">Total CO₂</th>
                <th className="text-right px-4 py-2 font-medium text-ink-500">Revenue (USD)</th>
                <th className="text-right px-4 py-2 font-medium text-ink-500">Revenue ({CURRENCY[country]})</th>
              </tr>
            </thead>
            <tbody>
              {results.projections.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-ink/5 cursor-pointer ${
                    p.id === selectedStandard ? 'bg-brand-50' : 'hover:bg-paper-200'
                  }`}
                  onClick={() => setSelectedStandard(p.id)}
                >
                  <td className="px-4 py-2 font-medium text-ink">{p.name}</td>
                  <td className="text-right px-4 py-2 tabular-nums">${p.price}</td>
                  <td className="text-right px-4 py-2 tabular-nums">{p.totalCO2.toFixed(1)} t</td>
                  <td className="text-right px-4 py-2 tabular-nums font-semibold">{fmtShortUSD(p.totalRevenueUSD)}</td>
                  <td className="text-right px-4 py-2 tabular-nums">{fmtLocal(p.totalRevenueUSD, country)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Chart: selected standard revenue over time ── */}
      <h3 className="text-sm font-semibold text-ink mb-2">
        {results.selected.name}, credit revenue projection
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={results.selected.yearlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="rev" tick={{ fontSize: 10 }} tickFormatter={(v) => fmtShortUSD(v)} />
          <YAxis yAxisId="co2" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} t`} />
          <Tooltip
            formatter={(v: number, name: string) =>
              name === 'revenue' ? [fmtShortUSD(v), 'Credit revenue'] : [`${v} t`, 'CO₂ avoided']
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="rev" dataKey="revenue" fill="#10b981" radius={[3, 3, 0, 0]} name="Credit revenue (USD)" />
          <Bar yAxisId="co2" dataKey="co2" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="CO₂ avoided (t)" />
        </BarChart>
      </ResponsiveContainer>

      {/* ── Note ── */}
      <p className="text-[10px] text-ink-400 mt-3">
        Carbon credit prices are indicative 2024/25 averages. Actual revenue depends on project registration, verification, and market conditions.
        Grid emission factors sourced from IEA 2023 country data.
      </p>
    </div>
  )
}
