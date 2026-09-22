'use client'

import { useMemo, memo } from 'react'
import type { Country } from '@/types/bess'
import InfoTooltip from '@/components/InfoTooltip'

interface GreenCertProps {
  country: Country
  solarKw: number
  batteryCapacityKwh: number
  coveragePct: number // 0-1
  co2AvoidedKg: number
  units: number
  mode: 'retrofit' | 'new'
}

interface CertResult {
  name: string
  fullName: string
  country: string
  maxPoints: number
  earnedPoints: number
  tier: string
  tierColor: string
  breakdown: { category: string; points: number; maxPoints: number; note: string }[]
}

// ── GBI (Malaysia) — Green Building Index ────────────────────────────
function calcGBI(props: GreenCertProps): CertResult {
  const { solarKw, batteryCapacityKwh, coveragePct, co2AvoidedKg } = props
  const breakdown: CertResult['breakdown'] = []
  
  // EE1: Energy Efficiency — Renewable Energy (max 15)
  const renewablePts = Math.min(15, Math.floor(solarKw / 10) * 2)
  breakdown.push({ category: 'Renewable Energy (EE1)', points: renewablePts, maxPoints: 15, note: `${Math.round(solarKw)} kW solar → 2 pts per 10 kW` })

  // EE2: Energy Management — Battery Storage (max 5)
  const storagePts = Math.min(5, batteryCapacityKwh >= 100 ? 5 : batteryCapacityKwh >= 50 ? 3 : batteryCapacityKwh >= 20 ? 2 : 0)
  breakdown.push({ category: 'Energy Storage (EE2)', points: storagePts, maxPoints: 5, note: `${Math.round(batteryCapacityKwh)} kWh storage` })

  // EE3: Reduced Grid Dependency (max 10)
  const gridPts = Math.min(10, Math.floor(coveragePct * 100 / 10))
  breakdown.push({ category: 'Grid Independence (EE3)', points: gridPts, maxPoints: 10, note: `${Math.round(coveragePct * 100)}% self-powered` })

  // SM1: Sustainable Site — Carbon Reduction (max 5)
  const carbonPts = Math.min(5, co2AvoidedKg >= 50000 ? 5 : co2AvoidedKg >= 20000 ? 3 : co2AvoidedKg >= 5000 ? 2 : 1)
  breakdown.push({ category: 'Carbon Reduction (SM1)', points: carbonPts, maxPoints: 5, note: `${(co2AvoidedKg / 1000).toFixed(1)}t CO₂/yr avoided` })

  // IN1: Innovation — Smart Energy Management (max 3)
  const innovPts = batteryCapacityKwh > 0 && solarKw > 0 ? 3 : 0
  breakdown.push({ category: 'Innovation (IN1)', points: innovPts, maxPoints: 3, note: 'Integrated solar+battery system' })

  const total = breakdown.reduce((s, b) => s + b.points, 0)
  const tier = total >= 86 ? 'Platinum' : total >= 76 ? 'Gold' : total >= 66 ? 'Silver' : total >= 50 ? 'Certified' : 'Not rated'
  const tierColor = total >= 86 ? '#1e3a5f' : total >= 76 ? '#b8860b' : total >= 66 ? '#808080' : total >= 50 ? '#059669' : '#9ca3af'

  return { name: 'GBI', fullName: 'Green Building Index (Malaysia)', country: 'MY', maxPoints: 100, earnedPoints: total, tier, tierColor, breakdown }
}

// ── BCA Green Mark (Singapore) ───────────────────────────────────────
function calcBCA(props: GreenCertProps): CertResult {
  const { solarKw, batteryCapacityKwh, coveragePct, co2AvoidedKg } = props
  const breakdown: CertResult['breakdown'] = []

  // 1. Energy Efficiency — Renewable (max 20)
  const renewPts = Math.min(20, Math.floor(solarKw / 5) * 2)
  breakdown.push({ category: 'Renewable Energy', points: renewPts, maxPoints: 20, note: `${Math.round(solarKw)} kW solar → 2 pts per 5 kW` })

  // 2. Energy Efficiency — Storage (max 10)
  const storagePts = Math.min(10, batteryCapacityKwh >= 200 ? 10 : batteryCapacityKwh >= 100 ? 7 : batteryCapacityKwh >= 50 ? 4 : 0)
  breakdown.push({ category: 'Energy Storage', points: storagePts, maxPoints: 10, note: `${Math.round(batteryCapacityKwh)} kWh battery` })

  // 3. Smart Grid Ready (max 5)
  const smartPts = batteryCapacityKwh > 0 ? 5 : 0
  breakdown.push({ category: 'Smart Grid Ready', points: smartPts, maxPoints: 5, note: batteryCapacityKwh > 0 ? 'Battery enables grid services' : 'No storage' })

  // 4. Carbon Reduction (max 10)
  const carbonPts = Math.min(10, Math.floor(co2AvoidedKg / 5000))
  breakdown.push({ category: 'Carbon Reduction', points: carbonPts, maxPoints: 10, note: `${(co2AvoidedKg / 1000).toFixed(1)}t CO₂/yr` })

  // 5. Resilience (max 5)
  const resilPts = Math.min(5, Math.floor(coveragePct * 5))
  breakdown.push({ category: 'Energy Resilience', points: resilPts, maxPoints: 5, note: `${Math.round(coveragePct * 100)}% self-powered` })

  const total = breakdown.reduce((s, b) => s + b.points, 0)
  const tier = total >= 90 ? 'Platinum' : total >= 75 ? 'GoldPLUS' : total >= 60 ? 'Gold' : total >= 50 ? 'Certified' : 'Not rated'
  const tierColor = total >= 90 ? '#1e3a5f' : total >= 75 ? '#b8860b' : total >= 60 ? '#d4a017' : total >= 50 ? '#059669' : '#9ca3af'

  return { name: 'BCA Green Mark', fullName: 'BCA Green Mark (Singapore)', country: 'SG', maxPoints: 120, earnedPoints: total, tier, tierColor, breakdown }
}

// ── LEED (International) ─────────────────────────────────────────────
function calcLEED(props: GreenCertProps): CertResult {
  const { solarKw, batteryCapacityKwh, coveragePct, co2AvoidedKg } = props
  const breakdown: CertResult['breakdown'] = []

  // EA Credit — Renewable Energy Production (max 5)
  const renewPts = Math.min(5, solarKw >= 100 ? 5 : solarKw >= 50 ? 3 : solarKw >= 20 ? 2 : solarKw >= 10 ? 1 : 0)
  breakdown.push({ category: 'EA: Renewable Energy', points: renewPts, maxPoints: 5, note: `${Math.round(solarKw)} kW on-site solar` })

  // EA Credit — Enhanced Energy Performance via storage (max 8 relevant to storage)
  const perfPts = Math.min(8, Math.floor(coveragePct * 100 / 8))
  breakdown.push({ category: 'EA: Enhanced Performance', points: perfPts, maxPoints: 18, note: `${Math.round(coveragePct * 100)}% energy offset` })

  // EA Credit — Grid Harmonization (max 2)
  const gridPts = batteryCapacityKwh >= 50 ? 2 : batteryCapacityKwh > 0 ? 1 : 0
  breakdown.push({ category: 'EA: Grid Harmonization', points: gridPts, maxPoints: 2, note: 'Demand response capable' })

  // IN Credit — Innovation (max 2 for integrated solar+storage)
  const innovPts = batteryCapacityKwh > 0 && solarKw > 20 ? 2 : batteryCapacityKwh > 0 ? 1 : 0
  breakdown.push({ category: 'IN: Innovation', points: innovPts, maxPoints: 5, note: 'Integrated solar+battery' })

  const total = breakdown.reduce((s, b) => s + b.points, 0)
  // LEED tiers are Certified(40-49), Silver(50-59), Gold(60-79), Platinum(80+) out of 110
  // We only calculate energy-related points, so we show estimated contribution
  const tier = total >= 15 ? 'Platinum contribution' : total >= 10 ? 'Gold contribution' : total >= 6 ? 'Silver contribution' : total >= 3 ? 'Certified contribution' : 'Minimal'
  const tierColor = total >= 15 ? '#1e3a5f' : total >= 10 ? '#b8860b' : total >= 6 ? '#808080' : total >= 3 ? '#059669' : '#9ca3af'

  return { name: 'LEED v4.1', fullName: 'LEED v4.1 (International)', country: 'ALL', maxPoints: 110, earnedPoints: total, tier, tierColor, breakdown }
}

function CertCard({ cert }: { cert: CertResult }) {
  const pctOfMax = Math.min(100, (cert.earnedPoints / cert.maxPoints) * 100)
  return (
    <div className="bg-paper-100 rounded-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-ink">{cert.name}</h4>
          <p className="text-[11px] text-ink-500">{cert.fullName}</p>
        </div>
        <span
          className="px-2.5 py-1 text-[11px] font-bold rounded-full"
          style={{ color: cert.tierColor, backgroundColor: `${cert.tierColor}22` }}
        >
          {cert.tier}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-1">
          <span className="text-2xl font-bold" style={{ color: cert.tierColor }}>{cert.earnedPoints}</span>
          <span className="text-xs text-ink-400">/ {cert.maxPoints} pts</span>
        </div>
        <div className="w-full bg-paper-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${pctOfMax}%`, backgroundColor: cert.tierColor }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {cert.breakdown.map((b) => (
          <div key={b.category} className="flex items-center justify-between text-xs">
            <div className="flex-1">
              <div className="font-medium text-ink-700">{b.category}</div>
              <div className="text-ink-400">{b.note}</div>
            </div>
            <div className="ml-3 text-right whitespace-nowrap">
              <span className="font-bold text-ink-800">{b.points}</span>
              <span className="text-ink-400">/{b.maxPoints}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const GreenCertEstimator = memo(function GreenCertEstimator(props: GreenCertProps) {
  const certs = useMemo(() => {
    const all = [calcGBI(props), calcBCA(props), calcLEED(props)]
    // Sort: country-relevant cert first
    const countryMap: Record<string, string> = { MY: 'GBI', SG: 'BCA Green Mark' }
    const primary = countryMap[props.country]
    if (primary) {
      all.sort((a, b) => (a.name === primary ? -1 : b.name === primary ? 1 : 0))
    }
    return all
  }, [props])

  return (
    <div className="bg-paper-200 border border-ink/10 rounded-card p-5 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            Green certification estimator
            <InfoTooltip content="Estimates how many green building certification points your solar+battery system could earn. Point values are simplified from official scoring manuals (GBI for Malaysia, BCA Green Mark for Singapore, LEED internationally). Actual certification requires full assessment by an accredited body." />
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Estimated points from your {Math.round(props.solarKw)} kW solar + {Math.round(props.batteryCapacityKwh)} kWh battery system
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {certs.map((cert) => (
          <CertCard key={cert.name} cert={cert} />
        ))}
      </div>

      <p className="mt-4 text-[11px] text-ink-400 leading-relaxed">
        * Points are indicative estimates based on simplified scoring models. Actual certification requires professional assessment.
        GBI is most relevant for Malaysia, BCA Green Mark for Singapore. LEED points shown are energy-related credits only (EA + IN categories).
      </p>
    </div>
  )
})

export default GreenCertEstimator
