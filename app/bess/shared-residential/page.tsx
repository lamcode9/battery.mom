'use client'

import { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react'
import { Country, BESS } from '@/types/bess'
import { useVehicleStore } from '@/store/VehicleStore'
import { COUNTRY_NAMES, CURRENCY_SYMBOLS } from '@/lib/constants'
import CountrySelector from '@/components/CountrySelector'
import InfoTooltip from '@/components/InfoTooltip'
import PDFExportButton from '@/components/PDFExportButton'
import { Eyebrow } from '@/components/ui'
import { NextSteps } from '@/components/ui/NextSteps'
import BuildingComparison, { type BuildingSnapshot } from '@/components/BuildingComparison'
import MarketingPDFButton from '@/components/MarketingPDFButton'
import GreenCertEstimator from '@/components/GreenCertEstimator'
import ESGDashboard from '@/components/ESGDashboard'
import TenantROIPitch from '@/components/TenantROIPitch'
import { useURLState, copyShareLink } from '@/lib/hooks/useURLState'
import { loadBESSData } from '@/lib/data-fetchers/bess-data'
import {
  SOLAR_YIELD_PER_KW,
  SOLAR_COST_PER_KW,
  ROOF_QUALITY_MULTIPLIERS,
  ELECTRICITY_TARIFFS,
  CO2_EMISSIONS_FACTOR,
} from '@/lib/utils/zero-bill-calculator'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'

type Mode = 'retrofit' | 'new'

const COUNTRY_DEFAULT_SALE_PRICE: Record<Country, number> = {
  MY: 680_000,
  SG: 1_100_000,
  ID: 3_200_000_000,
  TH: 8_000_000,
  VN: 5_500_000_000,
  PH: 9_000_000,
}

const COMMON_AREA_PRESETS = {
  Low: 80,
  Average: 140,
  High: 220,
}

const EXISTING_SOLAR_PRESETS = {
  None: 0,
  Small: 15,
  Large: 40,
}

const SOLAR_DENSITY_KW_PER_M2 = 0.17 // conservative, includes walkways + tilt spacing

const SMALL_CARD_SHADOW = 'shadow-[0_12px_45px_rgba(0,0,0,0.05)]'

function formatWithSymbol(amount: number, country: Country, digits: number = 0) {
  return `${CURRENCY_SYMBOLS[country]}${amount.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}`
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getBulkDiscount(units: number) {
  if (units >= 300) return 0.25
  if (units >= 200) return 0.22
  if (units >= 120) return 0.18
  return 0.15
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-brand-700 bg-brand-50 rounded-full">
      {label}
    </span>
  )
}

const MiniInfo = ({ title, copy }: { title: string; copy: string }) => (
  <div className="bg-paper-200 rounded-lg p-3 flex items-start gap-2 text-xs text-ink-600">
    <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
      i
    </div>
    <div className="space-y-0.5">
      <div className="font-semibold text-ink-800">{title}</div>
      <div className="leading-relaxed">{copy}</div>
    </div>
  </div>
)

const SnapshotCharts = memo(function SnapshotCharts({
  coverage,
  monthlySavings,
  baselineBill,
  paybackYears,
  co2Avoided,
  country,
}: {
  coverage: number
  monthlySavings: number
  baselineBill: number
  paybackYears: number
  co2Avoided: number
  country: Country
}) {
  const savingsData = [
    { name: 'Without', value: baselineBill },
    { name: 'With BESS', value: Math.max(0, baselineBill - monthlySavings) },
  ]

  const coverageData = [
    { name: 'Solar + Battery', value: Math.round(coverage * 100) },
    { name: 'Grid', value: Math.max(0, 100 - Math.round(coverage * 100)) },
  ]

  const paybackSeries = new Array(6).fill(0).map((_, idx) => {
    const year = idx * (Math.max(paybackYears, 1) / 5)
    const recovered = Math.min(100, (year / Math.max(paybackYears, 0.1)) * 100)
    return { year: `Y${idx}`, recovered }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className={`bg-paper-200 rounded-card p-4 ${SMALL_CARD_SHADOW}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Monthly bill</div>
            <div className="text-sm text-ink-600">Per participating household</div>
          </div>
          <InfoChip label="Live" />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={savingsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => formatWithSymbol(v, country, 0)} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`bg-paper-200 rounded-card p-4 ${SMALL_CARD_SHADOW}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Energy mix</div>
            <div className="text-sm text-ink-600">Solar + battery coverage</div>
          </div>
          <InfoChip label={`${Math.round(coverage * 100)}%`} />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={coverageData}
              innerRadius={48}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {coverageData.map((_, idx) => (
                <Cell key={idx} fill={idx === 0 ? '#059669' : '#e5e7eb'} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend verticalAlign="bottom" height={24} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={`bg-paper-200 rounded-card p-4 ${SMALL_CARD_SHADOW}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Payback glide</div>
            <div className="text-sm text-ink-600">Progress to breakeven</div>
          </div>
          <InfoChip label={`${paybackYears.toFixed(1)} yrs`} />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={paybackSeries}>
            <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip formatter={(v: number) => `${v.toFixed(0)}% recovered`} />
            <Line type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`bg-paper-200 rounded-card p-4 ${SMALL_CARD_SHADOW}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">CO₂ avoided</div>
            <div className="text-sm text-ink-600">Tonnes per year</div>
          </div>
          <InfoChip label={`${(co2Avoided / 1000).toFixed(1)} t`} />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={[{ name: 'CO₂ avoided', value: co2Avoided / 1000 }]}>
            <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)} t`} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})

/* ── Manufacturer colour palette ─────────────────────────── */
const MFR_COLORS: Record<string, string> = {
  Tesla: '#e11d48',
  BYD: '#2563eb',
  Huawei: '#d97706',
  Enphase: '#7c3aed',
  Samsung: '#0891b2',
  LG: '#059669',
  Sungrow: '#ea580c',
  Pylontech: '#4f46e5',
  GoodWe: '#0d9488',
  Growatt: '#65a30d',
}
function mfrColor(manufacturer: string) {
  return MFR_COLORS[manufacturer] || '#6b7280'
}

const BatteryScatter = memo(function BatteryScatter({
  bessList,
  country,
  monthlySavingsPerHousehold,
}: {
  bessList: BESS[]
  country: Country
  monthlySavingsPerHousehold: number
}) {
  const data = useMemo(
    () =>
      bessList
        .filter((b) => b.isAvailable)
        .map((b) => {
          const price = b.priceLocalCurrency[country] || 0
          const cycles = b.warrantyCycles || 5000
          const paybackYears =
            monthlySavingsPerHousehold > 0 ? price / (monthlySavingsPerHousehold * 12) : 0
          const costPerKwhCycle =
            b.usableCapacityKwh > 0 && cycles > 0 ? price / (b.usableCapacityKwh * cycles) : 0
          return {
            name: b.name,
            manufacturer: b.manufacturer,
            price,
            cycles,
            paybackYears,
            costPerKwhCycle,
          }
        }),
    [bessList, country, monthlySavingsPerHousehold]
  )

  const bestPick = useMemo(
    () =>
      data.reduce<(typeof data)[0] | null>(
        (best, d) => (!best || (d.costPerKwhCycle > 0 && d.costPerKwhCycle < best.costPerKwhCycle) ? d : best),
        null
      ),
    [data]
  )

  const medianCycles = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.cycles - b.cycles)
    return sorted.length ? sorted[Math.floor(sorted.length / 2)].cycles : 5000
  }, [data])
  const medianPayback = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.paybackYears - b.paybackYears)
    return sorted.length ? sorted[Math.floor(sorted.length / 2)].paybackYears : 5
  }, [data])

  const manufacturers = useMemo(
    () => Array.from(new Set(data.map((d) => d.manufacturer))).sort(),
    [data]
  )

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-5 mt-8">
      {/* ── header ── */}
      <div className="flex items-start justify-between mb-1 gap-3">
        <div>
          <div className="text-sm font-semibold text-ink">
            Which battery pays for itself fastest, and lasts longest?
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            Bottom-right = best value (fast payback + long warranty). Bubble size = cost per kWh-cycle.
          </div>
        </div>
        <InfoChip label="Interactive" />
      </div>

      {/* ── best pick callout ── */}
      {bestPick && bestPick.costPerKwhCycle > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-brand-50 rounded-lg text-xs">
          <span className="text-brand-600 font-bold text-base leading-none">★</span>
          <span className="text-ink-800">
            <strong className="text-brand-700">{bestPick.name}</strong> has the lowest lifetime cost at{' '}
            <strong>{formatWithSymbol(bestPick.costPerKwhCycle, country, 2)}/kWh-cycle</strong>,{' '}
            payback in <strong>{bestPick.paybackYears.toFixed(1)} years</strong> with{' '}
            <strong>{bestPick.cycles.toLocaleString()}</strong> warranty cycles.
          </span>
        </div>
      )}

      {/* ── chart ── */}
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
          <CartesianGrid stroke="#f3f4f6" />
          <XAxis
            type="number"
            dataKey="cycles"
            name="Warranty cycles"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            label={{ value: 'Warranty cycles →', position: 'insideBottom', offset: -18, fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis
            type="number"
            dataKey="paybackYears"
            name="Payback"
            tickFormatter={(v) => `${v.toFixed(1)}y`}
            domain={[0, 'dataMax']}
            label={{ value: '← Payback (years)', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: '#9ca3af' }}
          />
          <ZAxis type="number" range={[80, 220]} dataKey="costPerKwhCycle" name="Cost per kWh-cycle" />

          {/* quadrant reference lines */}
          <CartesianGrid
            horizontal={false}
            vertical={false}
            strokeDasharray="6 4"
            stroke="#d1d5db"
          />

          <Tooltip
            cursor={{ strokeDasharray: '4 4' }}
            content={(props: any) => {
              const { active, payload } = props || {}
              if (!active || !payload?.length) return null
              const item = payload[0].payload
              const isBest = bestPick && item.name === bestPick.name
              return (
                <div className={`bg-paper-100 border rounded-lg p-3 shadow-lg text-xs space-y-1 ${isBest ? 'border-brand-400 ring-1 ring-brand-200' : 'border-ink/10'}`}>
                  <div className="font-semibold text-ink flex items-center gap-1">
                    {isBest && <span className="text-brand-600">★</span>}
                    {item.name}
                  </div>
                  <div className="text-ink-500 text-[10px]">{item.manufacturer}</div>
                  <div className="text-ink-700">Payback: <strong>{item.paybackYears.toFixed(1)} years</strong></div>
                  <div className="text-ink-700">Warranty: <strong>{item.cycles.toLocaleString()} cycles</strong></div>
                  <div className="text-ink-700">
                    Cost/kWh-cycle: <strong>{formatWithSymbol(item.costPerKwhCycle, country, 2)}</strong>
                  </div>
                  <div className="text-ink-700">
                    Price: <strong>{formatWithSymbol(item.price, country, 0)}</strong>
                  </div>
                </div>
              )
            }}
          />

          <Scatter data={data} isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={mfrColor(entry.manufacturer)}
                stroke={bestPick && entry.name === bestPick.name ? '#059669' : '#fff'}
                strokeWidth={bestPick && entry.name === bestPick.name ? 2.5 : 1}
                opacity={0.85}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* ── manufacturer legend ── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
        {manufacturers.map((m) => (
          <div key={m} className="flex items-center gap-1.5 text-[10px] text-ink-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: mfrColor(m) }} />
            {m}
          </div>
        ))}
      </div>

      {/* ── quadrant guide ── */}
      <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] text-ink-400">
        <div className="text-right pr-2 border-r border-b border-ink/5 pb-1">Expensive &amp; short-lived</div>
        <div className="pl-2 border-b border-ink/5 pb-1">Long warranty but slow payback</div>
        <div className="text-right pr-2 border-r border-ink/5 pt-1">Fast payback but fewer cycles</div>
        <div className="pl-2 pt-1 font-semibold text-brand-600">★ Best value, fast payback and a long warranty</div>
      </div>
    </div>
  )
})

function CountryRequiredState() {
  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        <div className="grid gap-8 rounded-2xl border border-ink/10 bg-paper-200 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Shared residential BESS</p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl font-medium text-ink leading-tight">
              Select a country to load the calculator.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600">
              Tariffs, solar yield, battery pricing, currency, and emissions factors are country-specific. Choose a
              market first, then the inputs and outputs will appear.
            </p>
          </div>
          <div className="rounded-card bg-paper-100 p-4 shadow-sm">
            <CountrySelector />
          </div>
        </div>
      </section>
    </main>
  )
}

function SharedResidentialCalculator({ country }: { country: Country }) {
  const pdfRef = useRef<HTMLElement>(null)
  const [shareLabel, setShareLabel] = useState('Share Design')
  const [compSnapshots, setCompSnapshots] = useState<BuildingSnapshot[]>([])
  const [mode, setMode] = useState<Mode>('retrofit')
  const [bessList, setBessList] = useState<BESS[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [optimizeTarget, setOptimizeTarget] = useState<'savings' | 'solar'>('savings')

  // Retrofit inputs
  const [retroUnits, setRetroUnits] = useState(80)
  const [participation, setParticipation] = useState(80)
  const [retroRoofArea, setRetroRoofArea] = useState(1200)
  const [retroRoofQuality, setRetroRoofQuality] = useState<'Ideal' | 'Average' | 'Shaded'>('Ideal')
  const [retroCommonPreset, setRetroCommonPreset] = useState<'Low' | 'Average' | 'High'>('Average')
  const [retroCommonManual, setRetroCommonManual] = useState<number | null>(null)
  const [existingSolar, setExistingSolar] = useState<'None' | 'Small' | 'Large'>('None')
  const [retroBatteryId, setRetroBatteryId] = useState<string>('')
  const [retroBatteryQty, setRetroBatteryQty] = useState(6)

  // New development inputs
  const [newUnits, setNewUnits] = useState(150)
  const [unitPrice, setUnitPrice] = useState<number>(COUNTRY_DEFAULT_SALE_PRICE[country])
  const [newRoofArea, setNewRoofArea] = useState(2400)
  const [newRoofQuality, setNewRoofQuality] = useState<'Ideal' | 'Average' | 'Shaded'>('Average')
  const [newCommonPreset, setNewCommonPreset] = useState<'Low' | 'Average' | 'High'>('Average')
  const [newCommonManual, setNewCommonManual] = useState<number | null>(null)
  const [newBatteryId, setNewBatteryId] = useState<string>('')
  const [newBatteryQty, setNewBatteryQty] = useState(10)

  // Sync core configurator state to/from URL for sharing
  useURLState([
    { key: 'mode', value: mode, defaultValue: 'retrofit', setter: setMode, type: 'string' },
    { key: 'units', value: mode === 'retrofit' ? retroUnits : newUnits, defaultValue: mode === 'retrofit' ? 80 : 150, setter: (v: number) => mode === 'retrofit' ? setRetroUnits(v) : setNewUnits(v), type: 'number' },
    { key: 'roof', value: mode === 'retrofit' ? retroRoofArea : newRoofArea, defaultValue: mode === 'retrofit' ? 1200 : 2400, setter: (v: number) => mode === 'retrofit' ? setRetroRoofArea(v) : setNewRoofArea(v), type: 'number' },
    { key: 'batteryQty', value: mode === 'retrofit' ? retroBatteryQty : newBatteryQty, defaultValue: mode === 'retrofit' ? 6 : 10, setter: (v: number) => mode === 'retrofit' ? setRetroBatteryQty(v) : setNewBatteryQty(v), type: 'number' },
  ])

  useEffect(() => {
    setIsLoading(true)
    try {
      setBessList(loadBESSData(country))
      setUnitPrice(COUNTRY_DEFAULT_SALE_PRICE[country])
    } finally {
      setIsLoading(false)
    }
  }, [country])

  const roofMultiplier = useCallback((quality: 'Ideal' | 'Average' | 'Shaded') => ROOF_QUALITY_MULTIPLIERS[quality], [])

  const getBatteryModel = useCallback(
    (id: string) => bessList.find((b) => b.id === id) || null,
    [bessList]
  )

  const getCommonLoad = useCallback(
    (preset: 'Low' | 'Average' | 'High', manual: number | null) => {
      if (manual && manual > 0) return manual
      return COMMON_AREA_PRESETS[preset]
    },
    []
  )

  const householdDailyLoad = useMemo(() => {
    // use 2025 day+night baseline per country
    const perCountry = {
      MY: 18,
      SG: 12,
      ID: 16,
      TH: 22,
      VN: 15,
      PH: 20,
    }
    return perCountry[country]
  }, [country])

  const retrofitOutputs = useMemo(() => {
    const participatingUnits = Math.max(1, Math.round((retroUnits * participation) / 100))
    const commonLoad = getCommonLoad(retroCommonPreset, retroCommonManual)
    const buildingDailyLoad = householdDailyLoad * participatingUnits + commonLoad
    const roofCapacityKw = Math.round(retroRoofArea * SOLAR_DENSITY_KW_PER_M2)
    const existingSolarKw = EXISTING_SOLAR_PRESETS[existingSolar]
    const baseTargetKw =
      optimizeTarget === 'solar'
        ? roofCapacityKw
        : Math.min(
            roofCapacityKw,
            (buildingDailyLoad / (SOLAR_YIELD_PER_KW[country] * roofMultiplier(retroRoofQuality))) * 1.05
          )
    const solarKwToAdd = Math.max(0, Math.round(baseTargetKw - existingSolarKw))
    const totalSolarKwForYield = solarKwToAdd + existingSolarKw
    const dailySolarGen =
      totalSolarKwForYield * SOLAR_YIELD_PER_KW[country] * roofMultiplier(retroRoofQuality)

    const selectedBattery = getBatteryModel(retroBatteryId)
    const batteryCapacity = selectedBattery ? selectedBattery.usableCapacityKwh * retroBatteryQty : 0
    const batteryCost = selectedBattery ? (selectedBattery.priceLocalCurrency[country] || 0) * retroBatteryQty : 0

    const solarCost = solarKwToAdd * SOLAR_COST_PER_KW[country]
    const discount = getBulkDiscount(retroUnits)
    const totalSystemCost = (solarCost + batteryCost) * (1 - discount)
    const costPerHousehold = totalSystemCost / participatingUnits

    const coverage = buildingDailyLoad > 0 ? clampNumber((dailySolarGen + batteryCapacity * 0.85) / buildingDailyLoad, 0, 1) : 0
    const monthlySavingsPerHousehold = householdDailyLoad * 30 * ELECTRICITY_TARIFFS[country] * coverage
    const paybackYears =
      monthlySavingsPerHousehold > 0 ? costPerHousehold / (monthlySavingsPerHousehold * 12) : 0
    const blackoutHours = buildingDailyLoad > 0 ? batteryCapacity / (buildingDailyLoad / 24) : 0
    const co2Avoided = dailySolarGen * 365 * CO2_EMISSIONS_FACTOR[country]
    const zeroBillDays = Math.round(coverage * 365 * 0.9)

    return {
      participatingUnits,
      commonLoad,
      buildingDailyLoad,
      solarKwToAdd,
      totalSolarKwForYield,
      dailySolarGen,
      batteryCapacity,
      totalSystemCost,
      costPerHousehold,
      monthlySavingsPerHousehold,
      paybackYears,
      blackoutHours,
      co2Avoided,
      zeroBillDays,
      coverage,
      recommendation: `Optimal: ${Math.round(totalSolarKwForYield)} kW solar + ${retroBatteryQty} × ${
        selectedBattery?.name || 'battery'
      }`,
      discount,
    }
  }, [
    country,
    existingSolar,
    getBatteryModel,
    getCommonLoad,
    householdDailyLoad,
    optimizeTarget,
    participation,
    retroBatteryId,
    retroBatteryQty,
    retroCommonManual,
    retroCommonPreset,
    retroRoofArea,
    retroRoofQuality,
    retroUnits,
    roofMultiplier,
  ])

  const newDevOutputs = useMemo(() => {
    const commonLoad = getCommonLoad(newCommonPreset, newCommonManual)
    const buildingDailyLoad = householdDailyLoad * newUnits + commonLoad
    const roofCapacityKw = Math.round(newRoofArea * SOLAR_DENSITY_KW_PER_M2)
    const baseTargetKw =
      optimizeTarget === 'solar'
        ? roofCapacityKw
        : Math.min(
            roofCapacityKw,
            (buildingDailyLoad / (SOLAR_YIELD_PER_KW[country] * roofMultiplier(newRoofQuality))) * 1.05
          )
    const solarKw = Math.max(20, Math.round(baseTargetKw))
    const dailySolarGen =
      solarKw * SOLAR_YIELD_PER_KW[country] * roofMultiplier(newRoofQuality)

    const selectedBattery = getBatteryModel(newBatteryId)
    const batteryCapacity = selectedBattery ? selectedBattery.usableCapacityKwh * newBatteryQty : 0
    const batteryCost = selectedBattery ? (selectedBattery.priceLocalCurrency[country] || 0) * newBatteryQty : 0

    const solarCost = solarKw * SOLAR_COST_PER_KW[country]
    const discount = getBulkDiscount(newUnits)
    const totalSystemCost = (solarCost + batteryCost) * (1 - discount)
    const addedCostPerUnit = totalSystemCost / newUnits

    const coverage =
      buildingDailyLoad > 0 ? clampNumber((dailySolarGen + batteryCapacity * 0.85) / buildingDailyLoad, 0, 1) : 0
    const monthlySavings = householdDailyLoad * 30 * ELECTRICITY_TARIFFS[country] * coverage
    const twentyYearSavings = monthlySavings * 12 * 20
    const paybackYears = monthlySavings > 0 ? addedCostPerUnit / (monthlySavings * 12) : 0

    const blackoutHours = buildingDailyLoad > 0 ? batteryCapacity / (buildingDailyLoad / 24) : 0
    const co2Avoided = dailySolarGen * 365 * CO2_EMISSIONS_FACTOR[country]
    const zeroBillDays = Math.round(coverage * 365 * 0.9)

    return {
      commonLoad,
      buildingDailyLoad,
      solarKw,
      dailySolarGen,
      batteryCapacity,
      totalSystemCost,
      addedCostPerUnit,
      priceIncreasePct: unitPrice > 0 ? (addedCostPerUnit / unitPrice) * 100 : 0,
      savings20Y: twentyYearSavings,
      savingsPctOfPrice: unitPrice > 0 ? (twentyYearSavings / unitPrice) * 100 : 0,
      paybackYears,
      monthlySavings,
      blackoutHours,
      co2Avoided,
      zeroBillDays,
      coverage,
      recommendation: `Optimal: ${Math.round(solarKw)} kW solar + ${newBatteryQty} × ${
        selectedBattery?.name || 'battery'
      }`,
      discount,
    }
  }, [
    country,
    getBatteryModel,
    getCommonLoad,
    householdDailyLoad,
    newBatteryId,
    newBatteryQty,
    newCommonManual,
    newCommonPreset,
    newRoofArea,
    newRoofQuality,
    newUnits,
    optimizeTarget,
    roofMultiplier,
    unitPrice,
  ])

  const activeOutputs = mode === 'retrofit' ? retrofitOutputs : newDevOutputs

  const loading = isLoading && bessList.length === 0

  const handleOptimize = useCallback(() => {
    setOptimizeTarget((prev) => (prev === 'savings' ? 'solar' : 'savings'))
  }, [])

  const renderBatterySelect = (value: string, onChange: (id: string) => void) => (
    <div className="relative">
      <select
        className="w-full text-sm px-3 py-2 pr-8 rounded-full bg-paper-200 hover:bg-paper-300 focus:ring-2 focus:ring-brand-500 focus:bg-brand-50 appearance-none cursor-pointer transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select battery model</option>
        {bessList.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )

  const renderRoofQualityButtons = (
    value: 'Ideal' | 'Average' | 'Shaded',
    onChange: (v: 'Ideal' | 'Average' | 'Shaded') => void
  ) => (
    <div className="grid grid-cols-3 gap-2">
      {(['Ideal', 'Average', 'Shaded'] as const).map((quality) => (
        <button
          key={quality}
          onClick={() => onChange(quality)}
          className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
            value === quality
              ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
              : 'bg-paper-100 text-ink-700 border-ink/15 hover:border-brand-400 hover:bg-brand-50'
          }`}
        >
          {quality}
          <div className="text-xs opacity-80">
            {quality === 'Ideal' ? '100%' : quality === 'Average' ? '90%' : '75%'}
          </div>
        </button>
      ))}
    </div>
  )

  const renderCommonLoad = (
    preset: 'Low' | 'Average' | 'High',
    manual: number | null,
    setPreset: (v: 'Low' | 'Average' | 'High') => void,
    setManual: (v: number | null) => void
  ) => (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {(['Low', 'Average', 'High'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setPreset(level)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              preset === level
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-paper-100 text-ink-700 border-ink/15 hover:border-brand-400 hover:bg-brand-50'
            }`}
          >
            <div className="font-semibold">{level}</div>
            <div className="text-xs opacity-80">{COMMON_AREA_PRESETS[level]} kWh/day</div>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={manual ?? ''}
          onChange={(e) => setManual(e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="Manual kWh/day"
          className="flex-1 px-3 py-2 text-sm border border-ink/15 rounded-lg focus:ring-2 focus:ring-brand-500"
        />
        <span className="text-xs text-ink-500">Optional</span>
      </div>
    </div>
  )

  const renderInputs = () => {
    const isRetrofit = mode === 'retrofit'
    const outputsForSection = isRetrofit ? retrofitOutputs : newDevOutputs
    const selectedBattery = getBatteryModel(isRetrofit ? retroBatteryId : newBatteryId)
    const batteryQty = isRetrofit ? retroBatteryQty : newBatteryQty
    const totalBatteryCapacity = selectedBattery ? selectedBattery.usableCapacityKwh * batteryQty : 0
    const solarPlannedKw = isRetrofit ? retrofitOutputs.totalSolarKwForYield : newDevOutputs.solarKw
    const roofAreaDisplay = isRetrofit ? `${retroRoofArea} m²` : `${newRoofArea} m²`

    return (
      <div className="space-y-6">
        {/* Power requirements */}
        <div className="bg-paper-100 rounded-2xl p-5 space-y-5">
          <div>
            <div className="text-sm font-semibold text-ink">Power requirements</div>
            <p className="text-xs text-ink-500">
              {isRetrofit ? 'Participation, roof, and common loads' : 'Units, pricing, roof, and common loads'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-ink">Residential units</div>
                <InfoChip label={`${isRetrofit ? retroUnits : newUnits} units`} />
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={isRetrofit ? retroUnits : newUnits}
                onChange={(e) => (isRetrofit ? setRetroUnits(parseInt(e.target.value)) : setNewUnits(parseInt(e.target.value)))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-ink-500">
                <span>10</span>
                <span>500</span>
              </div>
            </div>

            {isRetrofit ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-ink">Participation rate <InfoTooltip content="Percentage of households in the building that opt in to share the solar+battery system cost. Higher participation = lower cost per household. Typical range: 60-90% for retrofits." /></div>
                  <InfoChip label={`${participation}%`} />
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  step={5}
                  value={participation}
                  onChange={(e) => setParticipation(parseInt(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-ink-500">
                  <span>30%</span>
                  <span>100%</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-ink">Avg unit price</div>
                  <InfoChip label={formatWithSymbol(unitPrice, country, 0)} />
                </div>
                <input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-ink/15 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-ink">Roof area</div>
                  <div className="text-xs text-ink-500">Solar-ready m²</div>
                </div>
                <InfoChip label={roofAreaDisplay} />
              </div>
              <input
                type="range"
                min={200}
                max={8000}
                step={100}
                value={isRetrofit ? retroRoofArea : newRoofArea}
                onChange={(e) =>
                  isRetrofit ? setRetroRoofArea(parseInt(e.target.value)) : setNewRoofArea(parseInt(e.target.value))
                }
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-ink-500">
                <span>200</span>
                <span>8000</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-ink-700 mb-2">Roof quality</div>
              {renderRoofQualityButtons(isRetrofit ? retroRoofQuality : newRoofQuality, isRetrofit ? setRetroRoofQuality : setNewRoofQuality)}
            </div>

            {isRetrofit && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-ink">Existing solar</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['None', 'Small', 'Large'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setExistingSolar(opt)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        existingSolar === opt
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-paper-100 text-ink-700 border-ink/15 hover:border-brand-400 hover:bg-brand-50'
                      }`}
                    >
                      {opt === 'None' ? 'None' : opt === 'Small' ? '<20 kW' : '>20 kW'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-semibold text-ink mb-2">Common area load</div>
              {renderCommonLoad(
                isRetrofit ? retroCommonPreset : newCommonPreset,
                isRetrofit ? retroCommonManual : newCommonManual,
                isRetrofit ? setRetroCommonPreset : setNewCommonPreset,
                isRetrofit ? setRetroCommonManual : setNewCommonManual
              )}
            </div>
          </div>
        </div>

        {/* System setup */}
        <div className="bg-paper-100 rounded-2xl p-5 space-y-5">
          <div>
            <div className="text-sm font-semibold text-ink">System setup</div>
            <p className="text-xs text-ink-500">Solar sizing and shared battery bank</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-ink-700">Planned solar</div>
              <div className="text-base font-semibold text-brand-700 tabular-nums">
                {Math.round(solarPlannedKw)} kW
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-ink-700">Battery quantity</div>
              <div className="text-base font-semibold text-brand-700 tabular-nums">{batteryQty} units</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-ink-700">Total usable capacity</div>
              <div className="text-base font-semibold text-brand-700 tabular-nums">
                {totalBatteryCapacity.toFixed(0)} kWh
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="text-sm font-semibold text-ink mb-1">Battery model</div>
              {renderBatterySelect(isRetrofit ? retroBatteryId : newBatteryId, isRetrofit ? setRetroBatteryId : setNewBatteryId)}
            </div>
            <div>
              <div className="text-sm font-semibold text-ink mb-1">Quantity</div>
              <input
                type="number"
                min={0}
                max={20}
                value={batteryQty}
                onChange={(e) =>
                  (isRetrofit ? setRetroBatteryQty : setNewBatteryQty)(clampNumber(parseInt(e.target.value) || 0, 0, 20))
                }
                className="w-full px-3 py-2 border border-ink/15 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderOutputs = () => {
    if (mode === 'retrofit') {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-paper-200 rounded-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Total system cost <InfoTooltip content="Full installed cost of solar panels + shared battery bank, after applying the bulk discount. Split among all participating households. Larger buildings get bigger discounts (15-25% off)." /></div>
                  <div className="text-xs text-ink-500">
                    Includes {Math.round(retrofitOutputs.discount * 100)}% bulk discount
                  </div>
                </div>
                <div className="text-2xl font-bold text-brand-700">
                  {formatWithSymbol(retrofitOutputs.totalSystemCost, country, 0)}
                </div>
              </div>
            </div>
            <div className="bg-paper-200 rounded-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Cost per household <InfoTooltip content="Your share of the total system cost, divided equally among participating units. This is the one-off investment each household pays. With bulk discounts, it's 15-25% cheaper than installing individually." /></div>
                  <div className="text-xs text-ink-500">Participating units</div>
                </div>
                <div className="text-2xl font-bold text-brand-700">
                  {formatWithSymbol(retrofitOutputs.costPerHousehold, country, 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-paper-200 rounded-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Monthly savings <InfoTooltip content="Estimated monthly electricity bill reduction per household. Calculated from: daily load × 30 days × local tariff × coverage percentage. Actual savings depend on your usage pattern and solar generation." /></div>
                  <div className="text-xs text-ink-500">Per participating household</div>
                </div>
                <div className="text-2xl font-bold text-brand-700">
                  {formatWithSymbol(retrofitOutputs.monthlySavingsPerHousehold, country, 0)}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-ink-700">
                <span>Payback</span>
                <span className="font-semibold text-brand-700">
                  {retrofitOutputs.paybackYears.toFixed(1)} years
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-ink-700">
                <span>Zero-bill days / year</span>
                <span className="font-semibold">{retrofitOutputs.zeroBillDays} days</span>
              </div>
            </div>

            <div className="bg-paper-200 rounded-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Blackout protection <InfoTooltip content="How many hours the shared battery bank can power the entire building during a grid outage, based on average building load (all participating units + common areas). Essential loads only would last ~3× longer." /></div>
                  <div className="text-xs text-ink-500">Whole building runtime</div>
                </div>
                <div className="text-2xl font-bold text-brand-700">
                  {retrofitOutputs.blackoutHours.toFixed(1)} hrs
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-ink-700">
                <span>CO₂ avoided</span>
                <span className="font-semibold">
                  {Math.round(retrofitOutputs.co2Avoided).toLocaleString()} kg/yr
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-ink-700">
                <span>Recommendation</span>
                <span className="font-semibold text-brand-700 text-right">
                  {retrofitOutputs.recommendation}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-paper-200 rounded-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Added cost / unit</div>
                <div className="text-xs text-ink-500">
                  Includes {Math.round(newDevOutputs.discount * 100)}% bulk discount
                </div>
              </div>
              <div className="text-2xl font-bold text-brand-700">
                {formatWithSymbol(newDevOutputs.addedCostPerUnit, country, 0)}
              </div>
            </div>
          </div>

          <div className="bg-paper-200 rounded-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-ink-600 uppercase tracking-wide">% price uplift</div>
                <div className="text-xs text-ink-500">On sale price</div>
              </div>
              <div className="text-2xl font-bold text-brand-700">
                {newDevOutputs.priceIncreasePct.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-paper-200 rounded-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-ink-600 uppercase tracking-wide">20-year savings</div>
                <div className="text-xs text-ink-500">Per buyer</div>
              </div>
              <div className="text-2xl font-bold text-brand-700">
                {formatWithSymbol(newDevOutputs.savings20Y, country, 0)}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-ink-700">
              <span>Savings as % of price</span>
              <span className="font-semibold text-brand-700">
                {newDevOutputs.savingsPctOfPrice.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-ink-700">
              <span>Payback from move-in</span>
              <span className="font-semibold">{newDevOutputs.paybackYears.toFixed(1)} years</span>
            </div>
          </div>

          <div className="bg-paper-200 rounded-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Blackout protection</div>
                <div className="text-xs text-ink-500">Whole building runtime</div>
              </div>
              <div className="text-2xl font-bold text-brand-700">
                {newDevOutputs.blackoutHours.toFixed(1)} hrs
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-ink-700">
              <span>Zero-bill days / year</span>
              <span className="font-semibold">{newDevOutputs.zeroBillDays} days</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-ink-700">
              <span>CO₂ avoided</span>
              <span className="font-semibold">
                {Math.round(newDevOutputs.co2Avoided).toLocaleString()} kg/yr
              </span>
            </div>
            <div className="mt-2 text-sm text-brand-700 font-semibold text-right">
              {newDevOutputs.recommendation}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section ref={pdfRef} className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Eyebrow>Shared residential calculator</Eyebrow>
            <h1 className="mt-3 font-display text-4xl md:text-5xl font-medium text-ink leading-tight tracking-tight">
              Make your condo or apartment 80–100% self-powered
            </h1>
          </div>
          <div className="shrink-0"><CountrySelector /></div>
        </div>
        <p className="max-w-3xl text-lg text-ink-700 leading-relaxed">
          Size a shared solar + battery system for your building. Switch between retrofit and new-build models to see
          cost per unit, payback, blackout hours, and zero-bill days update as you move each slider.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-3 bg-paper-200 border border-ink/10 rounded-full px-2 py-1">
            <button
              onClick={() => setMode('retrofit')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                mode === 'retrofit'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-ink-700 hover:text-brand-700'
              }`}
            >
              Retrofit (existing building)
            </button>
            <button
              onClick={() => setMode('new')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                mode === 'new'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-ink-700 hover:text-brand-700'
              }`}
            >
              New Development (pre-construction)
            </button>
          </div>

          <div className="inline-flex items-center gap-2 bg-paper-100 border border-ink/10 rounded-full px-3 py-2">
            <span className="text-xs font-semibold text-ink-700">Optimize</span>
            <button
              onClick={handleOptimize}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors"
            >
              {optimizeTarget === 'savings' ? 'Maximize Savings' : 'Maximize Solar'}
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[5fr_4fr] gap-6">
          <div className="space-y-4">
            <div className="bg-paper-200 border border-ink/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-ink">Inputs</div>
                  <div className="text-xs text-ink-500">
                    {mode === 'retrofit'
                      ? 'Participation, roof, existing solar, batteries'
                      : 'Units, sale price, roof, batteries'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <InfoChip label={loading ? 'Loading…' : 'Real-time'} />
                  <InfoChip label={COUNTRY_NAMES[country]} />
                </div>
              </div>
              {renderInputs()}
            </div>

            <MiniInfo
              title="Accurate 2025 tariffs + dailyCycle logic"
              copy="Solar yield, tariff escalation, and battery coverage mirror the /bess/home model for Southeast Asia. Discounts scale with unit count."
            />
          </div>

          <div className="space-y-4">
            <div className="bg-paper-100 border border-ink/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-ink">Live Outputs</div>
                  <div className="text-xs text-ink-500">
                    Auto-updates when you move any slider or toggle
                  </div>
                </div>
                <InfoChip label={mode === 'retrofit' ? 'Retrofit' : 'New build'} />
              </div>
              {renderOutputs()}
            </div>

            <SnapshotCharts
              coverage={activeOutputs.coverage}
              monthlySavings={
                mode === 'retrofit' ? retrofitOutputs.monthlySavingsPerHousehold : newDevOutputs.monthlySavings
              }
              baselineBill={householdDailyLoad * 30 * ELECTRICITY_TARIFFS[country]}
              paybackYears={activeOutputs.paybackYears}
              co2Avoided={activeOutputs.co2Avoided}
              country={country}
            />
          </div>
        </div>

        <GreenCertEstimator
          country={country}
          solarKw={mode === 'retrofit' ? retrofitOutputs.totalSolarKwForYield : newDevOutputs.solarKw}
          batteryCapacityKwh={activeOutputs.batteryCapacity}
          coveragePct={activeOutputs.coverage}
          co2AvoidedKg={activeOutputs.co2Avoided}
          units={mode === 'retrofit' ? retroUnits : newUnits}
          mode={mode}
        />

        <ESGDashboard
          country={country}
          solarKw={mode === 'retrofit' ? retrofitOutputs.totalSolarKwForYield : newDevOutputs.solarKw}
          batteryCapacityKwh={activeOutputs.batteryCapacity}
          annualSolarGenKwh={activeOutputs.dailySolarGen * 365}
          coveragePct={activeOutputs.coverage}
          co2AvoidedKg={activeOutputs.co2Avoided}
          annualSavingsLocal={(mode === 'retrofit' ? retrofitOutputs.monthlySavingsPerHousehold : newDevOutputs.monthlySavings) * 12 * (mode === 'retrofit' ? retroUnits : newUnits)}
          systemType="residential"
        />

        <BatteryScatter
          bessList={bessList}
          country={country}
          monthlySavingsPerHousehold={
            mode === 'retrofit' ? retrofitOutputs.monthlySavingsPerHousehold : newDevOutputs.monthlySavings
          }
        />

        {/* Batch 4 — Tenant ROI Pitch */}
        <TenantROIPitch
          country={country}
          addedCostPerUnit={mode === 'retrofit' ? retrofitOutputs.costPerHousehold : newDevOutputs.addedCostPerUnit}
          monthlySavings={mode === 'retrofit' ? retrofitOutputs.monthlySavingsPerHousehold : newDevOutputs.monthlySavings}
          paybackYears={activeOutputs.paybackYears}
          blackoutHours={activeOutputs.blackoutHours}
          co2AvoidedKg={activeOutputs.co2Avoided}
          units={mode === 'retrofit' ? retroUnits : newUnits}
        />

        {/* Save & Compare */}
        <div className="mt-8 flex flex-wrap items-center gap-3" data-pdf-ignore>
          <button
            disabled={compSnapshots.length >= 3}
            onClick={() => {
              const isRetrofit = mode === 'retrofit'
              const o = isRetrofit ? retrofitOutputs : newDevOutputs
              const selectedBattery = bessList.find((b) => b.id === (isRetrofit ? retroBatteryId : newBatteryId))
              const snap: BuildingSnapshot = {
                id: `snap-${Date.now()}`,
                label: `${isRetrofit ? 'Retrofit' : 'New'} · ${isRetrofit ? retroUnits : newUnits}u`,
                mode,
                units: isRetrofit ? retroUnits : newUnits,
                roofArea: isRetrofit ? retroRoofArea : newRoofArea,
                roofQuality: isRetrofit ? retroRoofQuality : newRoofQuality,
                solarKw: isRetrofit ? (o as any).totalSolarKwForYield ?? (o as any).solarKw : (o as any).solarKw,
                batteryName: selectedBattery?.name || '—',
                batteryQty: isRetrofit ? retroBatteryQty : newBatteryQty,
                batteryCapacityKwh: o.batteryCapacity,
                totalSystemCost: o.totalSystemCost,
                costPerUnit: isRetrofit ? (o as any).costPerHousehold : (o as any).addedCostPerUnit,
                monthlySavings: isRetrofit ? (o as any).monthlySavingsPerHousehold : (o as any).monthlySavings,
                paybackYears: o.paybackYears,
                blackoutHours: o.blackoutHours,
                co2Avoided: o.co2Avoided,
                zeroBillDays: o.zeroBillDays,
                coverage: o.coverage,
                discount: o.discount,
              }
              setCompSnapshots((prev) => [...prev, snap])
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Save Config to Compare {compSnapshots.length > 0 && `(${compSnapshots.length}/3)`}
          </button>
          {compSnapshots.length > 0 && (
            <button
              onClick={() => setCompSnapshots([])}
              className="text-xs text-ink-500 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {compSnapshots.length >= 2 && (
          <BuildingComparison
            snapshots={compSnapshots}
            country={country}
            onRemove={(id) => setCompSnapshots((prev) => prev.filter((s) => s.id !== id))}
          />
        )}

        <div className="mt-8 flex flex-wrap gap-3" data-pdf-ignore>
          <button
            onClick={async () => {
              const ok = await copyShareLink()
              if (ok) { setShareLabel('Link Copied!'); setTimeout(() => setShareLabel('Share Design'), 2000) }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            {shareLabel}
          </button>
          <PDFExportButton
            containerRef={pdfRef}
            options={{ filename: `battery-mom-shared-residential-${mode}.pdf`, title: 'battery.mom, shared residential BESS', subtitle: `${COUNTRY_NAMES[country]} · ${mode === 'retrofit' ? 'Retrofit' : 'New Development'} · ${mode === 'retrofit' ? retroUnits : newUnits} units` }}
            className="bg-paper-100 border border-ink/10 text-ink-800 hover:bg-paper-200"
          />
          <MarketingPDFButton
            data={{
              country,
              mode,
              units: mode === 'retrofit' ? retroUnits : newUnits,
              solarKw: mode === 'retrofit' ? retrofitOutputs.totalSolarKwForYield : newDevOutputs.solarKw,
              batteryCapacityKwh: activeOutputs.batteryCapacity,
              batteryName: bessList.find((b) => b.id === (mode === 'retrofit' ? retroBatteryId : newBatteryId))?.name || '—',
              costPerUnit: mode === 'retrofit' ? retrofitOutputs.costPerHousehold : newDevOutputs.addedCostPerUnit,
              monthlySavings: mode === 'retrofit' ? retrofitOutputs.monthlySavingsPerHousehold : newDevOutputs.monthlySavings,
              paybackYears: activeOutputs.paybackYears,
              blackoutHours: activeOutputs.blackoutHours,
              co2Avoided: activeOutputs.co2Avoided,
              zeroBillDays: activeOutputs.zeroBillDays,
              coverage: activeOutputs.coverage,
              totalSystemCost: activeOutputs.totalSystemCost,
            }}
            className="bg-purple-600 text-white hover:bg-purple-700"
          />
        </div>

        <div className="mt-6 text-[12px] text-ink-500 leading-relaxed border-t border-ink/10 pt-4">
          *New-build pricing includes 15–25 % bulk discount. Buyers save full electricity bill from day one — savings
          often exceed added cost within 7 years. Retrofit assumes cost split among participating units. Data updated
          monthly.*
        </div>
      </section>

      <NextSteps route="/bess/shared-residential" />
    </main>
  )
}

export default function SharedResidentialPage() {
  const { selectedCountry, setSelectedCountry } = useVehicleStore()
  const [isCountryReset, setIsCountryReset] = useState(false)

  useEffect(() => {
    setSelectedCountry(null)
    setIsCountryReset(true)
  }, [setSelectedCountry])

  if (!isCountryReset || !selectedCountry) {
    return <CountryRequiredState />
  }

  return (
    <SharedResidentialCalculator country={selectedCountry as Country} />
  )
}
