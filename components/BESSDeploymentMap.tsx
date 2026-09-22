'use client'

import { useState, useMemo } from 'react'
import InfoTooltip from '@/components/InfoTooltip'
import type { Country } from '@/types/bess'

/* ── Country data ────────────────────────────────────────────────── */

interface DeploymentData {
  code: Country
  name: string
  flag: string
  installedMwh: number
  plannedMwh: number
  projects: number
  highlight: string
}

const DEPLOYMENT: DeploymentData[] = [
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', installedMwh: 1200, plannedMwh: 2000, projects: 8, highlight: 'Tuas South 1 GWh, the largest in SEA' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', installedMwh: 280, plannedMwh: 1500, projects: 12, highlight: 'LSS4 + storage hybrid auctions' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', installedMwh: 180, plannedMwh: 800, projects: 6, highlight: 'EGAT Smart Grid programme' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', installedMwh: 80, plannedMwh: 2500, projects: 15, highlight: 'PDP8 mandates 300 MW by 2030' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', installedMwh: 120, plannedMwh: 3000, projects: 10, highlight: 'PLN 31 GW renewable target by 2030' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', installedMwh: 60, plannedMwh: 1200, projects: 7, highlight: 'DOE Storage Roadmap, 2 GWh target' },
]

const TOTAL_INSTALLED = DEPLOYMENT.reduce((s, d) => s + d.installedMwh, 0)
const TOTAL_PLANNED = DEPLOYMENT.reduce((s, d) => s + d.plannedMwh, 0)

/* ── SVG path data for simplified SEA map ─────────────────────────── */
/* Simplified country outlines positioned in an approx geo-layout.
   Each path is scaled to fit a 800×500 viewbox. */

const MAP_PATHS: Record<Country, { d: string; cx: number; cy: number }> = {
  MY: {
    d: 'M280,310 L340,290 L380,300 L400,320 L390,340 L350,350 L310,340 Z M420,350 L460,330 L500,340 L510,370 L480,390 L440,380 Z',
    cx: 400, cy: 340,
  },
  SG: {
    d: 'M405,380 L420,375 L425,385 L410,390 Z',
    cx: 415, cy: 383,
  },
  TH: {
    d: 'M280,160 L320,140 L340,160 L350,200 L340,240 L330,270 L300,290 L280,280 L260,240 L270,200 Z',
    cx: 310, cy: 220,
  },
  VN: {
    d: 'M360,140 L380,120 L400,140 L390,180 L370,220 L360,260 L370,300 L380,330 L360,340 L350,310 L340,270 L350,220 L350,160 Z',
    cx: 370, cy: 230,
  },
  ID: {
    d: 'M300,400 L360,390 L420,395 L480,400 L540,390 L580,400 L600,420 L560,440 L500,445 L440,440 L380,435 L320,430 L290,420 Z M610,380 L650,370 L680,380 L670,400 L640,410 L610,400 Z',
    cx: 480, cy: 415,
  },
  PH: {
    d: 'M540,180 L560,160 L580,170 L570,200 L580,230 L570,260 L560,290 L540,300 L530,270 L540,240 L530,210 Z',
    cx: 555, cy: 230,
  },
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  country: Country
}

export default function BESSDeploymentMap({ country }: Props) {
  const [hovered, setHovered] = useState<Country | null>(null)

  const active = hovered || country

  const activeData = useMemo(
    () => DEPLOYMENT.find((d) => d.code === active) || DEPLOYMENT[0],
    [active]
  )

  // Size scale for the "dot" on each country
  const maxMwh = Math.max(...DEPLOYMENT.map((d) => d.installedMwh + d.plannedMwh))

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
      <h2 className="text-lg font-semibold text-ink mb-1">
        SEA BESS Deployment Map{' '}
        <InfoTooltip content="Interactive map showing installed and planned grid-scale battery storage capacity across Southeast Asia. Hover over a country to see its details. Data reflects announced projects as of early 2025." />
      </h2>
      <p className="text-sm text-ink-500 mb-6">
        {(TOTAL_INSTALLED / 1000).toFixed(1)} GWh installed · {(TOTAL_PLANNED / 1000).toFixed(1)} GWh planned across 6 countries.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Map SVG ── */}
        <div className="lg:col-span-2">
          <svg viewBox="200 100 540 380" className="w-full h-auto" style={{ maxHeight: 400 }}>
            {/* Background sea */}
            <rect x="200" y="100" width="540" height="380" fill="#f0f9ff" rx="12" />

            {/* Country paths */}
            {DEPLOYMENT.map((dep) => {
              const mp = MAP_PATHS[dep.code]
              const isActive = dep.code === active
              const isSelected = dep.code === country
              return (
                <g
                  key={dep.code}
                  onMouseEnter={() => setHovered(dep.code)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer"
                >
                  <path
                    d={mp.d}
                    fill={isActive ? '#059669' : isSelected ? '#10b981' : '#d1fae5'}
                    stroke={isActive ? '#047857' : '#a7f3d0'}
                    strokeWidth={isActive ? 2 : 1}
                    opacity={isActive ? 1 : 0.8}
                    className="transition-all duration-200"
                  />
                  {/* Capacity bubble */}
                  <circle
                    cx={mp.cx}
                    cy={mp.cy}
                    r={Math.max(6, ((dep.installedMwh + dep.plannedMwh) / maxMwh) * 22)}
                    fill={isActive ? '#f59e0b' : '#6366f1'}
                    opacity={0.7}
                    className="transition-all duration-200"
                  />
                  {/* Label */}
                  <text
                    x={mp.cx}
                    y={mp.cy - (dep.code === 'SG' ? 16 : Math.max(8, ((dep.installedMwh + dep.plannedMwh) / maxMwh) * 24))}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={isActive ? '#047857' : '#374151'}
                    className="pointer-events-none"
                  >
                    {dep.flag} {dep.code}
                  </text>
                </g>
              )
            })}

            {/* Legend */}
            <g transform="translate(220, 440)">
              <circle cx="0" cy="0" r="5" fill="#6366f1" opacity="0.7" />
              <text x="10" y="4" fontSize="9" fill="#6b7280">Installed + Planned capacity</text>
              <circle cx="180" cy="0" r="5" fill="#f59e0b" opacity="0.7" />
              <text x="190" y="4" fontSize="9" fill="#6b7280">Selected country</text>
            </g>
          </svg>
        </div>

        {/* ── Detail panel ── */}
        <div className="space-y-4">
          {/* Active country card */}
          <div className="bg-brand-50 rounded-card p-4">
            <div className="text-lg font-bold text-brand-900 mb-2">
              {activeData.flag} {activeData.name}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-600">Installed</span>
                <span className="font-semibold text-brand-800">{activeData.installedMwh.toLocaleString()} MWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Planned</span>
                <span className="font-semibold text-blue-700">{activeData.plannedMwh.toLocaleString()} MWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">Projects</span>
                <span className="font-semibold text-ink">{activeData.projects}</span>
              </div>
              {/* Capacity bar */}
              <div className="mt-2">
                <div className="h-3 bg-paper-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${(activeData.installedMwh / (activeData.installedMwh + activeData.plannedMwh)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-ink-500 mt-1">
                  <span>Installed {Math.round((activeData.installedMwh / (activeData.installedMwh + activeData.plannedMwh)) * 100)}%</span>
                  <span>Planned {Math.round((activeData.plannedMwh / (activeData.installedMwh + activeData.plannedMwh)) * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-brand-700 bg-brand-100 rounded-lg px-3 py-2">
              {activeData.highlight}
            </div>
          </div>

          {/* All countries ranked */}
          <div className="bg-paper-100 rounded-card overflow-hidden">
            <div className="px-4 py-2.5 bg-paper-200 border-b border-ink/5 text-xs font-semibold text-ink-700">
              Capacity ranking
            </div>
            <div className="divide-y divide-ink/5">
              {[...DEPLOYMENT]
                .sort((a, b) => b.installedMwh + b.plannedMwh - (a.installedMwh + a.plannedMwh))
                .map((dep, i) => (
                  <div
                    key={dep.code}
                    className={`px-4 py-2 flex items-center gap-3 text-xs cursor-pointer hover:bg-paper-200 transition-colors ${
                      dep.code === active ? 'bg-brand-50' : ''
                    }`}
                    onMouseEnter={() => setHovered(dep.code)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span className="text-ink-400 font-mono w-4">#{i + 1}</span>
                    <span className="font-medium text-ink">{dep.flag} {dep.name}</span>
                    <span className="ml-auto tabular-nums text-ink-600">
                      {((dep.installedMwh + dep.plannedMwh) / 1000).toFixed(1)} GWh
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
