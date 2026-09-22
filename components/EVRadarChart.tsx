'use client'

import { useMemo } from 'react'
import { Vehicle } from '@/types/vehicle'
import { computeScore } from './EVScoreGauge'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'

const VEHICLE_COLORS = ['#0ea5e9', '#10b981', '#f97316', '#a855f7']

const AXES = [
  { key: 'range', label: 'Range' },
  { key: 'efficiency', label: 'Efficiency' },
  { key: 'value', label: 'Value' },
  { key: 'charging', label: 'Charging' },
  { key: 'battery', label: 'Battery' },
] as const

interface EVRadarChartProps {
  vehicles: Vehicle[]
}

export default function EVRadarChart({ vehicles }: EVRadarChartProps) {
  const data = useMemo(() => {
    if (vehicles.length < 2) return []

    const scores = vehicles.map(v => ({
      vehicle: v,
      score: computeScore(v, vehicles),
    }))

    return AXES.map(axis => {
      const point: Record<string, string | number> = { axis: axis.label }
      scores.forEach((s, i) => {
        const label = s.vehicle.modelTrim
          ? `${s.vehicle.name} ${s.vehicle.modelTrim}`
          : s.vehicle.name
        point[label] = s.score[axis.key]
      })
      return point
    })
  }, [vehicles])

  const vehicleLabels = useMemo(() =>
    vehicles.map(v => v.modelTrim ? `${v.name} ${v.modelTrim}` : v.name),
    [vehicles]
  )

  if (vehicles.length < 2) return null

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-4">
      <h3 className="text-sm font-semibold text-ink mb-1">Radar comparison</h3>
      <p className="text-[10px] text-ink-500 mb-3">
        Each axis is scored 0–100 relative to this comparison set. Larger area = stronger overall.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 8, fill: '#9ca3af' }}
            tickCount={5}
          />
          {vehicleLabels.map((label, i) => (
            <Radar
              key={label}
              name={label}
              dataKey={label}
              stroke={VEHICLE_COLORS[i % VEHICLE_COLORS.length]}
              fill={VEHICLE_COLORS[i % VEHICLE_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ r: 3, fill: VEHICLE_COLORS[i % VEHICLE_COLORS.length] }}
            />
          ))}
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
            }}
            formatter={(value: number) => `${value}/100`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
