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
  Legend,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'
import { CO2_GRID_FACTOR } from '@/data/rates'

const GRID_EMISSION_FACTOR = CO2_GRID_FACTOR

const CURRENCY: Record<Country, string> = {
  MY: 'RM', SG: 'S$', ID: 'Rp', TH: '฿', VN: '₫', PH: '₱',
}

// Typical grid-scale BESS capex per kWh (local currency)
const CAPEX_PER_KWH: Record<Country, number> = {
  MY: 800, SG: 600, ID: 3_000_000, TH: 6_000, VN: 4_000_000, PH: 12_000,
}

// Avg avoided peak-generation cost per kWh (local currency)
const AVOIDED_PEAK_COST: Record<Country, number> = {
  MY: 0.45, SG: 0.35, ID: 1_500, TH: 3.2, VN: 2_000, PH: 8.5,
}

function fmt(n: number, country: Country, digits = 0): string {
  return `${CURRENCY[country]}${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
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

/* ── Component ─────────────────────────────────────────────────────── */

interface Props {
  country: Country
}

export default function SubsidyROICalculator({ country }: Props) {
  const [subsidyPerKwh, setSubsidyPerKwh] = useState(100) // local currency / kWh subsidy
  const [budgetTotal, setBudgetTotal] = useState(50_000_000) // total government budget
  const [systemLifeYears, setSystemLifeYears] = useState(15)
  const [cyclesPerYear, setCyclesPerYear] = useState(365)

  // Adjust defaults for high-denomination currencies
  const budgetMin = country === 'ID' || country === 'VN' ? 100_000_000_000 : 10_000_000
  const budgetMax = country === 'ID' || country === 'VN' ? 10_000_000_000_000 : 500_000_000
  const budgetStep = country === 'ID' || country === 'VN' ? 100_000_000_000 : 5_000_000
  const subsidyMin = country === 'ID' ? 100_000 : country === 'VN' ? 200_000 : 20
  const subsidyMax = country === 'ID' ? 2_000_000 : country === 'VN' ? 3_000_000 : 400
  const subsidyStep = country === 'ID' ? 50_000 : country === 'VN' ? 100_000 : 10

  // Reset values when country changes in a sensible range
  const effectiveSubsidy = Math.min(Math.max(subsidyPerKwh, subsidyMin), subsidyMax)
  const effectiveBudget = Math.min(Math.max(budgetTotal, budgetMin), budgetMax)

  const results = useMemo(() => {
    const capex = CAPEX_PER_KWH[country]
    const ef = GRID_EMISSION_FACTOR[country]
    const avoidedCost = AVOIDED_PEAK_COST[country]
    const sub = effectiveSubsidy
    const budget = effectiveBudget

    // How many kWh of BESS does the budget trigger?
    // Subsidy covers 'sub' per kWh of the total capex.
    // Budget / sub = total kWh subsidized.
    const totalKwhSubsidized = budget / sub
    const totalMwhSubsidized = totalKwhSubsidized / 1000

    // Number of 100 kWh "installations" triggered (typical commercial unit)
    const installationsTriggered = Math.floor(totalKwhSubsidized / 100)

    // Total capex mobilized (developer also pays rest)
    const totalCapexMobilized = totalKwhSubsidized * capex

    // Private capital mobilized = total capex - subsidy budget
    const privateCapital = totalCapexMobilized - budget
    const leverageRatio = budget > 0 ? totalCapexMobilized / budget : 0

    // CO₂ reduction over system life
    // Each kWh of BESS × cycles/year × system life × round-trip eff × grid emission factor
    const totalEnergyKwh = totalKwhSubsidized * cyclesPerYear * systemLifeYears * 0.85
    const co2TonnesAvoided = (totalEnergyKwh * ef) / 1_000_000 // kg → tonnes

    // Cost per tonne CO₂ avoided (subsidy budget / CO₂ tonnes)
    const costPerTonneCO2 = co2TonnesAvoided > 0 ? budget / co2TonnesAvoided : 0

    // Grid savings (avoided peak generation)
    const gridSavings = totalEnergyKwh * avoidedCost

    // Breakout by year
    const annualData: { year: string; co2: number; gridSavings: number }[] = []
    for (let y = 1; y <= Math.min(systemLifeYears, 20); y++) {
      const deg = Math.pow(0.975, y - 1)
      const annualEnergy = totalKwhSubsidized * cyclesPerYear * 0.85 * deg
      annualData.push({
        year: `Y${y}`,
        co2: Math.round((annualEnergy * ef) / 1_000_000),
        gridSavings: Math.round(annualEnergy * avoidedCost),
      })
    }

    return {
      totalKwhSubsidized,
      totalMwhSubsidized,
      installationsTriggered,
      totalCapexMobilized,
      privateCapital,
      leverageRatio,
      co2TonnesAvoided: Math.round(co2TonnesAvoided),
      costPerTonneCO2,
      gridSavings,
      annualData,
    }
  }, [country, effectiveSubsidy, effectiveBudget, systemLifeYears, cyclesPerYear])

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
      <h2 className="text-lg font-semibold text-ink mb-1">
        Subsidy ROI Calculator{' '}
        <InfoTooltip content="Estimate the return on public investment: for a given subsidy budget, how many installations, CO₂ reductions, and grid savings does the government achieve? Key metric: cost per tonne CO₂ avoided." />
      </h2>
      <p className="text-sm text-ink-500 mb-6">
        Model public spending efficiency: how much CO₂ reduction and grid relief per {CURRENCY[country]} of subsidy?
      </p>

      {/* ── Inputs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Subsidy per kWh{' '}
            <InfoTooltip content="Amount of government grant per kWh of installed BESS capacity. Higher subsidy = more installations triggered per budget." />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range" min={subsidyMin} max={subsidyMax} step={subsidyStep}
              value={effectiveSubsidy}
              onChange={(e) => setSubsidyPerKwh(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <span className="text-sm font-medium text-ink w-24 text-right">{fmt(effectiveSubsidy, country)}/kWh</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Total budget{' '}
            <InfoTooltip content="Total public subsidy budget allocated for BESS incentive programme." />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range" min={budgetMin} max={budgetMax} step={budgetStep}
              value={effectiveBudget}
              onChange={(e) => setBudgetTotal(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <span className="text-sm font-medium text-ink w-24 text-right">{fmtShort(effectiveBudget, country)}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">System life (years)</label>
          <input
            type="number" value={systemLifeYears}
            onChange={(e) => setSystemLifeYears(Math.max(5, Math.min(25, Number(e.target.value))))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Cycles per year</label>
          <input
            type="number" value={cyclesPerYear}
            onChange={(e) => setCyclesPerYear(Math.max(100, Math.min(500, Number(e.target.value))))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* ── Results cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-brand-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-brand-700 uppercase tracking-wide mb-1">Installations</div>
          <div className="text-lg font-bold text-brand-900">{results.installationsTriggered.toLocaleString()}</div>
          <div className="text-[10px] text-brand-600">× 100 kWh units</div>
        </div>
        <div className="bg-blue-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">BESS deployed</div>
          <div className="text-lg font-bold text-blue-900">{results.totalMwhSubsidized.toFixed(1)} MWh</div>
          <div className="text-[10px] text-blue-600">{(results.totalMwhSubsidized / 1000).toFixed(2)} GWh</div>
        </div>
        <div className="bg-purple-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide mb-1">CO₂ avoided</div>
          <div className="text-lg font-bold text-purple-900">{(results.co2TonnesAvoided / 1000).toFixed(1)} kt</div>
          <div className="text-[10px] text-purple-600">Over {systemLifeYears} years</div>
        </div>
        <div className="bg-amber-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Cost per t CO₂</div>
          <div className="text-lg font-bold text-amber-900">{fmtShort(results.costPerTonneCO2, country)}</div>
          <div className="text-[10px] text-amber-600">Subsidy efficiency</div>
        </div>
        <div className="bg-paper-200 rounded-card p-4">
          <div className="text-[10px] font-semibold text-ink-700 uppercase tracking-wide mb-1">Capex mobilised</div>
          <div className="text-lg font-bold text-ink">{fmtShort(results.totalCapexMobilized, country)}</div>
          <div className="text-[10px] text-ink-600">{results.leverageRatio.toFixed(1)}× leverage</div>
        </div>
        <div className="bg-paper-200 rounded-card p-4">
          <div className="text-[10px] font-semibold text-ink-700 uppercase tracking-wide mb-1">Grid savings</div>
          <div className="text-lg font-bold text-ink">{fmtShort(results.gridSavings, country)}</div>
          <div className="text-[10px] text-ink-600">Avoided peak costs</div>
        </div>
      </div>

      {/* ── Annual chart ── */}
      <h3 className="text-sm font-semibold text-ink mb-2">Annual CO₂ reduction vs grid savings</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={results.annualData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="co2" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} t`} />
          <YAxis yAxisId="savings" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => fmtShort(v, country)} />
          <ChartHoverTooltip
            formatter={(v: number, name: string) =>
              name === 'co2' ? [`${v.toLocaleString()} t`, 'CO₂ avoided'] : [fmtShort(v, country), 'Grid savings']
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="co2" dataKey="co2" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="CO₂ avoided (t)" />
          <Bar yAxisId="savings" dataKey="gridSavings" fill="#10b981" radius={[3, 3, 0, 0]} name="Grid savings" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
