'use client'

import { useMemo, useState } from 'react'
import { BigPictureNav } from '@/components/ui/BigPictureNav'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GenerationYearDetail } from './generation-groups'
import { GenerationFossilGrainDefs, generationStackFill, generationStackFilter, isFossilGrainKey } from './generation-grain'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import InfoTooltip from '@/components/InfoTooltip'
import {
  BATTERY_ENERGY_MILESTONES,
  BATTERY_PACK_PRICES,
  BATTERY_PRICE_CONTEXT,
  BATTERY_STORAGE_REGIONS,
  DATA_SOURCES,
  ELECTRICITY_GENERATION_CHANGE_2025,
  ELECTRICITY_SOURCE_META,
  ENERGY_DEPLOYMENT_SNAPSHOT,
  EV_MARKET_CONTEXT,
  GLOBAL_ELECTRICITY_GENERATION,
  GLOBAL_EV_SALES,
  GLOBAL_RENEWABLE_GENERATION,
  REGIONAL_ELECTRICITY_MIX,
  RENEWABLE_CAPACITY_ADDITIONS_2025,
  RENEWABLE_SOURCE_META,
  SOLAR_WIND_SELECTED_MARKETS_2025,
  type BatteryStorageRegionKey,
  type ElectricitySourceKey,
  type RegionalMixKey,
  type RenewableSourceKey,
} from '@/data/energy-deployment-scoreboard'

type ChartMode = 'electricity' | 'renewables' | 'change'
type GenerationStackKey = Exclude<ElectricitySourceKey, 'renewables'> | RenewableSourceKey

const electricityKeys: ElectricitySourceKey[] = ['coal', 'naturalGas', 'oil', 'renewables', 'nuclear']
const generationStackKeys: GenerationStackKey[] = [
  'coal',
  'naturalGas',
  'oil',
  'hydro',
  'bioenergy',
  'solarPv',
  'wind',
  'other',
  'nuclear',
]
const renewableKeys: RenewableSourceKey[] = ['hydro', 'bioenergy', 'solarPv', 'wind', 'other']
const yearTicks = [2015, 2017, 2019, 2021, 2023, 2025]
const BATTERY_REGION_COLORS: Partial<Record<BatteryStorageRegionKey, string>> = {
  china: '#0f766e',
  unitedStates: '#38bdf8',
  europe: '#8b5cf6',
  restOfWorld: '#94a3b8',
}

const GENERATION_STACK_SOURCE_META: Record<GenerationStackKey, ChartSourceMeta> = {
  coal: ELECTRICITY_SOURCE_META.coal,
  naturalGas: ELECTRICITY_SOURCE_META.naturalGas,
  oil: ELECTRICITY_SOURCE_META.oil,
  hydro: RENEWABLE_SOURCE_META.hydro,
  bioenergy: RENEWABLE_SOURCE_META.bioenergy,
  solarPv: RENEWABLE_SOURCE_META.solarPv,
  wind: RENEWABLE_SOURCE_META.wind,
  other: RENEWABLE_SOURCE_META.other,
  nuclear: ELECTRICITY_SOURCE_META.nuclear,
}

const GLOBAL_GENERATION_STACK = GLOBAL_ELECTRICITY_GENERATION.map(point => {
  const renewablePoint = GLOBAL_RENEWABLE_GENERATION.find(item => item.year === point.year)

  return {
    year: point.year,
    coal: point.coal,
    naturalGas: point.naturalGas,
    oil: point.oil,
    hydro: renewablePoint?.hydro ?? 0,
    bioenergy: renewablePoint?.bioenergy ?? 0,
    solarPv: renewablePoint?.solarPv ?? 0,
    wind: renewablePoint?.wind ?? 0,
    other: renewablePoint?.other ?? 0,
    nuclear: point.nuclear,
  }
})

type SourceLegendEntry = {
  key: string
  label: string
  color: string
  value: number
  share?: number
  active: boolean
}

type ChartSourceMeta = {
  label: string
  color: string
  shortLabel: string
}

type TrendRow<Key extends string> = {
  key: Key
  label: string
  color: string
  value: number
  share: number
  change: number | null
  changePct: number | null
}

type TooltipPayloadItem = {
  dataKey?: string | number
  name?: string | number
  value?: number | string | Array<number | string>
  color?: string
  payload?: Record<string, unknown>
}

function formatCompact(value: number, decimals = 0): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(decimals)}k`
  return value.toFixed(decimals).replace(/\.0$/, '')
}

function formatTwh(value: number): string {
  if (value >= 1000) return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} TWh`
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} TWh`
}

function formatGw(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} GW`
}

function formatGwh(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} TWh`
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} GWh`
}

function formatSignedTwh(value: number): string {
  return `${value > 0 ? '+' : ''}${formatTwh(value)}`
}

function formatSignedPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

function getShare(value: number, total: number): number {
  if (!total) return 0
  return (value / total) * 100
}

function buildTrendRows<Key extends string>(
  keys: Key[],
  point: { year: number },
  previousPoint: { year: number } | undefined,
  meta: Record<Key, ChartSourceMeta>,
  total: number
): TrendRow<Key>[] {
  const values = point as unknown as Record<Key, number>
  const previousValues = previousPoint as unknown as Record<Key, number> | undefined

  return keys.map(key => {
    const value = Number(values[key] ?? 0)
    const previousValue = previousValues ? Number(previousValues[key] ?? 0) : null
    const change = previousValue === null ? null : value - previousValue
    const changePct = previousValue && change !== null ? (change / previousValue) * 100 : null

    return {
      key,
      label: meta[key].label,
      color: meta[key].color,
      value,
      share: getShare(value, total),
      change,
      changePct,
    }
  })
}

function getLargestSource<Key extends string>(rows: TrendRow<Key>[]): TrendRow<Key> | undefined {
  return [...rows].sort((a, b) => b.value - a.value)[0]
}

function getFastestGrowingSource<Key extends string>(rows: TrendRow<Key>[]): TrendRow<Key> | undefined {
  return rows
    .filter(row => row.change !== null && row.change > 0 && row.changePct !== null)
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0]
}

function getBiggestMoverSource<Key extends string>(rows: TrendRow<Key>[]): TrendRow<Key> | undefined {
  return rows
    .filter(row => row.change !== null)
    .sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0))[0]
}

function getBatteryRegionTotal(regionKey: BatteryStorageRegionKey, year: number): number {
  const region = BATTERY_STORAGE_REGIONS.find(item => item.key === regionKey)
  const point = region?.points.find(item => item.year === year)
  return point ? point.utilityScaleGw + point.behindMeterGw : 0
}

function getMixTotal(mixKey: RegionalMixKey, keys: Array<'coal' | 'oil' | 'naturalGas' | 'nuclear' | 'renewables'>): number {
  const mix = REGIONAL_ELECTRICITY_MIX.find(item => item.key === mixKey)
  if (!mix) return 0
  return keys.reduce((sum, key) => sum + mix[key], 0)
}

function MetricCard({
  label,
  value,
  helper,
  accent = 'emerald',
}: {
  label: string
  value: string
  helper: string
  accent?: 'emerald' | 'amber' | 'cyan' | 'slate'
}) {
  const accentClasses = {
    emerald: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    slate: 'bg-slate-100 text-slate-700',
  }

  return (
    <article className="rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card">
      <div className={`mb-4 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${accentClasses[accent]}`}>
        {label}
      </div>
      <div className="text-2xl font-bold text-ink md:text-3xl">{value}</div>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">{helper}</p>
    </article>
  )
}

function SegmentButton<T extends string>({
  value,
  selected,
  children,
  onSelect,
}: {
  value: T
  selected: T
  children: string
  onSelect: (value: T) => void
}) {
  const isSelected = value === selected
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(value)}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        isSelected
          ? 'bg-ink text-white'
          : 'bg-paper-200 text-ink-600 hover:bg-paper-300 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function UnitNote() {
  return (
    <div className="rounded-xl bg-ink p-5 text-white shadow-sm">
      <div className="text-xs font-semibold uppercase text-brand-300">Important unit boundary</div>
      <p className="mt-2 text-sm leading-relaxed text-paper-300">
        Batteries are not an energy source. They are storage: measured as power capacity in GW and energy
        capacity in GWh. Coal, gas, hydro, wind, solar, and nuclear are generation sources: usually measured
        as annual output in TWh or plant capacity in GW.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-ink-300">
        The charts separate battery deployment, electricity generation, renewable additions, and regional grid mix
        so storage is not mistaken for a fuel source.
      </p>
    </div>
  )
}

function SourceLegend({
  title,
  entries,
  onToggle,
  onShowAll,
}: {
  title: string
  entries: SourceLegendEntry[]
  onToggle: (key: string) => void
  onShowAll: () => void
}) {
  const hasHidden = entries.some(entry => !entry.active)

  return (
    <div className="rounded-xl bg-paper-200/70 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">{title}</div>
        {hasHidden && (
          <button
            type="button"
            onClick={onShowAll}
            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-600 shadow-sm ring-1 ring-gray-200 transition hover:text-brand-700"
          >
            Show all
          </button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {entries.map(entry => (
          <button
            key={entry.key}
            type="button"
            aria-pressed={entry.active}
            onClick={() => onToggle(entry.key)}
            className={`rounded-lg p-3 text-left transition ${
              entry.active
                ? 'bg-white shadow-card'
                : 'bg-white/45 opacity-50 hover:opacity-80'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-bold text-ink-700">{entry.label}</span>
            </span>
            <span className="mt-2 block text-sm font-black text-ink">{formatTwh(entry.value)}</span>
            {typeof entry.share === 'number' && (
              <span className="mt-0.5 block text-[11px] font-medium text-ink-500">{entry.share.toFixed(1)}% share</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function InsightStat({
  label,
  value,
  detail,
  color,
}: {
  label: string
  value: string
  detail?: string
  color?: string
}) {
  return (
    <div className="rounded-lg bg-white/[0.07] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-ink-300">
        {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
        <span>{label}</span>
      </div>
      <div className="mt-1 break-words text-sm font-black leading-tight text-white">{value}</div>
      {detail && <div className="mt-1 text-[11px] font-semibold leading-snug text-ink-300">{detail}</div>}
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
  meta,
  signed = false,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  meta: Partial<Record<string, ChartSourceMeta>>
  signed?: boolean
}) {
  if (!active || !payload?.length) return null

  const entries = payload
    .filter(item => item.value !== undefined && item.dataKey !== undefined)
    .map(item => {
      const rawValue = Array.isArray(item.value) ? item.value[0] : item.value
      return {
        key: String(item.dataKey),
        value: Number(rawValue),
        color: item.color,
      }
    })
    .filter(item => Number.isFinite(item.value))
    .reverse()

  const total = entries.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="min-w-[220px] rounded-xl bg-white p-3 shadow-xl shadow-gray-900/10">
      <div className="flex items-baseline justify-between gap-4">
        <div className="text-sm font-black text-ink">{label}</div>
        {!signed && <div className="text-xs font-semibold text-ink-500">{formatTwh(total)}</div>}
      </div>
      <div className="mt-3 space-y-2">
        {entries.map(item => {
          const source = meta[item.key]
          return (
            <div key={item.key} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-2 font-semibold text-ink-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: source?.color ?? item.color }} />
                {source?.label ?? item.key}
              </span>
              <span className="font-bold text-ink">{signed ? formatSignedTwh(item.value) : formatTwh(item.value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChangeLegend({
  selectedSource,
  onSelect,
}: {
  selectedSource: string
  onSelect: (source: string) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {ELECTRICITY_GENERATION_CHANGE_2025.map(item => (
        <button
          key={item.source}
          type="button"
          onClick={() => onSelect(item.source)}
          aria-pressed={selectedSource === item.source}
          className={`rounded-lg p-3 text-left transition ${
            selectedSource === item.source
              ? 'bg-white shadow-card'
              : 'bg-paper-200 hover:bg-white'
          }`}
        >
          <span className="flex items-center gap-2 text-xs font-bold text-ink-700">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.source}
          </span>
          <span className={`mt-2 block text-sm font-black ${item.changeTwh >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
            {formatSignedTwh(item.changeTwh)}
          </span>
        </button>
      ))}
    </div>
  )
}

function StackedShareBar({
  mixKey,
}: {
  mixKey: RegionalMixKey
}) {
  const mix = REGIONAL_ELECTRICITY_MIX.find(item => item.key === mixKey) ?? REGIONAL_ELECTRICITY_MIX[0]
  const segments = [
    { key: 'coal' as const, value: mix.coal, color: ELECTRICITY_SOURCE_META.coal.color, label: 'Coal' },
    { key: 'naturalGas' as const, value: mix.naturalGas, color: ELECTRICITY_SOURCE_META.naturalGas.color, label: 'Gas' },
    { key: 'oil' as const, value: mix.oil, color: ELECTRICITY_SOURCE_META.oil.color, label: 'Oil' },
    { key: 'nuclear' as const, value: mix.nuclear, color: ELECTRICITY_SOURCE_META.nuclear.color, label: 'Nuclear' },
    { key: 'renewables' as const, value: mix.renewables, color: ELECTRICITY_SOURCE_META.renewables.color, label: 'Renewables' },
  ]

  return (
    <div>
      <div className="flex h-5 overflow-hidden rounded-full bg-paper-200">
        {segments.map(segment => (
          <div
            key={segment.key}
            className="h-full"
            style={{ width: `${segment.value}%`, backgroundColor: segment.color }}
            title={`${segment.label}: ${segment.value}%`}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {segments.map(segment => (
          <div key={segment.key} className="rounded-lg bg-paper-200 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-[11px] font-semibold text-ink-500">{segment.label}</span>
            </div>
            <div className="mt-1 text-sm font-bold text-ink">{segment.value.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourceNotes() {
  return (
    <section className="rounded-card border border-ink/10 bg-paper-100 p-6 shadow-card">
      <h2 className="text-base font-bold text-ink">Sources and boundaries</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-500">
        Battery GWh figures here refer to stationary battery energy storage, not EV battery packs and not
        pumped hydro. The charging-source view is a regional electricity mix proxy, not metered battery charging.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {DATA_SOURCES.map(source => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-paper-200 p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
          >
            <div className="text-sm font-semibold text-ink">{source.label}</div>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">{source.note}</p>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function EnergyDeploymentScoreboardPage() {
  const [chartMode, setChartMode] = useState<ChartMode>('electricity')
  const [mixKey, setMixKey] = useState<RegionalMixKey>('world')
  const [batteryRegionKey, setBatteryRegionKey] = useState<BatteryStorageRegionKey>('global')
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedChangeSource, setSelectedChangeSource] = useState(ELECTRICITY_GENERATION_CHANGE_2025[0].source)
  const [visibleElectricityKeys, setVisibleElectricityKeys] = useState<GenerationStackKey[]>(generationStackKeys)
  const [visibleRenewableKeys, setVisibleRenewableKeys] = useState<RenewableSourceKey[]>(renewableKeys)

  const latestGeneration = GLOBAL_ELECTRICITY_GENERATION[GLOBAL_ELECTRICITY_GENERATION.length - 1]
  const totalGeneration = electricityKeys.reduce((sum, key) => sum + latestGeneration[key], 0)
  const selectedGeneration = GLOBAL_ELECTRICITY_GENERATION.find(item => item.year === selectedYear) ?? latestGeneration
  const selectedGenerationStack = GLOBAL_GENERATION_STACK.find(item => item.year === selectedYear) ?? GLOBAL_GENERATION_STACK[GLOBAL_GENERATION_STACK.length - 1]
  const selectedRenewableGeneration = GLOBAL_RENEWABLE_GENERATION.find(item => item.year === selectedYear) ?? GLOBAL_RENEWABLE_GENERATION[GLOBAL_RENEWABLE_GENERATION.length - 1]
  const selectedChange = ELECTRICITY_GENERATION_CHANGE_2025.find(item => item.source === selectedChangeSource) ?? ELECTRICITY_GENERATION_CHANGE_2025[0]
  const batteryRegion = BATTERY_STORAGE_REGIONS.find(item => item.key === batteryRegionKey) ?? BATTERY_STORAGE_REGIONS[0]
  const selectedMix = REGIONAL_ELECTRICITY_MIX.find(item => item.key === mixKey) ?? REGIONAL_ELECTRICITY_MIX[0]
  const fossilShare = getMixTotal(mixKey, ['coal', 'oil', 'naturalGas'])
  const lowCarbonShare = getMixTotal(mixKey, ['renewables', 'nuclear'])
  const selectedGenerationTotal = electricityKeys.reduce((sum, key) => sum + selectedGeneration[key], 0)
  const visibleGenerationTotal = visibleElectricityKeys.reduce((sum, key) => sum + selectedGenerationStack[key], 0)
  const selectedRenewableTotal = renewableKeys.reduce((sum, key) => sum + selectedRenewableGeneration[key], 0)
  const visibleRenewableTotal = visibleRenewableKeys.reduce((sum, key) => sum + selectedRenewableGeneration[key], 0)
  const selectedGenerationLeader = electricityKeys
    .map(key => ({
      key,
      label: ELECTRICITY_SOURCE_META[key].label,
      value: selectedGeneration[key],
      color: ELECTRICITY_SOURCE_META[key].color,
    }))
    .sort((a, b) => b.value - a.value)[0]
  const selectedRenewableLeader = renewableKeys
    .map(key => ({
      key,
      label: RENEWABLE_SOURCE_META[key].label,
      value: selectedRenewableGeneration[key],
      color: RENEWABLE_SOURCE_META[key].color,
    }))
    .sort((a, b) => b.value - a.value)[0]
  const previousGenerationStack = GLOBAL_GENERATION_STACK.find(item => item.year === selectedYear - 1)
  const previousRenewableGeneration = GLOBAL_RENEWABLE_GENERATION.find(item => item.year === selectedYear - 1)
  const electricityTrendRows = buildTrendRows(
    generationStackKeys,
    selectedGenerationStack,
    previousGenerationStack,
    GENERATION_STACK_SOURCE_META,
    selectedGenerationTotal
  )
  const renewableTrendRows = buildTrendRows(
    renewableKeys,
    selectedRenewableGeneration,
    previousRenewableGeneration,
    RENEWABLE_SOURCE_META,
    selectedRenewableTotal
  )
  const visibleElectricityTrendRows = electricityTrendRows.filter(row => visibleElectricityKeys.includes(row.key))
  const visibleRenewableTrendRows = renewableTrendRows.filter(row => visibleRenewableKeys.includes(row.key))
  const selectedVisibleGenerationLeader = getLargestSource(visibleElectricityTrendRows) ?? electricityTrendRows[0]
  const selectedVisibleRenewableLeader = getLargestSource(visibleRenewableTrendRows) ?? renewableTrendRows[0]
  const fastestElectricityGrowth = getFastestGrowingSource(visibleElectricityTrendRows)
  const biggestElectricityMover = getBiggestMoverSource(visibleElectricityTrendRows)
  const fastestRenewableGrowth = getFastestGrowingSource(visibleRenewableTrendRows)
  const biggestRenewableMover = getBiggestMoverSource(visibleRenewableTrendRows)
  const fossilGeneration = selectedGeneration.coal + selectedGeneration.naturalGas + selectedGeneration.oil
  const fossilGenerationShare = getShare(fossilGeneration, selectedGenerationTotal)
  const renewableGenerationShare = getShare(selectedGeneration.renewables, selectedGenerationTotal)
  const solarWindGeneration = selectedRenewableGeneration.solarPv + selectedRenewableGeneration.wind
  const solarWindShare = getShare(solarWindGeneration, selectedRenewableTotal)
  const hydroShare = getShare(selectedRenewableGeneration.hydro, selectedRenewableTotal)
  const biggestChangeGain = [...ELECTRICITY_GENERATION_CHANGE_2025]
    .filter(item => item.changeTwh > 0)
    .sort((a, b) => b.changeTwh - a.changeTwh)[0]
  const biggestChangeFall = [...ELECTRICITY_GENERATION_CHANGE_2025]
    .filter(item => item.changeTwh < 0)
    .sort((a, b) => a.changeTwh - b.changeTwh)[0]
  const netChange2025 = ELECTRICITY_GENERATION_CHANGE_2025.reduce((sum, item) => sum + item.changeTwh, 0)
  const renewablesChange2025 = ELECTRICITY_GENERATION_CHANGE_2025
    .filter(item => ['Solar PV', 'Wind', 'Hydro', 'Other renewables'].includes(item.source))
    .reduce((sum, item) => sum + item.changeTwh, 0)
  const fossilChange2025 = ELECTRICITY_GENERATION_CHANGE_2025
    .filter(item => ['Coal', 'Natural gas', 'Oil'].includes(item.source))
    .reduce((sum, item) => sum + item.changeTwh, 0)

  function toggleElectricityKey(key: GenerationStackKey) {
    setVisibleElectricityKeys(prev => {
      if (prev.includes(key)) {
        return prev.length === 1 ? prev : prev.filter(item => item !== key)
      }
      return generationStackKeys.filter(item => item === key || prev.includes(item))
    })
  }

  function toggleRenewableKey(key: RenewableSourceKey) {
    setVisibleRenewableKeys(prev => {
      if (prev.includes(key)) {
        return prev.length === 1 ? prev : prev.filter(item => item !== key)
      }
      return renewableKeys.filter(item => item === key || prev.includes(item))
    })
  }

  const electricityLegendEntries: SourceLegendEntry[] = generationStackKeys.map(key => ({
    key,
    label: GENERATION_STACK_SOURCE_META[key].label,
    color: GENERATION_STACK_SOURCE_META[key].color,
    value: selectedGenerationStack[key],
    share: getShare(selectedGenerationStack[key], selectedGenerationTotal),
    active: visibleElectricityKeys.includes(key),
  }))

  const renewableLegendEntries: SourceLegendEntry[] = renewableKeys.map(key => ({
    key,
    label: RENEWABLE_SOURCE_META[key].label,
    color: RENEWABLE_SOURCE_META[key].color,
    value: selectedRenewableGeneration[key],
    share: getShare(selectedRenewableGeneration[key], selectedRenewableTotal),
    active: visibleRenewableKeys.includes(key),
  }))

  const batteryRegionChartData = useMemo(
    () => batteryRegion.points.map(point => ({
      year: String(point.year),
      utilityScaleGw: point.utilityScaleGw,
      behindMeterGw: point.behindMeterGw,
      totalGw: point.utilityScaleGw + point.behindMeterGw,
    })),
    [batteryRegion]
  )

  const batteryContributionRows = useMemo(
    () => {
      const rows = BATTERY_STORAGE_REGIONS
        .filter(region => region.key !== 'global')
        .map(region => {
          const additions2023Gw = getBatteryRegionTotal(region.key, 2023)
          const additions2025Gw = getBatteryRegionTotal(region.key, 2025)

          return {
            key: region.key,
            label: region.label,
            color: BATTERY_REGION_COLORS[region.key] ?? '#64748b',
            additions2025Gw,
            growthSince2023Pct: additions2023Gw > 0
              ? ((additions2025Gw - additions2023Gw) / additions2023Gw) * 100
              : 0,
          }
        })
        .sort((a, b) => b.additions2025Gw - a.additions2025Gw)
      const total = rows.reduce((sum, row) => sum + row.additions2025Gw, 0)

      return rows.map(row => ({
        ...row,
        share2025Pct: getShare(row.additions2025Gw, total),
      }))
    },
    []
  )
  const batteryContributionTotal = batteryContributionRows.reduce((sum, row) => sum + row.additions2025Gw, 0)
  const largestBatteryContributor = batteryContributionRows[0]
  const fastestBatteryBuildout = [...batteryContributionRows].sort((a, b) => b.growthSince2023Pct - a.growthSince2023Pct)[0]

  const annualBatteryMilestones = BATTERY_ENERGY_MILESTONES.filter(item => item.annualAdditionsGwh)
  const cumulativeBatteryMilestones = BATTERY_ENERGY_MILESTONES.filter(item => item.cumulativeGwh)

  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 md:pt-12">
        <BigPictureNav className="mb-8" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-paper-200 px-3 py-1 text-xs font-semibold text-ink-600">
              2025 actuals where available · 2035 storage outlook
            </div>
            <h1 className="font-display text-4xl font-medium tracking-tight text-ink md:text-6xl">
              Battery deployment scoreboard
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">
              Track how fast stationary batteries are entering the power system, and compare that buildout
              against the world&apos;s generation stack: coal, gas, oil, hydro, wind, solar, and nuclear.
            </p>
          </div>
          <UnitNote />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Deployed storage"
            value={`~${formatGwh(ENERGY_DEPLOYMENT_SNAPSHOT.batteryCumulativeDisplayGwh)}`}
            helper={`Estimated stationary battery energy capacity now in service worldwide (${ENERGY_DEPLOYMENT_SNAPSHOT.batteryCumulativeEnergyGwhLow}-${ENERGY_DEPLOYMENT_SNAPSHOT.batteryCumulativeEnergyGwhHigh} GWh range).`}
            accent="emerald"
          />
          <MetricCard
            label="2025 battery build"
            value={`${formatGw(ENERGY_DEPLOYMENT_SNAPSHOT.batteryPowerAdditionsGw)} / ${formatGwh(ENERGY_DEPLOYMENT_SNAPSHOT.batteryEnergyAdditionsGwh)}`}
            helper="New battery storage added in one year. Utility-scale projects supplied most of the new power capacity."
            accent="cyan"
          />
          <MetricCard
            label="Solar surge"
            value={`+${formatTwh(ENERGY_DEPLOYMENT_SNAPSHOT.solarGenerationGrowthTwh)}`}
            helper="Solar PV produced the largest year-on-year increase of any electricity source in 2025."
            accent="amber"
          />
          <MetricCard
            label="2035 outlook"
            value={formatGwh(ENERGY_DEPLOYMENT_SNAPSHOT.forecast2035CumulativeGwh)}
            helper="Public BNEF outlook for cumulative stationary energy storage by 2035: about 2 TW / 7.3 TWh."
            accent="slate"
          />
        </div>

        <section className="mt-10 rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card md:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">
                World energy shift, 2015-2025
                <InfoTooltip
                  content="Electricity generation is shown in TWh. Battery storage is shown separately because it stores energy rather than generating it."
                />
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {chartMode === 'change'
                  ? 'Year-on-year change in generation by source, 2024 → 2025, in TWh. The bars show how much each source rose or fell.'
                  : chartMode === 'renewables'
                    ? "Each year's total renewable generation by source, in TWh. These are annual totals, not additions. Hover to inspect a year."
                    : "Each year's total electricity generation by source, in TWh. These are annual totals, not additions. Hover to inspect a year."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SegmentButton value="electricity" selected={chartMode} onSelect={setChartMode}>Generation</SegmentButton>
              <SegmentButton value="renewables" selected={chartMode} onSelect={setChartMode}>Renewables</SegmentButton>
              <SegmentButton value="change" selected={chartMode} onSelect={setChartMode}>2025 change</SegmentButton>
            </div>
          </div>

          {chartMode === 'electricity' && (
            <div className="scroll-mt-16" data-generation-surface>
            <div className="mb-5 rounded-xl bg-ink p-4 text-white">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-300">Selected year</div>
                <div className="text-3xl font-black tabular-nums leading-none">{selectedYear}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <InsightStat label="Visible stack" value={formatTwh(visibleGenerationTotal)} detail="selected sources" />
                <InsightStat
                  label="Largest source"
                  value={selectedVisibleGenerationLeader?.label ?? 'No source'}
                  detail={`${(selectedVisibleGenerationLeader?.share ?? 0).toFixed(1)}% of total`}
                  color={selectedVisibleGenerationLeader?.color}
                />
                <InsightStat
                  label="Fastest growing"
                  value={fastestElectricityGrowth?.label ?? 'Baseline year'}
                  detail={fastestElectricityGrowth ? `${formatSignedPercent(fastestElectricityGrowth.changePct ?? 0)} YoY` : 'No prior year'}
                  color={fastestElectricityGrowth?.color}
                />
                <InsightStat
                  label="Biggest mover"
                  value={biggestElectricityMover?.label ?? 'Baseline year'}
                  detail={biggestElectricityMover?.change !== null && biggestElectricityMover?.change !== undefined ? formatSignedTwh(biggestElectricityMover.change) : 'No prior year'}
                  color={biggestElectricityMover?.color}
                />
                <InsightStat
                  label="Renewables"
                  value={`${renewableGenerationShare.toFixed(1)}%`}
                  detail={formatTwh(selectedGeneration.renewables)}
                  color={ELECTRICITY_SOURCE_META.renewables.color}
                />
                <InsightStat
                  label="Fossil share"
                  value={`${fossilGenerationShare.toFixed(1)}%`}
                  detail="coal + gas + oil"
                  color={ELECTRICITY_SOURCE_META.coal.color}
                />
              </div>
            </div>

            <div data-generation-chart>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart
                  data={GLOBAL_GENERATION_STACK}
                  margin={{ top: 12, right: 18, left: 0, bottom: 4 }}
                  onMouseMove={(state) => {
                    const year = Number(state?.activePayload?.[0]?.payload?.year)
                    if (Number.isFinite(year)) setSelectedYear(year)
                  }}
                >
                  <defs>
                    {generationStackKeys.filter(key => !isFossilGrainKey(key)).map(key => (
                      <linearGradient key={key} id={`generation-${key}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor={GENERATION_STACK_SOURCE_META[key].color} stopOpacity={0.92} />
                        <stop offset="95%" stopColor={GENERATION_STACK_SOURCE_META[key].color} stopOpacity={0.68} />
                      </linearGradient>
                    ))}
                    <GenerationFossilGrainDefs />
                  </defs>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 6" vertical={false} />
                  <XAxis
                    dataKey="year"
                    ticks={yearTicks}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    tickFormatter={(value: number) => `${formatCompact(value)} TWh`}
                    tickLine={false}
                    axisLine={false}
                    width={76}
                  />
                  <Tooltip
                    cursor={{ stroke: '#111827', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={(props) => <ChartTooltip {...props} meta={GENERATION_STACK_SOURCE_META} />}
                  />
                  <ReferenceLine x={selectedYear} stroke="#111827" strokeOpacity={0.28} strokeDasharray="4 4" />
                  {visibleElectricityKeys.map(key => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={GENERATION_STACK_SOURCE_META[key].label}
                      stackId="generation"
                      stroke={GENERATION_STACK_SOURCE_META[key].color}
                      strokeWidth={1.6}
                      fill={generationStackFill(key, GENERATION_STACK_SOURCE_META[key].color)}
                      fillOpacity={isFossilGrainKey(key) ? 0.8 : 1}
                      filter={generationStackFilter(key)}
                      isAnimationActive={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <GenerationYearDetail
              entries={electricityLegendEntries}
              formatTwh={formatTwh}
              onToggle={key => toggleElectricityKey(key as GenerationStackKey)}
              onShowAll={() => setVisibleElectricityKeys(generationStackKeys)}
            />
            </div>
          )}

          {chartMode !== 'electricity' && (
          <div className="mb-5 grid gap-3 lg:grid-cols-[340px_1fr]">
            <div className="rounded-xl bg-ink p-4 text-white">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-300">
                {chartMode === 'change' ? 'Selected source' : 'Selected year'}
              </div>
              <div className="mt-2 text-3xl font-black">
                {chartMode === 'change' ? selectedChange.source : selectedYear}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {chartMode === 'renewables' && (
                  <>
                    <InsightStat label="Visible stack" value={formatTwh(visibleRenewableTotal)} detail="selected sources" />
                    <InsightStat
                      label="Largest source"
                      value={selectedVisibleRenewableLeader?.label ?? 'No source'}
                      detail={`${(selectedVisibleRenewableLeader?.share ?? 0).toFixed(1)}% of renewables`}
                      color={selectedVisibleRenewableLeader?.color}
                    />
                    <InsightStat
                      label="Fastest growing"
                      value={fastestRenewableGrowth?.label ?? 'Baseline year'}
                      detail={fastestRenewableGrowth ? `${formatSignedPercent(fastestRenewableGrowth.changePct ?? 0)} YoY` : 'No prior year'}
                      color={fastestRenewableGrowth?.color}
                    />
                    <InsightStat
                      label="Biggest mover"
                      value={biggestRenewableMover?.label ?? 'Baseline year'}
                      detail={biggestRenewableMover?.change !== null && biggestRenewableMover?.change !== undefined ? formatSignedTwh(biggestRenewableMover.change) : 'No prior year'}
                      color={biggestRenewableMover?.color}
                    />
                    <InsightStat
                      label="Solar + wind"
                      value={`${solarWindShare.toFixed(1)}%`}
                      detail={formatTwh(solarWindGeneration)}
                      color={RENEWABLE_SOURCE_META.solarPv.color}
                    />
                    <InsightStat
                      label="Hydro share"
                      value={`${hydroShare.toFixed(1)}%`}
                      detail={formatTwh(selectedRenewableGeneration.hydro)}
                      color={RENEWABLE_SOURCE_META.hydro.color}
                    />
                  </>
                )}
                {chartMode === 'change' && (
                  <>
                    <InsightStat
                      label="Selected change"
                      value={formatSignedTwh(selectedChange.changeTwh)}
                      detail={selectedChange.source}
                      color={selectedChange.color}
                    />
                    <InsightStat
                      label="Largest gain"
                      value={biggestChangeGain?.source ?? 'No gain'}
                      detail={biggestChangeGain ? formatSignedTwh(biggestChangeGain.changeTwh) : undefined}
                      color={biggestChangeGain?.color}
                    />
                    <InsightStat
                      label="Largest fall"
                      value={biggestChangeFall?.source ?? 'No fall'}
                      detail={biggestChangeFall ? formatSignedTwh(biggestChangeFall.changeTwh) : undefined}
                      color={biggestChangeFall?.color}
                    />
                    <InsightStat label="Net stack" value={formatSignedTwh(netChange2025)} detail="all listed sources" />
                    <InsightStat
                      label="Renewables gain"
                      value={formatSignedTwh(renewablesChange2025)}
                      detail="solar, wind, hydro, other"
                      color={ELECTRICITY_SOURCE_META.renewables.color}
                    />
                    <InsightStat
                      label="Fossil move"
                      value={formatSignedTwh(fossilChange2025)}
                      detail="coal + gas + oil"
                      color={ELECTRICITY_SOURCE_META.coal.color}
                    />
                  </>
                )}
              </div>
            </div>

            {chartMode === 'renewables' && (
              <SourceLegend
                title="Renewable sources"
                entries={renewableLegendEntries}
                onToggle={(key) => toggleRenewableKey(key as RenewableSourceKey)}
                onShowAll={() => setVisibleRenewableKeys(renewableKeys)}
              />
            )}

            {chartMode === 'change' && (
              <div className="rounded-xl bg-paper-200/70 p-3">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">
                  2025 year-on-year change
                </div>
                <ChangeLegend selectedSource={selectedChangeSource} onSelect={setSelectedChangeSource} />
              </div>
            )}
          </div>
          )}

          {chartMode === 'renewables' && (
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart
                data={GLOBAL_RENEWABLE_GENERATION}
                margin={{ top: 12, right: 18, left: 0, bottom: 4 }}
                onMouseMove={(state) => {
                  const year = Number(state?.activePayload?.[0]?.payload?.year)
                  if (Number.isFinite(year)) setSelectedYear(year)
                }}
              >
                <defs>
                  {renewableKeys.map(key => (
                    <linearGradient key={key} id={`renewable-${key}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor={RENEWABLE_SOURCE_META[key].color} stopOpacity={0.95} />
                      <stop offset="95%" stopColor={RENEWABLE_SOURCE_META[key].color} stopOpacity={0.68} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 6" vertical={false} />
                <XAxis
                  dataKey="year"
                  ticks={yearTicks}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  tickFormatter={(value: number) => `${formatCompact(value)} TWh`}
                  tickLine={false}
                  axisLine={false}
                  width={76}
                />
                <Tooltip
                  cursor={{ stroke: '#111827', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={(props) => <ChartTooltip {...props} meta={RENEWABLE_SOURCE_META} />}
                />
                <ReferenceLine x={selectedYear} stroke="#111827" strokeOpacity={0.28} strokeDasharray="4 4" />
                {visibleRenewableKeys.map(key => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={RENEWABLE_SOURCE_META[key].label}
                    stackId="renewables"
                    stroke={RENEWABLE_SOURCE_META[key].color}
                    strokeWidth={1.6}
                    fill={`url(#renewable-${key})`}
                    fillOpacity={1}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'change' && (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={ELECTRICITY_GENERATION_CHANGE_2025}
                margin={{ top: 12, right: 18, left: 0, bottom: 8 }}
                onMouseMove={(state) => {
                  const source = state?.activePayload?.[0]?.payload?.source
                  if (typeof source === 'string') setSelectedChangeSource(source)
                }}
              >
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 6" vertical={false} />
                <XAxis
                  dataKey="source"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={70}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  tickFormatter={(value: number) => `${value > 0 ? '+' : ''}${formatCompact(value)} TWh`}
                  tickLine={false}
                  axisLine={false}
                  width={82}
                />
                <Tooltip content={(props) => <ChartTooltip {...props} meta={{}} signed />} />
                <ReferenceLine y={0} stroke="#9ca3af" />
                <Bar dataKey="changeTwh" name="2025 change" radius={[6, 6, 0, 0]}>
                  {ELECTRICITY_GENERATION_CHANGE_2025.map(item => (
                    <Cell
                      key={item.source}
                      fill={item.color}
                      opacity={selectedChangeSource === item.source ? 1 : 0.55}
                      stroke={selectedChangeSource === item.source ? '#111827' : 'transparent'}
                      strokeWidth={selectedChangeSource === item.source ? 1 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-ink/5 pt-5 md:grid-cols-3">
            <div className="rounded-lg bg-paper-200 p-4">
              <div className="text-xs font-semibold text-ink-500">{chartMode === 'renewables' ? 'Total renewables' : 'Total electricity generation'}</div>
              <div className="mt-1 text-xl font-bold text-ink">
                {chartMode === 'renewables' ? formatTwh(selectedRenewableTotal) : formatTwh(selectedGenerationTotal)}
              </div>
              <div className="mt-1 text-xs text-ink-500">World, {chartMode === 'change' ? '2025 change' : selectedYear}</div>
            </div>
            <div className="rounded-lg bg-brand-50/60 p-4">
              <div className="text-xs font-semibold text-brand-700">
                {chartMode === 'renewables' ? `${selectedRenewableLeader.label} generation` : 'Renewables generation'}
              </div>
              <div className="mt-1 text-xl font-bold text-ink">
                {chartMode === 'renewables' ? formatTwh(selectedRenewableLeader.value) : formatTwh(selectedGeneration.renewables)}
              </div>
              <div className="mt-1 text-xs text-ink-500">
                {chartMode === 'renewables'
                  ? `${getShare(selectedRenewableLeader.value, selectedRenewableTotal).toFixed(1)}% of renewables`
                  : `${getShare(selectedGeneration.renewables, selectedGenerationTotal).toFixed(1)}% of world power`}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-600">
                {chartMode === 'change' ? 'Selected source change' : `${selectedGenerationLeader.label} generation`}
              </div>
              <div className="mt-1 text-xl font-bold text-ink">
                {chartMode === 'change' ? formatSignedTwh(selectedChange.changeTwh) : formatTwh(selectedGenerationLeader.value)}
              </div>
              <div className="mt-1 text-xs text-ink-500">
                {chartMode === 'change'
                  ? selectedChange.source
                  : `${getShare(selectedGenerationLeader.value, selectedGenerationTotal).toFixed(1)}% of world power`}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-ink">
              Why now: the price of storage collapsed
              <InfoTooltip content="BloombergNEF's annual battery price survey tracks the volume-weighted average lithium-ion pack price across EV and stationary-storage applications, in nominal US dollars per kWh." />
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Every chart below is downstream of this one. Storage scaled because the pack price fell far enough to make it worth building.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Average pack price · $ per kWh · nominal</div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={BATTERY_PACK_PRICES} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => `$${value}`} width={48} domain={[0, 200]} />
                  <Tooltip formatter={(value: number | string) => [`$${value}/kWh`, 'Pack price']} />
                  <Line type="monotone" dataKey="pricePerKwh" stroke="#1f8a55" strokeWidth={2.5} dot={{ r: 3, fill: '#1f8a55' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <p className="mt-3 text-xs leading-relaxed text-ink-500">
                Chart shows the continuous 2018-2025 survey. The 2022 uptick to $151/kWh was the first annual rise on record, driven by a
                lithium-price spike; prices then resumed falling to new record lows in 2024 and 2025.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-ink p-4 text-white">
                <div className="text-xs font-semibold text-brand-300">2010 → {BATTERY_PRICE_CONTEXT.latestYear}</div>
                <div className="mt-2 text-3xl font-black">−{BATTERY_PRICE_CONTEXT.declineSince2010Pct}%</div>
                <p className="mt-2 text-xs leading-relaxed text-ink-300">
                  From ${BATTERY_PRICE_CONTEXT.price2010PerKwh.toLocaleString()}/kWh in 2010 to ${BATTERY_PRICE_CONTEXT.latestPricePerKwh}/kWh
                  in {BATTERY_PRICE_CONTEXT.latestYear}{'. '}That drop is what puts a battery on a grid or in a house.
                </p>
              </div>
              <div className="rounded-lg bg-paper-200 p-4">
                <div className="text-xs font-semibold text-ink-500">EV packs, 2024</div>
                <div className="mt-1 text-2xl font-bold text-ink">${BATTERY_PRICE_CONTEXT.evPackPrice2024PerKwh}/kWh</div>
                <div className="mt-1 text-xs text-ink-500">Crossed below $100/kWh for the first time. In China, packs reached ${BATTERY_PRICE_CONTEXT.chinaPackPrice2024PerKwh}/kWh.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card md:p-6">
            <div className="mb-5">
              <div>
                <h2 className="text-lg font-bold text-ink">Battery storage additions</h2>
                <p className="mt-1 text-sm text-ink-500">
                  Power-capacity additions by market. Select a region to see the utility-scale vs behind-the-meter split.
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-xl bg-paper-200 p-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Market filter</div>
                <div className="text-xs font-semibold text-ink-500">
                  Selected: <span className="text-ink">{batteryRegion.label}</span>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5" role="tablist" aria-label="Battery storage market">
                {BATTERY_STORAGE_REGIONS.map(region => (
                  <button
                    key={region.key}
                    type="button"
                    role="tab"
                    aria-selected={batteryRegionKey === region.key}
                    onClick={() => setBatteryRegionKey(region.key)}
                    className={`rounded-lg px-3 py-2 text-left transition ${
                      batteryRegionKey === region.key
                        ? 'bg-ink text-white shadow-card'
                        : 'bg-white text-ink-700 hover:text-brand-700'
                    }`}
                  >
                    <span className="block text-sm font-black">{region.label}</span>
                    <span className={`mt-0.5 block text-[11px] font-semibold ${
                      batteryRegionKey === region.key ? 'text-brand-200' : 'text-ink-500'
                    }`}>
                      2025: {formatGw(getBatteryRegionTotal(region.key, 2025))}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Added per year · GW</div>
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={batteryRegionChartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => `${value} GW`} width={58} />
                <Tooltip formatter={(value: number | string, name: string) => [formatGw(Number(value)), name === 'utilityScaleGw' ? 'Utility-scale' : 'Behind the meter']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="utilityScaleGw" name="Utility-scale" stackId="battery" fill="#10b981" radius={[0, 0, 6, 6]} />
                <Bar dataKey="behindMeterGw" name="Behind the meter" stackId="battery" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-5 grid grid-cols-1 gap-3 border-t border-ink/5 pt-5 sm:grid-cols-3">
              {batteryRegionChartData.slice(-3).map(point => (
                <div key={point.year} className="rounded-lg bg-paper-200 p-4">
                  <div className="text-xs font-semibold text-ink-500">{batteryRegion.label} {point.year}</div>
                  <div className="mt-1 text-lg font-bold text-ink">{formatGw(point.totalGw)}</div>
                  <div className="mt-1 text-xs text-ink-500">
                    {((point.utilityScaleGw / point.totalGw) * 100).toFixed(0)}% utility-scale
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card md:p-6">
            <h2 className="text-lg font-bold text-ink">Storage GWh milestones</h2>
            <p className="mt-1 text-sm text-ink-500">
              The clearest public GWh view is annual stationary storage additions plus a current cumulative range.
            </p>

            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Added per year · GWh</div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={annualBatteryMilestones} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => `${value} GWh`} width={68} />
                  <Tooltip formatter={(value: number | string) => [formatGwh(Number(value)), 'Annual additions']} />
                  <Bar dataKey="annualAdditionsGwh" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 rounded-lg bg-ink p-4 text-white">
              <div className="text-xs font-semibold text-brand-300">Cumulative storage trajectory</div>
              <div className="mt-3 space-y-3">
                {cumulativeBatteryMilestones.map(item => (
                  <div key={item.year}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-paper-300">{item.year}</span>
                      <span className="text-sm font-bold">{item.cumulativeGwh ? formatGwh(item.cumulativeGwh) : 'N/A'}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-brand-400"
                        style={{ width: `${item.cumulativeGwh ? Math.min(100, (item.cumulativeGwh / ENERGY_DEPLOYMENT_SNAPSHOT.forecast2035CumulativeGwh) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ink-300">
                The current deployed base is still small beside annual generation, but it is growing into the
                flexibility layer that makes higher solar and wind penetration usable.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-ink">
              The bigger battery market: electric cars
              <InfoTooltip content="Electric car sales are BEV + PHEV passenger cars, in million units, per the IEA Global EV Outlook. EVs are the largest single use of lithium-ion batteries, a much larger demand than stationary storage." />
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Stationary storage is the headline above, but cars take most of the world&apos;s batteries, and that market is run from one country.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">New electric cars sold per year · millions</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={GLOBAL_EV_SALES} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => `${value}M`} width={44} />
                  <Tooltip formatter={(value: number | string) => [`${value} million`, 'Electric cars sold']} />
                  <Bar dataKey="salesMillions" fill="#1f8a55" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-3 text-xs leading-relaxed text-ink-500">
                Global electric car sales rose from about 3 million in 2020 to over 20 million in {EV_MARKET_CONTEXT.latestYear}.
                About a quarter of all new cars sold were electric. Figures are IEA Global EV Outlook headline totals.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-lg bg-ink p-4 text-white">
                <div className="text-xs font-semibold text-brand-300">China&apos;s share of global EV sales, {EV_MARKET_CONTEXT.latestYear}</div>
                <div className="mt-2 text-3xl font-black">~{EV_MARKET_CONTEXT.chinaShareOfGlobalPct}%</div>
                <p className="mt-2 text-xs leading-relaxed text-ink-300">
                  More than {EV_MARKET_CONTEXT.chinaSalesMillions} million electric cars were sold in China. Its share eased from
                  ~{EV_MARKET_CONTEXT.china2024ShareOfGlobalPct}% in 2024 only because other markets finally started catching up.
                </p>
              </div>
              <div className="rounded-lg bg-paper-200 p-4">
                <div className="text-xs font-semibold text-ink-500">Inside China, {EV_MARKET_CONTEXT.latestYear}</div>
                <div className="mt-1 text-2xl font-bold text-ink">~{EV_MARKET_CONTEXT.chinaDomesticEvSharePct}%</div>
                <div className="mt-1 text-xs text-ink-500">of all new cars sold were electric. Same price drop, counted in cars sold.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">
                What charges the batteries?
                <InfoTooltip content="This is a proxy: it shows each region's electricity generation mix, not metered charging energy for battery storage assets. Actual charging depends on dispatch, co-location, and market rules." />
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Pick a region to see the grid mix batteries would meet if charged from the average electricity system.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {REGIONAL_ELECTRICITY_MIX.map(region => (
                <SegmentButton key={region.key} value={region.key} selected={mixKey} onSelect={setMixKey}>
                  {region.label}
                </SegmentButton>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <StackedShareBar mixKey={mixKey} />
            <div className="rounded-xl bg-paper-200 p-5">
              <div className="text-sm font-bold text-ink">{selectedMix.label}</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-ink-500">Fossil share</div>
                  <div className="mt-1 text-2xl font-bold text-ink">{fossilShare.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-ink-500">Low-carbon share</div>
                  <div className="mt-1 text-2xl font-bold text-brand-700">{lowCarbonShare.toFixed(1)}%</div>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ink-500">
                For batteries, the deployment that matters is pairing storage
                with a grid that is adding solar, wind, hydro, nuclear, or other low-carbon supply.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card md:p-6">
            <h2 className="text-lg font-bold text-ink">2025 renewable capacity additions</h2>
            <p className="mt-1 text-sm text-ink-500">
              Solar dominates new renewable capacity. Battery storage follows as the balancing layer.
            </p>
            <div className="mt-5">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={RENEWABLE_CAPACITY_ADDITIONS_2025} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => `${value} GW`} width={58} />
                <Tooltip formatter={(value: number | string) => [formatGw(Number(value)), 'Capacity additions']} />
                <Bar dataKey="additionsGw" radius={[6, 6, 0, 0]}>
                  {RENEWABLE_CAPACITY_ADDITIONS_2025.map(item => (
                      <Cell key={item.source} fill={item.color} />
                  ))}
                </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-5 rounded-lg bg-brand-50/60 p-4 text-sm leading-relaxed text-ink-700">
              IRENA reports {ENERGY_DEPLOYMENT_SNAPSHOT.irenaRenewableCapacityAdditionsGw} GW of renewable
              capacity added in 2025, equal to {ENERGY_DEPLOYMENT_SNAPSHOT.irenaRenewablesShareOfExpansionPct}% of total net power-capacity expansion.
            </div>
          </div>

          <div className="rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card md:p-6">
            <h2 className="text-lg font-bold text-ink">2025 battery buildout share</h2>
            <p className="mt-1 text-sm text-ink-500">
              New stationary storage power additions by market. The stacked bar adds up to the same global total.
            </p>
            <div className="mt-5 rounded-xl bg-paper-200 p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Global additions</div>
                  <div className="mt-1 text-2xl font-black text-ink">{formatGw(batteryContributionTotal)}</div>
                </div>
                <div className="text-right text-xs font-semibold text-ink-500">
                  100% of tracked 2025 market additions
                </div>
              </div>

              <div className="mt-4 flex h-12 overflow-hidden rounded-xl bg-white shadow-inner" role="img" aria-label="2025 battery storage additions share by market">
                {batteryContributionRows.map(region => (
                  <button
                    type="button"
                    key={region.key}
                    onClick={() => setBatteryRegionKey(region.key)}
                    title={`${region.label}: ${formatGw(region.additions2025Gw)} (${region.share2025Pct.toFixed(1)}%)`}
                    className={`relative h-full border-r border-white/80 text-left transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 ${
                      batteryRegionKey === region.key ? 'ring-2 ring-gray-950 ring-offset-2' : ''
                    }`}
                    style={{ width: `${region.share2025Pct}%`, backgroundColor: region.color }}
                    aria-label={`${region.label}, ${formatGw(region.additions2025Gw)}, ${region.share2025Pct.toFixed(1)} percent of 2025 tracked battery additions`}
                  >
                    {region.share2025Pct >= 12 ? (
                      <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 truncate text-xs font-black text-white">
                        {region.share2025Pct.toFixed(0)}%
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {batteryContributionRows.map(region => (
                  <button
                    type="button"
                    key={region.key}
                    onClick={() => setBatteryRegionKey(region.key)}
                    className={`rounded-lg p-3 text-left transition ${
                      batteryRegionKey === region.key
                        ? 'bg-white shadow-card'
                        : 'bg-white/55 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: region.color }} />
                        <span className="truncate text-sm font-bold text-ink">{region.label}</span>
                      </span>
                      <span className="shrink-0 text-sm font-black text-ink">{region.share2025Pct.toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-ink-500">
                      <span>{formatGw(region.additions2025Gw)}</span>
                      <span>{region.growthSince2023Pct >= 0 ? '+' : ''}{region.growthSince2023Pct.toFixed(0)}% vs 2023</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-brand-50 p-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">Largest share</div>
                <div className="mt-1 text-sm font-black text-ink">
                  {largestBatteryContributor.label} · {largestBatteryContributor.share2025Pct.toFixed(1)}%
                </div>
              </div>
              <div className="rounded-lg bg-sky-50 p-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">Fastest buildout</div>
                <div className="mt-1 text-sm font-black text-ink">
                  {fastestBatteryBuildout.label} · +{fastestBatteryBuildout.growthSince2023Pct.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-card border border-ink/10 bg-paper-100 p-5 shadow-card md:p-6">
          <h2 className="text-lg font-bold text-ink">Solar and wind market signal</h2>
          <p className="mt-1 text-sm text-ink-500">
            Major-market 2025 additions show where future battery charging demand is likely to cluster.
          </p>
          <div className="mt-5">
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={SOLAR_WIND_SELECTED_MARKETS_2025} layout="vertical" margin={{ top: 12, right: 12, left: 24, bottom: 0 }}>
                <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value: number) => `${value} GW`} />
                <YAxis dataKey="market" type="category" tick={{ fontSize: 11 }} width={108} />
                <Tooltip formatter={(value: number | string, name: string) => [formatGw(Number(value)), name === 'solarPvGw' ? 'Solar PV' : 'Wind']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="solarPvGw" name="Solar PV" stackId="market" fill={RENEWABLE_SOURCE_META.solarPv.color} radius={[0, 0, 0, 0]} />
                <Bar dataKey="windGw" name="Wind" stackId="market" fill={RENEWABLE_SOURCE_META.wind.color} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="mt-10">
          <SourceNotes />
        </div>
      </section>
    </main>
  )
}
