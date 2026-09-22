'use client'

import { memo } from 'react'
import type { Country } from '@/types/bess'
import { CURRENCY_SYMBOLS } from '@/lib/constants'

export interface BuildingSnapshot {
  id: string
  label: string
  mode: 'retrofit' | 'new'
  units: number
  roofArea: number
  roofQuality: string
  solarKw: number
  batteryName: string
  batteryQty: number
  batteryCapacityKwh: number
  totalSystemCost: number
  costPerUnit: number
  monthlySavings: number
  paybackYears: number
  blackoutHours: number
  co2Avoided: number
  zeroBillDays: number
  coverage: number
  discount: number
}

function fmt(amount: number, country: Country, digits = 0) {
  return `${CURRENCY_SYMBOLS[country]}${amount.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}`
}

function fmtShort(n: number, country: Country): string {
  if (country === 'ID' || country === 'VN') {
    if (Math.abs(n) >= 1e9) return `${CURRENCY_SYMBOLS[country]}${(n / 1e9).toFixed(1)}B`
    if (Math.abs(n) >= 1e6) return `${CURRENCY_SYMBOLS[country]}${(n / 1e6).toFixed(1)}M`
    if (Math.abs(n) >= 1e3) return `${CURRENCY_SYMBOLS[country]}${(n / 1e3).toFixed(0)}K`
  }
  if (Math.abs(n) >= 1e6) return `${CURRENCY_SYMBOLS[country]}${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `${CURRENCY_SYMBOLS[country]}${(n / 1e3).toFixed(1)}K`
  return fmt(n, country)
}

interface MetricRow {
  label: string
  key: keyof BuildingSnapshot
  format: (val: any, country: Country) => string
  higherIsBetter?: boolean // for diff highlighting
}

const METRICS: MetricRow[] = [
  { label: 'Mode', key: 'mode', format: (v) => v === 'retrofit' ? 'Retrofit' : 'New Dev' },
  { label: 'Units', key: 'units', format: (v) => `${v}` },
  { label: 'Roof area', key: 'roofArea', format: (v) => `${v.toLocaleString()} m²` },
  { label: 'Solar capacity', key: 'solarKw', format: (v) => `${Math.round(v)} kW` },
  { label: 'Battery', key: 'batteryName', format: (v) => v || '—' },
  { label: 'Battery total', key: 'batteryCapacityKwh', format: (v) => `${Math.round(v)} kWh` },
  { label: 'System cost', key: 'totalSystemCost', format: (v, c) => fmtShort(v, c) },
  { label: 'Cost / unit', key: 'costPerUnit', format: (v, c) => fmt(v, c, 0) },
  { label: 'Monthly saving', key: 'monthlySavings', format: (v, c) => fmt(v, c, 0), higherIsBetter: true },
  { label: 'Payback', key: 'paybackYears', format: (v) => `${v.toFixed(1)} yrs`, higherIsBetter: false },
  { label: 'Blackout cover', key: 'blackoutHours', format: (v) => `${v.toFixed(1)} hrs`, higherIsBetter: true },
  { label: 'CO₂ avoided', key: 'co2Avoided', format: (v) => `${(v / 1000).toFixed(1)} t/yr`, higherIsBetter: true },
  { label: 'Zero-bill days', key: 'zeroBillDays', format: (v) => `${v} days`, higherIsBetter: true },
  { label: 'Coverage', key: 'coverage', format: (v) => `${Math.round(v * 100)}%`, higherIsBetter: true },
  { label: 'Bulk discount', key: 'discount', format: (v) => `${Math.round(v * 100)}%`, higherIsBetter: true },
]

function getBestIdx(values: number[], higherIsBetter: boolean): number {
  if (values.length === 0) return -1
  const fn = higherIsBetter ? Math.max : Math.min
  const best = fn(...values)
  return values.indexOf(best)
}

interface Props {
  snapshots: BuildingSnapshot[]
  country: Country
  onRemove: (id: string) => void
}

const BuildingComparison = memo(function BuildingComparison({ snapshots, country, onRemove }: Props) {
  if (snapshots.length < 2) return null

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-5 mt-8 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-ink">Building comparison</h3>
          <p className="text-xs text-ink-500">Side-by-side analysis of your saved configurations</p>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-semibold text-brand-700 bg-brand-50 rounded-full">
          {snapshots.length} configs
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10">
            <th className="text-left py-2 pr-4 text-xs font-semibold text-ink-500 uppercase tracking-wide w-36">Metric</th>
            {snapshots.map((s) => (
              <th key={s.id} className="text-center py-2 px-3 min-w-[140px]">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-ink">{s.label}</span>
                  <button
                    onClick={() => onRemove(s.id)}
                    className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((metric) => {
            const numericValues = metric.higherIsBetter !== undefined
              ? snapshots.map((s) => Number(s[metric.key]) || 0)
              : []
            const bestIdx = metric.higherIsBetter !== undefined
              ? getBestIdx(numericValues, metric.higherIsBetter)
              : -1

            return (
              <tr key={metric.key} className="border-b border-ink/5 last:border-0">
                <td className="py-2.5 pr-4 text-xs font-medium text-ink-600">{metric.label}</td>
                {snapshots.map((s, idx) => {
                  const isBest = bestIdx === idx && snapshots.length > 1
                  return (
                    <td
                      key={s.id}
                      className={`py-2.5 px-3 text-center text-xs font-medium ${
                        isBest ? 'text-brand-700 bg-brand-50 font-bold' : 'text-ink-800'
                      }`}
                    >
                      {metric.format(s[metric.key], country)}
                      {isBest && ' ★'}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

export default BuildingComparison
