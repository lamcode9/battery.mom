'use client'

import { useMemo } from 'react'
import { Vehicle } from '@/types/vehicle'

/* ── Speed-efficiency model ────────────────────────────────── *
 * EV efficiency rises roughly with the square of speed due to
 * aerodynamic drag. We use a simplified physics model:
 *   eff(v) = base × (a + b × (v/100)²)
 * Calibrated so WLTP ~= city/highway blend (~80 km/h effective).
 */

const SPEEDS = [60, 80, 100, 120] as const
const SPEED_LABELS = ['60 km/h', '80 km/h', '100 km/h', '120 km/h']
const SPEED_CONTEXTS = ['City', 'Suburban', 'Highway', 'Expressway']

/**
 * Multiplier at each speed relative to rated WLTP efficiency.
 * WLTP is ~a blend of city/highway, roughly equivalent to ~80 km/h average.
 */
const SPEED_MULTIPLIERS: Record<number, number> = {
  60:  0.82,   // City driving ~18% more efficient than rated
  80:  1.00,   // Close to WLTP rated
  100: 1.22,   // ~22% worse than rated
  120: 1.52,   // ~52% worse than rated (aero drag dominates)
}

function getVehicleLabel(v: Vehicle) {
  return v.modelTrim ? `${v.name} ${v.modelTrim}` : v.name
}

const CELL_COLORS = [
  { max: 12, bg: 'bg-brand-100', text: 'text-brand-800' },
  { max: 15, bg: 'bg-brand-50', text: 'text-brand-700' },
  { max: 18, bg: 'bg-green-50', text: 'text-green-700' },
  { max: 21, bg: 'bg-yellow-50', text: 'text-yellow-700' },
  { max: 25, bg: 'bg-amber-50', text: 'text-amber-700' },
  { max: 30, bg: 'bg-orange-50', text: 'text-orange-700' },
  { max: Infinity, bg: 'bg-red-50', text: 'text-red-700' },
]

function getCellStyle(kwhPer100: number) {
  const tier = CELL_COLORS.find(c => kwhPer100 <= c.max) ?? CELL_COLORS[CELL_COLORS.length - 1]
  return `${tier.bg} ${tier.text}`
}

interface Props {
  vehicles: Vehicle[]
}

export default function SpeedEfficiencyHeatmap({ vehicles }: Props) {
  const data = useMemo(() => {
    return vehicles.map(v => {
      const baseEff = v.efficiencyKwhPer100km ?? 18
      const effAtSpeed = SPEEDS.map(speed => {
        const mult = SPEED_MULTIPLIERS[speed]
        return parseFloat((baseEff * mult).toFixed(1))
      })
      const rangeAtSpeed = SPEEDS.map((speed, i) => {
        const cap = v.batteryCapacityKwh ?? 0
        if (effAtSpeed[i] <= 0) return 0
        return Math.round((cap / effAtSpeed[i]) * 100)
      })
      return {
        vehicle: v,
        label: getVehicleLabel(v),
        baseEff,
        effAtSpeed,
        rangeAtSpeed,
      }
    })
  }, [vehicles])

  if (vehicles.length === 0) return null

  // Find best efficiency at each speed
  const bestAtSpeed = SPEEDS.map((_, si) => {
    let best = Infinity
    data.forEach(d => { if (d.effAtSpeed[si] < best) best = d.effAtSpeed[si] })
    return best
  })

  return (
    <div className="bg-paper-100 rounded-card border border-ink/10 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            Efficiency heatmap by speed
          </h3>
          <p className="text-[10px] text-ink-500 mt-1">
            Estimated energy consumption at different cruising speeds. Lower is better. Green = efficient, Orange/Red = high consumption.
          </p>
        </div>
      </div>

      {/* Heatmap table */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2 text-[10px] font-medium text-ink-500 min-w-[120px]">Vehicle</th>
              {SPEEDS.map((speed, i) => (
                <th key={speed} className="text-center py-2 px-1.5">
                  <div className="text-[10px] font-bold text-ink-700">{SPEED_LABELS[i]}</div>
                  <div className="text-[8px] text-ink-400">{SPEED_CONTEXTS[i]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.vehicle.id} className="border-t border-ink/5">
                <td className="py-2 pr-2">
                  <div className="text-xs font-semibold text-ink truncate max-w-[140px]">{d.label}</div>
                  <div className="text-[9px] text-ink-400">Rated: {d.baseEff} kWh/100km</div>
                </td>
                {d.effAtSpeed.map((eff, si) => (
                  <td key={si} className="py-1.5 px-1">
                    <div className={`rounded-lg p-2 text-center ${getCellStyle(eff)} ${eff === bestAtSpeed[si] ? 'ring-1 ring-brand-400' : ''}`}>
                      <div className="text-xs font-bold">{eff}</div>
                      <div className="text-[8px] opacity-70">kWh/100km</div>
                      <div className="text-[9px] font-medium mt-0.5">{d.rangeAtSpeed[si]} km</div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="text-[9px] text-ink-500">Efficiency:</span>
        <div className="flex items-center gap-1">
          <span className="w-4 h-2.5 rounded bg-brand-100" />
          <span className="text-[8px] text-ink-500">Excellent</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-2.5 rounded bg-yellow-50" />
          <span className="text-[8px] text-ink-500">Average</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-2.5 rounded bg-red-50" />
          <span className="text-[8px] text-ink-500">High</span>
        </div>
        <span className="text-[9px] text-ink-500 ml-1">⭕ = Best in column</span>
      </div>

      <p className="text-[9px] text-ink-400 mt-3">
        Estimates based on aerodynamic drag model. At 120 km/h, energy consumption is typically ~50% higher than city driving at 60 km/h.
        Actual efficiency varies with vehicle aerodynamics (Cd), tire rolling resistance, temperature, and payload.
      </p>
      <p className="text-[8px] text-ink-300 mt-1">
        Model: Simplified speed² drag curve calibrated to WLTP ≈ 80 km/h average. Base efficiency from WLTP certification data / manufacturer specs.
      </p>
    </div>
  )
}
