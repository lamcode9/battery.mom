'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'

type CountryCode = 'SG' | 'MY' | 'TH' | 'ID' | 'VN' | 'PH'

const COUNTRIES: { code: CountryCode; name: string; flag: string; evAdoptionRate: number; totalEvs: number; chargersPerMillion: number; solarCapacityGw: number; evSalesGrowth: number; policyGrade: string }[] = [
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', evAdoptionRate: 19.4, totalEvs: 120301, chargersPerMillion: 161, solarCapacityGw: 6.8, evSalesGrowth: 80, policyGrade: 'A' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', evAdoptionRate: 45.1, totalEvs: 23684, chargersPerMillion: 1864, solarCapacityGw: 1.5, evSalesGrowth: 64, policyGrade: 'A-' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', evAdoptionRate: 12.9, totalEvs: 103900, chargersPerMillion: 17, solarCapacityGw: 1.5, evSalesGrowth: 141, policyGrade: 'B' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', evAdoptionRate: 3.8, totalEvs: 30848, chargersPerMillion: 158, solarCapacityGw: 3.1, evSalesGrowth: 109, policyGrade: 'B+' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', evAdoptionRate: 39.0, totalEvs: 175099, chargersPerMillion: 1500, solarCapacityGw: 19.3, evSalesGrowth: 99, policyGrade: 'B' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', evAdoptionRate: 12.0, totalEvs: 58905, chargersPerMillion: 9, solarCapacityGw: 3.9, evSalesGrowth: 143, policyGrade: 'C+' },
]

const radarData = COUNTRIES.map((c) => ({
  country: c.flag,
  'EV/xEV Share': Math.min(c.evAdoptionRate * 3, 100),
  'Charger Density': Math.min(c.chargersPerMillion / 4, 100),
  'Solar Capacity': Math.min(c.solarCapacityGw * 5, 100),
  'EV Growth': Math.min(c.evSalesGrowth, 100),
}))

export default function EmbedScoreboard() {
  const [view, setView] = useState<'table' | 'chart'>('table')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          SEA EV and energy scoreboard
        </h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setView('chart')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              view === 'chart' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chart
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-3 font-semibold text-gray-700">Country</th>
                <th className="py-2 px-2 font-semibold text-gray-700 text-right">EV/xEV %</th>
                <th className="py-2 px-2 font-semibold text-gray-700 text-right">2025 Sales</th>
                <th className="py-2 px-2 font-semibold text-gray-700 text-right">Chargers/M</th>
                <th className="py-2 px-2 font-semibold text-gray-700 text-right">Solar GW</th>
                <th className="py-2 px-2 font-semibold text-gray-700 text-right">Growth</th>
                <th className="py-2 pl-2 font-semibold text-gray-700 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {COUNTRIES.map((c) => (
                <tr key={c.code} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <span className="mr-1">{c.flag}</span>
                    <span className="font-medium text-gray-900">{c.name}</span>
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{c.evAdoptionRate}%</td>
                  <td className="py-2 px-2 text-right tabular-nums">{(c.totalEvs / 1000).toFixed(0)}k</td>
                  <td className="py-2 px-2 text-right tabular-nums">{c.chargersPerMillion}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{c.solarCapacityGw}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-emerald-600">+{c.evSalesGrowth}%</td>
                  <td className="py-2 pl-2 text-center">
                    <span className={`inline-block w-7 text-center rounded font-bold text-xs py-0.5 ${
                      c.policyGrade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                      c.policyGrade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {c.policyGrade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {/* EV Adoption Bar Chart */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">EV/xEV sales share (%)</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={COUNTRIES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="flag" type="category" width={30} tick={{ fontSize: 14 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'EV/xEV Share']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="evAdoptionRate" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Multi-metric comparison</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="country" tick={{ fontSize: 14 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name="EV/xEV Share" dataKey="EV/xEV Share" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Radar name="Charger Density" dataKey="Charger Density" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                  <Radar name="Solar Capacity" dataKey="Solar Capacity" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-right">
        Verified 1 May 2026 · <a href="/scoreboard/ev" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">Sources on battery.mom</a>
      </p>
    </div>
  )
}
