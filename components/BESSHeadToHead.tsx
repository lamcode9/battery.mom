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
  Cell,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { CHART } from '@/lib/chart-theme'
import { ChartHoverTooltip } from '@/components/ChartTooltip'

/* ── Product data ─────────────────────────────────────────────────── */

interface Product {
  id: string
  name: string
  manufacturer: string
  chemistry: string
  capacityKwh: number
  powerKw: number
  cycles: number
  warrantyYears: number
  roundTripEfficiency: number
  footprintM2: number
  pricePerKwh: Record<Country, number>
}

const PRODUCTS: Product[] = [
  { id: 'byd-c', name: 'BYD BatteryBox C-Series', manufacturer: 'BYD', chemistry: 'LFP', capacityKwh: 100, powerKw: 50, cycles: 6000, warrantyYears: 10, roundTripEfficiency: 0.93, footprintM2: 1.2, pricePerKwh: { MY: 1100, SG: 850, ID: 3200000, TH: 6500, VN: 4800000, PH: 13000 } },
  { id: 'tesla-mp', name: 'Tesla Megapack', manufacturer: 'Tesla', chemistry: 'LFP', capacityKwh: 3916, powerKw: 1937, cycles: 7000, warrantyYears: 15, roundTripEfficiency: 0.92, footprintM2: 9.5, pricePerKwh: { MY: 800, SG: 620, ID: 2800000, TH: 5800, VN: 4200000, PH: 11500 } },
  { id: 'byd-mc', name: 'BYD MC Cube', manufacturer: 'BYD', chemistry: 'LFP', capacityKwh: 372, powerKw: 186, cycles: 6000, warrantyYears: 15, roundTripEfficiency: 0.93, footprintM2: 4.2, pricePerKwh: { MY: 950, SG: 720, ID: 3000000, TH: 6000, VN: 4500000, PH: 12000 } },
  { id: 'sungrow-pt', name: 'Sungrow PowerTitan', manufacturer: 'Sungrow', chemistry: 'LFP', capacityKwh: 2752, powerKw: 1254, cycles: 8000, warrantyYears: 15, roundTripEfficiency: 0.95, footprintM2: 8.0, pricePerKwh: { MY: 780, SG: 600, ID: 2700000, TH: 5500, VN: 4000000, PH: 11000 } },
  { id: 'catl-ec', name: 'CATL EnerC', manufacturer: 'CATL', chemistry: 'LFP', capacityKwh: 280, powerKw: 125, cycles: 10000, warrantyYears: 15, roundTripEfficiency: 0.94, footprintM2: 2.8, pricePerKwh: { MY: 900, SG: 700, ID: 2900000, TH: 5800, VN: 4300000, PH: 11800 } },
  { id: 'samsung-e3', name: 'Samsung SDI E3', manufacturer: 'Samsung', chemistry: 'NMC', capacityKwh: 156, powerKw: 78, cycles: 4000, warrantyYears: 10, roundTripEfficiency: 0.91, footprintM2: 1.5, pricePerKwh: { MY: 1300, SG: 1000, ID: 3800000, TH: 7800, VN: 5800000, PH: 15000 } },
  { id: 'huawei-luna', name: 'Huawei LUNA Commercial', manufacturer: 'Huawei', chemistry: 'LFP', capacityKwh: 200, powerKw: 100, cycles: 6000, warrantyYears: 10, roundTripEfficiency: 0.93, footprintM2: 1.8, pricePerKwh: { MY: 1050, SG: 800, ID: 3100000, TH: 6200, VN: 4600000, PH: 12500 } },
]

/* ── Helpers ───────────────────────────────────────────────────────── */

const CURRENCY: Record<Country, string> = {
  MY: 'RM', SG: 'S$', ID: 'Rp', TH: '฿', VN: '₫', PH: '₱',
}

function fmt(n: number, country: Country, digits = 0): string {
  return `${CURRENCY[country]}${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

function fmtShort(n: number, country: Country): string {
  const c = CURRENCY[country]
  if (country === 'ID' || country === 'VN') {
    if (Math.abs(n) >= 1e9) return `${c}${(n / 1e9).toFixed(1)}B`
    if (Math.abs(n) >= 1e6) return `${c}${(n / 1e6).toFixed(1)}M`
    return `${c}${(n / 1e3).toFixed(0)}K`
  }
  if (Math.abs(n) >= 1e6) return `${c}${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `${c}${(n / 1e3).toFixed(1)}K`
  return fmt(n, country)
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  country: Country
}

export default function BESSHeadToHead({ country }: Props) {
  const [leftId, setLeftId] = useState(PRODUCTS[0].id)
  const [rightId, setRightId] = useState(PRODUCTS[3].id)

  const left = PRODUCTS.find((p) => p.id === leftId) || PRODUCTS[0]
  const right = PRODUCTS.find((p) => p.id === rightId) || PRODUCTS[3]

  /* Derived metrics */
  const derived = useMemo(() => {
    const calc = (p: Product) => {
      const price = p.capacityKwh * p.pricePerKwh[country]
      const costPerCycleKwh = p.pricePerKwh[country] / p.cycles
      const lifetimeEnergy = p.capacityKwh * p.cycles * p.roundTripEfficiency
      const energyDensity = p.capacityKwh / p.footprintM2
      return { price, costPerCycleKwh, lifetimeEnergy, energyDensity }
    }
    return { left: calc(left), right: calc(right) }
  }, [left, right, country])

  /* Comparison rows */
  interface Row {
    label: string
    leftVal: string
    rightVal: string
    leftNum: number
    rightNum: number
    lowerBetter?: boolean
    unit?: string
  }

  const rows: Row[] = [
    { label: 'Capacity', leftVal: `${left.capacityKwh} kWh`, rightVal: `${right.capacityKwh} kWh`, leftNum: left.capacityKwh, rightNum: right.capacityKwh },
    { label: 'Power', leftVal: `${left.powerKw} kW`, rightVal: `${right.powerKw} kW`, leftNum: left.powerKw, rightNum: right.powerKw },
    { label: 'Warranty cycles', leftVal: left.cycles.toLocaleString(), rightVal: right.cycles.toLocaleString(), leftNum: left.cycles, rightNum: right.cycles },
    { label: 'Warranty years', leftVal: `${left.warrantyYears}`, rightVal: `${right.warrantyYears}`, leftNum: left.warrantyYears, rightNum: right.warrantyYears },
    { label: 'Round-trip eff.', leftVal: `${(left.roundTripEfficiency * 100).toFixed(0)}%`, rightVal: `${(right.roundTripEfficiency * 100).toFixed(0)}%`, leftNum: left.roundTripEfficiency, rightNum: right.roundTripEfficiency },
    { label: 'Footprint', leftVal: `${left.footprintM2} m²`, rightVal: `${right.footprintM2} m²`, leftNum: left.footprintM2, rightNum: right.footprintM2, lowerBetter: true },
    { label: 'Price/kWh', leftVal: fmt(left.pricePerKwh[country], country), rightVal: fmt(right.pricePerKwh[country], country), leftNum: left.pricePerKwh[country], rightNum: right.pricePerKwh[country], lowerBetter: true },
    { label: 'Total price', leftVal: fmtShort(derived.left.price, country), rightVal: fmtShort(derived.right.price, country), leftNum: derived.left.price, rightNum: derived.right.price, lowerBetter: true },
    { label: 'Cost per cycle-kWh', leftVal: fmt(derived.left.costPerCycleKwh, country, 2), rightVal: fmt(derived.right.costPerCycleKwh, country, 2), leftNum: derived.left.costPerCycleKwh, rightNum: derived.right.costPerCycleKwh, lowerBetter: true },
    { label: 'Lifetime energy', leftVal: `${(derived.left.lifetimeEnergy / 1e6).toFixed(1)} GWh`, rightVal: `${(derived.right.lifetimeEnergy / 1e6).toFixed(1)} GWh`, leftNum: derived.left.lifetimeEnergy, rightNum: derived.right.lifetimeEnergy },
    { label: 'Energy density', leftVal: `${derived.left.energyDensity.toFixed(0)} kWh/m²`, rightVal: `${derived.right.energyDensity.toFixed(0)} kWh/m²`, leftNum: derived.left.energyDensity, rightNum: derived.right.energyDensity },
  ]

  function winner(r: Row): 'left' | 'right' | 'tie' {
    if (r.leftNum === r.rightNum) return 'tie'
    if (r.lowerBetter) return r.leftNum < r.rightNum ? 'left' : 'right'
    return r.leftNum > r.rightNum ? 'left' : 'right'
  }

  const leftWins = rows.filter((r) => winner(r) === 'left').length
  const rightWins = rows.filter((r) => winner(r) === 'right').length

  /* Bar chart data for key metrics */
  const barData = [
    { metric: 'Cycles', [left.name.split(' ')[0]]: left.cycles, [right.name.split(' ')[0]]: right.cycles },
    { metric: 'Eff %', [left.name.split(' ')[0]]: left.roundTripEfficiency * 100, [right.name.split(' ')[0]]: right.roundTripEfficiency * 100 },
    { metric: 'Warranty yr', [left.name.split(' ')[0]]: left.warrantyYears, [right.name.split(' ')[0]]: right.warrantyYears },
  ]

  const leftShort = left.name.split(' ')[0]
  const rightShort = right.name.split(' ')[0]

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
      <h2 className="text-lg font-semibold text-ink mb-1">
        BESS Product Head-to-Head{' '}
        <InfoTooltip content="Select any two commercial BESS products to compare specs, pricing, and derived metrics side by side. Green highlight = winner for that row." />
      </h2>
      <p className="text-sm text-ink-500 mb-5">
        Pick two products to compare specs, cost-per-cycle, and lifetime value.
      </p>

      {/* ── Selectors ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1 uppercase tracking-wide">Product A</label>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1 uppercase tracking-wide">Product B</label>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Score ── */}
      <div className="flex items-center justify-center gap-4 mb-5">
        <div className={`text-center px-4 py-2 rounded-lg ${leftWins > rightWins ? 'bg-brand-50' : 'bg-paper-200'}`}>
          <div className="text-xs text-ink-500">{left.manufacturer}</div>
          <div className="text-2xl font-bold text-ink">{leftWins}</div>
          <div className="text-[10px] text-ink-400">wins</div>
        </div>
        <div className="text-lg font-bold text-ink-300">vs</div>
        <div className={`text-center px-4 py-2 rounded-lg ${rightWins > leftWins ? 'bg-brand-50' : 'bg-paper-200'}`}>
          <div className="text-xs text-ink-500">{right.manufacturer}</div>
          <div className="text-2xl font-bold text-ink">{rightWins}</div>
          <div className="text-[10px] text-ink-400">wins</div>
        </div>
      </div>

      {/* ── Comparison table ── */}
      <div className="bg-paper-200 rounded-card overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-paper-200 border-b border-ink/10">
              <th className="text-left px-4 py-2 font-medium text-ink-500 w-36">Spec</th>
              <th className="text-center px-4 py-2 font-medium text-blue-700">{left.name}</th>
              <th className="text-center px-4 py-2 font-medium text-purple-700">{right.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ink/5">
              <td className="px-4 py-2 text-ink-500">Chemistry</td>
              <td className="text-center px-4 py-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{left.chemistry}</span>
              </td>
              <td className="text-center px-4 py-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${right.chemistry === 'LFP' ? 'bg-brand-50 text-brand-700' : 'bg-blue-50 text-blue-700'}`}>{right.chemistry}</span>
              </td>
            </tr>
            {rows.map((r) => {
              const w = winner(r)
              return (
                <tr key={r.label} className="border-b border-ink/5">
                  <td className="px-4 py-2 text-ink-500 text-xs">{r.label}</td>
                  <td className={`text-center px-4 py-2 tabular-nums font-medium ${w === 'left' ? 'text-brand-700 bg-brand-50/50' : 'text-ink'}`}>
                    {r.leftVal} {w === 'left' && <span className="text-brand-500 ml-1">★</span>}
                  </td>
                  <td className={`text-center px-4 py-2 tabular-nums font-medium ${w === 'right' ? 'text-brand-700 bg-brand-50/50' : 'text-ink'}`}>
                    {r.rightVal} {w === 'right' && <span className="text-brand-500 ml-1">★</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Visual bar comparison ── */}
      <h3 className="text-sm font-semibold text-ink mb-2">Key metrics comparison</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={barData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis type="number" tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} />
          <YAxis type="category" dataKey="metric" tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} width={80} />
          <ChartHoverTooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey={leftShort} fill={CHART.highlight} radius={[0, 3, 3, 0]} />
          <Bar dataKey={rightShort} fill={CHART.primary} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
