'use client'

import { useMemo } from 'react'
import { Vehicle } from '@/types/vehicle'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'

/* ── Degradation curves by chemistry ───────────────────────── */

/** Annual capacity retention % at each year for different chemistries */
const DEGRADATION_CURVES: Record<string, number[]> = {
  // Year: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  LFP:        [100, 98.5, 97.0, 95.5, 94.2, 93.0, 91.8, 90.7, 89.5, 88.5, 87.5],
  NMC:        [100, 97.5, 95.0, 92.8, 90.8, 89.0, 87.3, 85.7, 84.2, 82.8, 81.5],
  SolidState: [100, 99.0, 98.0, 97.0, 96.2, 95.5, 94.8, 94.1, 93.5, 92.9, 92.3],
  Other:      [100, 97.0, 94.2, 91.5, 89.0, 86.8, 84.7, 82.8, 81.0, 79.3, 77.8],
}

const CHART_YEARS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const DISPLAY_YEARS = [0, 1, 3, 5, 8, 10]

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const CHEMISTRY_LABELS: Record<string, string> = {
  LFP: 'LFP (Lithium Iron Phosphate)',
  NMC: 'NMC (Nickel Manganese Cobalt)',
  SolidState: 'Solid State',
  Other: 'Other',
}

function getVehicleLabel(v: Vehicle) {
  return v.modelTrim ? `${v.name} ${v.modelTrim}` : v.name
}

interface Props {
  vehicles: Vehicle[]
}

export default function BatteryHealthChart({ vehicles }: Props) {
  const chartData = useMemo(() => {
    return CHART_YEARS.map(year => {
      const point: Record<string, number | string> = { year: `Y${year}` }
      vehicles.forEach(v => {
        const chem = v.batteryTechnology ?? 'Other'
        const curve = DEGRADATION_CURVES[chem] ?? DEGRADATION_CURVES['Other']
        const capacity = v.batteryCapacityKwh ?? 0
        point[v.id] = parseFloat(((curve[year] / 100) * capacity).toFixed(1))
      })
      return point
    })
  }, [vehicles])

  const summaryData = useMemo(() => {
    return vehicles.map(v => {
      const chem = v.batteryTechnology ?? 'Other'
      const curve = DEGRADATION_CURVES[chem] ?? DEGRADATION_CURVES['Other']
      const capacity = v.batteryCapacityKwh ?? 0
      return {
        vehicle: v,
        label: getVehicleLabel(v),
        chemistry: chem,
        chemLabel: CHEMISTRY_LABELS[chem] ?? chem,
        capacity,
        year5: parseFloat(((curve[5] / 100) * capacity).toFixed(1)),
        year5pct: curve[5],
        year10: parseFloat(((curve[10] / 100) * capacity).toFixed(1)),
        year10pct: curve[10],
      }
    })
  }, [vehicles])

  if (vehicles.length === 0) return null

  return (
    <div className="bg-paper-100 rounded-card border border-ink/10 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            Battery health projection
          </h3>
          <p className="text-[10px] text-ink-500 mt-1">
            Estimated usable capacity over 10 years based on battery chemistry degradation curves. Assumes typical driving patterns and climate conditions.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              {vehicles.map((v, i) => (
                <linearGradient key={v.id} id={`health-${v.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' } }}
            />
            <ChartHoverTooltip
              formatter={(val: number, name: string) => {
                const v = vehicles.find(x => x.id === name)
                return [`${val} kWh`, v ? getVehicleLabel(v) : name]
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10 }}
              formatter={(val: string) => {
                const v = vehicles.find(x => x.id === val)
                return v ? getVehicleLabel(v) : val
              }}
            />
            {vehicles.map((v, i) => (
              <Area
                key={v.id}
                type="monotone"
                dataKey={v.id}
                stroke={COLORS[i % COLORS.length]}
                fill={`url(#health-${v.id})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {summaryData.map((s, i) => (
          <div key={s.vehicle.id} className="bg-paper-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-xs font-semibold text-ink truncate">{s.label}</span>
            </div>
            <div className="text-[10px] text-ink-500 mb-1">{s.chemLabel}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-bold text-ink">{s.capacity} kWh</div>
                <div className="text-[9px] text-ink-400">New</div>
              </div>
              <div>
                <div className="text-xs font-bold text-amber-700">{s.year5} kWh</div>
                <div className="text-[9px] text-ink-400">Yr 5 ({s.year5pct}%)</div>
              </div>
              <div>
                <div className={`text-xs font-bold ${s.year10pct >= 85 ? 'text-brand-700' : s.year10pct >= 80 ? 'text-amber-700' : 'text-red-600'}`}>
                  {s.year10} kWh
                </div>
                <div className="text-[9px] text-ink-400">Yr 10 ({s.year10pct}%)</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-ink-400 mt-3">
        Degradation estimates based on published research (NREL, Argonne National Lab) and manufacturer warranty data.
        LFP batteries retain ~87% after 10 years; NMC ~82%; Solid State ~92%. Actual results depend on climate, charging habits, and depth of discharge.
      </p>
      <p className="text-[8px] text-ink-300 mt-1">
        Sources: NREL Battery Lifetime Report 2024; Argonne ReCell Center; manufacturer datasheets. Battery chemistry from vehicle spec sheets.
      </p>
    </div>
  )
}
