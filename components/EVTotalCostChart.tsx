'use client'

import { useState, useMemo } from 'react'
import { Vehicle } from '@/types/vehicle'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'
import { CURRENCY_SYMBOLS, formatCompact } from '@/lib/constants'
import { RESIDENTIAL_TARIFF, getCitationFooter } from '@/data/rates'

/* ── Assumptions ───────────────────────────────────────────── */

/** Estimated annual maintenance cost as fraction of purchase price */
const MAINTENANCE_RATE = 0.005 // 0.5% of purchase price per year
/** Estimated annual insurance as fraction of purchase price */
const INSURANCE_RATE = 0.025 // 2.5% of purchase price per year  
/** Resale value as % of purchase price after 5 years */
const RESALE_5Y = 0.50 // 50% retained

const DEFAULT_KM_YEAR = 15000

const COLORS = {
  purchase: '#6366f1',
  electricity: '#10b981',
  maintenance: '#f59e0b',
  insurance: '#8b5cf6',
}

function getVehicleLabel(v: Vehicle) {
  const name = v.modelTrim ? `${v.name} ${v.modelTrim}` : v.name
  // Shorten for chart labels
  return name.length > 18 ? name.slice(0, 16) + '…' : name
}

interface Props {
  vehicles: Vehicle[]
  country: string
}

export default function EVTotalCostChart({ vehicles, country }: Props) {
  const [annualKm, setAnnualKm] = useState(DEFAULT_KM_YEAR)

  const sym = CURRENCY_SYMBOLS[country] ?? ''
  const tariff = (RESIDENTIAL_TARIFF as Record<string, number>)[country] ?? 0.30

  const tcoData = useMemo(() => {
    return vehicles.map(v => {
      const price = v.basePriceLocalCurrency ?? 0
      const efficiency = v.efficiencyKwhPer100km ?? 18 // fallback ~18 kWh/100km
      const electricityPerYear = (annualKm / 100) * efficiency * tariff
      const maintenancePerYear = price * MAINTENANCE_RATE
      const insurancePerYear = price * INSURANCE_RATE

      const electricity5y = electricityPerYear * 5
      const maintenance5y = maintenancePerYear * 5
      const insurance5y = insurancePerYear * 5
      const resaleCredit = price * RESALE_5Y
      const tco = price + electricity5y + maintenance5y + insurance5y - resaleCredit

      return {
        label: getVehicleLabel(v),
        fullLabel: v.modelTrim ? `${v.name} ${v.modelTrim}` : v.name,
        id: v.id,
        purchase: Math.round(price),
        electricity: Math.round(electricity5y),
        maintenance: Math.round(maintenance5y),
        insurance: Math.round(insurance5y),
        resale: Math.round(resaleCredit),
        tco: Math.round(tco),
        costPerKm: tco > 0 && annualKm > 0 ? (tco / (annualKm * 5)) : 0,
      }
    }).sort((a, b) => a.tco - b.tco)
  }, [vehicles, annualKm, tariff])

  if (vehicles.length === 0) return null

  const lowestTCO = tcoData[0]

  return (
    <div className="bg-paper-100 rounded-card border border-ink/10 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            5-year total cost of ownership
          </h3>
          <p className="text-[10px] text-ink-500 mt-1">
            Purchase price + electricity + maintenance + insurance − estimated resale value after 5 years.
          </p>
        </div>
      </div>

      {/* Annual km slider */}
      <div className="mb-4">
        <label className="text-[10px] font-medium text-ink-600 block mb-2">
          Annual driving distance
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5000}
            max={40000}
            step={1000}
            value={annualKm}
            onChange={e => setAnnualKm(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-paper-300 accent-indigo-600"
          />
          <span className="text-sm font-bold text-ink w-24 text-right">
            {annualKm.toLocaleString()} km/yr
          </span>
        </div>
        <div className="flex justify-between text-[9px] text-ink-400 mt-0.5 px-0.5">
          <span>5,000</span>
          <span>40,000 km</span>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={Math.max(180, vehicles.length * 50 + 30)}>
          <BarChart
            data={tcoData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 9 }}
              tickFormatter={v => formatCompact(v, country)}
            />
            <YAxis
              dataKey="label"
              type="category"
              tick={{ fontSize: 10 }}
              width={90}
            />
            <ChartHoverTooltip
              formatter={(val: number, name: string) => [formatCompact(val, country), name.charAt(0).toUpperCase() + name.slice(1)]}
              labelFormatter={(label) => {
                const item = tcoData.find(d => d.label === label)
                return item?.fullLabel ?? label
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="purchase" stackId="a" fill={COLORS.purchase} name="Purchase" radius={[0, 0, 0, 0]} />
            <Bar dataKey="electricity" stackId="a" fill={COLORS.electricity} name="Electricity" />
            <Bar dataKey="maintenance" stackId="a" fill={COLORS.maintenance} name="Maintenance" />
            <Bar dataKey="insurance" stackId="a" fill={COLORS.insurance} name="Insurance" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-ink/10">
              <th className="text-left py-1.5 text-ink-500 font-medium">Vehicle</th>
              <th className="text-right py-1.5 text-ink-500 font-medium">5-Yr TCO</th>
              <th className="text-right py-1.5 text-ink-500 font-medium">Resale</th>
              <th className="text-right py-1.5 text-ink-500 font-medium">Net Cost</th>
              <th className="text-right py-1.5 text-ink-500 font-medium">{sym}/km</th>
            </tr>
          </thead>
          <tbody>
            {tcoData.map((d, i) => (
              <tr key={d.id} className={`border-b border-ink/5 ${i === 0 ? 'bg-brand-50/50' : ''}`}>
                <td className="py-1.5 font-semibold text-ink flex items-center gap-1">
                  {i === 0 && <span className="text-[9px]">🏆</span>}
                  {d.fullLabel}
                </td>
                <td className="text-right py-1.5 text-ink-700">{formatCompact(d.purchase + d.electricity + d.maintenance + d.insurance, country)}</td>
                <td className="text-right py-1.5 text-brand-600">−{formatCompact(d.resale, country)}</td>
                <td className="text-right py-1.5 font-bold text-ink">{formatCompact(d.tco, country)}</td>
                <td className="text-right py-1.5 text-ink-600">{d.costPerKm.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lowestTCO && tcoData.length >= 2 && (
        <div className="mt-3 bg-brand-50 rounded-lg p-2.5">
          <p className="text-[10px] text-brand-800">
            🏆 <strong>{lowestTCO.fullLabel}</strong> has the lowest 5-year TCO at {formatCompact(lowestTCO.tco, country)},
            saving you {formatCompact(tcoData[tcoData.length - 1].tco - lowestTCO.tco, country)} vs the most expensive option.
          </p>
        </div>
      )}

      <p className="text-[9px] text-ink-400 mt-3">
        Electricity at {sym}{tariff.toLocaleString()}/kWh (residential). Maintenance 0.5%/yr of purchase price. Insurance 2.5%/yr. Resale assumed at 50% after 5 years.
        Adjust annual km to see impact on running costs.
      </p>
      <p className="text-[8px] text-ink-300 mt-1">
        {getCitationFooter('electricityResidential')} · Vehicle prices from manufacturer websites.
      </p>
    </div>
  )
}
