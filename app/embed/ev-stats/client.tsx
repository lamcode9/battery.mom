'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'

interface Stats {
  totalVehicles: number
  countryCounts: { country: string; flag: string; count: number }[]
  topRange: { name: string; range: number | null; country: string; flag: string }[]
  topEfficiency: { name: string; efficiency: number | null; country: string; flag: string }[]
}

export default function EmbedEvStatsClient({ stats }: { stats: Stats }) {
  const [tab, setTab] = useState<'range' | 'efficiency'>('range')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">
          ⚡ EV Database Stats
        </h2>
        <span className="text-2xl font-bold text-brand-600 tabular-nums">
          {stats.totalVehicles.toLocaleString()}
          <span className="text-xs font-normal text-ink-500 ml-1">vehicles</span>
        </span>
      </div>

      {/* Country breakdown */}
      <div className="flex flex-wrap gap-2">
        {stats.countryCounts.map((c) => (
          <div
            key={c.country}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paper-200 border border-ink/10 text-sm"
          >
            <span>{c.flag}</span>
            <span className="font-medium text-ink-700">{c.country}</span>
            <span className="text-ink-500 tabular-nums">{c.count}</span>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-paper-200 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setTab('range')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            tab === 'range' ? 'bg-paper-100 text-ink shadow-sm' : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          Longest Range
        </button>
        <button
          onClick={() => setTab('efficiency')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            tab === 'efficiency' ? 'bg-paper-100 text-ink shadow-sm' : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          Most Efficient
        </button>
      </div>

      {/* Chart */}
      {tab === 'range' ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.topRange.map((v) => ({
                name: v.name.length > 20 ? v.name.slice(0, 18) + '…' : v.name,
                fullName: v.name,
                range: v.range,
              }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} unit=" km" />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
              <ChartHoverTooltip
                formatter={(value: number) => [`${value} km`, 'Range']}
                labelFormatter={(label, payload) => {
                  const fullName = payload?.[0]?.payload?.fullName
                  return typeof fullName === 'string' ? fullName : label
                }}
              />
              <Bar dataKey="range" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.topEfficiency.map((v) => ({
                name: v.name.length > 20 ? v.name.slice(0, 18) + '…' : v.name,
                fullName: v.name,
                efficiency: v.efficiency,
              }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} unit=" kWh" />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
              <ChartHoverTooltip
                formatter={(value: number) => [`${value} kWh/100km`, 'Efficiency']}
                labelFormatter={(label, payload) => {
                  const fullName = payload?.[0]?.payload?.fullName
                  return typeof fullName === 'string' ? fullName : label
                }}
              />
              <Bar dataKey="efficiency" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-[10px] text-ink-400 text-right">
        Live data · Source: battery.mom
      </p>
    </div>
  )
}
