'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import InfoTooltip from '@/components/InfoTooltip'
import PDFExportButton from '@/components/PDFExportButton'
import { Eyebrow } from '@/components/ui'
import PolicyImpactSimulator from '@/components/PolicyImpactSimulator'
import SubsidyROICalculator from '@/components/SubsidyROICalculator'
import BESSDeploymentMap from '@/components/BESSDeploymentMap'
import GridStabilityAnalysis from '@/components/GridStabilityAnalysis'
import { useURLState, copyShareLink } from '@/lib/hooks/useURLState'
import type { Country } from '@/types/bess'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
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

// Grid-scale BESS cost assumptions (2026)
const GRID_BESS_COST_PER_KWH: Record<Country, number> = {
  MY: 800, SG: 600, ID: 3000000, TH: 6000, VN: 4000000, PH: 12000,
}

const PCS_COST_PER_KW: Record<Country, number> = {
  MY: 400, SG: 300, ID: 1500000, TH: 3000, VN: 2000000, PH: 6000,
}

// Annual O&M (% of capex)
const ANNUAL_OM_PCT = 0.02
// Battery degradation
const DEGRADATION_PER_YEAR = 0.025
// System lifespan
const SYSTEM_LIFE = 20
// Round-trip efficiency
const ROUND_TRIP_EFF = 0.85
// Discount rate for NPV
const DISCOUNT_RATE = 0.08

// ── Technology comparison ──────────────────────────────────────────────

interface BatteryTech {
  name: string
  chemistry: string
  costPerKwh: number
  cycles: number
  energyDensity: number
  advantages: string[]
  disadvantages: string[]
  useCases: string[]
}

const BATTERY_TECHS: BatteryTech[] = [
  {
    name: 'LFP (Lithium Iron Phosphate)',
    chemistry: 'LFP',
    costPerKwh: 800,
    cycles: 8000,
    energyDensity: 160,
    advantages: ['Long cycle life', 'Thermal stability', 'Low cost', 'Safe'],
    disadvantages: ['Lower energy density', 'Voltage limitations'],
    useCases: ['Grid storage', 'Peak shaving', 'Renewable integration'],
  },
  {
    name: 'NMC (Nickel Manganese Cobalt)',
    chemistry: 'NMC',
    costPerKwh: 900,
    cycles: 5000,
    energyDensity: 200,
    advantages: ['High energy density', 'Good performance', 'Established tech'],
    disadvantages: ['Higher cost', 'Thermal management needed', 'Shorter cycle life'],
    useCases: ['Grid storage', 'EV applications', 'Portable power'],
  },
  {
    name: 'Flow Battery (Vanadium)',
    chemistry: 'Flow',
    costPerKwh: 1200,
    cycles: 15000,
    energyDensity: 25,
    advantages: ['Unlimited cycle life', 'Scalable power/energy', 'Long duration'],
    disadvantages: ['Low energy density', 'High cost', 'Complex system'],
    useCases: ['Long-duration storage', 'Grid stabilization', 'Renewable firming'],
  },
  {
    name: 'Sodium-ion',
    chemistry: 'Na-ion',
    costPerKwh: 600,
    cycles: 6000,
    energyDensity: 140,
    advantages: ['Low cost', 'Abundant materials', 'Good cycle life'],
    disadvantages: ['Lower energy density', 'Newer technology', 'Limited suppliers'],
    useCases: ['Grid storage', 'Cost-sensitive applications', 'Large-scale projects'],
  },
]

// ── Grid-scale projects ────────────────────────────────────────────────

interface GridProject {
  name: string
  country: string
  developer: string
  capacityMw: number
  capacityMwh: number
  chemistry: string
  status: string
  year: number
  cost?: number
}

const GRID_PROJECTS: GridProject[] = [
  { name: 'Tuas South', country: 'SG', developer: 'Sembcorp', capacityMw: 250, capacityMwh: 1000, chemistry: 'LFP', status: 'Operational', year: 2024 },
  { name: 'Hornsdale Power Reserve', country: 'AU', developer: 'Tesla', capacityMw: 150, capacityMwh: 193.5, chemistry: 'LFP', status: 'Operational', year: 2017 },
  { name: 'Gateway Energy Storage', country: 'AU', developer: 'Fluence', capacityMw: 250, capacityMwh: 250, chemistry: 'LFP', status: 'Operational', year: 2023 },
  { name: 'Dalrymple BESS', country: 'AU', developer: 'Edify Energy', capacityMw: 300, capacityMwh: 900, chemistry: 'LFP', status: 'Operational', year: 2023 },
  { name: 'Victoria Big Battery', country: 'AU', developer: 'Tesla', capacityMw: 300, capacityMwh: 450, chemistry: 'LFP', status: 'Operational', year: 2021 },
  { name: 'Moss Landing', country: 'US', developer: 'PG&E', capacityMw: 300, capacityMwh: 1200, chemistry: 'LFP', status: 'Operational', year: 2023 },
  { name: 'Pathfinder', country: 'US', developer: 'AES', capacityMw: 250, capacityMwh: 500, chemistry: 'LFP', status: 'Operational', year: 2023 },
  { name: 'Gila River', country: 'US', developer: 'NextEra', capacityMw: 250, capacityMwh: 500, chemistry: 'LFP', status: 'Operational', year: 2023 },
  { name: 'Kauai Island Utility', country: 'US', developer: 'AES', capacityMw: 52, capacityMwh: 208, chemistry: 'LFP', status: 'Operational', year: 2022 },
  { name: 'Kern County', country: 'US', developer: 'LS Power', capacityMw: 204.6, capacityMwh: 819, chemistry: 'LFP', status: 'Operational', year: 2023 },
]

// ── Policy tracker ─────────────────────────────────────────────────────

interface Policy {
  country: string
  policy: string
  description: string
  incentive: string
  status: string
}

const POLICIES: Policy[] = [
  { country: 'SG', policy: 'Energy Storage Programme', description: 'Grants for grid-connected BESS', incentive: 'Up to 50% of capex', status: 'Active' },
  { country: 'MY', policy: 'Large Scale Solar + Storage', description: 'FiT for solar + storage hybrid', incentive: 'RM1.50/kWh for 21 years', status: 'Active' },
  { country: 'TH', policy: 'Smart Grid Development', description: 'Grid modernization with storage', incentive: 'Government funding', status: 'Active' },
  { country: 'ID', policy: 'PLN B2B Storage', description: 'Direct procurement from PLN', incentive: 'Competitive pricing', status: 'Active' },
  { country: 'VN', policy: 'Renewable Integration', description: 'Storage for grid stability', incentive: 'Priority dispatch', status: 'Developing' },
  { country: 'PH', policy: 'DOE Storage Roadmap', description: 'National storage targets', incentive: 'Policy support', status: 'Planning' },
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

export default function GridBESSClient() {
  const [country, setCountry] = useState<Country>('MY')
  const [systemSizeMwh, setSystemSizeMwh] = useState(100)
  const [cyclesPerYear, setCyclesPerYear] = useState(365)
  const [projectLife, setProjectLife] = useState(20)
  const [capexPerMwh, setCapexPerMwh] = useState(800000)
  const [omPerMwhYear, setOmPerMwhYear] = useState(20000)
  const [revenuePerMwhCycle, setRevenuePerMwhCycle] = useState(50)
  const pdfRef = useRef<HTMLElement>(null)
  const [shareLabel, setShareLabel] = useState('Share Design')

  useURLState([
    { key: 'country', value: country, defaultValue: 'MY', setter: setCountry, type: 'string' },
    { key: 'size', value: systemSizeMwh, defaultValue: 100, setter: setSystemSizeMwh, type: 'number' },
    { key: 'cycles', value: cyclesPerYear, defaultValue: 365, setter: setCyclesPerYear, type: 'number' },
    { key: 'life', value: projectLife, defaultValue: 20, setter: setProjectLife, type: 'number' },
    { key: 'capex', value: capexPerMwh, defaultValue: 800000, setter: setCapexPerMwh, type: 'number' },
    { key: 'om', value: omPerMwhYear, defaultValue: 20000, setter: setOmPerMwhYear, type: 'number' },
    { key: 'revenue', value: revenuePerMwhCycle, defaultValue: 50, setter: setRevenuePerMwhCycle, type: 'number' },
  ])

  // ── LCOE/LCOS Calculation ────────────────────────────────────────────
  const lcoeResults = useMemo(() => {
    const totalCapex = systemSizeMwh * capexPerMwh
    const annualOm = systemSizeMwh * omPerMwhYear
    const annualRevenue = systemSizeMwh * cyclesPerYear * revenuePerMwhCycle

    let totalRevenue = 0
    let totalOm = 0
    let totalEnergy = 0

    const yearlyData: { year: string; revenue: number; om: number; netCashflow: number; cumulative: number }[] = []

    for (let y = 1; y <= projectLife; y++) {
      const degradation = Math.pow(1 - DEGRADATION_PER_YEAR, y - 1)
      const yearlyEnergy = systemSizeMwh * cyclesPerYear * ROUND_TRIP_EFF * degradation
      const yearlyRevenue = yearlyEnergy * revenuePerMwhCycle
      const yearlyOm = annualOm

      const netCashflow = yearlyRevenue - yearlyOm
      totalRevenue += yearlyRevenue
      totalOm += yearlyOm
      totalEnergy += yearlyEnergy

      yearlyData.push({
        year: `Y${y}`,
        revenue: Math.round(yearlyRevenue),
        om: Math.round(yearlyOm),
        netCashflow: Math.round(netCashflow),
        cumulative: Math.round(totalRevenue - totalOm),
      })
    }

    // NPV calculation
    let npv = -totalCapex
    for (let y = 1; y <= projectLife; y++) {
      const yearlyNet = yearlyData[y - 1].netCashflow
      npv += yearlyNet / Math.pow(1 + DISCOUNT_RATE, y)
    }

    const lcoe = totalCapex / (totalEnergy / ROUND_TRIP_EFF) // Levelized cost of energy
    const lcos = totalCapex / totalEnergy // Levelized cost of storage

    return {
      totalCapex,
      totalRevenue,
      totalOm,
      totalEnergy: Math.round(totalEnergy),
      npv: Math.round(npv),
      lcoe: Math.round(lcoe * 100) / 100,
      lcos: Math.round(lcos * 100) / 100,
      paybackYears: yearlyData.findIndex(y => y.cumulative >= totalCapex) + 1 || null,
      yearlyData,
    }
  }, [systemSizeMwh, cyclesPerYear, projectLife, capexPerMwh, omPerMwhYear, revenuePerMwhCycle])

  // ── Technology comparison chart ──────────────────────────────────────
  const techComparisonData = BATTERY_TECHS.map(tech => ({
    name: tech.chemistry,
    cost: tech.costPerKwh,
    cycles: tech.cycles,
    density: tech.energyDensity,
  }))

  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section ref={pdfRef} className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <Eyebrow>Grid &amp; industrial calculator</Eyebrow>
          <h1 className="mt-3 font-display text-4xl md:text-5xl font-medium text-ink tracking-tight">
            Grid-Scale BESS <InfoTooltip content="Utility-scale battery storage (typically 10 MWh to 1+ GWh) connected directly to the power grid. Used for frequency regulation, renewable energy firming (storing solar/wind for use at night), and grid stabilisation during demand spikes." />
          </h1>
          <p className="mt-4 text-lg text-ink-600 leading-relaxed">
            Work out levelized cost (LCOE and LCOS) and net present value for a utility-scale battery, compare chemistries, and read Southeast Asian grid-storage policy. The assumptions are editable.
          </p>
        </div>

        {/* LCOE and LCOS calculator */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-ink mb-4">LCOE and LCOS calculator <InfoTooltip content="LCOE (Levelized Cost of Energy) = total lifetime cost ÷ total energy input. LCOS (Levelized Cost of Storage) = total lifetime cost ÷ total energy delivered from battery. Both expressed in cost per MWh, letting you compare storage costs against other energy sources." /></h2>
          <p className="text-sm text-ink-500 mb-6">
            Calculate the levelized cost of energy (LCOE) and levelized cost of storage (LCOS) for grid-scale battery projects.
          </p>

          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">System size (MWh)</label>
              <input
                type="number"
                value={systemSizeMwh}
                onChange={(e) => setSystemSizeMwh(Number(e.target.value))}
                className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                min="10"
                max="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Cycles per year <InfoTooltip content="How many full charge-discharge cycles the battery completes each year. A grid battery doing daily arbitrage does ~365 cycles/year. One that also does frequency regulation may do 400-500. More cycles = more revenue but faster degradation." /></label>
              <input
                type="number"
                value={cyclesPerYear}
                onChange={(e) => setCyclesPerYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                min="100"
                max="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Project life (years) <InfoTooltip content="Expected operational lifetime of the grid storage project. LFP batteries typically last 15-20 years in grid service. Longer life spreads the capex over more years, reducing LCOS. Factor in augmentation (adding cells) after year 10-12." /></label>
              <input
                type="number"
                value={projectLife}
                onChange={(e) => setProjectLife(Number(e.target.value))}
                className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                min="10"
                max="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Capex per MWh</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="500000"
                  max="1500000"
                  step="50000"
                  value={capexPerMwh}
                  onChange={(e) => setCapexPerMwh(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-20 text-right">{fmtShort(capexPerMwh, country)}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Annual O&M per MWh</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10000"
                  max="50000"
                  step="5000"
                  value={omPerMwhYear}
                  onChange={(e) => setOmPerMwhYear(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-20 text-right">{fmtShort(omPerMwhYear, country)}</span>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Revenue per MWh/cycle</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={revenuePerMwhCycle}
                  onChange={(e) => setRevenuePerMwhCycle(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-16 text-right">{fmt(revenuePerMwhCycle, country)}</span>
              </div>
            </div>
          </div>

          {/* Plain-language result — the four metrics in one read */}
          <p className="mb-6 max-w-3xl text-base md:text-lg text-ink-700 leading-relaxed">
            A <span className="font-semibold text-ink">{systemSizeMwh.toLocaleString()} MWh</span> project costs about{' '}
            <span className="font-semibold text-ink">{fmtShort(lcoeResults.totalCapex, country)}</span> to build and
            delivers stored energy at <span className="font-semibold text-ink">{fmt(lcoeResults.lcos, country)}/MWh</span>.
            Over {projectLife} years its net present value is{' '}
            <span className={`font-semibold ${lcoeResults.npv >= 0 ? 'text-brand-700' : 'text-red-700'}`}>{fmtShort(lcoeResults.npv, country)}</span>
            {' '}at an 8% discount rate{lcoeResults.npv >= 0 ? ', clearing the return hurdle.' : ', short of the return hurdle.'}
          </p>

          {/* Results */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-brand-50 rounded-card p-5">
              <div className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1">LCOE <InfoTooltip content="Levelized Cost of Energy: total lifecycle cost (capex + O&M over project life) divided by total energy throughput in MWh. Think of it as: 'how much does each MWh of energy cost me to pass through this battery system?'" /></div>
              <div className="text-xl font-bold text-brand-900">{fmt(lcoeResults.lcoe, country)}/MWh</div>
              <div className="text-xs text-brand-600 mt-0.5">Levelized cost of energy</div>
            </div>
            <div className="bg-blue-50 rounded-card p-5">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">LCOS <InfoTooltip content="Levelized Cost of Storage: total lifecycle cost divided by total energy delivered (output). Unlike LCOE, LCOS accounts for round-trip efficiency losses, the energy you actually get out. Lower LCOS = cheaper storage." /></div>
              <div className="text-xl font-bold text-blue-900">{fmt(lcoeResults.lcos, country)}/MWh</div>
              <div className="text-xs text-blue-600 mt-0.5">Levelized cost of storage</div>
            </div>
            <div className="bg-paper-200 rounded-card p-5">
              <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Total capex</div>
              <div className="text-xl font-bold text-ink">{fmtShort(lcoeResults.totalCapex, country)}</div>
              <div className="text-xs text-ink-500 mt-0.5">{systemSizeMwh} MWh × {fmtShort(capexPerMwh, country)}</div>
            </div>
            <div className="bg-paper-200 rounded-card p-5">
              <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">NPV <InfoTooltip content="Net Present Value: the total project value today after discounting all future cashflows at 8% per year. Positive NPV = the project earns more than an 8% return on investment. Negative = it doesn't meet the hurdle rate." /></div>
              <div className={`text-xl font-bold ${lcoeResults.npv >= 0 ? 'text-brand-700' : 'text-red-700'}`}>
                {fmtShort(lcoeResults.npv, country)}
              </div>
              <div className="text-xs text-ink-500 mt-0.5">{DISCOUNT_RATE * 100}% discount rate</div>
            </div>
          </div>

          {/* Cashflow chart */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-ink mb-2">20-year cashflow projection</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lcoeResults.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtShort(v, country)} />
                <Tooltip formatter={(v: number) => fmt(v, country)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="om" stroke="#ef4444" strokeWidth={2} name="O&M" />
                <Line type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} name="Cumulative NPV" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Technology comparison */}
        <div className="bg-paper-100 border border-ink/10 rounded-card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-ink/5">
            <h2 className="text-lg font-semibold text-ink">Battery technology comparison <InfoTooltip content="Four main grid-scale battery chemistries compared: LFP (safest, lowest cost), NMC (higher density but pricier), Flow/Vanadium (unlimited cycles, best for 6+ hour storage), Sodium-ion (cheapest raw materials, emerging technology)." /></h2>
            <p className="text-sm text-ink-500 mt-0.5">Key specifications and use cases for grid-scale battery technologies</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-200 border-b border-ink/10">
                  <th className="text-left px-4 py-2.5 font-medium text-ink-500">Technology</th>
                  <th className="text-center px-4 py-2.5 font-medium text-ink-500">Chemistry</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Cost/kWh</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Cycles</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Energy Density</th>
                  <th className="text-left px-4 py-2.5 font-medium text-ink-500">Key Advantages</th>
                  <th className="text-left px-4 py-2.5 font-medium text-ink-500">Use Cases</th>
                </tr>
              </thead>
              <tbody>
                {BATTERY_TECHS.map((tech) => (
                  <tr key={tech.name} className="border-b border-ink/5 hover:bg-paper-200">
                    <td className="px-4 py-2.5 font-medium text-ink">{tech.name}</td>
                    <td className="text-center px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        tech.chemistry === 'LFP' ? 'bg-brand-50 text-brand-700' :
                        tech.chemistry === 'NMC' ? 'bg-blue-50 text-blue-700' :
                        tech.chemistry === 'Flow' ? 'bg-purple-50 text-purple-700' :
                        'bg-orange-50 text-orange-700'
                      }`}>{tech.chemistry}</span>
                    </td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{fmt(tech.costPerKwh, 'MY')}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{tech.cycles.toLocaleString()}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{tech.energyDensity} Wh/kg</td>
                    <td className="px-4 py-2.5 text-ink-600 text-xs">{tech.advantages.slice(0, 2).join(', ')}</td>
                    <td className="px-4 py-2.5 text-ink-600 text-xs">{tech.useCases.slice(0, 2).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost breakdown pie chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Technology cost comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v}/kWh`, 'Cost']} />
                <Bar dataKey="cost" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Cycle life comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}k`} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()} cycles`, 'Cycle life']} />
                <Bar dataKey="cycles" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grid projects table */}
        <div className="bg-paper-100 border border-ink/10 rounded-card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-ink/5">
            <h2 className="text-lg font-semibold text-ink">Global grid-scale BESS projects</h2>
            <p className="text-sm text-ink-500 mt-0.5">Major operational battery storage projects worldwide (focus on LFP chemistry)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-200 border-b border-ink/10">
                  <th className="text-left px-4 py-2.5 font-medium text-ink-500">Project</th>
                  <th className="text-center px-4 py-2.5 font-medium text-ink-500">Country</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Power</th>
                  <th className="text-right px-4 py-2.5 font-medium text-ink-500">Energy</th>
                  <th className="text-center px-4 py-2.5 font-medium text-ink-500">Chemistry</th>
                  <th className="text-center px-4 py-2.5 font-medium text-ink-500">Status</th>
                  <th className="text-center px-4 py-2.5 font-medium text-ink-500">Year</th>
                </tr>
              </thead>
              <tbody>
                {GRID_PROJECTS.map((project) => (
                  <tr key={project.name} className="border-b border-ink/5 hover:bg-paper-200">
                    <td className="px-4 py-2.5 font-medium text-ink">{project.name}</td>
                    <td className="text-center px-4 py-2.5">{project.country}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{project.capacityMw} MW</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{project.capacityMwh} MWh</td>
                    <td className="text-center px-4 py-2.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                        {project.chemistry}
                      </span>
                    </td>
                    <td className="text-center px-4 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        project.status === 'Operational' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="text-center px-4 py-2.5 tabular-nums">{project.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Policy tracker */}
        <div className="bg-paper-100 border border-ink/10 rounded-card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-ink/5">
            <h2 className="text-lg font-semibold text-ink">SEA grid storage policies</h2>
            <p className="text-sm text-ink-500 mt-0.5">Current incentives and regulatory frameworks for grid-scale battery storage</p>
          </div>
          <div className="divide-y divide-ink/5">
            {POLICIES.map((policy) => (
              <div key={`${policy.country}-${policy.policy}`} className="px-6 py-4 hover:bg-paper-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-ink">{policy.policy}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        policy.status === 'Active' ? 'bg-brand-50 text-brand-700' :
                        policy.status === 'Developing' ? 'bg-blue-50 text-blue-700' :
                        'bg-paper-200 text-ink-700'
                      }`}>
                        {policy.status}
                      </span>
                    </div>
                    <p className="text-sm text-ink-600 mb-1">{policy.description}</p>
                    <p className="text-xs text-ink-500">{policy.country} • {policy.incentive}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batch 3 — Policy Impact Simulator */}
        <PolicyImpactSimulator country={country} />

        {/* Batch 3 — Subsidy ROI Calculator */}
        <SubsidyROICalculator country={country} />

        {/* Batch 3 — BESS Deployment Map */}
        <BESSDeploymentMap country={country} />

        {/* Batch 4 — Grid Stability Analysis */}
        <GridStabilityAnalysis country={country} />

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
            options={{ filename: `battery-mom-grid-bess-${systemSizeMwh}MWh.pdf`, title: 'battery.mom, grid-scale BESS calculator', subtitle: `${COUNTRIES.find(c => c.value === country)?.label} · ${systemSizeMwh} MWh · ${projectLife}-year project` }}
            className="bg-paper-200 text-ink-700 hover:bg-paper-300"
          />
        </div>

        {/* Assumptions + CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-3">Key assumptions <InfoTooltip content="Round-trip efficiency: 85% (15% energy lost per cycle). Degradation: 2.5%/year capacity fade. Discount rate: 8% (standard utility project hurdle rate). These are conservative industry defaults." /></h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-ink-500">
              <div>Round-trip efficiency: {ROUND_TRIP_EFF * 100}%</div>
              <div>Degradation: {DEGRADATION_PER_YEAR * 100}%/year</div>
              <div>Discount rate: {DISCOUNT_RATE * 100}%</div>
              <div>Annual O&M: {ANNUAL_OM_PCT * 100}% of capex</div>
              <div>System life: {SYSTEM_LIFE} years</div>
              <div>Revenue: Arbitrage + grid services</div>
            </div>
          </div>
          <div className="bg-brand-50 border border-brand-200 rounded-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-brand-900 mb-2">Need commercial storage?</h3>
              <p className="text-sm text-brand-800">
                For smaller commercial systems (100 kW–1 MW), use our commercial BESS calculator.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link href="/bess/commercial" className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                Commercial Calculator
              </Link>
              <Link href="/bess/home" className="inline-flex items-center px-4 py-2 bg-paper-100 text-ink-800 border border-ink/15 rounded-lg hover:bg-paper-200 transition-colors text-sm font-medium">
                Home BESS
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}