'use client'

import { useState, useMemo } from 'react'
import { Vehicle } from '@/types/vehicle'

const PRESETS = [
  { label: 'Light (500 W)', watts: 500 },
  { label: 'Medium (1.5 kW)', watts: 1500 },
  { label: 'Heavy (3 kW)', watts: 3000 },
  { label: 'Full Home (5 kW)', watts: 5000 },
]

/** Inverter efficiency for V2H / V2L */
const INVERTER_EFF = 0.90
/** Reserve – EVs typically hold back 10-15% of battery for drivetrain protection */
const USABLE_FACTOR = 0.85

function getVehicleLabel(v: Vehicle) {
  return v.modelTrim ? `${v.name} ${v.modelTrim}` : v.name
}

const BAR_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface Props {
  vehicles: Vehicle[]
}

export default function EVAsBackupCalc({ vehicles }: Props) {
  const [watts, setWatts] = useState(1500)

  const results = useMemo(() => {
    return vehicles.map(v => {
      const capacityKwh = v.batteryCapacityKwh ?? 0
      const usableKwh = capacityKwh * USABLE_FACTOR
      const outputKw = (usableKwh * INVERTER_EFF)
      const hours = watts > 0 ? outputKw / (watts / 1000) : 0
      const days = hours / 24
      return {
        vehicle: v,
        label: getVehicleLabel(v),
        capacityKwh,
        hasBidirectional: v.hasBidirectional ?? false,
        hours: parseFloat(hours.toFixed(1)),
        days: parseFloat(days.toFixed(1)),
      }
    }).sort((a, b) => b.hours - a.hours)
  }, [vehicles, watts])

  const maxHours = Math.max(...results.map(r => r.hours), 1)

  if (vehicles.length === 0) return null

  return (
    <div className="bg-paper-100 rounded-card border border-ink/10 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            Battery as home backup
          </h3>
          <p className="text-[10px] text-ink-500 mt-1">
            Estimate how long each EV can power your home during an outage. Accounts for inverter losses (90%) and EV battery reserve (15%).
          </p>
        </div>
      </div>

      {/* Wattage input */}
      <div className="mb-4">
        <label className="text-[10px] font-medium text-ink-600 block mb-2">
          Household power draw
        </label>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRESETS.map(p => (
            <button
              key={p.watts}
              onClick={() => setWatts(p.watts)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                watts === p.watts
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-paper-200 text-ink-600 hover:bg-paper-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={200}
            max={10000}
            step={100}
            value={watts}
            onChange={e => setWatts(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-paper-300 accent-brand-600"
          />
          <span className="text-sm font-bold text-ink w-20 text-right">
            {watts >= 1000 ? `${(watts / 1000).toFixed(1)} kW` : `${watts} W`}
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2.5">
        {results.map((r, i) => (
          <div key={r.vehicle.id} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                <span className="text-xs font-semibold text-ink truncate">{r.label}</span>
                {r.hasBidirectional && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold bg-brand-100 text-brand-700">V2H</span>
                )}
                {!r.hasBidirectional && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700">V2L only</span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 shrink-0 ml-2">
                <span className="text-sm font-bold text-ink">{r.hours}h</span>
                <span className="text-[10px] text-ink-400">({r.days} days)</span>
              </div>
            </div>
            {/* Bar */}
            <div className="h-3 bg-paper-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max((r.hours / maxHours) * 100, 2)}%`,
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  opacity: 0.8,
                }}
              />
            </div>
            <div className="text-[9px] text-ink-400 mt-0.5">
              {r.capacityKwh} kWh battery · {(r.capacityKwh * USABLE_FACTOR).toFixed(1)} kWh usable
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-ink-400 mt-4">
        <strong>V2H</strong> (Vehicle-to-Home) EVs can fully power a home via a bidirectional charger.
        <strong> V2L</strong> (Vehicle-to-Load) EVs provide power via an outlet (typically 1.5–3.6 kW max).
        Actual backup time varies with battery state-of-charge and ambient temperature.
      </p>
      <p className="text-[8px] text-ink-300 mt-1">
        Assumptions: 85% usable battery capacity (EV reserves ~15%), 90% inverter efficiency. Battery specs from manufacturer data. V2H/V2L capability per model verified against OEM feature lists.
      </p>
    </div>
  )
}
