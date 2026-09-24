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
import { CHART } from '@/lib/chart-theme'
import { RESIDENTIAL_TARIFF, RESIDENTIAL_TARIFF_NOTE, CO2_GRID_FACTOR, RATE_VERIFIED_ON } from '@/data/rates'

/* ── Constants ────────────────────────────────────────────────────── */

const CURRENCY: Record<Country, string> = {
  MY: 'RM', SG: 'S$', ID: 'Rp', TH: '฿', VN: '₫', PH: '₱',
}

// Solar yield kWh/kWp/year
const SOLAR_YIELD: Record<Country, number> = {
  MY: 1400, SG: 1350, ID: 1500, TH: 1450, VN: 1400, PH: 1500,
}

const TARIFF = RESIDENTIAL_TARIFF

// Solar cost per kWp installed (local currency)
const SOLAR_COST: Record<Country, number> = {
  MY: 4500, SG: 2800, ID: 12000000, TH: 35000, VN: 22000000, PH: 60000,
}

// BESS cost per kWh (residential, local currency)
const BESS_COST: Record<Country, number> = {
  MY: 2800, SG: 1800, ID: 8500000, TH: 18000, VN: 12000000, PH: 35000,
}

const GRID_EF = CO2_GRID_FACTOR

// EV consumption kWh/100km
const EV_CONSUMPTION = 16

// EV charger cost (local currency, Level 2)
const EV_CHARGER_COST: Record<Country, number> = {
  MY: 3500, SG: 2500, ID: 8000000, TH: 25000, VN: 15000000, PH: 40000,
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

/* ── Scenarios ────────────────────────────────────────────────────── */

type ScenarioId = 'solar' | 'solar_bess' | 'solar_bess_ev'

const SCENARIO_META: Record<ScenarioId, { label: string; icon: string; color: string; description: string }> = {
  solar: { label: 'Solar Only', icon: '☀️', color: '#f59e0b', description: 'Rooftop solar panels. Surplus goes to the grid or is curtailed' },
  solar_bess: { label: 'Solar + BESS', icon: '🔋', color: '#10b981', description: 'Add battery to store daytime solar for night use' },
  solar_bess_ev: { label: 'Solar + BESS + EV', icon: '⚡', color: '#6366f1', description: 'Solar, a battery, and an EV. Charge the EV from stored solar' },
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  country: Country
}

export default function ScenarioComparisonTool({ country }: Props) {
  const [solarKwp, setSolarKwp] = useState(8)
  const [batteryKwh, setBatteryKwh] = useState(13.5)
  const [dailyLoadKwh, setDailyLoadKwh] = useState(25)
  const [evKmPerDay, setEvKmPerDay] = useState(40)
  const [years, setYears] = useState(20)

  const scenarios = useMemo(() => {
    const tariff = TARIFF[country]
    const solarYield = SOLAR_YIELD[country]
    const ef = GRID_EF[country]

    const annualSolarKwh = solarKwp * solarYield
    const dailySolarKwh = annualSolarKwh / 365
    const annualLoadKwh = dailyLoadKwh * 365
    const evDailyKwh = (evKmPerDay * EV_CONSUMPTION) / 100

    function calc(id: ScenarioId) {
      const hasBess = id === 'solar_bess' || id === 'solar_bess_ev'
      const hasEv = id === 'solar_bess_ev'
      const totalDailyLoad = dailyLoadKwh + (hasEv ? evDailyKwh : 0)

      // Self-consumption ratio — solar only ~40%, with BESS ~75%, with EV ~85%
      const selfConsumptionRatio = id === 'solar' ? 0.40 : id === 'solar_bess' ? 0.75 : 0.85
      const selfConsumedKwh = Math.min(dailySolarKwh * selfConsumptionRatio, totalDailyLoad)
      const gridKwh = Math.max(0, totalDailyLoad - selfConsumedKwh)

      const annualSelfConsumed = selfConsumedKwh * 365
      const annualGrid = gridKwh * 365
      const annualBill = annualGrid * tariff
      const baselineBill = totalDailyLoad * 365 * tariff
      const annualSavings = baselineBill - annualBill

      // Upfront cost
      const solarCost = solarKwp * SOLAR_COST[country]
      const bessCost = hasBess ? batteryKwh * BESS_COST[country] : 0
      const evChargerCost = hasEv ? EV_CHARGER_COST[country] : 0
      const totalCost = solarCost + bessCost + evChargerCost

      // Payback
      const paybackYears = annualSavings > 0 ? totalCost / annualSavings : 999

      // CO₂
      const annualCO2Avoided = annualSelfConsumed * ef / 1000 // tonnes
      const totalCO2 = annualCO2Avoided * years

      // Resilience (blackout hours covered by BESS)
      const blackoutHours = hasBess ? (batteryKwh * 0.9) / (totalDailyLoad / 24) : 0

      // Self-sufficiency
      const selfSufficiency = totalDailyLoad > 0 ? (selfConsumedKwh / totalDailyLoad) * 100 : 0

      // Yearly cashflow for chart
      const yearlyData: { year: string; savings: number; cumulative: number }[] = []
      let cumSavings = -totalCost
      for (let y = 1; y <= years; y++) {
        const deg = Math.pow(0.995, y - 1) // 0.5% solar degradation
        const ySavings = annualSavings * deg
        cumSavings += ySavings
        yearlyData.push({ year: `Y${y}`, savings: Math.round(ySavings), cumulative: Math.round(cumSavings) })
      }

      return {
        id,
        totalCost,
        annualSavings,
        paybackYears,
        annualCO2Avoided,
        totalCO2,
        blackoutHours: Math.round(blackoutHours),
        selfSufficiency: Math.round(selfSufficiency),
        annualBill,
        baselineBill,
        gridBills: annualBill * years,
        yearlyData,
      }
    }

    return (['solar', 'solar_bess', 'solar_bess_ev'] as ScenarioId[]).map(calc)
  }, [country, solarKwp, batteryKwh, dailyLoadKwh, evKmPerDay, years])

  const gridOnlyBill = dailyLoadKwh * 365 * TARIFF[country] * years
  const twentyYearCost = [
    { name: 'Grid only', Equipment: 0, 'Grid bills': Math.round(gridOnlyBill) },
    ...scenarios.map((s) => ({
      name: SCENARIO_META[s.id].label.replaceAll(' + ', '+'),
      Equipment: Math.round(s.totalCost),
      'Grid bills': Math.round(s.gridBills),
    })),
  ]

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
      <h2 className="text-lg font-semibold text-ink mb-1">
        Scenario Comparison{' '}
        <InfoTooltip content="Compare staying on the grid with Solar Only, Solar + Battery, and Solar + Battery + EV. The 20-year cost bar is equipment plus electricity still bought from the grid. Grid only is this house's bill, with no solar, battery, or EV." />
      </h2>
      <p className="text-sm text-ink-500 mb-6">
        How much more value does a battery (and EV) add on top of solar?
      </p>

      {/* ── Inputs ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">Solar (kWp)</label>
          <input type="number" value={solarKwp} onChange={(e) => setSolarKwp(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">Battery (kWh)</label>
          <input type="number" value={batteryKwh} onChange={(e) => setBatteryKwh(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">Daily load (kWh)</label>
          <input type="number" value={dailyLoadKwh} onChange={(e) => setDailyLoadKwh(Math.max(5, Number(e.target.value)))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">EV km/day</label>
          <input type="number" value={evKmPerDay} onChange={(e) => setEvKmPerDay(Math.max(0, Number(e.target.value)))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">Years</label>
          <input type="number" value={years} onChange={(e) => setYears(Math.max(5, Math.min(30, Number(e.target.value))))}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      {/* ── Scenario cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scenarios.map((s) => {
          const meta = SCENARIO_META[s.id]
          return (
            <div key={s.id} className="border-t-[3px] rounded-card p-4 bg-paper-200 hover:bg-paper-300 transition-colors" style={{ borderTopColor: meta.color }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{meta.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-ink">{meta.label}</div>
                  <div className="text-[10px] text-ink-500">{meta.description}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Upfront cost</span>
                  <span className="font-semibold text-ink">{fmtShort(s.totalCost, country)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Annual savings</span>
                  <span className="font-semibold text-brand-700">{fmtShort(s.annualSavings, country)}/yr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Payback</span>
                  <span className="font-semibold text-ink">{s.paybackYears < 50 ? `${s.paybackYears.toFixed(1)} yrs` : '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Self-sufficiency</span>
                  <span className="font-semibold text-blue-700">{s.selfSufficiency}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">CO₂ avoided ({years}yr)</span>
                  <span className="font-semibold text-purple-700">{s.totalCO2.toFixed(1)} t</span>
                </div>
                {s.blackoutHours > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-500">Blackout cover</span>
                    <span className="font-semibold text-amber-700">{s.blackoutHours} hrs</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Side-by-side bar charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">Cost vs savings</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={scenarios.map((s) => ({
              name: SCENARIO_META[s.id].label.replaceAll(' + ', '+'),
              'Upfront cost': s.totalCost,
              [`${years}yr savings`]: s.annualSavings * years,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="name" tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} />
              <YAxis tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} tickFormatter={(v) => fmtShort(v, country)} />
              <ChartHoverTooltip formatter={(v: number) => fmtShort(v, country)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Upfront cost" fill={CHART.negative} radius={[3, 3, 0, 0]} />
              <Bar dataKey={`${years}yr savings`} fill={CHART.primary} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">CO₂ &amp; self-sufficiency</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={scenarios.map((s) => ({
              name: SCENARIO_META[s.id].label.replaceAll(' + ', '+'),
              'CO₂ avoided (t)': Math.round(s.totalCO2 * 10) / 10,
              'Self-sufficiency %': s.selfSufficiency,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="name" tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} />
              <YAxis tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} />
              <ChartHoverTooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="CO₂ avoided (t)" fill={CHART.primary} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Self-sufficiency %" fill={CHART.highlight} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-ink mb-1">20-year cost</h3>
        <p className="text-xs text-ink-500 mb-2">
          Equipment plus the electricity still bought from the grid. Grid only is this house&apos;s bill with no solar, battery, or EV.
          The EV bar adds the car&apos;s home charging and a charger. Petrol is not included. Today&apos;s tariff, held flat for {years} years.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={twentyYearCost}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis dataKey="name" tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} />
            <YAxis tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} tickFormatter={(v) => fmtShort(v, country)} />
            <ChartHoverTooltip formatter={(v: number) => fmtShort(v, country)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Equipment" stackId="cost" fill={CHART.negative} />
            <Bar dataKey="Grid bills" stackId="cost" fill={CHART.comparison} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-ink-400 mt-4">
        * Electricity tariff: {RESIDENTIAL_TARIFF_NOTE[country]} Last verified {RATE_VERIFIED_ON}.
      </p>
    </div>
  )
}
