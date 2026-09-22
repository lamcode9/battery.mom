'use client'

import { useState, useMemo, useCallback } from 'react'
import InfoTooltip from '@/components/InfoTooltip'
import type { Country } from '@/types/bess'

/* ── Types ───────────────────────────────────────────────────────── */

interface TouBand { label: string; startHr: number; endHr: number; rate: number; color: string }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const CURRENCY: Record<Country, string> = {
  MY: 'RM', SG: 'S$', ID: 'Rp', TH: '฿', VN: '₫', PH: '₱',
}

const DEMAND_CHARGE: Record<Country, number> = {
  MY: 45.10, SG: 12.68, ID: 48000, TH: 220, VN: 62000, PH: 520,
}

const TOU_RATES: Record<Country, TouBand[]> = {
  MY: [
    { label: 'Off-peak', startHr: 0, endHr: 8, rate: 0.337, color: '#86efac' },
    { label: 'Mid-peak', startHr: 8, endHr: 14, rate: 0.509, color: '#fde68a' },
    { label: 'Peak', startHr: 14, endHr: 20, rate: 0.612, color: '#fca5a5' },
    { label: 'Mid-peak', startHr: 20, endHr: 22, rate: 0.509, color: '#fde68a' },
    { label: 'Off-peak', startHr: 22, endHr: 24, rate: 0.337, color: '#86efac' },
  ],
  SG: [
    { label: 'Off-peak', startHr: 0, endHr: 7, rate: 0.195, color: '#86efac' },
    { label: 'Shoulder', startHr: 7, endHr: 9, rate: 0.265, color: '#fde68a' },
    { label: 'Peak', startHr: 9, endHr: 18, rate: 0.345, color: '#fca5a5' },
    { label: 'Shoulder', startHr: 18, endHr: 23, rate: 0.265, color: '#fde68a' },
    { label: 'Off-peak', startHr: 23, endHr: 24, rate: 0.195, color: '#86efac' },
  ],
  ID: [
    { label: 'Off-peak (LWBP)', startHr: 0, endHr: 17, rate: 1050, color: '#86efac' },
    { label: 'Peak (WBP)', startHr: 17, endHr: 22, rate: 1890, color: '#fca5a5' },
    { label: 'Off-peak (LWBP)', startHr: 22, endHr: 24, rate: 1050, color: '#86efac' },
  ],
  TH: [
    { label: 'Off-peak', startHr: 0, endHr: 9, rate: 2.93, color: '#86efac' },
    { label: 'Peak', startHr: 9, endHr: 22, rate: 5.11, color: '#fca5a5' },
    { label: 'Off-peak', startHr: 22, endHr: 24, rate: 2.93, color: '#86efac' },
  ],
  VN: [
    { label: 'Off-peak', startHr: 0, endHr: 4, rate: 1220, color: '#86efac' },
    { label: 'Normal', startHr: 4, endHr: 9, rate: 1658, color: '#fde68a' },
    { label: 'Peak', startHr: 9, endHr: 11, rate: 2871, color: '#fca5a5' },
    { label: 'Normal', startHr: 11, endHr: 17, rate: 1658, color: '#fde68a' },
    { label: 'Peak', startHr: 17, endHr: 20, rate: 2871, color: '#fca5a5' },
    { label: 'Normal', startHr: 20, endHr: 22, rate: 1658, color: '#fde68a' },
    { label: 'Off-peak', startHr: 22, endHr: 24, rate: 1220, color: '#86efac' },
  ],
  PH: [
    { label: 'Off-peak', startHr: 0, endHr: 8, rate: 8.20, color: '#86efac' },
    { label: 'Peak', startHr: 8, endHr: 21, rate: 13.50, color: '#fca5a5' },
    { label: 'Off-peak', startHr: 21, endHr: 24, rate: 8.20, color: '#86efac' },
  ],
}

/* ── Demand profile generators ───────────────────────────────────── */

type UseCase = 'office' | 'retail' | 'factory' | 'datacentre'

const PROFILE: Record<UseCase, {
  weekday: (h: number) => number    // 0–1 demand fraction
  weekend: (h: number) => number
}> = {
  office: {
    weekday: (h) => h < 6 ? 0.15 : h < 8 ? 0.35 : h < 12 ? 0.95 : h < 13 ? 0.7 : h < 18 ? 0.95 : h < 20 ? 0.5 : 0.15,
    weekend: (h) => h < 8 ? 0.1 : h < 18 ? 0.25 : 0.1,
  },
  retail: {
    weekday: (h) => h < 7 ? 0.12 : h < 10 ? 0.45 : h < 14 ? 0.85 : h < 18 ? 1.0 : h < 21 ? 0.9 : h < 23 ? 0.6 : 0.15,
    weekend: (h) => h < 8 ? 0.12 : h < 11 ? 0.55 : h < 20 ? 1.0 : h < 22 ? 0.7 : 0.15,
  },
  factory: {
    weekday: (h) => h < 6 ? 0.35 : h < 7 ? 0.85 : h < 18 ? 1.0 : h < 20 ? 0.65 : 0.35,
    weekend: (h) => h < 6 ? 0.3 : h < 18 ? 0.55 : 0.3,
  },
  datacentre: {
    weekday: (h) => h < 6 ? 0.88 : h < 14 ? 0.95 : h < 18 ? 1.0 : h < 22 ? 0.92 : 0.88,
    weekend: (h) => h < 6 ? 0.86 : h < 14 ? 0.9 : h < 18 ? 0.93 : 0.86,
  },
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  country: Country
  peakDemandKw?: number
  targetReductionPct?: number
  useCase?: UseCase
}

export default function DemandChargeHeatmap({ country, peakDemandKw: propPeak, targetReductionPct: propReduction, useCase: propUseCase }: Props) {
  const [useCase, setUseCase] = useState<UseCase>(propUseCase ?? 'office')
  const [peakDemandKw, setPeakDemandKw] = useState(propPeak ?? 150)
  const [targetReductionPct, setTargetReductionPct] = useState(propReduction ?? 30)
  const [showShaving, setShowShaving] = useState(true)
  const [hoverCell, setHoverCell] = useState<{ day: number; hour: number } | null>(null)

  const touBands = TOU_RATES[country]
  const demandCharge = DEMAND_CHARGE[country]
  const cur = CURRENCY[country]

  // Generate 24×7 demand matrix
  const { matrix, maxDemand, shavedMatrix, totalSavedKw, monthlySaving, peakEvents } = useMemo(() => {
    const profile = PROFILE[useCase]
    const mat: number[][] = []
    const shaved: number[][] = []
    const threshold = peakDemandKw * (1 - targetReductionPct / 100)
    let peak = 0
    let totalSaved = 0
    let peakEvts = 0

    for (let d = 0; d < 7; d++) {
      const row: number[] = []
      const sRow: number[] = []
      const isWeekend = d >= 5
      for (let h = 0; h < 24; h++) {
        // Add slight randomness for realism
        const noise = 0.92 + Math.sin(d * 7 + h * 3) * 0.08
        const base = peakDemandKw * (isWeekend ? profile.weekend(h) : profile.weekday(h)) * noise
        row.push(Math.round(base))
        if (base > peak) peak = base
        if (base > threshold) {
          sRow.push(Math.round(threshold))
          totalSaved += (base - threshold)
          peakEvts++
        } else {
          sRow.push(Math.round(base))
        }
      }
      mat.push(row)
      shaved.push(sRow)
    }

    const monthly = (peakDemandKw - threshold) * demandCharge
    return { matrix: mat, maxDemand: peak, shavedMatrix: shaved, totalSavedKw: totalSaved, monthlySaving: monthly, peakEvents: peakEvts }
  }, [useCase, peakDemandKw, targetReductionPct, demandCharge])

  // Color scale for demand
  const getColor = useCallback((kw: number, isShaved: boolean) => {
    const ratio = kw / peakDemandKw
    if (isShaved && showShaving) {
      const threshold = 1 - targetReductionPct / 100
      if (ratio >= threshold * 0.95) {
        return 'bg-blue-200 border-blue-400 border-dashed'
      }
    }
    if (ratio > 0.9) return 'bg-red-500 text-white'
    if (ratio > 0.75) return 'bg-orange-400 text-white'
    if (ratio > 0.6) return 'bg-amber-300 text-ink'
    if (ratio > 0.4) return 'bg-yellow-200 text-ink-700'
    if (ratio > 0.2) return 'bg-lime-100 text-ink-600'
    return 'bg-green-50 text-ink-500'
  }, [peakDemandKw, targetReductionPct, showShaving])

  // TOU band for hour
  const getTouBand = useCallback((h: number) => touBands.find(b => h >= b.startHr && h < b.endHr), [touBands])

  const fmtDemandCharge = (n: number) => {
    if (country === 'ID' || country === 'VN') {
      if (Math.abs(n) >= 1e6) return `${cur}${(n / 1e6).toFixed(1)}M`
      if (Math.abs(n) >= 1e3) return `${cur}${(n / 1e3).toFixed(0)}K`
    }
    if (Math.abs(n) >= 1e3) return `${cur}${(n / 1e3).toFixed(1)}K`
    return `${cur}${n.toFixed(0)}`
  }

  const data = showShaving ? shavedMatrix : matrix

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
      <h2 className="text-lg font-semibold text-ink mb-1">
        Demand Charge Heatmap{' '}
        <InfoTooltip content="Visualize a 24h × 7-day demand profile for your facility type. Red cells are peak demand events that trigger high demand charges. Toggle 'Show battery shaving' to see how BESS clips those peaks." />
      </h2>
      <p className="text-sm text-ink-500 mb-5">
        Identify peak demand events and see how battery shaving reduces your demand charges.
      </p>

      {/* ── Controls ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div>
          <label className="block text-[11px] font-semibold text-ink-500 uppercase tracking-wide mb-1">Facility</label>
          <select value={useCase} onChange={(e) => setUseCase(e.target.value as UseCase)}
            className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm">
            <option value="office">🏢 Office</option>
            <option value="retail">🏬 Retail</option>
            <option value="factory">🏭 Factory</option>
            <option value="datacentre">🖥️ Data Centre</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink-500 uppercase tracking-wide mb-1">Peak demand</label>
          <div className="flex items-center gap-2">
            <input type="range" min="50" max="2000" step="10" value={peakDemandKw}
              onChange={(e) => setPeakDemandKw(Number(e.target.value))}
              className="flex-1 accent-brand-600" />
            <span className="text-sm font-medium text-ink w-16 text-right">{peakDemandKw} kW</span>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-ink-500 uppercase tracking-wide mb-1">Target reduction</label>
          <div className="flex items-center gap-2">
            <input type="range" min="10" max="60" step="5" value={targetReductionPct}
              onChange={(e) => setTargetReductionPct(Number(e.target.value))}
              className="flex-1 accent-brand-600" />
            <span className="text-sm font-medium text-ink w-10 text-right">{targetReductionPct}%</span>
          </div>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showShaving} onChange={(e) => setShowShaving(e.target.checked)}
              className="w-4 h-4 rounded border-ink/15 text-blue-600 accent-blue-600" />
            <span className="text-sm text-ink-700">Show battery shaving</span>
          </label>
        </div>
      </div>

      {/* ── Savings summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">Peak events/week</div>
          <div className="text-xl font-bold text-red-900">{peakEvents}</div>
          <div className="text-[10px] text-red-500">Above {(peakDemandKw * (1 - targetReductionPct / 100)).toFixed(0)} kW</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Demand shaved</div>
          <div className="text-xl font-bold text-blue-900">{(targetReductionPct)}%</div>
          <div className="text-[10px] text-blue-500">−{(peakDemandKw * targetReductionPct / 100).toFixed(0)} kW off peak</div>
        </div>
        <div className="bg-brand-50 rounded-lg p-3">
          <div className="text-[10px] font-semibold text-brand-600 uppercase tracking-wide">Monthly saving</div>
          <div className="text-xl font-bold text-brand-900">{fmtDemandCharge(monthlySaving)}</div>
          <div className="text-[10px] text-brand-500">Demand charge only</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Annual saving</div>
          <div className="text-xl font-bold text-purple-900">{fmtDemandCharge(monthlySaving * 12)}</div>
          <div className="text-[10px] text-purple-500">@ {cur}{demandCharge.toLocaleString()}/kW/mo</div>
        </div>
      </div>

      {/* ── TOU band legend ── */}
      <div className="flex flex-wrap gap-3 mb-3">
        {touBands.map((b, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-ink-600">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: b.color }} />
            {b.label} ({b.startHr}:00–{b.endHr === 24 ? '00' : b.endHr}:00), {cur}{b.rate.toLocaleString()}/kWh
          </div>
        ))}
      </div>

      {/* ── Heatmap grid ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="w-10 text-left text-ink-500 py-1">Day</th>
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className="py-1 px-0 text-center text-ink-400 font-normal" style={{ minWidth: 28 }}>
                  <div>{h.toString().padStart(2, '0')}</div>
                  <div className="w-full h-1 mt-0.5 rounded-sm" style={{ backgroundColor: getTouBand(h)?.color ?? '#e5e7eb' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, d) => (
              <tr key={day}>
                <td className="text-ink-600 font-medium pr-1 py-0.5">{day}</td>
                {data[d].map((kw, h) => {
                  const orig = matrix[d][h]
                  const wasShaved = showShaving && orig > peakDemandKw * (1 - targetReductionPct / 100)
                  const isHover = hoverCell?.day === d && hoverCell?.hour === h
                  return (
                    <td key={h}
                      className={`relative py-0.5 px-0 text-center transition-all cursor-default
                        ${wasShaved ? 'ring-2 ring-blue-400 ring-inset' : ''}
                        ${isHover ? 'ring-2 ring-ink ring-inset z-10' : ''}`}
                      onMouseEnter={() => setHoverCell({ day: d, hour: h })}
                      onMouseLeave={() => setHoverCell(null)}>
                      <div className={`mx-[1px] rounded-sm py-1 text-[9px] font-medium leading-none
                        ${getColor(kw, wasShaved)}`}>
                        {kw}
                      </div>
                      {/* Tooltip */}
                      {isHover && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 bg-ink text-white rounded-lg px-3 py-2 text-[11px] whitespace-nowrap shadow-xl pointer-events-none">
                          <div className="font-semibold">{day} {h.toString().padStart(2, '0')}:00</div>
                          <div>Demand: {orig} kW {wasShaved ? `→ ${kw} kW (shaved)` : ''}</div>
                          <div>TOU band: {getTouBand(h)?.label} @ {cur}{getTouBand(h)?.rate.toLocaleString()}/kWh</div>
                          {wasShaved && <div className="text-blue-300 font-medium">⚡ Battery active: −{orig - kw} kW</div>}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] text-ink-500">
        <span className="font-medium text-ink-600">Demand level:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-100" /> &lt;20%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-lime-100" /> 20–40%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-200" /> 40–60%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-300" /> 60–75%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400" /> 75–90%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> &gt;90%</span>
        {showShaving && (
          <span className="flex items-center gap-1 ml-2 text-blue-600 font-medium">
            <span className="w-3 h-3 rounded-sm border-2 border-dashed border-blue-400 bg-blue-100" /> Battery shaved
          </span>
        )}
      </div>
    </div>
  )
}
