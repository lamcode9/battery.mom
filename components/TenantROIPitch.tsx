'use client'

import { useState, useMemo, useRef } from 'react'
import InfoTooltip from '@/components/InfoTooltip'
import type { Country } from '@/types/bess'

/* ── Constants ────────────────────────────────────────────────────── */

const CURRENCY: Record<Country, string> = {
  MY: 'RM', SG: 'S$', ID: 'Rp', TH: '฿', VN: '₫', PH: '₱',
}

// Typical condo monthly bill (residential tariff × avg kWh)
const AVG_MONTHLY_BILL: Record<Country, number> = {
  MY: 250, SG: 180, ID: 750000, TH: 3500, VN: 1500000, PH: 5500,
}

function fmt(n: number, country: Country, digits = 0): string {
  return `${CURRENCY[country]}${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

function fmtShort(n: number, country: Country): string {
  const c = CURRENCY[country]
  if (country === 'ID' || country === 'VN') {
    if (Math.abs(n) >= 1e9) return `${c}${(n / 1e9).toFixed(1)}B`
    if (Math.abs(n) >= 1e6) return `${c}${(n / 1e6).toFixed(1)}M`
    return `${c}${(n / 1e3).toFixed(0)}K`
  }
  if (Math.abs(n) >= 1e6) return `${c}${(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `${c}${(n / 1e3).toFixed(1)}K`
  return fmt(n, country)
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  country: Country
  /** Extra cost per unit due to solar+BESS — from the parent calculator */
  addedCostPerUnit?: number
  /** Monthly savings per household — from the parent calculator */
  monthlySavings?: number
  /** System payback years — from the parent calculator */
  paybackYears?: number
  /** Blackout hours covered */
  blackoutHours?: number
  /** CO₂ avoided kg/year total */
  co2AvoidedKg?: number
  /** Number of units */
  units?: number
}

export default function TenantROIPitch({
  country,
  addedCostPerUnit = 0,
  monthlySavings = 0,
  paybackYears = 0,
  blackoutHours = 0,
  co2AvoidedKg = 0,
  units = 80,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  // Allow override inputs
  const [overrideCost, setOverrideCost] = useState<number | null>(null)
  const [overrideSavings, setOverrideSavings] = useState<number | null>(null)

  const effectiveCost = overrideCost ?? addedCostPerUnit
  const effectiveSavings = overrideSavings ?? monthlySavings

  const results = useMemo(() => {
    const monthlyBill = AVG_MONTHLY_BILL[country]
    const savingsAsPct = monthlyBill > 0 ? (effectiveSavings / monthlyBill) * 100 : 0
    const effectivePayback = effectiveSavings > 0 ? effectiveCost / (effectiveSavings * 12) : 0
    const roi20Year = effectiveSavings * 12 * 20 - effectiveCost
    const co2PerUnit = units > 0 ? co2AvoidedKg / units / 1000 : 0 // tonnes/unit/year

    return {
      monthlyBill,
      savingsAsPct,
      effectivePayback,
      roi20Year,
      co2PerUnit,
    }
  }, [country, effectiveCost, effectiveSavings, co2AvoidedKg, units])

  const copyCard = async () => {
    const text = [
      `Green home investment, ${country}`,
      ``,
      `Your unit costs ${fmtShort(effectiveCost, country)} more`,
      `but saves ${fmt(effectiveSavings, country)}/month (${results.savingsAsPct.toFixed(0)}% of your bill)`,
      ``,
      `Pays for itself in ${results.effectivePayback.toFixed(1)} years`,
      `20-year ROI is ${fmtShort(results.roi20Year, country)}`,
      `⚡ ${blackoutHours}h blackout protection`,
      `${results.co2PerUnit.toFixed(1)} t CO₂ saved a year`,
      ``,
      `Powered by battery.mom`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  return (
    <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
      <h2 className="text-lg font-semibold text-ink mb-1">
        Tenant ROI Pitch Card{' '}
        <InfoTooltip content="Generate a shareable one-liner for condo buyers: 'Your unit costs X% more but saves Y a month and pays for itself in Z years.' Useful for property developer marketing materials and agent talking points." />
      </h2>
      <p className="text-sm text-ink-500 mb-5">
        Show condo buyers exactly what the green premium gets them.
      </p>

      {/* ── Override inputs (optional) ── */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">
            Added cost per unit{' '}
            <InfoTooltip content="Override the per-unit cost premium from the calculator above, or leave blank to use the calculator's value." />
          </label>
          <input
            type="number"
            placeholder={effectiveCost > 0 ? fmt(addedCostPerUnit, country) : 'From calculator'}
            value={overrideCost ?? ''}
            onChange={(e) => setOverrideCost(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-700 mb-1">
            Monthly savings
          </label>
          <input
            type="number"
            placeholder={effectiveSavings > 0 ? fmt(monthlySavings, country) : 'From calculator'}
            value={overrideSavings ?? ''}
            onChange={(e) => setOverrideSavings(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* ── The pitch card ── */}
      <div ref={cardRef} className="bg-gradient-to-br from-brand-50 to-blue-50 rounded-2xl p-6 mb-4">
        {/* Headline */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-600 text-white rounded-full text-xs font-semibold mb-3">
            Green home investment
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-ink leading-tight">
            Your unit costs{' '}
            <span className="text-brand-700">{fmtShort(effectiveCost, country)}</span> more
          </h3>
          <p className="text-lg text-ink-700 mt-1">
            but saves{' '}
            <span className="font-bold text-brand-700">{fmt(effectiveSavings, country)}/month</span>{' '}
            <span className="text-ink-500 text-sm">({results.savingsAsPct.toFixed(0)}% of your electricity bill)</span>
          </p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/70 rounded-card p-3 text-center">
            <div className="text-2xl font-bold text-brand-700">{results.effectivePayback.toFixed(1)}</div>
            <div className="text-xs text-ink-600 mt-0.5">Years to pay back</div>
          </div>
          <div className="bg-white/70 rounded-card p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{fmtShort(results.roi20Year, country)}</div>
            <div className="text-xs text-ink-600 mt-0.5">20-year net gain</div>
          </div>
          <div className="bg-white/70 rounded-card p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">{blackoutHours}h</div>
            <div className="text-xs text-ink-600 mt-0.5">Blackout protection</div>
          </div>
          <div className="bg-white/70 rounded-card p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{results.co2PerUnit.toFixed(1)}t</div>
            <div className="text-xs text-ink-600 mt-0.5">CO₂ saved/year</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[10px] text-ink-400">
          Powered by battery.mom · Based on {CURRENCY[country]} tariffs and solar yield
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3" data-pdf-ignore>
        <button
          onClick={copyCard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          {copied ? 'Copied!' : 'Copy Pitch Text'}
        </button>
      </div>
    </div>
  )
}
