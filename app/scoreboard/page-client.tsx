'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { BigPictureNav } from '@/components/ui/BigPictureNav'
import InfoTooltip from '@/components/InfoTooltip'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'
import { RESIDENTIAL_TARIFF_NOTE, RATE_VERIFIED_ON } from '@/data/rates'

// ── Types ──────────────────────────────────────────────────────

type CountryCode = 'SG' | 'MY' | 'TH' | 'ID' | 'VN' | 'PH'

interface CountryData {
  code: CountryCode
  name: string
  flag: string
  population: number
  evAdoptionRate: number
  totalEvs: number
  chargingStations: number
  chargersPerMillion: number
  solarCapacityGw: number
  bessPenetrationPct: number
  policyGrade: string
  evSalesGrowth: number
  topSellingEv: string
  electricityTariff: string
  evIncentives: string
  // Previous comparable period for trend arrows (mostly full-year 2024)
  prev: {
    evAdoptionRate: number
    totalEvs: number
    chargersPerMillion: number
    solarCapacityGw: number
    bessPenetrationPct: number
    evSalesGrowth: number
  }
  // Historical data for sparklines (2021–2025)
  historical: {
    evAdoptionRate: number[]
    totalEvs: number[]
    chargersPerMillion: number[]
    solarCapacityGw: number[]
    bessPenetrationPct: number[]
    evSalesGrowth: number[]
  }
  // Economic snapshot
  gdpPerCapita: number       // USD
  electricityCostUsd: number  // USD per kWh
  avgEvPriceUsd: number       // average EV price
  avgAnnualIncomeUsd: number  // average annual income
}

// ── Data ───────────────────────────────────────────────────────

const COUNTRIES: CountryData[] = [
  {
    code: 'TH', name: 'Thailand', flag: '🇹🇭', population: 72,
    evAdoptionRate: 19.4, totalEvs: 120301, chargingStations: 11622, chargersPerMillion: 161,
    solarCapacityGw: 6.8, bessPenetrationPct: 3.5, policyGrade: 'A', evSalesGrowth: 80,
    topSellingEv: 'BYD Dolphin', electricityTariff: '฿3.88/kWh',
    evIncentives: '฿70K-150K subsidy, excise tax cut to 2%',
    prev: { evAdoptionRate: 11.9, totalEvs: 66732, chargersPerMillion: 159, solarCapacityGw: 5.2, bessPenetrationPct: 3.0, evSalesGrowth: -9 },
    historical: {
      evAdoptionRate: [1.2, 3.5, 7.8, 11.9, 19.4],
      totalEvs: [9000, 28000, 76000, 66732, 120301],
      chargersPerMillion: [18, 54, 135, 159, 161],
      solarCapacityGw: [3.0, 3.6, 4.3, 5.2, 6.8],
      bessPenetrationPct: [0.5, 1.0, 1.8, 3.0, 3.5],
      evSalesGrowth: [180, 220, 95, -9, 80],
    },
    gdpPerCapita: 7066, electricityCostUsd: 0.12, avgEvPriceUsd: 28000, avgAnnualIncomeUsd: 8200,
  },
  {
    code: 'SG', name: 'Singapore', flag: '🇸🇬', population: 5.9,
    evAdoptionRate: 45.1, totalEvs: 23684, chargingStations: 10996, chargersPerMillion: 1864,
    solarCapacityGw: 1.5, bessPenetrationPct: 8.5, policyGrade: 'A-', evSalesGrowth: 64,
    topSellingEv: 'BYD Sealion 7', electricityTariff: 'S$0.348/kWh',
    evIncentives: '$45K ARF rebate, VES rebate up to $25K',
    prev: { evAdoptionRate: 33.6, totalEvs: 14450, chargersPerMillion: 915, solarCapacityGw: 1.1, bessPenetrationPct: 8.0, evSalesGrowth: 218 },
    historical: {
      evAdoptionRate: [5.0, 12.0, 18.0, 33.6, 45.1],
      totalEvs: [1500, 3500, 5467, 14450, 23684],
      chargersPerMillion: [280, 450, 650, 915, 1864],
      solarCapacityGw: [0.5, 0.7, 0.9, 1.1, 1.5],
      bessPenetrationPct: [2.0, 3.5, 5.0, 8.0, 8.5],
      evSalesGrowth: [90, 160, 78, 218, 64],
    },
    gdpPerCapita: 65233, electricityCostUsd: 0.27, avgEvPriceUsd: 62000, avgAnnualIncomeUsd: 58000,
  },
  {
    code: 'MY', name: 'Malaysia', flag: '🇲🇾', population: 34,
    evAdoptionRate: 3.8, totalEvs: 30848, chargingStations: 5360, chargersPerMillion: 158,
    solarCapacityGw: 3.1, bessPenetrationPct: 2.3, policyGrade: 'B+', evSalesGrowth: 109,
    topSellingEv: 'Proton e.MAS 7', electricityTariff: 'RM0.444/kWh',
    evIncentives: 'Zero import duty & excise to 2027, road tax exemption',
    prev: { evAdoptionRate: 1.8, totalEvs: 14766, chargersPerMillion: 106, solarCapacityGw: 3.1, bessPenetrationPct: 2.0, evSalesGrowth: 120 },
    historical: {
      evAdoptionRate: [0.2, 0.6, 1.3, 1.8, 3.8],
      totalEvs: [1200, 4500, 10000, 14766, 30848],
      chargersPerMillion: [8, 22, 45, 106, 158],
      solarCapacityGw: [1.4, 1.9, 2.4, 3.1, 3.1],
      bessPenetrationPct: [0.3, 0.7, 1.1, 2.0, 2.3],
      evSalesGrowth: [150, 280, 180, 120, 109],
    },
    gdpPerCapita: 12570, electricityCostUsd: 0.11, avgEvPriceUsd: 35000, avgAnnualIncomeUsd: 11500,
  },
  {
    code: 'VN', name: 'Vietnam', flag: '🇻🇳', population: 100,
    evAdoptionRate: 39.0, totalEvs: 175099, chargingStations: 150000, chargersPerMillion: 1500,
    solarCapacityGw: 19.3, bessPenetrationPct: 1.2, policyGrade: 'B', evSalesGrowth: 99,
    topSellingEv: 'VinFast VF 3', electricityTariff: '₫2,199/kWh',
    evIncentives: '50% registration fee reduction, 0% luxury tax to 2027',
    prev: { evAdoptionRate: 20.0, totalEvs: 88000, chargersPerMillion: 1000, solarCapacityGw: 18.7, bessPenetrationPct: 1.0, evSalesGrowth: 55 },
    historical: {
      evAdoptionRate: [0.05, 0.5, 3.5, 20.0, 39.0],
      totalEvs: [800, 5200, 25000, 88000, 175099],
      chargersPerMillion: [2, 80, 600, 1000, 1500],
      solarCapacityGw: [5.0, 9.5, 14.0, 18.7, 19.3],
      bessPenetrationPct: [0.1, 0.3, 0.5, 1.0, 1.2],
      evSalesGrowth: [120, 350, 95, 55, 99],
    },
    gdpPerCapita: 4163, electricityCostUsd: 0.09, avgEvPriceUsd: 22000, avgAnnualIncomeUsd: 5400,
  },
  {
    code: 'ID', name: 'Indonesia', flag: '🇮🇩', population: 278,
    evAdoptionRate: 12.9, totalEvs: 103900, chargingStations: 4655, chargersPerMillion: 17,
    solarCapacityGw: 1.5, bessPenetrationPct: 0.7, policyGrade: 'B', evSalesGrowth: 141,
    topSellingEv: 'BYD Atto 1', electricityTariff: 'Rp1,445/kWh',
    evIncentives: '2025 PPN DTP ended Dec 2025; 2026 PPN DTP announced, not confirmed in force',
    prev: { evAdoptionRate: 5.0, totalEvs: 43100, chargersPerMillion: 12, solarCapacityGw: 0.9, bessPenetrationPct: 0.5, evSalesGrowth: 190 },
    historical: {
      evAdoptionRate: [0.05, 0.2, 0.9, 5.0, 12.9],
      totalEvs: [500, 3500, 18000, 43100, 103900],
      chargersPerMillion: [1, 3, 5, 12, 17],
      solarCapacityGw: [0.5, 0.5, 0.7, 0.9, 1.5],
      bessPenetrationPct: [0.05, 0.1, 0.2, 0.5, 0.7],
      evSalesGrowth: [60, 200, 120, 190, 141],
    },
    gdpPerCapita: 4788, electricityCostUsd: 0.08, avgEvPriceUsd: 25000, avgAnnualIncomeUsd: 5100,
  },
  {
    code: 'PH', name: 'Philippines', flag: '🇵🇭', population: 117,
    evAdoptionRate: 12.0, totalEvs: 58905, chargingStations: 1110, chargersPerMillion: 9,
    solarCapacityGw: 3.9, bessPenetrationPct: 1.2, policyGrade: 'C+', evSalesGrowth: 143,
    topSellingEv: 'BYD Seagull', electricityTariff: '₱14.74/kWh',
    evIncentives: 'EVIDA Act: 0% tariff, priority registration, HOV access',
    prev: { evAdoptionRate: 5.1, totalEvs: 24294, chargersPerMillion: 5, solarCapacityGw: 3.0, bessPenetrationPct: 1.0, evSalesGrowth: 80 },
    historical: {
      evAdoptionRate: [0.2, 1.0, 2.6, 5.1, 12.0],
      totalEvs: [1165, 3636, 11584, 24294, 58905],
      chargersPerMillion: [0.5, 1, 3, 5, 9],
      solarCapacityGw: [1.0, 1.5, 2.0, 3.0, 3.9],
      bessPenetrationPct: [0.1, 0.2, 0.5, 1.0, 1.2],
      evSalesGrowth: [40, 150, 130, 80, 143],
    },
    gdpPerCapita: 3905, electricityCostUsd: 0.23, avgEvPriceUsd: 30000, avgAnnualIncomeUsd: 4500,
  },
]

const DATA_PERIOD_NOTE = 'Mostly full-year 2025. Vietnam EV share uses Ember Jan-Oct 2025 because a single public full-year national EV split is not yet available. Philippines uses the public electrified-vehicle category, which includes hybrids, until full-year BEV/PHEV-only national data is published. Charging-network counts use the latest public 2025 or early-2026 datasets where a full-year 2025 snapshot is not published.'

const SCOREBOARD_SOURCES = [
  {
    label: 'IEA Global Energy Review 2026',
    url: 'https://www.iea.org/reports/global-energy-review-2026/technology-electric-vehicles',
    note: 'Global, US, and emerging-market EV growth context.',
  },
  {
    label: 'ADB / Ember EV Leapfrog 2025',
    url: 'https://seads.adb.org/news/southeast-asia-leads-global-boom-electric-vehicle-sales',
    note: 'Comparable Jan-Oct 2025 EV sales-share estimates for Southeast Asian markets.',
  },
  {
    label: 'IRENA Renewable Capacity Statistics 2026',
    url: 'https://www.irena.org/Publications/2026/Mar/Renewable-capacity-statistics-2026',
    note: 'End-2025 solar PV capacity by country.',
  },
  {
    label: 'Singapore LTA / Business Times',
    url: 'https://www.businesstimes.com.sg/singapore/evs-made-record-45-new-car-registrations-singapore-2025/',
    note: 'Singapore 2025 EV registrations, share, and YoY growth.',
  },
  {
    label: 'Malaysia MAA / paultan.org',
    url: 'https://paultan.org/2026/01/20/maa-ev-and-hybrid-sales-2025/',
    note: 'Malaysia 2025 EV sales and YoY growth.',
  },
  {
    label: 'Thailand FTI / electrive',
    url: 'https://www.electrive.com/2026/01/29/thailand-ev-sales-jump-80-in-2025-lifting-auto-market/',
    note: 'Thailand 2025 BEV sales, share, and YoY growth.',
  },
  {
    label: 'Indonesia GAIKINDO / Databoks',
    url: 'https://databoks.katadata.co.id/en/transportation-logistics/statistics/69686c580eb08/byd-to-dominate-indonesias-electric-car-market-in-2025',
    note: 'Indonesia 2025 BEV wholesale sales and YoY growth.',
  },
  {
    label: 'Vietnam VinFast / VietnamPlus',
    url: 'https://en.vietnamplus.vn/vinfast-sets-record-with-nearly-176000-ev-deliveries-in-vietnam-in-2025-post335909.vnp',
    note: 'Vietnam 2025 VinFast domestic EV deliveries and model leaders.',
  },
  {
    label: 'Philippines EVAP/DOE and GT Capital',
    url: 'https://www.gtcapital.com.ph/storage/uploads/quarterly-reports/%5BUPLOAD%5D%20FY%202025%20Financial%20and%20Operating%20Results%20Briefing%20vF.pdf',
    note: 'Philippines 2025 electrified-vehicle market size/share.',
  },
  {
    label: 'Singapore LTA DataMall charging points',
    url: 'https://datamall.lta.gov.sg/content/datamall/en/static-data.html',
    note: 'Singapore EV charging-point dataset, downloaded from LTA DataMall.',
  },
  {
    label: 'Malaysia Energy Commission charger licences',
    url: 'https://www.marklines.com/en/news/337933',
    note: 'Malaysia licensed public EV charger count by AC/DC type as of end-November 2025.',
  },
  {
    label: 'Thailand BOI / EVAT charging network',
    url: 'https://osos.boi.go.th/EN/news/2228/Thailand-EV-Board-Adjusts-EV3-EV3-5-Terms-to-Promote-Exports-as-Investment-in-EV-Supply-Chain-Tops-137-Billion-Baht/',
    note: 'Thailand charging-station and charging-head count as of March 2025.',
  },
  {
    label: 'Indonesia PLN charging network',
    url: 'https://voi.id/en/ekonomi/557294',
    note: 'Indonesia public EV charging-station machines operated through 2025.',
  },
  {
    label: 'Vietnam V-Green charging network',
    url: 'https://en.vietnamplus.vn/v-green-to-invest-10-trillion-vnd-in-nationwide-ultra-fast-ev-charging-network-post339467.vnp',
    note: 'Vietnam V-Green/VinFast charging-port network and 2026 expansion plan.',
  },
  {
    label: 'Philippines DOE/EVAP charging points',
    url: 'https://www.carguide.ph/2025/08/the-state-of-philippine-ev-industry-as.html',
    note: 'Philippines DOE/EVAP active charging-point and port counts.',
  },
]

function SourceLinks({ labels }: { labels: string[] }) {
  const sources = SCOREBOARD_SOURCES.filter(source => labels.includes(source.label))

  return (
    <span className="block space-y-1">
      {sources.map(source => (
        <a
          key={source.label}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-medium text-brand-700 hover:text-brand-800"
        >
          {source.label}
        </a>
      ))}
    </span>
  )
}

// ── Metrics ────────────────────────────────────────────────────

const METRICS = [
  { key: 'evAdoptionRate' as const, label: 'EV/xEV Sales Share', unit: '%', desc: 'Share of new 2025 sales/registrations that were electric or electrified, using each market\'s public reporting boundary' },
  { key: 'totalEvs' as const, label: '2025 EV Sales', unit: '', desc: 'New 2025 EV sales, registrations, or deliveries from public market sources' },
  { key: 'chargersPerMillion' as const, label: 'Chargers/1M people', unit: '', desc: 'Public charging points per million population' },
  { key: 'solarCapacityGw' as const, label: 'Solar PV (GW)', unit: 'GW', desc: 'Total installed solar photovoltaic capacity' },
  { key: 'bessPenetrationPct' as const, label: 'BESS Context', unit: '%', desc: 'Indicative solar-plus-storage maturity proxy; lower-confidence than vehicle and solar registry data' },
  { key: 'evSalesGrowth' as const, label: 'EV Sales Growth', unit: '% YoY', desc: 'Year-over-year growth in each market\'s cited EV/electrified sales boundary (2024→2025)' },
]

type MetricKey = typeof METRICS[number]['key']
type SortField = MetricKey | 'name' | 'readinessScore' | 'policyGrade'
type SortDir = 'asc' | 'desc'

// ── Helpers ────────────────────────────────────────────────────

const GRADE_SCORE: Record<string, number> = {
  'A': 100, 'A-': 90, 'B+': 80, 'B': 70, 'B-': 60, 'C+': 50, 'C': 40, 'D': 20,
}

const GRADE_COLORS: Record<string, string> = {
  'A': 'bg-brand-100 text-brand-800',
  'A-': 'bg-brand-50 text-brand-700',
  'B+': 'bg-brand-50 text-brand-700',
  'B': 'bg-brand-50 text-brand-600',
  'B-': 'bg-paper-200 text-ink-700',
  'C+': 'bg-amber-100 text-amber-800',
  'C': 'bg-amber-50 text-amber-700',
  'D': 'bg-red-50 text-red-700',
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

/** Compute Country Readiness Score (0–100) */
function computeReadinessScore(country: CountryData, all: CountryData[]): number {
  const maxAdoption = Math.max(...all.map(c => c.evAdoptionRate))
  const maxChargers = Math.max(...all.map(c => c.chargersPerMillion))
  const maxGrowth = Math.max(...all.map(c => c.evSalesGrowth))
  const maxSolar = Math.max(...all.map(c => c.solarCapacityGw))
  const maxBess = Math.max(...all.map(c => c.bessPenetrationPct))

  const adoption = maxAdoption > 0 ? (country.evAdoptionRate / maxAdoption) * 100 : 0
  const chargers = maxChargers > 0 ? (country.chargersPerMillion / maxChargers) * 100 : 0
  const growth = maxGrowth > 0 ? (country.evSalesGrowth / maxGrowth) * 100 : 0
  const solar = maxSolar > 0 ? (country.solarCapacityGw / maxSolar) * 100 : 0
  const bess = maxBess > 0 ? (country.bessPenetrationPct / maxBess) * 100 : 0
  const policy = GRADE_SCORE[country.policyGrade] ?? 50

  return Math.round(
    adoption * 0.25 +
    chargers * 0.20 +
    growth * 0.20 +
    solar * 0.15 +
    bess * 0.10 +
    policy * 0.10
  )
}

// --- Chart color tokens (the SVG layer can't read Tailwind classes) ---
const CHART_BRAND = '#0E9F6E' // brand-500
const CHART_AMBER = '#E0A33C' // accent
const CHART_GRID = '#F4EEE0' // paper-200
// Categorical series for the six SEA countries — all within the ink/brand/amber
// family so the multi-line and dual-radar charts read as one palette, no rainbow.
const CHART_SERIES = ['#0E9F6E', '#0B6648', '#5DD9A6', '#E0A33C', '#828B80', '#454E44']

/** Score ring colours — a green → amber → muted readiness ramp (no alarm red) */
function getScoreColor(score: number): string {
  if (score >= 75) return '#0E9F6E' // brand-500
  if (score >= 55) return '#23C088' // brand-400
  if (score >= 35) return '#E0A33C' // accent amber
  return '#828B80' // ink-400
}

/** Trend arrow helper */
function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const delta = current - previous
  const pct = Math.round((delta / previous) * 100)
  if (Math.abs(pct) < 1) return <span className="text-[9px] text-ink-400 ml-1">→</span>
  const up = delta > 0
  return (
    <span className={`inline-flex items-center text-[9px] font-semibold ml-1 ${up ? 'text-brand-600' : 'text-red-500'}`}>
      {up ? '↑' : '↓'}{Math.abs(pct)}%
    </span>
  )
}

/** Mini score ring (SVG) */
function ScoreRing({ score, size = 52, strokeWidth = 4, medal }: { score: number; size?: number; strokeWidth?: number; medal?: 'gold' | 'silver' | 'bronze' | null }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  // Podium in brand tones, not literal gold/silver/bronze, so the ranking reads
  // as part of the same palette as the rest of the board.
  const color = medal === 'gold' ? '#0E9F6E' : medal === 'silver' ? '#A7AFA4' : medal === 'bronze' ? '#E0A33C' : getScoreColor(score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={CHART_GRID} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

// ── Historical & Benchmark Data ────────────────────────────────

const HISTORICAL_YEARS = [2021, 2022, 2023, 2024, 2025]

/** Global & regional benchmarks for context banner */
const BENCHMARKS: Record<string, { sea: number; us: number; global: number; eu: number; china: number; unit: string; label: string }> = {
  evAdoptionRate: { sea: 22, us: 10, global: 25, eu: 26, china: 50, unit: '%', label: 'EV/xEV Sales Share' },
  chargersPerMillion: { sea: 618, us: 555, global: 450, eu: 800, china: 1200, unit: '', label: 'Chargers per 1M People' },
  evSalesGrowth: { sea: 106, us: -2, global: 20, eu: 30, china: 20, unit: '% YoY', label: 'EV Sales Growth' },
}

/** Detailed metric info for deep-dive modal */
const METRIC_DETAILS: Record<MetricKey, { definition: string; methodology: string; source: string }> = {
  evAdoptionRate: {
    definition: 'The share of new 2025 sales or registrations reported as electric/electrified in each market source.',
    methodology: 'EV or xEV units ÷ total new vehicle sales/registrations × 100. BEV-only is used where public full-year data exists; Philippines is marked as xEV because its public full-year series includes hybrids.',
    source: 'LTA, MAA, FTI, GAIKINDO, VinFast/VAMA, GT Capital/CAMPI-TMA, Ember',
  },
  totalEvs: {
    definition: 'New 2025 electric/electrified vehicle sales, registrations, deliveries, or wholesale volume, depending on the source available for that market.',
    methodology: 'Uses the highest-quality public 2025 market series per country. Singapore and Thailand use registrations/sales; Indonesia uses BEV wholesale; Vietnam uses VinFast domestic deliveries; Philippines uses electrified-vehicle sales including BYD estimates.',
    source: 'National transport/industry registries and company-reported domestic delivery data',
  },
  chargersPerMillion: {
    definition: 'Number of publicly accessible EV charging points per million population, including Level 2 (AC) and DC fast chargers.',
    methodology: 'Latest public charger or charging-point count ÷ population in millions. Vietnam includes the V-Green/VinFast network, which is a materially different boundary from open multi-brand public networks.',
    source: 'LTA DataMall, Malaysia Energy Commission, Thailand EVAT/TISI, PLN, DOE/EVAP, V-Green/VinFast public reports',
  },
  solarCapacityGw: {
    definition: 'Total installed solar photovoltaic (PV) generation capacity in gigawatts, including utility-scale, commercial, and residential installations.',
    methodology: 'End-2025 solar PV capacity from IRENA Renewable Capacity Statistics 2026, rounded to one decimal place for display.',
    source: 'IRENA Renewable Capacity Statistics 2026',
  },
  bessPenetrationPct: {
    definition: 'Indicative solar-plus-storage maturity signal, not a directly comparable national registry metric.',
    methodology: 'Uses installer, utility, and market-research context where public BESS attachment data is sparse. It is kept at lower weight in the readiness score and should be read as directional.',
    source: 'BloombergNEF, utility filings, installer market reports',
  },
  evSalesGrowth: {
    definition: 'Year-over-year percentage change in the cited 2025 EV/electrified sales series.',
    methodology: '(2025 units − 2024 units) ÷ 2024 units × 100. Because countries publish different EV boundaries, this is best read as market momentum rather than a perfectly standardised BEV-only metric.',
    source: 'LTA, MAA, FTI, GAIKINDO, VinFast, GT Capital/CAMPI-TMA, IEA',
  },
}

/** Sparkline mini chart */
function Sparkline({ data, color = '#0E9F6E', width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const chartData = HISTORICAL_YEARS.map((yr, i) => ({ year: yr, value: data[i] }))
  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── 3.3 Data Freshness ────────────────────────────────────────

const DATA_UPDATED_DATE = new Date('2026-05-01T00:00:00Z')

function DataFreshnessBadge() {
  const now = new Date()
  const diffMs = now.getTime() - DATA_UPDATED_DATE.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  let label: string
  let colorClass: string
  if (diffDays <= 7) {
    label = diffDays <= 1 ? 'Updated today' : `Updated ${diffDays}d ago`
    colorClass = 'bg-brand-100 text-brand-700'
  } else if (diffDays <= 30) {
    label = `Updated ${diffDays}d ago`
    colorClass = 'bg-brand-50 text-brand-600'
  } else if (diffDays <= 60) {
    label = `Updated ${Math.floor(diffDays / 7)}w ago`
    colorClass = 'bg-amber-100 text-amber-700'
  } else {
    const months = Math.floor(diffDays / 30)
    label = `Updated ${months}mo ago`
    colorClass = 'bg-red-100 text-red-700'
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${diffDays <= 30 ? 'bg-brand-500' : diffDays <= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
      {label}
    </span>
  )
}

// ── 3.1 Animated Count-Up Hook ─────────────────────────────────

function useCountUp(target: number, duration = 800, decimals = 0) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()
          const animate = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // easeOutQuart
            const ease = 1 - Math.pow(1 - progress, 4)
            setValue(parseFloat((ease * target).toFixed(decimals)))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration, decimals])

  return { value, ref }
}

/** Animated number display */
function AnimatedNum({ value, suffix = '', decimals = 0, large = false }: { value: number; suffix?: string; decimals?: number; large?: boolean }) {
  const { value: animated, ref } = useCountUp(value, 800, decimals)
  return (
    <span ref={ref}>
      {large && animated >= 1000 ? formatNum(animated) : animated.toFixed(decimals).replace(/\.0+$/, '')}{suffix}
    </span>
  )
}

// ── 3.4 Export Helpers ─────────────────────────────────────────

function exportTableCSV(scored: (CountryData & { readinessScore: number })[]) {
  const headers = ['Country', 'Code', 'Readiness Score', 'EV/xEV Share %', '2025 EV Sales', 'Chargers/1M', 'Solar GW', 'BESS Context %', 'EV Growth %', 'Policy Grade', 'GDP/Capita', 'Electricity $/kWh', 'Avg EV Price', 'Affordability Index']
  const rows = scored.map(c => [
    c.name, c.code, c.readinessScore, c.evAdoptionRate, c.totalEvs, c.chargersPerMillion,
    c.solarCapacityGw, c.bessPenetrationPct, c.evSalesGrowth, c.policyGrade,
    c.gdpPerCapita, c.electricityCostUsd, c.avgEvPriceUsd,
    (c.avgEvPriceUsd / c.avgAnnualIncomeUsd).toFixed(1),
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'battery-mom-ev-adoption-scoreboard-data.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function handlePrint() {
  window.print()
}

// ── Component ──────────────────────────────────────────────────

export default function ScoreboardPage() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('evAdoptionRate')
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null)
  const [sortField, setSortField] = useState<SortField>('readinessScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [compareA, setCompareA] = useState<CountryCode | null>(null)
  const [compareB, setCompareB] = useState<CountryCode | null>(null)
  const [metricModal, setMetricModal] = useState<MetricKey | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const scorecardRef = useRef<HTMLDivElement>(null)

  // ── Computed scores ──────────────────────────────────────────
  const scored = useMemo(() =>
    COUNTRIES.map(c => ({ ...c, readinessScore: computeReadinessScore(c, COUNTRIES) }))
      .sort((a, b) => b.readinessScore - a.readinessScore),
  [])

  const top3 = scored.slice(0, 3)
  const metricInfo = METRICS.find(m => m.key === selectedMetric)!

  // ── Ranking by selected metric ───────────────────────────────
  const rankedByMetric = useMemo(() =>
    [...scored].sort((a, b) => (b[selectedMetric] as number) - (a[selectedMetric] as number)),
  [selectedMetric, scored])

  // ── Auto-generated headlines ─────────────────────────────────
  const headlines = useMemo(() => {
    const lines: string[] = []
    const byAdoption = [...scored].sort((a, b) => b.evAdoptionRate - a.evAdoptionRate)
    const byGrowth = [...scored].sort((a, b) => b.evSalesGrowth - a.evSalesGrowth)
    const byChargers = [...scored].sort((a, b) => b.chargersPerMillion - a.chargersPerMillion)
    const bySolar = [...scored].sort((a, b) => b.solarCapacityGw - a.solarCapacityGw)

    lines.push(`${byAdoption[0].flag} ${byAdoption[0].name} leads SEA with a ${byAdoption[0].evAdoptionRate}% EV/xEV sales share, ${(byAdoption[0].evAdoptionRate / byAdoption[byAdoption.length - 1].evAdoptionRate).toFixed(0)}× the lowest reported share.`)
    lines.push(`${byGrowth[0].flag} ${byGrowth[0].name} saw the fastest reported growth at +${byGrowth[0].evSalesGrowth}% YoY.`)

    if (byChargers[0].chargersPerMillion > byChargers[byChargers.length - 1].chargersPerMillion * 5) {
      lines.push(`${byChargers[0].flag} ${byChargers[0].name} has ${Math.round(byChargers[0].chargersPerMillion / byChargers[byChargers.length - 1].chargersPerMillion)}× more chargers per capita than ${byChargers[byChargers.length - 1].name}.`)
    }
    lines.push(`${bySolar[0].flag} ${bySolar[0].name} has ${bySolar[0].solarCapacityGw} GW of solar installed, ${(bySolar[0].solarCapacityGw / (scored.reduce((s, c) => s + c.solarCapacityGw, 0) / scored.length)).toFixed(0)}× the SEA average.`)

    // Momentum insight
    const biggestJump = [...scored].sort((a, b) => {
      const aD = a.evAdoptionRate - a.prev.evAdoptionRate
      const bD = b.evAdoptionRate - b.prev.evAdoptionRate
      return bD - aD
    })[0]
    const jump = biggestJump.evAdoptionRate - biggestJump.prev.evAdoptionRate
    if (jump > 0) {
      lines.push(`${biggestJump.flag} ${biggestJump.name} gained +${jump.toFixed(1)} percentage points in reported EV/xEV share, the biggest absolute jump in the region.`)
    }

    return lines
  }, [scored])

  // ── Sortable table ───────────────────────────────────────────
  const sortedForTable = useMemo(() => {
    const arr = [...scored]
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      if (sortField === 'name') { av = a.name; bv = b.name }
      else if (sortField === 'policyGrade') { av = GRADE_SCORE[a.policyGrade] ?? 0; bv = GRADE_SCORE[b.policyGrade] ?? 0 }
      else if (sortField === 'readinessScore') { av = a.readinessScore; bv = b.readinessScore }
      else { av = a[sortField] as number; bv = b[sortField] as number }
      if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return arr
  }, [scored, sortField, sortDir])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }, [sortField])

  // Best-in-class detection for table green highlight
  const bestValues = useMemo(() => {
    const b: Record<string, number> = {}
    for (const m of METRICS) {
      const vals = scored.map(c => c[m.key] as number)
      b[m.key] = Math.max(...vals)
    }
    b['readinessScore'] = Math.max(...scored.map(c => c.readinessScore))
    return b
  }, [scored])

  // ── Country detail radar ─────────────────────────────────────
  const radarData = selectedCountry
    ? METRICS.map(m => {
        const vals = COUNTRIES.map(c => c[m.key] as number)
        const max = Math.max(...vals)
        const country = COUNTRIES.find(c => c.code === selectedCountry)!
        return { metric: m.label, value: max > 0 ? Math.round(((country[m.key] as number) / max) * 100) : 0 }
      })
    : null

  // ── Side-by-side comparison ──────────────────────────────────
  const comparisonData = useMemo(() => {
    if (!compareA || !compareB) return null
    const a = scored.find(c => c.code === compareA)!
    const b = scored.find(c => c.code === compareB)!
    const radar = METRICS.map(m => {
      const max = Math.max(...scored.map(c => c[m.key] as number))
      return {
        metric: m.label,
        [a.name]: max > 0 ? Math.round(((a[m.key] as number) / max) * 100) : 0,
        [b.name]: max > 0 ? Math.round(((b[m.key] as number) / max) * 100) : 0,
      }
    })
    // Narrative deltas
    const narratives: string[] = []
    if (a.totalEvs !== b.totalEvs) {
      const [hi, lo] = a.totalEvs > b.totalEvs ? [a, b] : [b, a]
      narratives.push(`${hi.flag} ${hi.name} reported ${(hi.totalEvs / lo.totalEvs).toFixed(1)}× more 2025 EV/xEV sales or registrations than ${lo.name}.`)
    }
    if (a.chargersPerMillion !== b.chargersPerMillion) {
      const [hi, lo] = a.chargersPerMillion > b.chargersPerMillion ? [a, b] : [b, a]
      narratives.push(`${hi.flag} ${hi.name} has ${(hi.chargersPerMillion / lo.chargersPerMillion).toFixed(1)}× the charger density of ${lo.name}.`)
    }
    if (a.evSalesGrowth !== b.evSalesGrowth) {
      const [hi, lo] = a.evSalesGrowth > b.evSalesGrowth ? [a, b] : [b, a]
      narratives.push(`${hi.flag} ${hi.name}'s EV sales grew ${hi.evSalesGrowth - lo.evSalesGrowth} percentage points faster YoY.`)
    }
    return { a, b, radar, narratives }
  }, [compareA, compareB, scored])

  // ── Bar chart for selected metric ────────────────────────────
  const barData = rankedByMetric.map(c => ({ name: c.flag + ' ' + c.code, value: c[selectedMetric] as number }))

  // ── Metric deep-dive insight ─────────────────────────────────
  const deepDiveInsight = useMemo(() => {
    if (!metricModal) return null
    const m = METRICS.find(x => x.key === metricModal)!
    const sorted = [...scored].sort((a, b) => (b[metricModal] as number) - (a[metricModal] as number))
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    const avg = scored.reduce((s, c) => s + (c[metricModal] as number), 0) / scored.length
    const ratio = (worst[metricModal] as number) > 0 ? ((best[metricModal] as number) / (worst[metricModal] as number)).toFixed(1) : 'N/A'

    const lines: string[] = []
    lines.push(`${best.flag} ${best.name} leads the region in ${m.label.toLowerCase()} at ${typeof (best[metricModal] as number) === 'number' && (best[metricModal] as number) >= 1000 ? formatNum(best[metricModal] as number) : best[metricModal]}${m.unit ? ' ' + m.unit : ''}, which is ${ratio}× that of ${worst.name}.`)
    lines.push(`The SEA average is ${avg >= 1000 ? formatNum(avg) : avg.toFixed(1)}${m.unit ? ' ' + m.unit : ''}, suggesting significant room for improvement across the bloc.`)
    return { detail: METRIC_DETAILS[metricModal], chart: sorted, lines, metricInfo: m }
  }, [metricModal, scored])

  // ── Share country scorecard ──────────────────────────────────
  const handleShareScorecard = useCallback(async () => {
    if (!selectedCountry || !scorecardRef.current) return
    setShareLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(scorecardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) return

      // Try native share first, fall back to download
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'scorecard.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `${COUNTRIES.find(c => c.code === selectedCountry)?.name}, energy scorecard`,
          files: [new File([blob], 'scorecard.png', { type: 'image/png' })],
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `battery-mom-scorecard-${selectedCountry.toLowerCase()}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // User cancelled share or error
    } finally {
      setShareLoading(false)
    }
  }, [selectedCountry])

  // ── Render ───────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-medium text-ink tracking-tight">
            EV adoption scoreboard <InfoTooltip
              content={
                <>
                  <p>Ranks six Southeast Asian countries across 2025 EV/xEV sales share, charging infrastructure, sales growth, solar context, and policy support.</p>
                  <p>{DATA_PERIOD_NOTE}</p>
                  <SourceLinks labels={['IEA Global Energy Review 2026', 'ADB / Ember EV Leapfrog 2025', 'IRENA Renewable Capacity Statistics 2026']} />
                </>
              }
            />
          </h1>
          <p className="mt-3 text-lg text-ink-600 leading-relaxed">
            Country-by-country rankings for electric-vehicle adoption across Southeast Asia, with charging, policy, solar, and battery-storage context.
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs text-ink-400">
            <DataFreshnessBadge /> Sources: national registries, industry bodies, IEA, ADB/Ember, IRENA
          </p>
          <BigPictureNav className="mt-5" />
        </div>

        {/* ─── 1.2 Top-3 Podium ─────────────────────────────────── */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">
            EV adoption readiness ranking
            <InfoTooltip content="Composite score (0–100) combining EV/xEV sales share (25%), charger density (20%), EV sales growth (20%), solar capacity (15%), BESS context (10%), and policy grade (10%). BESS context is a lower-confidence directional metric." />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((c, i) => {
              const medal = (['gold', 'silver', 'bronze'] as const)[i]
              const medalEmoji = ['🥇', '🥈', '🥉'][i]
              const medalBorder = i === 0 ? 'border-brand-200 bg-brand-50/50' : i === 1 ? 'border-ink/15 bg-paper-200/50' : 'border-amber-300 bg-amber-50/40'
              return (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={`relative rounded-card border-2 p-5 text-left transition-all hover:shadow-lg ${medalBorder} ${selectedCountry === c.code ? 'ring-2 ring-brand-400' : ''}`}
                >
                  <div className="absolute top-3 right-3 text-2xl">{medalEmoji}</div>
                  <div className="flex items-center gap-4">
                    <ScoreRing score={c.readinessScore} size={64} strokeWidth={5} medal={medal} />
                    <div>
                      <div className="text-2xl mb-0.5">{c.flag}</div>
                      <div className="text-lg font-bold text-ink">{c.name}</div>
                      <div className="text-xs text-ink-500 mt-0.5">
                        {c.evAdoptionRate}% EV/xEV · +{c.evSalesGrowth}% growth
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-ink/10 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs font-bold text-ink"><AnimatedNum value={c.evAdoptionRate} suffix="%" decimals={1} /></div>
                      <div className="text-[9px] text-ink-400">EV/xEV %</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink"><AnimatedNum value={c.chargersPerMillion} /></div>
                      <div className="text-[9px] text-ink-400">Chrg/1M</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink"><AnimatedNum value={c.solarCapacityGw} suffix="" decimals={1} /></div>
                      <div className="text-[9px] text-ink-400">Solar GW</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          {/* Remaining countries mini row */}
          <div className="mt-3 flex flex-wrap gap-2">
            {scored.slice(3).map((c, i) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left ${selectedCountry === c.code ? 'bg-brand-50 shadow-card' : 'bg-paper-100 hover:bg-paper-200'}`}
              >
                <span className="text-xs font-medium text-ink-400">#{i + 4}</span>
                <ScoreRing score={c.readinessScore} size={32} strokeWidth={3} />
                <div>
                  <div className="text-sm font-semibold text-ink-700">{c.flag} {c.name}</div>
                  <div className="text-[10px] text-ink-400">{c.evAdoptionRate}% EV/xEV</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ─── 1.4 Auto-Generated Headlines ─────────────────────── */}
        <div className="mb-10 bg-ink rounded-card p-6 text-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-300 mb-3">Key headlines</h3>
          <ul className="space-y-2">
            {headlines.map((line, i) => (
              <li key={i} className="text-sm text-paper-300 leading-relaxed flex gap-2">
                <span className="text-brand-300 font-bold shrink-0">•</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* ─── 2.2 Regional Context Banner ──────────────────────── */}
        <div className="mb-10 bg-paper-200 rounded-card p-6">
          <h3 className="text-sm font-semibold text-ink mb-1">
            How does Southeast Asia compare?
            <InfoTooltip
              content={
                <>
                  <p>SEA average is the simple average of the six countries tracked. Global and major-market context comes from IEA 2026 and Ember 2025 reporting.</p>
                  <SourceLinks labels={['IEA Global Energy Review 2026', 'ADB / Ember EV Leapfrog 2025']} />
                </>
              }
            />
          </h3>
          <p className="text-xs text-ink-500 mb-5">SEA average vs US and regional benchmarks for three key metrics.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(BENCHMARKS).map(([key, bm]) => {
              const max = Math.max(bm.sea, bm.us, bm.global, bm.eu, bm.china)
              const entries = [
                { label: 'SEA', value: bm.sea, color: 'bg-brand-500', text: 'text-brand-700' },
                { label: 'US', value: bm.us, color: 'bg-ink-600', text: 'text-ink-700' },
                { label: 'Global', value: bm.global, color: 'bg-ink-300', text: 'text-ink-600' },
                { label: 'EU', value: bm.eu, color: 'bg-ink-400', text: 'text-ink-500' },
                { label: 'China', value: bm.china, color: 'bg-amber-500', text: 'text-amber-700' },
              ]
              return (
                <div key={key} className="bg-paper-100 rounded-lg p-4 shadow-sm">
                  <div className="text-xs font-semibold text-ink-700 mb-3">{bm.label}</div>
                  <div className="space-y-2">
                    {entries.map(e => (
                      <div key={e.label} className="flex items-center gap-2">
                        <span className={`text-[10px] w-10 font-medium ${e.text}`}>{e.label}</span>
                        <div className="flex-1 h-2.5 bg-paper-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${e.color} transition-all duration-500`}
                            style={{ width: `${max > 0 ? (e.value / max) * 100 : 0}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums ${e.text} w-14 text-right`}>
                          {e.value >= 1000 ? formatNum(e.value) : e.value}{bm.unit ? bm.unit : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  {bm.sea < bm.global && (
                    <p className="text-[10px] text-amber-600 mt-2">
                      SEA is {((bm.global - bm.sea) / bm.global * 100).toFixed(0)}% below the global average
                    </p>
                  )}
                  {bm.sea > bm.global && (
                    <p className="text-[10px] text-brand-600 mt-2">
                      SEA outpaces the global average by {((bm.sea - bm.global) / bm.global * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Metric selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {METRICS.map(m => (
            <div key={m.key} className="flex items-center">
              <button
                onClick={() => setSelectedMetric(m.key)}
                className={`px-3 py-1.5 rounded-l-lg text-sm font-medium transition-colors ${
                  selectedMetric === m.key ? 'bg-brand-600 text-white' : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
                }`}
              >
                {m.label}
              </button>
              <button
                onClick={() => setMetricModal(m.key)}
                className={`px-1.5 py-1.5 rounded-r-lg text-xs transition-colors border-l ${
                  selectedMetric === m.key ? 'bg-brand-700 text-brand-200 border-brand-500 hover:bg-brand-800' : 'bg-paper-200 text-ink-400 border-ink/10 hover:bg-paper-200 hover:text-ink-600'
                }`}
                title={`Deep dive: ${m.label}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Ranking Table + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Ranking table with trend arrows */}
          <div className="bg-paper-100 border border-ink/10 rounded-card overflow-hidden">
            <div className="px-6 py-4 border-b border-ink/5">
              <h3 className="text-sm font-semibold text-ink">{metricInfo.label}</h3>
              <p className="text-xs text-ink-500 mt-0.5">{metricInfo.desc}</p>
            </div>
            <div className="divide-y divide-ink/5">
              {rankedByMetric.map((c, i) => {
                const value = c[selectedMetric] as number
                const max = rankedByMetric[0][selectedMetric] as number
                const pct = max > 0 ? (value / max) * 100 : 0
                const prev = c.prev[selectedMetric as keyof CountryData['prev']] as number | undefined
                return (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountry(c.code)}
                    className={`w-full flex items-center gap-4 px-6 py-3 text-left hover:bg-paper-200 transition-colors ${selectedCountry === c.code ? 'bg-brand-50' : ''}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-brand-100 text-brand-700' : i === 1 ? 'bg-paper-200 text-ink-700' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-paper-200 text-ink-500'
                    }`}>{i + 1}</span>
                    <span className="text-xl">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink">{c.name}</div>
                      <div className="relative h-1.5 bg-paper-200 rounded-full mt-1">
                        <div className="absolute inset-y-0 left-0 bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-ink tabular-nums flex items-center">
                      {typeof value === 'number' && value >= 1000 ? formatNum(value) : value}
                      {metricInfo.unit ? <span className="text-xs text-ink-400 ml-0.5">{metricInfo.unit}</span> : null}
                      {prev !== undefined && <TrendBadge current={value} previous={prev} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bar chart */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">{metricInfo.label} by country</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                <ChartHoverTooltip formatter={(v: number) => `${typeof v === 'number' && v >= 1000 ? formatNum(v) : v} ${metricInfo.unit}`} />
                <Bar dataKey="value" fill={CHART_BRAND} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Country detail */}
        {selectedCountry && (() => {
          const c = scored.find(x => x.code === selectedCountry)!
          const affordabilityIndex = (c.avgEvPriceUsd / c.avgAnnualIncomeUsd).toFixed(1)
          return (
            <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-10">
              {/* Header with share button */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{c.flag}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-ink">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[c.policyGrade] || 'bg-paper-200 text-ink-600'}`}>
                      Policy grade: {c.policyGrade}
                    </span>
                    <span className="text-xs text-ink-400">Readiness: {c.readinessScore}/100</span>
                  </div>
                </div>
                <button
                  onClick={handleShareScorecard}
                  disabled={shareLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-paper-200 text-ink-700 hover:bg-paper-300 transition-colors disabled:opacity-50"
                  title="Download country scorecard as PNG"
                >
                  {shareLoading ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  )}
                  Share
                </button>
                <ScoreRing score={c.readinessScore} size={56} strokeWidth={4} />
              </div>

              {/* ── Scorecard capture area ── */}
              <div ref={scorecardRef}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Stats with sparklines */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-paper-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">EV/xEV share <InfoTooltip
                          content={
                            <>
                              <p>Share of 2025 new sales or registrations reported as electric or electrified. BEV-only is used where full-year public data exists; Philippines uses the broader xEV category.</p>
                              <p>{DATA_PERIOD_NOTE}</p>
                            </>
                          }
                        /></div>
                        <Sparkline data={c.historical.evAdoptionRate} />
                      </div>
                      <div className="text-2xl font-bold text-ink mt-1 flex items-center">
                        {c.evAdoptionRate}%
                        <TrendBadge current={c.evAdoptionRate} previous={c.prev.evAdoptionRate} />
                      </div>
                      <div className="text-xs text-ink-500">of 2025 new sales</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">2025 EV sales</div>
                        <Sparkline data={c.historical.totalEvs} color="#0E9F6E" />
                      </div>
                      <div className="text-2xl font-bold text-ink mt-1 flex items-center">
                        {formatNum(c.totalEvs)}
                        <TrendBadge current={c.totalEvs} previous={c.prev.totalEvs} />
                      </div>
                      <div className="text-xs text-ink-500">sales / registrations</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Charger density <InfoTooltip
                          content={
                            <>
                              <p>Charging points per million people. Network definitions differ by country; Vietnam includes V-Green/VinFast points, while Singapore uses the LTA DataMall charger-point dataset.</p>
                              <SourceLinks labels={[
                                'Singapore LTA DataMall charging points',
                                'Malaysia Energy Commission charger licences',
                                'Thailand BOI / EVAT charging network',
                                'Indonesia PLN charging network',
                                'Vietnam V-Green charging network',
                                'Philippines DOE/EVAP charging points',
                              ]} />
                            </>
                          }
                        /></div>
                        <Sparkline data={c.historical.chargersPerMillion} color="#0E9F6E" />
                      </div>
                      <div className="text-2xl font-bold text-ink mt-1 flex items-center">
                        {c.chargersPerMillion}
                        <TrendBadge current={c.chargersPerMillion} previous={c.prev.chargersPerMillion} />
                      </div>
                      <div className="text-xs text-ink-500">per million people</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Solar capacity</div>
                        <Sparkline data={c.historical.solarCapacityGw} color="#0E9F6E" />
                      </div>
                      <div className="text-2xl font-bold text-ink mt-1 flex items-center">
                        {c.solarCapacityGw} GW
                        <TrendBadge current={c.solarCapacityGw} previous={c.prev.solarCapacityGw} />
                      </div>
                      <div className="text-xs text-ink-500">installed PV</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">EV growth <InfoTooltip content="Year-over-year change from 2024 to 2025 in each market's cited EV/electrified sales boundary." /></div>
                        <Sparkline data={c.historical.evSalesGrowth} color="#0E9F6E" />
                      </div>
                      <div className="text-2xl font-bold text-brand-700 mt-1">+{c.evSalesGrowth}%</div>
                      <div className="text-xs text-ink-500">YoY 2024→2025</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Top seller</div>
                      <div className="text-lg font-bold text-ink mt-1">{c.topSellingEv}</div>
                      <div className="text-xs text-ink-500">reported EV leader</div>
                    </div>
                  </div>
                  {radarData && (
                    <div>
                      <h4 className="text-sm font-semibold text-ink-700 mb-2">Relative performance (vs SEA peers) <InfoTooltip content="Each metric normalised to the best-performing SEA country (= 100%)." /></h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name={c.name} dataKey="value" stroke={CHART_BRAND} fill={CHART_BRAND} fillOpacity={0.2} strokeWidth={2} />
                          <ChartHoverTooltip formatter={(value: number) => [`${value}`, 'Index']} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* ─── 2.5 Economic Snapshot ──────────────────────────── */}
                <div className="mt-6 pt-5 border-t border-ink/5">
                  <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">
                    Economic context
                    <InfoTooltip content="Economic indicators that affect EV adoption feasibility. Affordability Index = average EV price ÷ average annual income (lower = more affordable)." />
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-brand-50/60 rounded-lg p-3">
                      <div className="text-[10px] font-medium text-brand-600 uppercase">GDP per capita</div>
                      <div className="text-lg font-bold text-ink mt-0.5">${c.gdpPerCapita.toLocaleString()}</div>
                    </div>
                    <div className="bg-amber-50/60 rounded-lg p-3">
                      <div className="text-[10px] font-medium text-amber-600 uppercase">Electricity cost <InfoTooltip content={`${RESIDENTIAL_TARIFF_NOTE[c.code]} Last verified ${RATE_VERIFIED_ON}.`} /></div>
                      <div className="text-lg font-bold text-ink mt-0.5">${c.electricityCostUsd}/kWh</div>
                      <div className="text-[10px] text-ink-400">{c.electricityTariff}</div>
                    </div>
                    <div className="bg-paper-200 rounded-lg p-3">
                      <div className="text-[10px] font-medium text-ink-500 uppercase">Avg EV Price</div>
                      <div className="text-lg font-bold text-ink mt-0.5">${c.avgEvPriceUsd.toLocaleString()}</div>
                    </div>
                    <div className={`rounded-lg p-3 ${parseFloat(affordabilityIndex) <= 2 ? 'bg-brand-50/60' : parseFloat(affordabilityIndex) <= 4 ? 'bg-amber-50/60' : 'bg-red-50/60'}`}>
                      <div className={`text-[10px] font-medium uppercase ${parseFloat(affordabilityIndex) <= 2 ? 'text-brand-600' : parseFloat(affordabilityIndex) <= 4 ? 'text-amber-600' : 'text-red-600'}`}>
                        Affordability Index
                      </div>
                      <div className="text-lg font-bold text-ink mt-0.5">{affordabilityIndex}×</div>
                      <div className="text-[10px] text-ink-400">
                        {parseFloat(affordabilityIndex) <= 2 ? 'Affordable' : parseFloat(affordabilityIndex) <= 4 ? 'Moderate' : 'Expensive'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tariff & Incentives */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-ink/5">
                  <div>
                    <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1 inline-flex items-center gap-1">
                      Key EV incentives
                      {c.code === 'ID' && (
                        <InfoTooltip content="PMK 12/2025 PPN DTP for qualifying BEVs ran through December 2025. Ministers announced a 2026 PPN DTP of 40–100% (NMC vs other chemistries) for mid-2026; as of 21 Sep 2026 no replacement gazette was confirmed in force. The old Rp80 million cash-subsidy talking point is not current." />
                      )}
                    </div>
                    <div className="text-sm text-ink-700">{c.evIncentives}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Avg. annual income</div>
                    <div className="text-sm text-ink-700">${c.avgAnnualIncomeUsd.toLocaleString()}</div>
                  </div>
                </div>

                {/* battery.mom branding for share image */}
                <div className="mt-4 pt-3 border-t border-ink/5 flex items-center justify-between">
                  <span className="text-[10px] text-paper-300">battery.mom · Southeast Asia EV adoption scoreboard</span>
                  <span className="text-[10px] text-paper-300">Data: national registries, industry bodies, IEA, Ember, IRENA</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ─── 1.5 Sortable At-a-Glance Table + 3.2 Mobile Cards + 3.4 Export ── */}
        <div className="bg-paper-100 border border-ink/10 rounded-card mb-10 print:border-0 print:shadow-none">
          <div className="px-6 py-4 border-b border-ink/5 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-ink">At a glance</h3>
              <p className="text-[10px] text-ink-400 mt-0.5 hidden md:block">Click column headers to sort · Green = best in class</p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => exportTableCSV(scored)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-ink-600 bg-paper-200 rounded-lg hover:bg-paper-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                CSV
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-ink-600 bg-paper-200 rounded-lg hover:bg-paper-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print
              </button>
            </div>
          </div>

          {/* ── 3.2 Mobile Card View (below md) ── */}
          <div className="md:hidden divide-y divide-ink/5">
            {sortedForTable.map(c => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`w-full p-4 text-left transition-colors ${selectedCountry === c.code ? 'bg-brand-50' : 'hover:bg-paper-200'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-sm font-bold text-ink">{c.name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${GRADE_COLORS[c.policyGrade] || 'bg-paper-200 text-ink-600'}`}>{c.policyGrade}</span>
                  </div>
                  <ScoreRing score={c.readinessScore} size={36} strokeWidth={3} />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <div className={`text-xs font-semibold tabular-nums ${c.evAdoptionRate === bestValues['evAdoptionRate'] ? 'text-brand-700' : 'text-ink'}`}>
                      {c.evAdoptionRate}%
                    </div>
                    <div className="text-[9px] text-ink-400">EV/xEV %</div>
                  </div>
                  <div>
                    <div className={`text-xs font-semibold tabular-nums ${c.totalEvs === bestValues['totalEvs'] ? 'text-brand-700' : 'text-ink'}`}>
                      {formatNum(c.totalEvs)}
                    </div>
                    <div className="text-[9px] text-ink-400">Sales</div>
                  </div>
                  <div>
                    <div className={`text-xs font-semibold tabular-nums ${c.chargersPerMillion === bestValues['chargersPerMillion'] ? 'text-brand-700' : 'text-ink'}`}>
                      {c.chargersPerMillion}
                    </div>
                    <div className="text-[9px] text-ink-400">Chrg/1M</div>
                  </div>
                  <div>
                    <div className={`text-xs font-semibold tabular-nums ${c.evSalesGrowth === bestValues['evSalesGrowth'] ? 'text-brand-700' : 'text-ink'}`}>
                      +{c.evSalesGrowth}%
                    </div>
                    <div className="text-[9px] text-ink-400">Growth</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Desktop Table (md+) ── */}
          <div className="hidden md:block overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper-200 border-b border-ink/10">
                  {[
                    { f: 'name' as SortField, label: 'Country' },
                    { f: 'readinessScore' as SortField, label: 'Score' },
                    { f: 'evAdoptionRate' as SortField, label: 'EV/xEV %' },
                    { f: 'totalEvs' as SortField, label: '2025 EV sales' },
                    { f: 'chargersPerMillion' as SortField, label: 'Chrg/1M' },
                    { f: 'solarCapacityGw' as SortField, label: 'Solar GW' },
                    { f: 'evSalesGrowth' as SortField, label: 'Growth %' },
                    { f: 'policyGrade' as SortField, label: 'Policy' },
                  ].map(col => (
                    <th
                      key={col.f}
                      onClick={() => handleSort(col.f)}
                      className={`px-4 py-2.5 font-medium cursor-pointer hover:bg-paper-200 transition-colors select-none ${col.f === 'name' ? 'text-left' : 'text-right'} ${sortField === col.f ? 'text-brand-700' : 'text-ink-500'}`}
                    >
                      {col.label}
                      {sortField === col.f && <span className="ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedForTable.map(c => (
                  <tr key={c.code} className="border-b border-ink/5 hover:bg-paper-200 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-ink">
                      <span className="mr-2">{c.flag}</span>{c.name}
                    </td>
                    <td className={`text-right px-4 py-2.5 tabular-nums font-semibold ${c.readinessScore === bestValues['readinessScore'] ? 'text-brand-700 bg-brand-50' : ''}`}>
                      {c.readinessScore}
                    </td>
                    <td className={`text-right px-4 py-2.5 tabular-nums ${c.evAdoptionRate === bestValues['evAdoptionRate'] ? 'text-brand-700 bg-brand-50 font-semibold' : ''}`}>
                      {c.evAdoptionRate}%
                      <TrendBadge current={c.evAdoptionRate} previous={c.prev.evAdoptionRate} />
                    </td>
                    <td className={`text-right px-4 py-2.5 tabular-nums ${c.totalEvs === bestValues['totalEvs'] ? 'text-brand-700 bg-brand-50 font-semibold' : ''}`}>
                      {formatNum(c.totalEvs)}
                    </td>
                    <td className={`text-right px-4 py-2.5 tabular-nums ${c.chargersPerMillion === bestValues['chargersPerMillion'] ? 'text-brand-700 bg-brand-50 font-semibold' : ''}`}>
                      {c.chargersPerMillion}
                    </td>
                    <td className={`text-right px-4 py-2.5 tabular-nums ${c.solarCapacityGw === bestValues['solarCapacityGw'] ? 'text-brand-700 bg-brand-50 font-semibold' : ''}`}>
                      {c.solarCapacityGw}
                    </td>
                    <td className={`text-right px-4 py-2.5 tabular-nums ${c.evSalesGrowth === bestValues['evSalesGrowth'] ? 'text-brand-700 bg-brand-50 font-semibold' : ''}`}>
                      +{c.evSalesGrowth}%
                    </td>
                    <td className="text-center px-4 py-2.5">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${GRADE_COLORS[c.policyGrade] || 'bg-paper-200 text-ink-600'}`}>
                        {c.policyGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── 1.6 Side-by-Side Country Comparison ──────────────── */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-10">
          <h3 className="text-sm font-semibold text-ink mb-4">Compare two countries</h3>
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-xs text-ink-500 mb-1">Country A</label>
              <select
                value={compareA ?? ''}
                onChange={e => setCompareA(e.target.value as CountryCode || null)}
                className="px-3 py-1.5 rounded-lg text-sm bg-paper-200 font-medium text-ink shadow-sm"
              >
                <option value="">Select…</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1 text-ink-400 font-bold">vs</div>
            <div>
              <label className="block text-xs text-ink-500 mb-1">Country B</label>
              <select
                value={compareB ?? ''}
                onChange={e => setCompareB(e.target.value as CountryCode || null)}
                className="px-3 py-1.5 rounded-lg text-sm bg-paper-200 font-medium text-ink shadow-sm"
              >
                <option value="">Select…</option>
                {COUNTRIES.filter(c => c.code !== compareA).map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
          </div>

          {comparisonData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Dual radar */}
              <div>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={comparisonData.radar}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name={comparisonData.a.name} dataKey={comparisonData.a.name} stroke={CHART_BRAND} fill={CHART_BRAND} fillOpacity={0.15} strokeWidth={2} />
                    <Radar name={comparisonData.b.name} dataKey={comparisonData.b.name} stroke={CHART_AMBER} fill={CHART_AMBER} fillOpacity={0.15} strokeWidth={2} />
                    <Legend />
                    <ChartHoverTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Delta table + narratives */}
              <div>
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b border-ink/10">
                      <th className="text-left py-2 text-ink-500 font-medium">Metric</th>
                      <th className="text-right py-2 text-brand-700 font-medium">{comparisonData.a.flag} {comparisonData.a.name}</th>
                      <th className="text-right py-2 text-amber-700 font-medium">{comparisonData.b.flag} {comparisonData.b.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map(m => {
                      const av = comparisonData.a[m.key] as number
                      const bv = comparisonData.b[m.key] as number
                      const aWins = av > bv
                      return (
                        <tr key={m.key} className="border-b border-ink/5">
                          <td className="py-2 text-ink-700">{m.label}</td>
                          <td className={`text-right py-2 tabular-nums ${aWins ? 'font-semibold text-brand-700' : 'text-ink-500'}`}>
                            {typeof av === 'number' && av >= 1000 ? formatNum(av) : av}{m.unit ? ` ${m.unit}` : ''}
                          </td>
                          <td className={`text-right py-2 tabular-nums ${!aWins ? 'font-semibold text-amber-700' : 'text-ink-500'}`}>
                            {typeof bv === 'number' && bv >= 1000 ? formatNum(bv) : bv}{m.unit ? ` ${m.unit}` : ''}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="border-t-2 border-ink/10">
                      <td className="py-2 font-semibold text-ink">Readiness Score</td>
                      <td className={`text-right py-2 font-bold tabular-nums ${comparisonData.a.readinessScore >= comparisonData.b.readinessScore ? 'text-brand-700' : 'text-ink-500'}`}>{comparisonData.a.readinessScore}</td>
                      <td className={`text-right py-2 font-bold tabular-nums ${comparisonData.b.readinessScore >= comparisonData.a.readinessScore ? 'text-amber-700' : 'text-ink-500'}`}>{comparisonData.b.readinessScore}</td>
                    </tr>
                  </tbody>
                </table>

                {comparisonData.narratives.length > 0 && (
                  <div className="bg-brand-50 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-ink mb-2">Comparison insights</h4>
                    <ul className="space-y-1.5 text-xs text-ink-600">
                      {comparisonData.narratives.map((n, i) => <li key={i}>• {n}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {!comparisonData && (
            <p className="text-sm text-ink-400 text-center py-8">Select two countries above to see a side-by-side comparison.</p>
          )}
        </div>

        {/* Sources & CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-paper-200 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-3">Data sources</h3>
            <ul className="text-xs text-ink-500 space-y-2">
              {SCOREBOARD_SOURCES.map(source => (
                <li key={source.label}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:text-brand-800">
                    {source.label}
                  </a>
                  <span className="text-ink-400">. {source.note}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-400 mt-3">
              {DATA_PERIOD_NOTE} Values are rounded for display and verified against public source material on 1 May 2026.
            </p>
          </div>
          <div className="bg-brand-50 border border-brand-200 rounded-card p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-brand-900 mb-2">Explore the tools</h3>
              <p className="text-sm text-brand-800">
                Use our calculators to see what these numbers mean for your own energy costs and EV savings.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link href="/ev" className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                Compare EVs
              </Link>
              <Link href="/calculators" className="inline-flex items-center px-4 py-2 bg-paper-100 text-ink-700 border border-ink/15 rounded-lg hover:bg-paper-200 transition-colors text-sm font-medium">
                Calculators
              </Link>
            </div>
          </div>
        </div>

        {/* ─── 2.4 Metric Deep-Dive Modal ───────────────────────── */}
        {metricModal && deepDiveInsight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setMetricModal(null)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative bg-paper-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button onClick={() => setMetricModal(null)} className="absolute top-4 right-4 text-ink-400 hover:text-ink-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <h3 className="text-lg font-bold text-ink mb-1">{deepDiveInsight.metricInfo.label}</h3>
              <p className="text-xs text-ink-400 mb-5">{deepDiveInsight.metricInfo.desc}</p>

              {/* Definition, Methodology, Source */}
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Definition</h4>
                  <p className="text-sm text-ink-700">{deepDiveInsight.detail.definition}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">How it&apos;s calculated</h4>
                  <p className="text-sm text-ink-700">{deepDiveInsight.detail.methodology}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Data source</h4>
                  <p className="text-sm text-ink-500">{deepDiveInsight.detail.source}</p>
                </div>
              </div>

              {/* All-6-countries bar chart */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">All countries comparison</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deepDiveInsight.chart.map(c => ({
                    name: `${c.flag} ${c.code}`,
                    value: c[metricModal] as number,
                  }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                    <ChartHoverTooltip formatter={(v: number) => `${v >= 1000 ? formatNum(v) : v} ${deepDiveInsight.metricInfo.unit}`} />
                    <Bar dataKey="value" fill={CHART_AMBER} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Historical trend for this metric */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Historical trend (2021–2025)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={HISTORICAL_YEARS.map((yr, i) => {
                    const point: Record<string, string | number> = { year: yr.toString() }
                    COUNTRIES.forEach(c => { point[c.name] = c.historical[metricModal][i] })
                    return point
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartHoverTooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {COUNTRIES.map((c, i) => {
                      const colors = CHART_SERIES
                      return (
                        <Area
                          key={c.code}
                          type="monotone"
                          dataKey={c.name}
                          stroke={colors[i]}
                          fill={colors[i]}
                          fillOpacity={0.08}
                          strokeWidth={1.5}
                        />
                      )
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Auto-generated insight */}
              <div className="bg-brand-50 rounded-lg p-4">
                <h4 className="text-xs font-bold text-ink mb-2">Key insights</h4>
                <ul className="space-y-1.5 text-xs text-ink-600">
                  {deepDiveInsight.lines.map((line, i) => <li key={i}>• {line}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
