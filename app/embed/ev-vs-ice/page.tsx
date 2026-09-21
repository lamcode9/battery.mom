'use client'

import { useState, useMemo } from 'react'
import type { Country } from '@/types/bess'
import { COUNTRY_OPTIONS as COUNTRIES, formatCurrency as fmt } from '@/lib/constants'
import { PETROL_PRICE_PER_LITRE, PETROL_PRICE_NOTE, RESIDENTIAL_TARIFF, RESIDENTIAL_TARIFF_NOTE, RATE_VERIFIED_ON } from '@/data/rates'

const ELECTRICITY_RATE = RESIDENTIAL_TARIFF
const PETROL_PRICE = PETROL_PRICE_PER_LITRE

export default function EmbedEvVsIce() {
  const [country, setCountry] = useState<Country>('MY')
  const [annualKm, setAnnualKm] = useState(15000)

  const result = useMemo(() => {
    const evEfficiency = 15 // kWh/100km avg
    const iceEfficiency = 7.5 // L/100km avg
    const evCostPerKm = (evEfficiency / 100) * ELECTRICITY_RATE[country]
    const iceCostPerKm = (iceEfficiency / 100) * PETROL_PRICE[country]
    const evAnnual = evCostPerKm * annualKm
    const iceAnnual = iceCostPerKm * annualKm
    const savings = iceAnnual - evAnnual
    const savingsPct = iceAnnual > 0 ? (savings / iceAnnual) * 100 : 0
    return { evAnnual, iceAnnual, savings, savingsPct }
  }, [country, annualKm])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-ink">
        🔋 EV vs Petrol — Annual Fuel Cost
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-ink-600">Country</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            className="mt-1 w-full rounded-lg border border-ink/15 px-2 py-1.5 text-sm"
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-ink-600">Annual km</span>
          <input
            type="number"
            value={annualKm}
            onChange={(e) => setAnnualKm(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-ink/15 px-2 py-1.5 text-sm tabular-nums"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-card bg-brand-50 p-3">
          <div className="text-xs font-medium text-brand-700">EV Cost</div>
          <div className="text-lg font-bold text-brand-700 tabular-nums">
            {fmt(result.evAnnual, country)}
          </div>
          <div className="text-[10px] text-brand-600">/year</div>
        </div>
        <div className="rounded-card bg-red-50 p-3">
          <div className="text-xs font-medium text-red-700">Petrol Cost</div>
          <div className="text-lg font-bold text-red-700 tabular-nums">
            {fmt(result.iceAnnual, country)}
          </div>
          <div className="text-[10px] text-red-600">/year</div>
        </div>
        <div className="rounded-card bg-blue-50 p-3">
          <div className="text-xs font-medium text-blue-700">You Save</div>
          <div className="text-lg font-bold text-blue-700 tabular-nums">
            {result.savingsPct.toFixed(0)}%
          </div>
          <div className="text-[10px] text-blue-600">{fmt(result.savings, country)}/yr</div>
        </div>
      </div>

      <p className="text-[10px] text-ink-400">
        Based on avg 15 kWh/100km (EV) and 7.5 L/100km (petrol). Home tariff: {RESIDENTIAL_TARIFF_NOTE[country]} Petrol: {PETROL_PRICE_NOTE[country]} Last verified {RATE_VERIFIED_ON}.{' '}
        <a href="https://battery.mom/calculators/ev-vs-ice" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-600">Full calculator →</a>
      </p>
    </div>
  )
}
