'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'
import {
  BATTERY_STORAGE_REGIONS,
  GLOBAL_BATTERY_POWER_ADDITIONS,
  GLOBAL_ELECTRICITY_GENERATION,
  GLOBAL_RENEWABLE_GENERATION,
} from '@/data/energy-deployment-scoreboard'

// --- Tokens mirrored for the SVG layer (charts can't read Tailwind classes) ---
const INK = '#11150F'
const MUTED = '#5E675C'
const GRID = 'rgba(17,21,15,0.07)'
const BRAND = '#0E9F6E'
const BRAND_SOFT = '#5DD9A6'
const FOSSIL = '#A7AFA4'

const axisTick = { fill: MUTED, fontSize: 12 }

// ---------------------------------------------------------------------------
// 1. The grid tipped — fossil vs low-carbon generation, 2015 → 2025 (TWh)
// ---------------------------------------------------------------------------
const generationData = GLOBAL_ELECTRICITY_GENERATION.map((p) => {
  const renew = GLOBAL_RENEWABLE_GENERATION.find((r) => r.year === p.year)
  return {
    year: p.year,
    fossil: Math.round(p.coal + p.naturalGas + p.oil),
    lowCarbon: Math.round(p.renewables + p.nuclear),
  }
})

export function GenerationMixChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={generationData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="lowCarbonFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} ticks={[2015, 2018, 2021, 2025]} />
        <YAxis
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
        />
        <ChartHoverTooltip unit="TWh" cursor={{ stroke: GRID }} />
        <Area
          type="monotone"
          dataKey="fossil"
          name="Fossil"
          stroke={FOSSIL}
          strokeWidth={2}
          fill={FOSSIL}
          fillOpacity={0.1}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="lowCarbon"
          name="Low-carbon"
          stroke={BRAND}
          strokeWidth={2.5}
          fill="url(#lowCarbonFill)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// 2. The battery boom — annual power additions, 2020 → 2025 (GW)
// ---------------------------------------------------------------------------
export function BatteryBoomChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={GLOBAL_BATTERY_POWER_ADDITIONS} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="year" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} />
        <ChartHoverTooltip unit="GW" cursor={{ fill: 'rgba(17,21,15,0.04)' }} />
        <Bar dataKey="utilityScaleGw" name="Utility-scale" stackId="b" fill={BRAND} radius={[0, 0, 0, 0]} />
        <Bar dataKey="behindMeterGw" name="Behind-the-meter" stackId="b" fill={BRAND_SOFT} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// 3. Where it's built — 2025 utility-scale additions by region (GW)
// ---------------------------------------------------------------------------
const regionData = BATTERY_STORAGE_REGIONS.filter((r) => r.key !== 'global')
  .map((r) => {
    const p = r.points.find((pt) => pt.year === 2025)
    return { label: r.label, gw: p ? p.utilityScaleGw : 0, key: r.key }
  })
  .sort((a, b) => b.gw - a.gw)

export function BatteryRegionChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={regionData}
        layout="vertical"
        margin={{ top: 4, right: 36, bottom: 4, left: 8 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: INK, fontSize: 13, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          width={108}
        />
        <ChartHoverTooltip unit="GW" cursor={{ fill: 'rgba(17,21,15,0.04)' }} />
        <Bar dataKey="gw" name="Utility-scale added" radius={[0, 6, 6, 0]} barSize={26}>
          {regionData.map((d) => (
            <Cell key={d.key} fill={d.key === 'china' ? BRAND : FOSSIL} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
