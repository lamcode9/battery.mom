'use client'

import { useMemo } from 'react'
import { Vehicle } from '@/types/vehicle'
import { CURRENCY_SYMBOLS, formatCompact } from '@/lib/constants'
import { RESIDENTIAL_TARIFF } from '@/data/rates'

/* ── Types ─────────────────────────────────────────────────── */

interface InsightCard {
  icon: string
  title: string
  body: string
  highlight?: string
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'indigo'
}

const CARD_STYLES: Record<string, { bg: string; border: string; iconBg: string; title: string; body: string; highlight: string }> = {
  emerald:  { bg: 'bg-brand-50/80', border: 'border-brand-200', iconBg: 'bg-brand-100', title: 'text-brand-900', body: 'text-brand-700', highlight: 'text-brand-800 bg-brand-100' },
  blue:     { bg: 'bg-blue-50/80',    border: 'border-blue-200',    iconBg: 'bg-blue-100',    title: 'text-blue-900',    body: 'text-blue-700',    highlight: 'text-blue-800 bg-blue-100' },
  amber:    { bg: 'bg-amber-50/80',   border: 'border-amber-200',   iconBg: 'bg-amber-100',   title: 'text-amber-900',   body: 'text-amber-700',   highlight: 'text-amber-800 bg-amber-100' },
  purple:   { bg: 'bg-purple-50/80',  border: 'border-purple-200',  iconBg: 'bg-purple-100',  title: 'text-purple-900',  body: 'text-purple-700',  highlight: 'text-purple-800 bg-purple-100' },
  rose:     { bg: 'bg-rose-50/80',    border: 'border-rose-200',    iconBg: 'bg-rose-100',    title: 'text-rose-900',    body: 'text-rose-700',    highlight: 'text-rose-800 bg-rose-100' },
  indigo:   { bg: 'bg-indigo-50/80',  border: 'border-indigo-200',  iconBg: 'bg-indigo-100',  title: 'text-indigo-900',  body: 'text-indigo-700',  highlight: 'text-indigo-800 bg-indigo-100' },
}

function getLabel(v: Vehicle) {
  return v.modelTrim ? `${v.name} ${v.modelTrim}` : v.name
}

interface Props {
  vehicles: Vehicle[]
  country: string
}

export default function SmartInsightsCards({ vehicles, country }: Props) {
  const sym = CURRENCY_SYMBOLS[country] ?? ''
  const tariff = (RESIDENTIAL_TARIFF as Record<string, number>)[country] ?? 0.30

  const cards = useMemo((): InsightCard[] => {
    if (vehicles.length < 2) return []
    const result: InsightCard[] = []

    /* ── 1. Range champion ──────────────────────────────── */
    const withRange = vehicles.filter(v => v.rangeKm != null)
    if (withRange.length >= 2) {
      const sorted = [...withRange].sort((a, b) => (b.rangeKm ?? 0) - (a.rangeKm ?? 0))
      const best = sorted[0]
      const worst = sorted[sorted.length - 1]
      const diff = (best.rangeKm ?? 0) - (worst.rangeKm ?? 0)
      result.push({
        icon: '🏁',
        title: 'Range Champion',
        body: `${getLabel(best)} leads with ${best.rangeKm} km range, ${diff} km more than ${getLabel(worst)} (${worst.rangeKm} km).`,
        highlight: `+${diff} km`,
        color: 'emerald',
      })
    }

    /* ── 2. Efficiency winner ──────────────────────────── */
    const withEff = vehicles.filter(v => v.efficiencyKwhPer100km != null)
    if (withEff.length >= 2) {
      const sorted = [...withEff].sort((a, b) => (a.efficiencyKwhPer100km ?? 99) - (b.efficiencyKwhPer100km ?? 99))
      const best = sorted[0]
      const pctSaving = withEff.length >= 2
        ? Math.round(((sorted[sorted.length - 1].efficiencyKwhPer100km ?? 20) - (best.efficiencyKwhPer100km ?? 20)) / (sorted[sorted.length - 1].efficiencyKwhPer100km ?? 20) * 100)
        : 0
      result.push({
        icon: '⚡',
        title: 'Most Efficient',
        body: `${getLabel(best)} uses only ${best.efficiencyKwhPer100km} kWh/100km, ${pctSaving}% less energy than the least efficient option.`,
        highlight: `${best.efficiencyKwhPer100km} kWh/100km`,
        color: 'blue',
      })
    }

    /* ── 3. Best value (lowest price per km range) ─────── */
    const withPriceRange = vehicles.filter(v => v.basePriceLocalCurrency != null && v.rangeKm != null && v.rangeKm > 0)
    if (withPriceRange.length >= 2) {
      const sorted = [...withPriceRange].sort((a, b) =>
        ((a.basePriceLocalCurrency ?? 0) / (a.rangeKm ?? 1)) -
        ((b.basePriceLocalCurrency ?? 0) / (b.rangeKm ?? 1))
      )
      const best = sorted[0]
      const pricePerKm = (best.basePriceLocalCurrency ?? 0) / (best.rangeKm ?? 1)
      result.push({
        icon: '💎',
        title: 'Best Value per km Range',
        body: `${getLabel(best)} delivers the most range per ${sym} spent at ${formatCompact(Math.round(pricePerKm), country)}/km of range.`,
        highlight: `${formatCompact(Math.round(pricePerKm), country)}/km`,
        color: 'purple',
      })
    }

    /* ── 4. Fastest charging ───────────────────────────── */
    const withCharging = vehicles.filter(v => v.chargingTimeDc0To80Min != null && v.chargingTimeDc0To80Min > 0)
    if (withCharging.length >= 2) {
      const sorted = [...withCharging].sort((a, b) => (a.chargingTimeDc0To80Min ?? 99) - (b.chargingTimeDc0To80Min ?? 99))
      const best = sorted[0]
      const slowest = sorted[sorted.length - 1]
      const timeSaved = (slowest.chargingTimeDc0To80Min ?? 0) - (best.chargingTimeDc0To80Min ?? 0)
      result.push({
        icon: '🔌',
        title: 'Fastest Charger',
        body: `${getLabel(best)} charges 0–80% in just ${best.chargingTimeDc0To80Min} min, ${timeSaved} min faster than ${getLabel(slowest)}.`,
        highlight: `${best.chargingTimeDc0To80Min} min`,
        color: 'amber',
      })
    }

    /* ── 5. Daily driving recommendation ───────────────── */
    const withEffAndRange = vehicles.filter(v => v.efficiencyKwhPer100km != null && v.rangeKm != null)
    if (withEffAndRange.length >= 2) {
      // For daily commuter (≤50 km/day), recommend most efficient
      // For long-distance (≥150 km/day), recommend most range
      const mostEfficient = [...withEffAndRange].sort((a, b) => (a.efficiencyKwhPer100km ?? 99) - (b.efficiencyKwhPer100km ?? 99))[0]
      const longestRange = [...withEffAndRange].sort((a, b) => (b.rangeKm ?? 0) - (a.rangeKm ?? 0))[0]

      if (mostEfficient.id !== longestRange.id) {
        // Cost per day at 50km
        const costShort = (50 / 100) * (mostEfficient.efficiencyKwhPer100km ?? 18) * tariff
        const costLong = (150 / 100) * (longestRange.efficiencyKwhPer100km ?? 18) * tariff
        result.push({
          icon: '🎯',
          title: 'Pick by Your Commute',
          body: `Drive ≤50 km/day? Pick ${getLabel(mostEfficient)} (${sym}${costShort.toFixed(1)}/day). Drive ≥150 km/day? Pick ${getLabel(longestRange)} for range confidence.`,
          highlight: 'Personalized pick',
          color: 'rose',
        })
      }
    }

    /* ── 6. Battery tech comparison ────────────────────── */
    const chemTypes = new Set(vehicles.map(v => v.batteryTechnology).filter(Boolean))
    if (chemTypes.size >= 2) {
      const lfpVehicles = vehicles.filter(v => v.batteryTechnology === 'LFP')
      const nmcVehicles = vehicles.filter(v => v.batteryTechnology === 'NMC')
      if (lfpVehicles.length > 0 && nmcVehicles.length > 0) {
        result.push({
          icon: '🔬',
          title: 'Chemistry Face-off',
          body: `You're comparing LFP (longer lifespan, safer) vs NMC (higher energy density, more range). LFP batteries retain ~88% capacity after 10 years vs ~82% for NMC.`,
          highlight: 'LFP vs NMC',
          color: 'indigo',
        })
      }
    }

    return result
  }, [vehicles, country, sym, tariff])

  if (cards.length === 0) return null

  return (
    <div className="bg-paper-100 rounded-card border border-ink/10 p-5">
      <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
        Smart insights
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => {
          const style = CARD_STYLES[card.color]
          return (
            <div key={i} className={`${style.bg} rounded-card p-4 flex flex-col`}>
              {/* Icon + Title */}
              <div className="flex items-center gap-2.5 mb-2">
                <span className={`${style.iconBg} w-8 h-8 rounded-lg flex items-center justify-center text-base`}>
                  {card.icon}
                </span>
                <h4 className={`text-xs font-bold ${style.title}`}>{card.title}</h4>
              </div>

              {/* Highlight pill */}
              {card.highlight && (
                <span className={`inline-block self-start px-2 py-0.5 rounded-full text-[10px] font-bold ${style.highlight} mb-2`}>
                  {card.highlight}
                </span>
              )}

              {/* Body */}
              <p className={`text-[11px] leading-relaxed ${style.body}`}>{card.body}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
