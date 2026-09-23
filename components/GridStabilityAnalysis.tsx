'use client'

import { useState, useMemo } from 'react'
import InfoTooltip from '@/components/InfoTooltip'
import type { Country } from '@/types/bess'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'
import { CHART } from '@/lib/chart-theme'

/* ── Country grid data ───────────────────────────────────────────── */

const GRID_DATA: Record<Country, {
  peakDemandGw: number
  installedRenewableGw: number
  renewablePct: number
  curtailmentPct: number
  frequencyDeviationMhz: number
  reserveMarginPct: number
}> = {
  SG: { peakDemandGw: 7.3, installedRenewableGw: 1.2, renewablePct: 5, curtailmentPct: 1.5, frequencyDeviationMhz: 15, reserveMarginPct: 30 },
  MY: { peakDemandGw: 19.1, installedRenewableGw: 3.5, renewablePct: 8, curtailmentPct: 4, frequencyDeviationMhz: 25, reserveMarginPct: 25 },
  ID: { peakDemandGw: 42, installedRenewableGw: 5.2, renewablePct: 12, curtailmentPct: 8, frequencyDeviationMhz: 40, reserveMarginPct: 20 },
  TH: { peakDemandGw: 30.5, installedRenewableGw: 8.5, renewablePct: 15, curtailmentPct: 5, frequencyDeviationMhz: 20, reserveMarginPct: 22 },
  VN: { peakDemandGw: 45, installedRenewableGw: 25, renewablePct: 27, curtailmentPct: 12, frequencyDeviationMhz: 35, reserveMarginPct: 18 },
  PH: { peakDemandGw: 15.5, installedRenewableGw: 4.8, renewablePct: 22, curtailmentPct: 6, frequencyDeviationMhz: 30, reserveMarginPct: 15 },
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  country: Country
}

export default function GridStabilityAnalysis({ country }: Props) {
  const [storageMwh, setStorageMwh] = useState(500)
  const [dischargeDurationHr, setDischargeDurationHr] = useState(4)
  const [distributedPct, setDistributedPct] = useState(30) // % of storage that's distributed (vs utility-scale)

  const grid = GRID_DATA[country]

  const results = useMemo(() => {
    const storageMw = storageMwh / dischargeDurationHr
    const storagGw = storageMw / 1000

    // Peak demand reduction
    const peakReductionGw = storagGw * 0.85 // 85% round-trip
    const peakReductionPct = (peakReductionGw / grid.peakDemandGw) * 100

    // Renewable curtailment reduction
    // Storage absorbs excess renewable generation
    const absorbableGwh = storageMwh / 1000 // GWh per cycle
    const annualCurtailedGwh = grid.installedRenewableGw * 365 * 4 * (grid.curtailmentPct / 100) // Rough: 4 peak sun hours
    const curtailmentReductionGwh = Math.min(absorbableGwh * 365, annualCurtailedGwh)
    const newCurtailmentPct = annualCurtailedGwh > 0
      ? Math.max(0, grid.curtailmentPct - (curtailmentReductionGwh / annualCurtailedGwh) * grid.curtailmentPct)
      : grid.curtailmentPct

    // Frequency stability improvement
    // Fast-response BESS reduces frequency deviation
    const frequencyImprovementPct = Math.min(60, (storageMw / (grid.peakDemandGw * 1000)) * 100 * 15)
    const newFreqDeviation = grid.frequencyDeviationMhz * (1 - frequencyImprovementPct / 100)

    // Reserve margin improvement
    const newReserveMargin = grid.reserveMarginPct + (storagGw / grid.peakDemandGw) * 100

    // Distributed resilience (distributed storage provides local stability)
    const distributedMwh = storageMwh * (distributedPct / 100)
    const householdsProtected = Math.round(distributedMwh / 13.5) // ~13.5 kWh per household
    const localBlackoutReduction = Math.min(80, distributedPct * 1.5)

    // 24-hour grid profile (simulated)
    const hourlyData: { hour: string; demand: number; renewable: number; storage: number; net: number }[] = []
    for (let h = 0; h < 24; h++) {
      // Demand curve: peak at 14:00-18:00
      const demandFactor = h < 6 ? 0.6 : h < 10 ? 0.8 : h < 14 ? 0.9 : h < 18 ? 1.0 : h < 22 ? 0.85 : 0.65
      const demand = grid.peakDemandGw * demandFactor

      // Renewable: peak at 10:00-14:00 (solar-dominated)
      const renewableFactor = h < 6 ? 0.05 : h < 8 ? 0.3 : h < 10 ? 0.7 : h < 14 ? 1.0 : h < 16 ? 0.7 : h < 18 ? 0.3 : 0.05
      const renewable = grid.installedRenewableGw * renewableFactor

      // Storage: charges during solar peak, discharges during demand peak
      const storageFactor = h < 6 ? 0 : h < 10 ? -0.5 : h < 14 ? -1.0 : h < 18 ? 0.8 : h < 22 ? 0.4 : 0
      const storage = storagGw * storageFactor // negative = charging

      hourlyData.push({
        hour: `${h.toString().padStart(2, '0')}:00`,
        demand: Math.round(demand * 100) / 100,
        renewable: Math.round(renewable * 100) / 100,
        storage: Math.round(storage * 1000) / 1000,
        net: Math.round((demand - renewable - storage) * 100) / 100,
      })
    }

    return {
      storageMw,
      peakReductionGw,
      peakReductionPct,
      newCurtailmentPct,
      curtailmentReductionGwh,
      frequencyImprovementPct,
      newFreqDeviation,
      newReserveMargin,
      householdsProtected,
      localBlackoutReduction,
      hourlyData,
    }
  }, [storageMwh, dischargeDurationHr, distributedPct, grid])

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
      <h2 className="text-lg font-semibold text-ink mb-1">
        Grid Stability Analysis{' '}
        <InfoTooltip content="Model how adding X MWh of distributed + utility-scale storage affects grid peak demand, renewable curtailment, frequency stability, and reserve margins. Based on real grid parameters for each SEA country." />
      </h2>
      <p className="text-sm text-ink-500 mb-6">
        See how battery storage strengthens the grid, including peak shaving and frequency regulation.
      </p>

      {/* ── Inputs ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Total storage (MWh){' '}
            <InfoTooltip content="Total battery storage capacity added to the grid. Can be a mix of utility-scale and distributed residential/commercial systems." />
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min="50" max="5000" step="50" value={storageMwh}
              onChange={(e) => setStorageMwh(Number(e.target.value))}
              className="flex-1 accent-brand-600" />
            <span className="text-sm font-medium text-ink w-20 text-right">{storageMwh} MWh</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Discharge duration (hrs){' '}
            <InfoTooltip content="How many hours the storage can discharge at full power. 2h = frequency regulation, 4h = peak shaving, 8h = renewable firming." />
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min="1" max="8" step="1" value={dischargeDurationHr}
              onChange={(e) => setDischargeDurationHr(Number(e.target.value))}
              className="flex-1 accent-brand-600" />
            <span className="text-sm font-medium text-ink w-12 text-right">{dischargeDurationHr}h</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Distributed share (%){' '}
            <InfoTooltip content="What percentage of total storage is behind-the-meter (residential/commercial). Higher distributed % = better local resilience during grid outages." />
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="100" step="5" value={distributedPct}
              onChange={(e) => setDistributedPct(Number(e.target.value))}
              className="flex-1 accent-brand-600" />
            <span className="text-sm font-medium text-ink w-12 text-right">{distributedPct}%</span>
          </div>
        </div>
      </div>

      {/* ── Before/After metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-brand-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-brand-700 uppercase tracking-wide mb-1">Peak shaving</div>
          <div className="text-xl font-bold text-brand-900">
            {results.peakReductionPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-brand-600">
            −{results.peakReductionGw.toFixed(2)} GW off peak
          </div>
          <div className="mt-2 h-2 bg-paper-300 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(100, results.peakReductionPct * 5)}%` }} />
          </div>
        </div>

        <div className="bg-blue-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Curtailment</div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-ink-400 line-through">{grid.curtailmentPct}%</span>
            <span className="text-xl font-bold text-blue-900">{results.newCurtailmentPct.toFixed(1)}%</span>
          </div>
          <div className="text-[10px] text-blue-600">
            {results.curtailmentReductionGwh.toFixed(0)} GWh/yr saved
          </div>
        </div>

        <div className="bg-purple-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide mb-1">Frequency</div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-ink-400 line-through">±{grid.frequencyDeviationMhz}mHz</span>
            <span className="text-xl font-bold text-purple-900">±{results.newFreqDeviation.toFixed(0)}mHz</span>
          </div>
          <div className="text-[10px] text-purple-600">
            {results.frequencyImprovementPct.toFixed(0)}% improvement
          </div>
        </div>

        <div className="bg-amber-50 rounded-card p-4">
          <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Resilience</div>
          <div className="text-xl font-bold text-amber-900">
            {results.householdsProtected.toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-600">
            Households with backup
          </div>
          <div className="text-[10px] text-amber-500 mt-0.5">
            −{results.localBlackoutReduction.toFixed(0)}% local outage impact
          </div>
        </div>
      </div>

      {/* ── 24h grid profile chart ── */}
      <h3 className="text-sm font-semibold text-ink mb-2">
        24-hour grid profile with storage{' '}
        <InfoTooltip content="Simulated daily grid profile: demand curve (terracotta), renewable generation (gold), and storage dispatch (emerald, negative=charging). Shows how BESS flattens the demand curve and absorbs renewable oversupply." />
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={results.hourlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis dataKey="hour" tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} interval={2} />
          <YAxis tick={{ fill: CHART.axis, fontSize: CHART.axisFontSize }} tickFormatter={(v) => `${v} GW`} />
          <ChartHoverTooltip formatter={(v: number, name: string) => [`${v.toFixed(2)} GW`, name]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke={CHART.grid} />
          <Area type="monotone" dataKey="demand" fill={CHART.negative} stroke={CHART.negative} strokeWidth={2} name="Demand" fillOpacity={0.3} />
          <Area type="monotone" dataKey="renewable" fill={CHART.highlight} stroke={CHART.highlight} strokeWidth={2} name="Renewable" fillOpacity={0.4} />
          <Area type="monotone" dataKey="storage" fill={CHART.primary} stroke={CHART.primary} strokeWidth={2} name="Storage" fillOpacity={0.4} />
          <Line type="monotone" dataKey="net" stroke={CHART.comparison} strokeWidth={1.5} strokeDasharray="4 4" name="Net demand" dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      {/* ── Grid baseline info ── */}
      <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-ink-500">
        <div>Peak demand: <strong className="text-ink">{grid.peakDemandGw} GW</strong></div>
        <div>Renewable: <strong className="text-ink">{grid.installedRenewableGw} GW</strong></div>
        <div>RE share: <strong className="text-ink">{grid.renewablePct}%</strong></div>
        <div>Curtailment: <strong className="text-ink">{grid.curtailmentPct}%</strong></div>
        <div>Freq. dev: <strong className="text-ink">±{grid.frequencyDeviationMhz}mHz</strong></div>
        <div>Reserve: <strong className="text-ink">{grid.reserveMarginPct}%</strong></div>
      </div>
    </div>
  )
}
