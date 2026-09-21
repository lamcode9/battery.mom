'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import InfoTooltip from '@/components/InfoTooltip'
import PDFExportButton from '@/components/PDFExportButton'
import { Eyebrow } from '@/components/ui'
import ESGDashboard from '@/components/ESGDashboard'
import CarbonCreditEstimator from '@/components/CarbonCreditEstimator'
import BESSHeadToHead from '@/components/BESSHeadToHead'
import DemandChargeHeatmap from '@/components/DemandChargeHeatmap'
import { useURLState, copyShareLink } from '@/lib/hooks/useURLState'
import type { Country } from '@/types/bess'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'

// ── Country data ──────────────────────────────────────────────────────

const COUNTRIES: { value: Country; label: string; flag: string }[] = [
  { value: 'MY', label: 'Malaysia', flag: '🇲🇾' },
  { value: 'SG', label: 'Singapore', flag: '🇸🇬' },
  { value: 'ID', label: 'Indonesia', flag: '🇮🇩' },
  { value: 'TH', label: 'Thailand', flag: '🇹🇭' },
  { value: 'VN', label: 'Vietnam', flag: '🇻🇳' },
  { value: 'PH', label: 'Philippines', flag: '🇵🇭' },
]

const CURRENCY: Record<Country, string> = {
  MY: 'RM', SG: 'S$', ID: 'Rp', TH: '฿', VN: '₫', PH: '₱',
}

// Commercial electricity tariff (local currency / kWh, blended C&I rate)
const TARIFF: Record<Country, number> = {
  MY: 0.507, SG: 0.285, ID: 1450, TH: 4.18, VN: 1920, PH: 10.80,
}

// Maximum demand charge (local currency / kW / month)
const DEMAND_CHARGE: Record<Country, number> = {
  MY: 45.10, SG: 12.68, ID: 48000, TH: 220, VN: 62000, PH: 520,
}

// Peak hours
const PEAK_HOURS: Record<Country, string> = {
  MY: '08:00–22:00', SG: '09:00–23:00', ID: '17:00–22:00',
  TH: '09:00–22:00', VN: '09:30–11:30 & 17:00–20:00', PH: '08:00–21:00',
}

// TOU rate schedules (local currency / kWh, real C&I tariff bands)
interface TouBand { label: string; startHr: number; endHr: number; rate: number; color: string }

const TOU_RATES: Record<Country, TouBand[]> = {
  MY: [
    { label: 'Off-peak', startHr: 0, endHr: 8, rate: 0.337, color: '#86efac' },
    { label: 'Mid-peak', startHr: 8, endHr: 14, rate: 0.509, color: '#fde68a' },
    { label: 'Peak', startHr: 14, endHr: 20, rate: 0.612, color: '#fca5a5' },
    { label: 'Mid-peak', startHr: 20, endHr: 22, rate: 0.509, color: '#fde68a' },
    { label: 'Off-peak', startHr: 22, endHr: 24, rate: 0.337, color: '#86efac' },
  ],
  SG: [
    { label: 'Off-peak', startHr: 0, endHr: 7, rate: 0.195, color: '#86efac' },
    { label: 'Shoulder', startHr: 7, endHr: 9, rate: 0.265, color: '#fde68a' },
    { label: 'Peak', startHr: 9, endHr: 18, rate: 0.345, color: '#fca5a5' },
    { label: 'Shoulder', startHr: 18, endHr: 23, rate: 0.265, color: '#fde68a' },
    { label: 'Off-peak', startHr: 23, endHr: 24, rate: 0.195, color: '#86efac' },
  ],
  ID: [
    { label: 'Off-peak (LWBP)', startHr: 0, endHr: 17, rate: 1050, color: '#86efac' },
    { label: 'Peak (WBP)', startHr: 17, endHr: 22, rate: 1890, color: '#fca5a5' },
    { label: 'Off-peak (LWBP)', startHr: 22, endHr: 24, rate: 1050, color: '#86efac' },
  ],
  TH: [
    { label: 'Off-peak', startHr: 0, endHr: 9, rate: 2.93, color: '#86efac' },
    { label: 'Peak', startHr: 9, endHr: 22, rate: 5.11, color: '#fca5a5' },
    { label: 'Off-peak', startHr: 22, endHr: 24, rate: 2.93, color: '#86efac' },
  ],
  VN: [
    { label: 'Off-peak', startHr: 0, endHr: 4, rate: 1220, color: '#86efac' },
    { label: 'Normal', startHr: 4, endHr: 9, rate: 1658, color: '#fde68a' },
    { label: 'Peak', startHr: 9, endHr: 11, rate: 2871, color: '#fca5a5' },
    { label: 'Normal', startHr: 11, endHr: 17, rate: 1658, color: '#fde68a' },
    { label: 'Peak', startHr: 17, endHr: 20, rate: 2871, color: '#fca5a5' },
    { label: 'Normal', startHr: 20, endHr: 22, rate: 1658, color: '#fde68a' },
    { label: 'Off-peak', startHr: 22, endHr: 24, rate: 1220, color: '#86efac' },
  ],
  PH: [
    { label: 'Off-peak', startHr: 0, endHr: 8, rate: 8.20, color: '#86efac' },
    { label: 'Peak', startHr: 8, endHr: 21, rate: 13.50, color: '#fca5a5' },
    { label: 'Off-peak', startHr: 21, endHr: 24, rate: 8.20, color: '#86efac' },
  ],
}

// BESS cost per kWh (commercial-grade LFP, installed)
const BESS_COST_PER_KWH: Record<Country, number> = {
  MY: 1200, SG: 900, ID: 3500000, TH: 7200, VN: 5200000, PH: 14000,
}

// Inverter/PCS cost per kW
const PCS_COST_PER_KW: Record<Country, number> = {
  MY: 600, SG: 450, ID: 1800000, TH: 3600, VN: 2600000, PH: 7000,
}

// Annual O&M (% of capex)
const ANNUAL_OM_PCT = 0.015
// Battery degradation
const DEGRADATION_PER_YEAR = 0.02
// System lifespan
const SYSTEM_LIFE = 15
// Charging/discharging efficiency
const ROUND_TRIP_EFF = 0.88

// Use-case presets
type UseCase = 'office' | 'retail' | 'factory' | 'datacentre'

interface UseCasePreset {
  label: string
  icon: string
  peakDemandKw: number
  avgLoadKw: number
  peakHours: number
  description: string
}

const USE_CASE_PRESETS: Record<UseCase, UseCasePreset> = {
  office: {
    label: 'Office',
    icon: '🏢',
    peakDemandKw: 150,
    avgLoadKw: 80,
    peakHours: 8,
    description: 'M–F daytime peaks from HVAC and lighting. Weekend demand drops 60%+.',
  },
  retail: {
    label: 'Retail',
    icon: '🏬',
    peakDemandKw: 200,
    avgLoadKw: 120,
    peakHours: 10,
    description: 'Extended operating hours, heavy cooling loads, consistent 7-day demand.',
  },
  factory: {
    label: 'Factory',
    icon: '🏭',
    peakDemandKw: 500,
    avgLoadKw: 350,
    peakHours: 12,
    description: 'High baseload, motor start-up spikes. Demand charges are typically the biggest line item.',
  },
  datacentre: {
    label: 'Data Centre',
    icon: '🖥️',
    peakDemandKw: 1000,
    avgLoadKw: 850,
    peakHours: 24,
    description: 'Near-flat 24/7 load. UPS replacement and grid backup are primary battery use cases.',
  },
}

// Commercial BESS products for comparison
interface CommercialBESS {
  name: string
  chemistry: string
  capacityKwh: number
  powerKw: number
  cycles: number
  warrantyYears: number
  footprintM2: number
}

const BESS_PRODUCTS: CommercialBESS[] = [
  { name: 'BYD BatteryBox C-Series', chemistry: 'LFP', capacityKwh: 100, powerKw: 50, cycles: 6000, warrantyYears: 10, footprintM2: 1.2 },
  { name: 'Tesla Megapack', chemistry: 'LFP', capacityKwh: 3916, powerKw: 1937, cycles: 7000, warrantyYears: 15, footprintM2: 9.5 },
  { name: 'BYD MC Cube', chemistry: 'LFP', capacityKwh: 372, powerKw: 186, cycles: 6000, warrantyYears: 15, footprintM2: 4.2 },
  { name: 'Sungrow PowerTitan', chemistry: 'LFP', capacityKwh: 2752, powerKw: 1254, cycles: 8000, warrantyYears: 15, footprintM2: 8.0 },
  { name: 'CATL EnerC', chemistry: 'LFP', capacityKwh: 280, powerKw: 125, cycles: 10000, warrantyYears: 15, footprintM2: 2.8 },
  { name: 'Samsung SDI E3', chemistry: 'NMC', capacityKwh: 156, powerKw: 78, cycles: 4000, warrantyYears: 10, footprintM2: 1.5 },
  { name: 'Huawei LUNA Commercial', chemistry: 'LFP', capacityKwh: 200, powerKw: 100, cycles: 6000, warrantyYears: 10, footprintM2: 1.8 },
]

// Case studies
interface CaseStudy {
  title: string
  location: string
  type: string
  systemSize: string
  result: string
  saving: string
}

const CASE_STUDIES: CaseStudy[] = [
  {
    title: 'Shopping Mall Peak Shaving',
    location: 'Bangkok, Thailand',
    type: 'Retail',
    systemSize: '500 kWh / 250 kW',
    result: 'Reduced monthly max demand charge by 35%',
    saving: '฿1.2M/year',
  },
  {
    title: 'Manufacturing Plant Load Shifting',
    location: 'Johor, Malaysia',
    type: 'Factory',
    systemSize: '1 MWh / 500 kW',
    result: 'Avoided RM480K/year in demand surcharges',
    saving: 'RM480K/year',
  },
  {
    title: 'Office Complex Solar + Storage',
    location: 'Singapore',
    type: 'Office',
    systemSize: '200 kWh / 100 kW + 80 kWp solar',
    result: 'Self-consumption rate from 35% to 82%',
    saving: 'S$65K/year',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────

function fmt(n: number, country: Country, digits = 0): string {
  return `${CURRENCY[country]}${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

function fmtShort(n: number, country: Country): string {
  if (country === 'ID' || country === 'VN') {
    if (Math.abs(n) >= 1e9) return `${CURRENCY[country]}${(n / 1e9).toFixed(1)}B`
    if (Math.abs(n) >= 1e6) return `${CURRENCY[country]}${(n / 1e6).toFixed(1)}M`
    if (Math.abs(n) >= 1e3) return `${CURRENCY[country]}${(n / 1e3).toFixed(0)}K`
  }
  if (Math.abs(n) >= 1e6) return `${CURRENCY[country]}${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `${CURRENCY[country]}${(n / 1e3).toFixed(1)}K`
  return fmt(n, country)
}

// ── Component ─────────────────────────────────────────────────────────

export default function CommercialBESSClient() {
  const [country, setCountry] = useState<Country>('MY')
  const [useCase, setUseCase] = useState<UseCase>('office')
  const [peakDemandKw, setPeakDemandKw] = useState(150)
  const [targetReductionPct, setTargetReductionPct] = useState(30)
  const [peakDurationHrs, setPeakDurationHrs] = useState(4)
  const pdfRef = useRef<HTMLElement>(null)
  const [shareLabel, setShareLabel] = useState('Share Design')

  // Diesel genset replacement state
  const [gensetKva, setGensetKva] = useState(200)
  const [dieselPricePerLitre, setDieselPricePerLitre] = useState<number>(
    { MY: 2.15, SG: 2.80, ID: 13500, TH: 30, VN: 24000, PH: 65 }[country] || 2.15
  )
  const [outageHoursPerMonth, setOutageHoursPerMonth] = useState(6)

  // Update diesel price when country changes
  useEffect(() => {
    const prices: Record<Country, number> = { MY: 2.15, SG: 2.80, ID: 13500, TH: 30, VN: 24000, PH: 65 }
    setDieselPricePerLitre(prices[country])
  }, [country])

  useURLState([
    { key: 'country', value: country, defaultValue: 'MY', setter: setCountry, type: 'string' },
    { key: 'useCase', value: useCase, defaultValue: 'office', setter: setUseCase, type: 'string' },
    { key: 'peakKw', value: peakDemandKw, defaultValue: 150, setter: setPeakDemandKw, type: 'number' },
    { key: 'reduction', value: targetReductionPct, defaultValue: 30, setter: setTargetReductionPct, type: 'number' },
    { key: 'duration', value: peakDurationHrs, defaultValue: 4, setter: setPeakDurationHrs, type: 'number' },
  ])

  // Sync presets when use-case changes
  const applyPreset = (uc: UseCase) => {
    setUseCase(uc)
    setPeakDemandKw(USE_CASE_PRESETS[uc].peakDemandKw)
    setPeakDurationHrs(Math.min(USE_CASE_PRESETS[uc].peakHours, 8))
  }

  // ── Calculation ─────────────────────────────────────────────────────
  const results = useMemo(() => {
    const demandCharge = DEMAND_CHARGE[country]
    const tariff = TARIFF[country]
    const bessPerKwh = BESS_COST_PER_KWH[country]
    const pcsPerKw = PCS_COST_PER_KW[country]

    // Shaved demand
    const shavedKw = peakDemandKw * (targetReductionPct / 100)
    const newPeakKw = peakDemandKw - shavedKw

    // Battery sizing
    const requiredKwh = Math.ceil(shavedKw * peakDurationHrs / ROUND_TRIP_EFF)
    const requiredKw = Math.ceil(shavedKw / ROUND_TRIP_EFF)

    // Capex
    const batteryCost = requiredKwh * bessPerKwh
    const pcsCost = requiredKw * pcsPerKw
    const installationPct = 0.12
    const totalCapex = (batteryCost + pcsCost) * (1 + installationPct)

    // Annual savings
    const demandSavings = shavedKw * demandCharge * 12
    // Energy arbitrage (charge off-peak, discharge peak — ~15% tariff spread)
    const arbitrageSpread = 0.15
    const dailyArbitrageKwh = requiredKwh * 0.6 // 60% of capacity used for arbitrage
    const arbitrageSavings = dailyArbitrageKwh * tariff * arbitrageSpread * 365

    const totalAnnualSavings = demandSavings + arbitrageSavings
    const annualOm = totalCapex * ANNUAL_OM_PCT

    // Year-by-year
    let cumCashflow = -totalCapex
    let paybackYear: number | null = null
    const yearlyData: { year: string; savings: number; cumulative: number }[] = []
    let totalSavings = 0

    for (let y = 1; y <= SYSTEM_LIFE; y++) {
      const degradation = Math.pow(1 - DEGRADATION_PER_YEAR, y - 1)
      const yearlySavings = totalAnnualSavings * degradation
      const netCashflow = yearlySavings - annualOm
      cumCashflow += netCashflow
      totalSavings += netCashflow

      if (!paybackYear && cumCashflow >= 0) paybackYear = y

      yearlyData.push({
        year: `Y${y}`,
        savings: Math.round(netCashflow),
        cumulative: Math.round(cumCashflow),
      })
    }

    const roi = totalCapex > 0 ? (totalSavings / totalCapex) * 100 : 0

    // Load profile chart (24hr)
    const loadProfile = Array.from({ length: 24 }, (_, h) => {
      const preset = USE_CASE_PRESETS[useCase]
      const baseLoad = preset.avgLoadKw * 0.6
      let load = baseLoad
      // Peak hours simulation
      if (h >= 8 && h <= 17) load = preset.avgLoadKw + (preset.peakDemandKw - preset.avgLoadKw) * Math.sin(((h - 8) / 9) * Math.PI)
      if (h >= 18 && h <= 21) load = preset.avgLoadKw * 0.8
      
      const batteryDischarge = load > newPeakKw ? Math.min(load - newPeakKw, shavedKw) : 0
      const gridLoad = load - batteryDischarge

      return {
        hour: `${h.toString().padStart(2, '0')}:00`,
        'Original load': Math.round(load),
        'With BESS': Math.round(gridLoad),
        'Battery discharge': Math.round(batteryDischarge),
      }
    })

    return {
      shavedKw: Math.round(shavedKw),
      newPeakKw: Math.round(newPeakKw),
      requiredKwh,
      requiredKw,
      totalCapex: Math.round(totalCapex),
      demandSavingsAnnual: Math.round(demandSavings),
      arbitrageSavingsAnnual: Math.round(arbitrageSavings),
      totalAnnualSavings: Math.round(totalAnnualSavings),
      annualOm: Math.round(annualOm),
      paybackYear,
      roi: Math.round(roi),
      totalSavings15: Math.round(totalSavings),
      yearlyData,
      loadProfile,
    }
  }, [country, useCase, peakDemandKw, targetReductionPct, peakDurationHrs])

  // ── Diesel genset replacement calculation ───────────────────────────
  const dieselCalc = useMemo(() => {
    const gensetKw = gensetKva * 0.8 // kVA → kW power factor
    const fuelConsumptionPerHr = gensetKw * 0.28 // litres/hr at ~75% load
    const monthlyFuel = fuelConsumptionPerHr * outageHoursPerMonth
    const annualFuelCost = monthlyFuel * 12 * dieselPricePerLitre
    const gensetCapex = gensetKva * (country === 'SG' ? 280 : country === 'ID' ? 2800000 : country === 'TH' ? 5500 : country === 'VN' ? 4500000 : country === 'PH' ? 12000 : 800)
    const annualGensetMaint = gensetCapex * 0.08 // 8% annual maintenance
    const annualGensetTotal = annualFuelCost + annualGensetMaint

    // BESS equivalent: enough to cover the same hours at same kW
    const bessKwh = Math.ceil(gensetKw * (outageHoursPerMonth > 4 ? 4 : outageHoursPerMonth)) // cap at 4hr for sizing
    const bessCapex = bessKwh * BESS_COST_PER_KWH[country] + gensetKw * PCS_COST_PER_KW[country]
    const bessCapexWithInstall = bessCapex * 1.12
    const annualBessMaint = bessCapexWithInstall * 0.02 // 2% O&M

    const years = 15
    const yearlyComparison: { year: string; diesel: number; bess: number }[] = []
    let dieselCum = gensetCapex
    let bessCum = bessCapexWithInstall
    let breakEvenYear: number | null = null

    for (let y = 1; y <= years; y++) {
      dieselCum += annualGensetTotal
      bessCum += annualBessMaint
      if (!breakEvenYear && bessCum < dieselCum) breakEvenYear = y
      yearlyComparison.push({
        year: `Y${y}`,
        diesel: Math.round(dieselCum),
        bess: Math.round(bessCum),
      })
    }

    return {
      gensetKw: Math.round(gensetKw),
      monthlyFuelLitres: Math.round(monthlyFuel),
      annualFuelCost: Math.round(annualFuelCost),
      annualGensetMaint: Math.round(annualGensetMaint),
      annualGensetTotal: Math.round(annualGensetTotal),
      gensetCapex: Math.round(gensetCapex),
      bessKwh,
      bessCapex: Math.round(bessCapexWithInstall),
      annualBessMaint: Math.round(annualBessMaint),
      breakEvenYear,
      totalDiesel15yr: Math.round(dieselCum),
      totalBess15yr: Math.round(bessCum),
      savings15yr: Math.round(dieselCum - bessCum),
      yearlyComparison,
    }
  }, [gensetKva, dieselPricePerLitre, outageHoursPerMonth, country])

  // ── TOU arbitrage calculation ───────────────────────────────────────
  const touCalc = useMemo(() => {
    const bands = TOU_RATES[country]
    const offPeakRate = Math.min(...bands.map(b => b.rate))
    const peakRate = Math.max(...bands.map(b => b.rate))
    const spread = peakRate - offPeakRate

    // Use the BESS size from main calc for arbitrage
    const bessKwh = results.requiredKwh
    const usableKwh = bessKwh * ROUND_TRIP_EFF * 0.8 // 80% DoD, round-trip eff

    // Charge during cheapest band, discharge during most expensive
    const dailyArbSavings = usableKwh * spread
    const annualArbSavings = dailyArbSavings * 365 * 0.9 // 90% availability
    const monthlyArbSavings = annualArbSavings / 12

    // Build 24-hour rate profile data for chart
    const hourlyProfile = Array.from({ length: 24 }, (_, h) => {
      const band = bands.find(b => h >= b.startHr && h < b.endHr)!
      const isCharging = band.rate === offPeakRate
      const isDischarging = band.rate === peakRate
      return {
        hour: `${h.toString().padStart(2, '0')}:00`,
        rate: band.rate,
        label: band.label,
        color: band.color,
        action: isCharging ? 'Charge' : isDischarging ? 'Discharge' : 'Idle',
      }
    })

    return {
      offPeakRate,
      peakRate,
      spread,
      bessKwh,
      usableKwh: Math.round(usableKwh),
      dailySavings: Math.round(dailyArbSavings),
      monthlySavings: Math.round(monthlyArbSavings),
      annualSavings: Math.round(annualArbSavings),
      hourlyProfile,
    }
  }, [country, results.requiredKwh])

  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section ref={pdfRef} className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <Eyebrow>Commercial calculator</Eyebrow>
          <h1 className="mt-3 font-display text-4xl md:text-5xl font-medium text-ink tracking-tight">
            Commercial BESS <InfoTooltip content="BESS = Battery Energy Storage System. A commercial BESS is a large battery (100 kWh to several MWh) installed at a business to reduce electricity costs by shaving peak demand, shifting energy to cheaper off-peak hours, and providing backup power." />
          </h1>
          <p className="mt-4 text-lg text-ink-600 leading-relaxed">
            Size a commercial battery for peak shaving, demand-charge reduction, and energy arbitrage on real Southeast Asian tariffs. Pick a use case, set your peak load, and read the system size, cost, and payback below.
          </p>
        </div>

        {/* Use-case selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {(Object.entries(USE_CASE_PRESETS) as [UseCase, UseCasePreset][]).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`text-left p-4 rounded-card transition-all ${
                useCase === key
                  ? 'bg-brand-50 shadow-card'
                  : 'bg-paper-100 shadow-card hover:bg-paper-200'
              }`}
            >
              <div className="text-2xl mb-1">{preset.icon}</div>
              <div className="text-sm font-semibold text-ink">{preset.label}</div>
              <div className="text-xs text-ink-500 mt-0.5 leading-relaxed">{preset.description}</div>
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Country</label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as Country)}
                  className="w-full px-4 py-2 pr-8 rounded-full bg-paper-200 hover:bg-paper-300 text-sm font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-brand-50 appearance-none cursor-pointer transition-colors"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.flag} {c.label}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-ink-400 mt-1">Peak hours: {PEAK_HOURS[country]}</p>
            </div>

            {/* Peak demand */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Current peak demand <InfoTooltip content="The highest power draw (in kW) your building records in any 15-30 minute interval during a billing period. Utilities charge extra for high peak demand because it forces them to keep expensive 'peaker' generators on standby. Reducing your peak can cut this charge significantly." /></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={25}
                  value={peakDemandKw}
                  onChange={(e) => setPeakDemandKw(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-16 text-right">{peakDemandKw} kW</span>
              </div>
            </div>

            {/* Target reduction */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Target peak reduction <InfoTooltip content="How much of your peak demand you want the battery to 'shave off'. A 30% reduction means if your peak is 150 kW, the battery absorbs 45 kW during peaks so the grid only sees 105 kW. Higher reduction = bigger battery needed." /></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={60}
                  step={5}
                  value={targetReductionPct}
                  onChange={(e) => setTargetReductionPct(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-10 text-right">{targetReductionPct}%</span>
              </div>
              <p className="text-xs text-ink-400 mt-1">Shave {results.shavedKw} kW → {results.newPeakKw} kW</p>
            </div>

            {/* Peak duration */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Peak discharge duration <InfoTooltip content="How many hours the battery needs to sustain peak shaving each day. Longer duration = larger battery capacity needed. Most commercial peaks last 2-4 hours; factories may need 6-8 hours." /></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={peakDurationHrs}
                  onChange={(e) => setPeakDurationHrs(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-12 text-right">{peakDurationHrs}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plain-language result — ties the four numbers together in one read */}
        <p className="mb-6 max-w-3xl text-base md:text-lg text-ink-700 leading-relaxed">
          A <span className="font-semibold text-ink">{results.requiredKwh.toLocaleString()} kWh / {results.requiredKw.toLocaleString()} kW</span> battery
          costs about <span className="font-semibold text-ink">{fmtShort(results.totalCapex, country)}</span> to install,
          {results.paybackYear
            ? <> pays that back in <span className="font-semibold text-ink">{results.paybackYear} years</span>,</>
            : <> takes over {SYSTEM_LIFE} years to pay back,</>}
          {' '}then nets about <span className="font-semibold text-brand-700">{fmtShort(results.totalAnnualSavings, country)} a year</span> after running costs.
        </p>

        {/* Results summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Battery size <InfoTooltip content="The recommended battery capacity (kWh) and power converter size (kW PCS). Sized based on: shaved kW × peak hours ÷ round-trip efficiency (88%). The PCS (Power Conversion System) converts between AC grid power and DC battery storage." /></div>
            <div className="text-xl font-bold text-ink">{results.requiredKwh} kWh</div>
            <div className="text-xs text-ink-500 mt-0.5">{results.requiredKw} kW PCS</div>
          </div>
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Total capex <InfoTooltip content="Total upfront cost: battery cells + PCS (power converter) + 12% installation labour/wiring/commissioning. This is the all-in investment before any savings begin." /></div>
            <div className="text-xl font-bold text-ink">{fmtShort(results.totalCapex, country)}</div>
            <div className="text-xs text-ink-500 mt-0.5">Battery + PCS + install</div>
          </div>
          <div className={`rounded-card p-5 border ${
            results.paybackYear && results.paybackYear <= 6
              ? 'bg-brand-50 border-brand-200'
              : 'bg-paper-100 border-ink/10'
          }`}>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Payback <InfoTooltip content="Years until cumulative savings cover the capex investment, accounting for 2% annual battery degradation and 1.5% annual O&M costs. After payback, the system generates net positive returns for its remaining life." /></div>
            <div className="text-xl font-bold text-ink">
              {results.paybackYear ? `${results.paybackYear} years` : '15+ years'}
            </div>
            <div className="text-xs text-ink-500 mt-0.5">{results.roi}% ROI over {SYSTEM_LIFE}yr</div>
          </div>
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Annual savings</div>
            <div className="text-xl font-bold text-brand-700">{fmtShort(results.totalAnnualSavings, country)}</div>
            <div className="text-xs text-ink-500 mt-0.5">net of {fmtShort(results.annualOm, country)} O&M</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Load profile */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-1">Daily load profile: {USE_CASE_PRESETS[useCase].label}</h3>
            <p className="text-xs text-ink-500 mb-4">Shows how BESS clips peak demand from the grid perspective</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={results.loadProfile} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} unit=" kW" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="With BESS" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Battery discharge" stackId="a" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative cashflow */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-1">Cumulative cashflow</h3>
            <p className="text-xs text-ink-500 mb-4">{SYSTEM_LIFE}-year projection including O&M and degradation</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={results.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtShort(v, country)} />
                <Tooltip formatter={(v: number) => fmt(v, country)} />
                <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} dot={false} name="Net cashflow" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Savings breakdown */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <h3 className="text-sm font-semibold text-ink mb-4">Annual savings breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-paper-200 rounded-lg p-4">
              <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Demand charge reduction <InfoTooltip content="Monthly savings from reducing your recorded peak demand. Formula: shaved kW × demand charge rate × 12 months. This is typically the largest revenue stream for commercial BESS (40-60% of total savings)." /></div>
              <div className="text-2xl font-bold text-ink mt-1">{fmtShort(results.demandSavingsAnnual, country)}</div>
              <div className="text-xs text-ink-500 mt-0.5">
                {results.shavedKw} kW × {fmt(DEMAND_CHARGE[country], country)} × 12 months
              </div>
            </div>
            <div className="bg-paper-200 rounded-lg p-4">
              <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Energy arbitrage <InfoTooltip content="Savings from charging the battery during cheap off-peak hours and discharging during expensive peak hours. We assume a 15% tariff spread (peak vs off-peak) and 60% of battery capacity available for daily arbitrage." /></div>
              <div className="text-2xl font-bold text-ink mt-1">{fmtShort(results.arbitrageSavingsAnnual, country)}</div>
              <div className="text-xs text-ink-500 mt-0.5">Charge off-peak, discharge at peak tariff</div>
            </div>
            <div className="bg-brand-50 rounded-lg p-4">
              <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Total over {SYSTEM_LIFE} years</div>
              <div className="text-2xl font-bold text-brand-700 mt-1">{fmtShort(results.totalSavings15, country)}</div>
              <div className="text-xs text-ink-500 mt-0.5">Net of O&M and degradation</div>
            </div>
          </div>
        </div>

        {/* Revenue stacking explainer */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-ink mb-2">Revenue stacking: why commercial BESS beats single-use <InfoTooltip content="Revenue stacking means using the same battery for multiple purposes (peak shaving + arbitrage + backup + grid services). Each additional use case adds incremental value without needing a bigger battery, improving the overall ROI by 30-60%." /></h3>
          <p className="text-sm text-ink-600 mb-6">
            A commercial battery isn&apos;t just peak shaving. By stacking multiple revenue streams, the same battery can earn 30–60% more than peak shaving alone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Peak shaving', desc: 'Reduce max demand charges by 20–40%. The primary revenue stream in most SEA markets.', pct: '40–60%' },
              { title: 'Energy arbitrage', desc: 'Charge at off-peak rates (typically 30–50% cheaper), discharge during peak periods.', pct: '15–25%' },
              { title: 'Backup power', desc: 'Replace or supplement diesel generators. Avoids fuel cost + maintenance + noise.', pct: '10–15%' },
              { title: 'Grid services', desc: 'Frequency regulation and demand response payments (SG, TH markets most active).', pct: '5–15%' },
            ].map((s) => (
              <div key={s.title} className="bg-paper-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-ink">{s.title}</h4>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">{s.pct}</span>
                </div>
                <p className="text-xs text-ink-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BESS product comparison */}
        <div className="bg-paper-100 border border-ink/10 rounded-card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-ink/5">
            <h3 className="text-sm font-semibold text-ink">Commercial BESS products (100+ kWh)</h3>
            <p className="text-xs text-ink-500 mt-0.5">Key specifications for the most widely deployed commercial battery systems in Southeast Asia</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-200 border-b border-ink/10">
                  <th className="text-left px-4 py-2.5 font-medium text-ink-500">Product</th>
                  <th className="text-center px-4 py-2.5 font-medium text-ink-500">Chemistry</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Capacity</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Power</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Cycles</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Warranty</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Footprint</th>
                </tr>
              </thead>
              <tbody>
                {BESS_PRODUCTS.map((p) => (
                  <tr key={p.name} className="border-b border-ink/5 hover:bg-paper-200">
                    <td className="px-4 py-2.5 font-medium text-ink">{p.name}</td>
                    <td className="text-center px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.chemistry === 'LFP' ? 'bg-brand-50 text-brand-700' : 'bg-blue-50 text-blue-700'
                      }`}>{p.chemistry}</span>
                    </td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{p.capacityKwh.toLocaleString()} kWh</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{p.powerKw.toLocaleString()} kW</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{p.cycles.toLocaleString()}</td>
                    <td className="text-right px-4 py-2.5">{p.warrantyYears} yr</td>
                    <td className="text-right px-4 py-2.5">{p.footprintM2} m²</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Case studies */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-ink mb-4">Case studies</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CASE_STUDIES.map((cs) => (
              <div key={cs.title} className="bg-paper-100 border border-ink/10 rounded-card p-5">
                <span className="text-[11px] font-semibold text-ink-500 bg-paper-200 rounded-full px-2.5 py-0.5">
                  {cs.type}
                </span>
                <h4 className="text-sm font-semibold text-ink mt-3 mb-1">{cs.title}</h4>
                <p className="text-xs text-ink-500 mb-3">{cs.location}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-500">System</span>
                    <span className="font-medium text-ink-700">{cs.systemSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">Result</span>
                    <span className="font-medium text-ink-700">{cs.result}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-ink/5">
                    <span className="text-ink-500">Annual saving</span>
                    <span className="font-bold text-brand-700">{cs.saving}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diesel genset replacement calculator */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <h3 className="text-base font-bold text-ink mb-1 flex items-center gap-2">
            ⛽ Diesel Generator Replacement
            <InfoTooltip content="Compare the 15-year total cost of ownership (TCO) between a diesel genset and a BESS for backup power. Includes fuel costs, maintenance, and degradation. Most commercial buildings in SEA pay 20-80% more for diesel backup over a 15-year period vs BESS." />
          </h3>
          <p className="text-sm text-ink-500 mb-5">See if replacing your diesel genset with battery backup saves money over 15 years.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Generator size (kVA)</label>
              <input
                type="range"
                min={50}
                max={1000}
                step={25}
                value={gensetKva}
                onChange={(e) => setGensetKva(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-ink-500 mt-1">
                <span>50 kVA</span>
                <span className="font-semibold text-ink-800">{gensetKva} kVA ({dieselCalc.gensetKw} kW)</span>
                <span>1,000 kVA</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Diesel price ({CURRENCY[country]}/litre)</label>
              <input
                type="range"
                min={country === 'ID' ? 5000 : country === 'VN' ? 10000 : 0.5}
                max={country === 'ID' ? 25000 : country === 'VN' ? 40000 : country === 'PH' ? 100 : country === 'TH' ? 60 : 6}
                step={country === 'ID' ? 500 : country === 'VN' ? 1000 : 0.05}
                value={dieselPricePerLitre}
                onChange={(e) => setDieselPricePerLitre(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-ink-500 mt-1">
                <span>Low</span>
                <span className="font-semibold text-ink-800">{fmt(dieselPricePerLitre, country, 2)}/L</span>
                <span>High</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Outage hours/month</label>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={outageHoursPerMonth}
                onChange={(e) => setOutageHoursPerMonth(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-ink-500 mt-1">
                <span>1 hr</span>
                <span className="font-semibold text-ink-800">{outageHoursPerMonth} hrs/month</span>
                <span>30 hrs</span>
              </div>
            </div>
          </div>

          {/* Comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 rounded-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⛽</span>
                <h4 className="text-sm font-bold text-red-900">Diesel Generator</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">Genset capex</span>
                  <span className="font-medium">{fmtShort(dieselCalc.gensetCapex, country)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Annual fuel ({dieselCalc.monthlyFuelLitres}L/mo)</span>
                  <span className="font-medium">{fmtShort(dieselCalc.annualFuelCost, country)}/yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Annual maintenance</span>
                  <span className="font-medium">{fmtShort(dieselCalc.annualGensetMaint, country)}/yr</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-red-200">
                  <span className="font-semibold text-red-900">15-year TCO</span>
                  <span className="font-bold text-red-700">{fmtShort(dieselCalc.totalDiesel15yr, country)}</span>
                </div>
              </div>
            </div>
            <div className="bg-brand-50 rounded-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔋</span>
                <h4 className="text-sm font-bold text-brand-900">Battery (BESS)</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">BESS capex ({dieselCalc.bessKwh} kWh)</span>
                  <span className="font-medium">{fmtShort(dieselCalc.bessCapex, country)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Annual O&M (2%)</span>
                  <span className="font-medium">{fmtShort(dieselCalc.annualBessMaint, country)}/yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Fuel cost</span>
                  <span className="font-medium text-brand-700">{fmt(0, country)} — zero fuel</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-brand-200">
                  <span className="font-semibold text-brand-900">15-year TCO</span>
                  <span className="font-bold text-brand-700">{fmtShort(dieselCalc.totalBess15yr, country)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Savings summary */}
          {dieselCalc.savings15yr > 0 && (
            <div className="bg-brand-100 rounded-lg px-4 py-3 mb-6 text-sm text-brand-900 font-medium text-center">
              BESS saves <span className="font-bold">{fmtShort(dieselCalc.savings15yr, country)}</span> over 15 years
              {dieselCalc.breakEvenYear ? ` — break-even in Year ${dieselCalc.breakEvenYear}` : ''}
            </div>
          )}

          {/* TCO chart */}
          <div>
            <h4 className="text-sm font-semibold text-ink-700 mb-3">15-Year Total Cost of Ownership</h4>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dieselCalc.yearlyComparison} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => fmtShort(v, country)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v, country)} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="diesel" name="Diesel TCO" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bess" name="BESS TCO" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOU Arbitrage Simulator */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <h3 className="text-base font-bold text-ink mb-1 flex items-center gap-2">
            ⏱️ Time-of-Use Arbitrage
            <InfoTooltip content="TOU arbitrage means charging your battery during cheap off-peak hours and discharging during expensive peak hours. The bigger the rate spread between off-peak and peak, the greater the savings. Most SEA utilities have 2–3 rate tiers for commercial customers." />
          </h3>
          <p className="text-sm text-ink-500 mb-5">
            Charge at off-peak rates, discharge at peak rates — using your {touCalc.bessKwh} kWh BESS from the calculation above.
          </p>

          {/* Rate band legend */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            {TOU_RATES[country].map((b, i) => (
              <div key={`${b.label}-${i}`} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: b.color }} />
                <span className="text-ink-600">
                  {b.label}: {fmt(b.rate, country, country === 'ID' || country === 'VN' ? 0 : 2)}/kWh
                  <span className="text-ink-400 ml-1">({b.startHr.toString().padStart(2,'0')}:00–{b.endHr.toString().padStart(2,'0')}:00)</span>
                </span>
              </div>
            ))}
          </div>

          {/* 24-hour rate chart with charge/discharge indicators */}
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-ink-700 mb-3">24-Hour Tariff Profile</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={touCalc.hourlyProfile} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tickFormatter={(v: number) => fmt(v, country, country === 'ID' || country === 'VN' ? 0 : 2)} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v: number) => fmt(v, country, country === 'ID' || country === 'VN' ? 0 : 3)}
                  labelFormatter={(l: string) => `Time: ${l}`}
                />
                <ReferenceLine y={touCalc.offPeakRate} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Charge', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
                <ReferenceLine y={touCalc.peakRate} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Discharge', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
                <Bar dataKey="rate" name="Tariff rate" radius={[2, 2, 0, 0]}>
                  {touCalc.hourlyProfile.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Action timeline (visual) */}
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-ink-700 mb-2">Battery Actions</h4>
            <div className="flex h-8 rounded-lg overflow-hidden">
              {touCalc.hourlyProfile.map((entry, i) => (
                <div
                  key={i}
                  className="flex-1 flex items-center justify-center relative group"
                  style={{
                    backgroundColor: entry.action === 'Charge' ? '#bbf7d0' : entry.action === 'Discharge' ? '#fecaca' : '#f3f4f6',
                  }}
                  title={`${entry.hour} — ${entry.action}`}
                >
                  {i % 4 === 0 && (
                    <span className="text-[8px] font-medium text-ink-500">{entry.action === 'Charge' ? '⬇' : entry.action === 'Discharge' ? '⬆' : '–'}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-ink-400 mt-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-ink-500">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-200" /> Charge</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-200" /> Discharge</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-paper-300" /> Idle</div>
            </div>
          </div>

          {/* Savings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-paper-200 rounded-lg p-3 text-center">
              <div className="text-xs text-ink-500 mb-1">Rate spread</div>
              <div className="text-sm font-bold text-ink">
                {fmt(touCalc.spread, country, country === 'ID' || country === 'VN' ? 0 : 2)}/kWh
              </div>
            </div>
            <div className="bg-paper-200 rounded-lg p-3 text-center">
              <div className="text-xs text-ink-500 mb-1">Usable capacity</div>
              <div className="text-sm font-bold text-ink">{touCalc.usableKwh} kWh</div>
            </div>
            <div className="bg-brand-50 rounded-lg p-3 text-center">
              <div className="text-xs text-ink-500 mb-1">Monthly saving</div>
              <div className="text-sm font-bold text-brand-700">{fmtShort(touCalc.monthlySavings, country)}</div>
            </div>
            <div className="bg-brand-50 rounded-lg p-3 text-center">
              <div className="text-xs text-ink-500 mb-1">Annual saving</div>
              <div className="text-sm font-bold text-brand-700">{fmtShort(touCalc.annualSavings, country)}</div>
            </div>
          </div>
        </div>

        <ESGDashboard
          country={country}
          solarKw={0}
          batteryCapacityKwh={results.requiredKwh}
          annualSolarGenKwh={0}
          coveragePct={targetReductionPct / 100}
          co2AvoidedKg={dieselCalc.monthlyFuelLitres * 12 * 2.68}
          annualSavingsLocal={results.totalAnnualSavings}
          systemType="commercial"
        />

        {/* Carbon Credit Estimator */}
        <CarbonCreditEstimator
          country={country}
          systemSizeKwh={results.requiredKwh}
          cyclesPerYear={365}
        />

        {/* Batch 4 — BESS Head-to-Head */}
        <BESSHeadToHead country={country} />

        {/* Batch 4 — Demand Charge Heatmap */}
        <DemandChargeHeatmap
          country={country}
          peakDemandKw={peakDemandKw}
          targetReductionPct={targetReductionPct}
          useCase={useCase}
        />

        {/* Export */}
        <div className="flex flex-wrap gap-3 mb-8" data-pdf-ignore>
          <button
            onClick={async () => {
              const ok = await copyShareLink()
              if (ok) { setShareLabel('Link Copied!'); setTimeout(() => setShareLabel('Share Design'), 2000) }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            {shareLabel}
          </button>
          <PDFExportButton
            containerRef={pdfRef}
            options={{ filename: `battery-mom-commercial-bess-${useCase}.pdf`, title: 'battery.mom — Commercial BESS Calculator', subtitle: `${COUNTRIES.find(c => c.value === country)?.label} · ${USE_CASE_PRESETS[useCase].label} · ${peakDemandKw}kW peak` }}
            className="bg-paper-200 text-ink-700 hover:bg-paper-300"
          />
        </div>

        {/* Assumptions + CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-3">Key assumptions <InfoTooltip content="Commercial/industrial tariff rates (higher than residential). Demand charge = extra fee per kW of your peak load. Round-trip efficiency: 88% of energy stored is recovered (12% lost as heat). Battery degrades 2%/year." /></h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-ink-500">
              <div>C&I tariff: {fmt(TARIFF[country], country, 3)}/kWh</div>
              <div>Demand charge: {fmt(DEMAND_CHARGE[country], country)}/kW/mo</div>
              <div>BESS cost: {fmt(BESS_COST_PER_KWH[country], country)}/kWh</div>
              <div>Round-trip efficiency: {ROUND_TRIP_EFF * 100}%</div>
              <div>Degradation: {DEGRADATION_PER_YEAR * 100}%/year</div>
              <div>Annual O&M: {ANNUAL_OM_PCT * 100}% of capex</div>
              <div>System life: {SYSTEM_LIFE} years</div>
              <div>Peak hours: {PEAK_HOURS[country]}</div>
            </div>
          </div>
          <div className="bg-brand-50 border border-brand-200 rounded-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-brand-900 mb-2">Looking for home battery?</h3>
              <p className="text-sm text-brand-800">
                For residential solar + battery sizing, use our dedicated home calculators.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link href="/bess/home" className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                Home BESS Calculator
              </Link>
              <Link href="/bess/shared-residential" className="inline-flex items-center px-4 py-2 bg-paper-100 text-ink-800 border border-ink/15 rounded-lg hover:bg-paper-200 transition-colors text-sm font-medium">
                Shared Residential
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
