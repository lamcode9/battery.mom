'use client'

import { useState, useMemo, useEffect } from 'react'
import InfoTooltip from '@/components/InfoTooltip'
import { NextSteps } from '@/components/ui/NextSteps'
import { COUNTRY_OPTIONS as COUNTRIES, formatCurrency as fmt, formatCompact as fmtShort } from '@/lib/constants'
import ShareResult from '@/components/ShareResult'
import { useSearchParams } from 'next/navigation'
import type { Country } from '@/types/bess'
import {
  PETROL_PRICE_PER_LITRE,
  PETROL_PRICE_NOTE,
  RESIDENTIAL_TARIFF,
  RESIDENTIAL_TARIFF_NOTE,
  DC_FAST_CHARGING_RATE,
  RATE_VERIFIED_ON,
} from '@/data/rates'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'


const HOME_TARIFF = RESIDENTIAL_TARIFF
const DC_RATE = DC_FAST_CHARGING_RATE

// AC public charger (Level 2) per kWh
const AC_PUBLIC_RATE: Record<Country, number> = {
  MY: 0.80, SG: 0.42, ID: 2500, TH: 5.50, VN: 2800, PH: 10.50,
}

const PETROL_PRICE = PETROL_PRICE_PER_LITRE

// Average petrol car consumption (L/100km)
const PETROL_CONSUMPTION = 7.5

// Charging efficiency loss (~10% for home, ~15% for DC)
const HOME_EFFICIENCY = 0.90
const DC_EFFICIENCY = 0.85
const AC_PUBLIC_EFFICIENCY = 0.88

// Popular EV presets per country {name, battery_kwh, efficiency_kwh_per_100km}
const EV_PRESETS: Record<Country, { name: string; battery: number; efficiency: number }[]> = {
  MY: [
    { name: 'Tesla Model 3 SR', battery: 60, efficiency: 14.2 },
    { name: 'BYD Atto 3', battery: 60.5, efficiency: 16.3 },
    { name: 'BYD Seal', battery: 82.5, efficiency: 15.7 },
  ],
  SG: [
    { name: 'Tesla Model 3 LR', battery: 75, efficiency: 14.8 },
    { name: 'BYD Atto 3', battery: 60.5, efficiency: 16.3 },
    { name: 'Hyundai Ioniq 5', battery: 72.6, efficiency: 17.3 },
  ],
  ID: [
    { name: 'Wuling Air ev', battery: 26.7, efficiency: 12.0 },
    { name: 'Hyundai Ioniq 5', battery: 72.6, efficiency: 17.3 },
    { name: 'BYD Atto 3', battery: 60.5, efficiency: 16.3 },
  ],
  TH: [
    { name: 'BYD Atto 3', battery: 60.5, efficiency: 16.3 },
    { name: 'MG MG4', battery: 64, efficiency: 15.8 },
    { name: 'Tesla Model 3 SR', battery: 60, efficiency: 14.2 },
  ],
  VN: [
    { name: 'VinFast VF e34', battery: 42, efficiency: 16.0 },
    { name: 'VinFast VF 8', battery: 87.7, efficiency: 21.0 },
    { name: 'BYD Atto 3', battery: 60.5, efficiency: 16.3 },
  ],
  PH: [
    { name: 'BYD Atto 3', battery: 60.5, efficiency: 16.3 },
    { name: 'BYD Dolphin', battery: 44.9, efficiency: 13.1 },
    { name: 'Hyundai Ioniq 5', battery: 72.6, efficiency: 17.3 },
  ],
}

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b']

// ── Component ─────────────────────────────────────────────────────────

export default function EvChargingCostPage() {
  const searchParams = useSearchParams()
  const [country, setCountry] = useState<Country>('MY')
  const [dailyKm, setDailyKm] = useState(40)
  const [efficiency, setEfficiency] = useState(15.0) // kWh/100km
  const [homeChargePct, setHomeChargePct] = useState(70) // % charged at home
  const [dcPct, setDcPct] = useState(20) // % DC fast
  // remainder = AC public
  const acPubPct = Math.max(0, 100 - homeChargePct - dcPct)

  // Restore state from shared URL
  useEffect(() => {
    const encoded = searchParams.get('s')
    if (!encoded) return
    try {
      const s = JSON.parse(atob(encoded))
      if (s.country) setCountry(s.country)
      if (s.dailyKm) setDailyKm(Number(s.dailyKm))
      if (s.efficiency) setEfficiency(Number(s.efficiency))
      if (s.homeChargePct != null) setHomeChargePct(Number(s.homeChargePct))
      if (s.dcPct != null) setDcPct(Number(s.dcPct))
    } catch { /* invalid state, use defaults */ }
  }, [searchParams])

  // ── Calculations ────────────────────────────────────────────────────
  const results = useMemo(() => {
    const annualKm = dailyKm * 365
    const annualKwh = (annualKm / 100) * efficiency

    const homeKwh = annualKwh * (homeChargePct / 100) / HOME_EFFICIENCY
    const dcKwh = annualKwh * (dcPct / 100) / DC_EFFICIENCY
    const acKwh = annualKwh * (acPubPct / 100) / AC_PUBLIC_EFFICIENCY

    const homeCost = homeKwh * HOME_TARIFF[country]
    const dcCost = dcKwh * DC_RATE[country]
    const acCost = acKwh * AC_PUBLIC_RATE[country]
    const totalCost = homeCost + dcCost + acCost

    const costPerKm = annualKm > 0 ? totalCost / annualKm : 0
    const monthlyCost = totalCost / 12

    // Petrol comparison
    const petrolCostAnnual = (annualKm / 100) * PETROL_CONSUMPTION * PETROL_PRICE[country]
    const savingsAnnual = petrolCostAnnual - totalCost
    const savingsPct = petrolCostAnnual > 0 ? (savingsAnnual / petrolCostAnnual) * 100 : 0

    // Monthly comparison chart
    const monthlyData = [
      { name: 'Home', cost: Math.round(homeCost / 12) },
      { name: 'AC Public', cost: Math.round(acCost / 12) },
      { name: 'DC Fast', cost: Math.round(dcCost / 12) },
    ]

    const pieData = [
      { name: 'Home', value: Math.round(homeCost) },
      { name: 'AC Public', value: Math.round(acCost) },
      { name: 'DC Fast', value: Math.round(dcCost) },
    ].filter(d => d.value > 0)

    return {
      annualKm,
      annualKwh: Math.round(annualKwh),
      totalAnnual: Math.round(totalCost),
      monthlyCost: Math.round(monthlyCost),
      costPerKm,
      petrolAnnual: Math.round(petrolCostAnnual),
      savingsAnnual: Math.round(savingsAnnual),
      savingsPct: Math.round(savingsPct),
      homeCostAnnual: Math.round(homeCost),
      dcCostAnnual: Math.round(dcCost),
      acCostAnnual: Math.round(acCost),
      monthlyData,
      pieData,
    }
  }, [country, dailyKm, efficiency, homeChargePct, dcPct, acPubPct])

  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-medium text-ink tracking-tight">
            EV charging cost calculator <InfoTooltip content="Estimates your real-world EV charging costs by mixing home, public AC, and DC fast-charging rates, accounting for energy losses during charging. Results show monthly/annual cost and how much you save compared to a petrol car." />
          </h1>
          <p className="mt-3 text-lg text-ink-600 leading-relaxed">
            Estimate your real-world EV charging costs by mixing home, public AC, and DC fast charging, then see how much you save versus petrol.
          </p>
          <div className="mt-4">
            <ShareResult
              title={`EV Charging Cost (${COUNTRIES.find(c => c.value === country)?.label})`}
              results={[
                { label: 'Monthly cost', value: fmt(results.monthlyCost, country) },
                { label: 'Annual cost', value: fmtShort(results.totalAnnual, country) },
                { label: 'vs Petrol savings', value: `${results.savingsPct}%` },
                { label: 'Cost/km', value: fmt(results.costPerKm, country, 2) },
              ]}
              path="/calculators/ev-charging-cost"
              state={{ country, dailyKm, efficiency, homeChargePct, dcPct }}
            />
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as Country)}
                className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.flag} {c.label}</option>
                ))}
              </select>
            </div>

            {/* EV preset */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Popular EVs</label>
              <div className="flex gap-2 flex-wrap">
                {EV_PRESETS[country].map((ev) => (
                  <button
                    key={ev.name}
                    onClick={() => setEfficiency(ev.efficiency)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      efficiency === ev.efficiency
                        ? 'bg-brand-50 border-brand-300 text-brand-700'
                        : 'border-ink/10 text-ink-600 hover:border-ink/15'
                    }`}
                  >
                    {ev.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Daily km */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Daily driving</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={dailyKm}
                  onChange={(e) => setDailyKm(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-16 text-right">{dailyKm} km</span>
              </div>
              <p className="text-xs text-ink-400 mt-1">{(dailyKm * 365).toLocaleString()} km/year</p>
            </div>

            {/* Efficiency */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">EV efficiency <InfoTooltip content="How much energy (kWh) the EV uses per 100 km of driving. Lower = more efficient. A typical compact EV uses ~14 kWh/100km; a large SUV might use 20+. This is the single biggest factor in your charging cost." /></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={28}
                  step={0.5}
                  value={efficiency}
                  onChange={(e) => setEfficiency(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-24 text-right">{efficiency} kWh/100km</span>
              </div>
            </div>

            {/* Home charging % */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Home charging <InfoTooltip content="Percentage of total charging done at home. Home AC charging (Level 2, ~7 kW) is the cheapest option at residential tariff rates. Most EV owners charge 70-90% at home overnight." /></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={homeChargePct}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setHomeChargePct(v)
                    if (v + dcPct > 100) setDcPct(100 - v)
                  }}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-10 text-right">{homeChargePct}%</span>
              </div>
            </div>

            {/* DC fast % */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">DC fast charging <InfoTooltip content="Percentage charged at DC fast chargers (50-350 kW). Fastest but most expensive, with ~15% energy lost as heat during high-power charging. Best reserved for long trips." /></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100 - homeChargePct}
                  step={5}
                  value={dcPct}
                  onChange={(e) => setDcPct(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-10 text-right">{dcPct}%</span>
              </div>
              <p className="text-xs text-ink-400 mt-1">AC public: {acPubPct}%</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Monthly cost <InfoTooltip content="Your estimated monthly electricity bill for EV charging, including energy losses. Formula: (daily km × 365 ÷ 100 × efficiency) split by charging type, divided by charging efficiency, times each rate, divided by 12." /></div>
            <div className="text-xl font-bold text-ink">{fmtShort(results.monthlyCost, country)}</div>
            <div className="text-xs text-ink-500 mt-0.5">{results.annualKwh.toLocaleString()} kWh/year</div>
          </div>
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Annual cost</div>
            <div className="text-xl font-bold text-ink">{fmtShort(results.totalAnnual, country)}</div>
            <div className="text-xs text-ink-500 mt-0.5">{fmt(results.costPerKm, country, 2)}/km</div>
          </div>
          <div className={`rounded-card p-5 border ${
            results.savingsAnnual > 0
              ? 'bg-brand-50 border-brand-200'
              : 'bg-paper-100 border-ink/10'
          }`}>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">vs Petrol savings <InfoTooltip content={`How much cheaper EV charging is compared to fuelling a similar petrol car at 7.5 L/100 km. ${PETROL_PRICE_NOTE[country]}`} /></div>
            <div className="text-xl font-bold text-brand-700">{results.savingsPct}%</div>
            <div className="text-xs text-ink-500 mt-0.5">{fmtShort(results.savingsAnnual, country)}/year</div>
          </div>
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Petrol equiv.</div>
            <div className="text-xl font-bold text-ink">{fmtShort(results.petrolAnnual, country)}</div>
            <div className="text-xs text-ink-500 mt-0.5">@ {PETROL_CONSUMPTION}L/100km</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cost pie */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Annual cost breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={results.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {results.pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v, country)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* EV vs petrol comparison */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Monthly: EV vs Petrol</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[
                  { name: 'EV', cost: results.monthlyCost },
                  { name: 'Petrol', cost: Math.round(results.petrolAnnual / 12) },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtShort(v, country)} />
                <Tooltip formatter={(v: number) => fmt(v, country)} />
                <Bar dataKey="cost" name="Monthly cost" radius={[6, 6, 0, 0]}>
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rate table */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <h3 className="text-sm font-semibold text-ink mb-4">Charging rates in {COUNTRIES.find(c => c.value === country)?.label} <InfoTooltip content={`Home uses the residential tariff last verified ${RATE_VERIFIED_ON}. ${RESIDENTIAL_TARIFF_NOTE[country]} AC Public is a Level 2 charger at shopping malls etc. DC Fast is a high-power highway charger. Efficiency column shows how much energy actually reaches the battery (rest is lost as heat).`} /></h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="text-left py-2 font-medium text-ink-500">Type</th>
                  <th className="text-right py-2 font-medium text-ink-500">Rate/kWh</th>
                  <th className="text-right py-2 font-medium text-ink-500">Efficiency</th>
                  <th className="text-right py-2 font-medium text-ink-500">Your annual cost</th>
                </tr>
              </thead>
              <tbody className="text-ink-700">
                <tr className="border-b border-ink/5">
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500" /> Home (AC)
                  </td>
                  <td className="text-right py-2">{fmt(HOME_TARIFF[country], country, HOME_TARIFF[country] < 1 ? 4 : 2)}</td>
                  <td className="text-right py-2">{HOME_EFFICIENCY * 100}%</td>
                  <td className="text-right py-2 font-medium">{fmtShort(results.homeCostAnnual, country)}</td>
                </tr>
                <tr className="border-b border-ink/5">
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> Public AC
                  </td>
                  <td className="text-right py-2">{fmt(AC_PUBLIC_RATE[country], country, 2)}</td>
                  <td className="text-right py-2">{AC_PUBLIC_EFFICIENCY * 100}%</td>
                  <td className="text-right py-2 font-medium">{fmtShort(results.acCostAnnual, country)}</td>
                </tr>
                <tr>
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> DC Fast
                  </td>
                  <td className="text-right py-2">{fmt(DC_RATE[country], country, 2)}</td>
                  <td className="text-right py-2">{DC_EFFICIENCY * 100}%</td>
                  <td className="text-right py-2 font-medium">{fmtShort(results.dcCostAnnual, country)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-400 mt-4">
            * Home rate: {RESIDENTIAL_TARIFF_NOTE[country]} Petrol comparison: {PETROL_PRICE_NOTE[country]} Last verified {RATE_VERIFIED_ON}.
          </p>
        </div>
        <div className="bg-brand-50 border border-brand-200 rounded-card p-6">
          <h3 className="text-sm font-semibold text-brand-900 mb-2">Maximise your savings</h3>
          <ul className="text-sm text-brand-800 space-y-1.5">
            <li>• <strong>Charge at home overnight.</strong> Residential rates are 40-60% cheaper than DC fast chargers.</li>
            <li>• <strong>Add rooftop solar.</strong> Pay {fmt(0, country)} per kWh during the day. <a href="/calculators/solar-payback" className="underline font-medium">Check solar payback →</a></li>
            <li>• <strong>Add a home battery.</strong> Store solar for overnight EV charging. <a href="/bess/home" className="underline font-medium">Zero-bill calculator →</a></li>
            <li>• <strong>Use DC fast only for trips.</strong> Keep DC below 20% of total charging for the lowest cost.</li>
          </ul>
        </div>
      </section>

      <NextSteps route="/calculators/ev-charging-cost" />
    </main>
  )
}
