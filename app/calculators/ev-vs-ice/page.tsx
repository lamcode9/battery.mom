'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import InfoTooltip from '@/components/InfoTooltip'
import { NextSteps } from '@/components/ui/NextSteps'
import { COUNTRY_OPTIONS as COUNTRIES, formatCurrency as fmt, formatCompact as fmtShort } from '@/lib/constants'
import ShareResult from '@/components/ShareResult'
import type { Country } from '@/types/bess'
import {
  PETROL_PRICE_PER_LITRE,
  PETROL_PRICE_NOTE,
  RESIDENTIAL_TARIFF,
  RESIDENTIAL_TARIFF_NOTE,
  EV_INCENTIVE,
  RATE_VERIFIED_ON,
} from '@/data/rates'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'


const PETROL_PRICE = PETROL_PRICE_PER_LITRE
const ELECTRICITY_TARIFF = RESIDENTIAL_TARIFF

// Annual maintenance cost estimates (local currency)
const EV_ANNUAL_MAINTENANCE: Record<Country, number> = {
  MY: 800, SG: 600, ID: 4000000, TH: 8000, VN: 5000000, PH: 15000,
}
const ICE_ANNUAL_MAINTENANCE: Record<Country, number> = {
  MY: 2000, SG: 1500, ID: 10000000, TH: 18000, VN: 12000000, PH: 35000,
}

// Insurance premium per year (local currency, typical sedan)
const EV_INSURANCE: Record<Country, number> = {
  MY: 2500, SG: 1800, ID: 8000000, TH: 20000, VN: 8000000, PH: 30000,
}
const ICE_INSURANCE: Record<Country, number> = {
  MY: 2200, SG: 1600, ID: 7000000, TH: 18000, VN: 7000000, PH: 25000,
}

// Annual depreciation rate. EVs historically depreciated faster, but the gap has
// narrowed sharply through 2025/26 (the used EV-vs-petrol price spread closed to
// roughly parity per Cox Automotive), so the EV penalty is now 1pt, not 2+.
const EV_DEPRECIATION_RATE = 0.11    // 11% per year
const ICE_DEPRECIATION_RATE = 0.10   // 10% per year

// Average ICE fuel consumption (litres/100km for a comparable sedan)
const ICE_FUEL_CONSUMPTION_L100KM = 7.5

// Average EV efficiency (kWh/100km, blended home + public charging)
const DEFAULT_EV_EFFICIENCY = 15

// ── Component ─────────────────────────────────────────────────────────

export default function EVvsICEPage() {
  const searchParams = useSearchParams()
  const [country, setCountry] = useState<Country>('MY')
  const [evPrice, setEvPrice] = useState(125800)
  const [icePrice, setIcePrice] = useState(115900)
  const [annualKm, setAnnualKm] = useState(15000)
  const [homeChargePercent, setHomeChargePercent] = useState(80)
  const [yearsToCompare, setYearsToCompare] = useState(10)

  // Restore state from shared URL
  useEffect(() => {
    const encoded = searchParams.get('s')
    if (!encoded) return
    try {
      const s = JSON.parse(atob(encoded))
      if (s.country) setCountry(s.country)
      if (s.evPrice) setEvPrice(Number(s.evPrice))
      if (s.icePrice) setIcePrice(Number(s.icePrice))
      if (s.annualKm) setAnnualKm(Number(s.annualKm))
      if (s.homeChargePercent) setHomeChargePercent(Number(s.homeChargePercent))
      if (s.yearsToCompare) setYearsToCompare(Number(s.yearsToCompare))
    } catch { /* invalid state, use defaults */ }
  }, [searchParams])

  // Presets by country (approximate popular sedan pair)
  // Like-for-like compact SUVs (BYD Atto 3 vs Honda HR-V), current 2025/26
  // prices. Same vehicle class on both sides, so the purchase gap reflects a real
  // EV premium — not an SUV-vs-sedan mismatch. TH sells the HR-V only as a hybrid
  // (labelled); SG EV price is a sourced COE-inclusive drive-away.
  const presets: Record<Country, { evPrice: number; icePrice: number; evLabel: string; iceLabel: string }> = useMemo(() => ({
    MY: { evPrice: 125800, icePrice: 115900, evLabel: 'BYD Atto 3 (RM126K)', iceLabel: 'Honda HR-V (RM116K)' },
    SG: { evPrice: 181888, icePrice: 151999, evLabel: 'BYD Atto 3 (S$182K)', iceLabel: 'Honda HR-V (S$152K)' },
    ID: { evPrice: 390000000, icePrice: 388700000, evLabel: 'BYD Atto 3 (Rp390M)', iceLabel: 'Honda HR-V (Rp389M)' },
    TH: { evPrice: 729900, icePrice: 959000, evLabel: 'BYD Atto 3 (฿730K)', iceLabel: 'Honda HR-V e:HEV (฿959K)' },
    VN: { evPrice: 766000000, icePrice: 699000000, evLabel: 'BYD Atto 3 (₫766M)', iceLabel: 'Honda HR-V (₫699M)' },
    PH: { evPrice: 1638000, icePrice: 1450000, evLabel: 'BYD Atto 3 (₱1.64M)', iceLabel: 'Honda HR-V (₱1.45M)' },
  }), [])

  const handleCountryChange = useCallback((c: Country) => {
    setCountry(c)
    setEvPrice(presets[c].evPrice)
    setIcePrice(presets[c].icePrice)
  }, [presets])

  // ── Calculation ─────────────────────────────────────────────────────
  const results = useMemo(() => {
    const tariff = ELECTRICITY_TARIFF[country]
    const petrol = PETROL_PRICE[country]
    const incentive = EV_INCENTIVE[country]

    const dailyKm = annualKm / 365
    const monthlyKm = annualKm / 12

    // Fuel / energy costs per year
    const iceFuelCostPerYear = (annualKm / 100) * ICE_FUEL_CONSUMPTION_L100KM * petrol
    const evEnergyPerYear = (annualKm / 100) * DEFAULT_EV_EFFICIENCY // kWh
    const evHomeCost = evEnergyPerYear * (homeChargePercent / 100) * tariff
    const evPublicRate = tariff * 1.8 // public chargers ~1.8x residential
    const evPublicCost = evEnergyPerYear * ((100 - homeChargePercent) / 100) * evPublicRate
    const evEnergyCostPerYear = evHomeCost + evPublicCost

    // Build year-by-year TCO
    const evYearly: number[] = []
    const iceYearly: number[] = []
    let evCumulative = evPrice - incentive
    let iceCumulative = icePrice

    for (let y = 1; y <= yearsToCompare; y++) {
      const evRunning = evEnergyCostPerYear + EV_ANNUAL_MAINTENANCE[country] + EV_INSURANCE[country]
      const iceRunning = iceFuelCostPerYear + ICE_ANNUAL_MAINTENANCE[country] + ICE_INSURANCE[country]
      evCumulative += evRunning
      iceCumulative += iceRunning
      evYearly.push(evCumulative)
      iceYearly.push(iceCumulative)
    }

    // Residual value (simple declining balance)
    const evResidual = evPrice * Math.pow(1 - EV_DEPRECIATION_RATE, yearsToCompare)
    const iceResidual = icePrice * Math.pow(1 - ICE_DEPRECIATION_RATE, yearsToCompare)

    const evTCO = evCumulative - evResidual
    const iceTCO = iceCumulative - iceResidual

    const savings = iceTCO - evTCO
    const breakEvenYear = evYearly.findIndex((ev, i) => ev <= iceYearly[i]) + 1 || null

    // Chart data
    const chartData = Array.from({ length: yearsToCompare }, (_, i) => ({
      year: `Year ${i + 1}`,
      EV: Math.round(evYearly[i]),
      ICE: Math.round(iceYearly[i]),
    }))

    // Cost breakdown data (for the bar chart)
    const breakdownData = [
      { name: 'Purchase', EV: evPrice - incentive, ICE: icePrice },
      { name: 'Energy / Fuel', EV: Math.round(evEnergyCostPerYear * yearsToCompare), ICE: Math.round(iceFuelCostPerYear * yearsToCompare) },
      { name: 'Maintenance', EV: Math.round(EV_ANNUAL_MAINTENANCE[country] * yearsToCompare), ICE: Math.round(ICE_ANNUAL_MAINTENANCE[country] * yearsToCompare) },
      { name: 'Insurance', EV: Math.round(EV_INSURANCE[country] * yearsToCompare), ICE: Math.round(ICE_INSURANCE[country] * yearsToCompare) },
      { name: 'Resale Value', EV: -Math.round(evResidual), ICE: -Math.round(iceResidual) },
    ]

    return {
      evTCO, iceTCO, savings, breakEvenYear,
      evFuelPerMonth: Math.round(evEnergyCostPerYear / 12),
      iceFuelPerMonth: Math.round(iceFuelCostPerYear / 12),
      evResidual, iceResidual,
      chartData, breakdownData,
      co2EvPerYear: Math.round(evEnergyPerYear * 0.55), // avg grid factor
      co2IcePerYear: Math.round((annualKm / 100) * ICE_FUEL_CONSUMPTION_L100KM * 2.31), // 2.31 kg CO₂/litre petrol
    }
  }, [country, evPrice, icePrice, annualKm, homeChargePercent, yearsToCompare])

  const winner = results.savings > 0 ? 'EV' : 'ICE'

  return (
    <main className="min-h-screen bg-paper pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-medium text-ink tracking-tight">
            EV vs ICE — Total Cost of Ownership <InfoTooltip content="TCO (Total Cost of Ownership) adds up every cost of owning a car — purchase price, fuel/energy, maintenance, insurance, and subtracts resale value. It answers: 'What does this car really cost me over X years?'" />
          </h1>
          <p className="mt-3 text-lg text-ink-600 leading-relaxed">
            Compare {yearsToCompare}-year costs: purchase price, energy, maintenance, insurance, and resale — using real local rates.
          </p>
          <div className="mt-4">
            <ShareResult
              title={`EV vs ICE — ${yearsToCompare}-Year TCO (${COUNTRIES.find(c => c.value === country)?.label})`}
              results={[
                { label: `${yearsToCompare}yr winner`, value: winner === 'EV' ? 'Electric Vehicle' : 'Petrol Vehicle' },
                { label: 'EV TCO', value: fmtShort(results.evTCO, country) },
                { label: 'ICE TCO', value: fmtShort(results.iceTCO, country) },
                { label: 'Savings', value: fmtShort(Math.abs(results.savings), country) },
              ]}
              path="/calculators/ev-vs-ice"
              state={{ country, evPrice, icePrice, annualKm, homeChargePercent, yearsToCompare }}
            />
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Country</label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value as Country)}
                className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.flag} {c.label}</option>
                ))}
              </select>
              <p className="text-xs text-ink-400 mt-1">{presets[country].evLabel} vs {presets[country].iceLabel}</p>
            </div>

            {/* EV Price */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">EV purchase price</label>
              <input
                type="number"
                value={evPrice}
                onChange={(e) => setEvPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              {EV_INCENTIVE[country] > 0 && (
                <p className="text-xs text-brand-600 mt-1">Incentive: -{fmt(EV_INCENTIVE[country], country)} applied</p>
              )}
            </div>

            {/* ICE Price */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">ICE purchase price</label>
              <input
                type="number"
                value={icePrice}
                onChange={(e) => setIcePrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-ink/15 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            {/* Annual km */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Annual driving distance</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5000}
                  max={40000}
                  step={1000}
                  value={annualKm}
                  onChange={(e) => setAnnualKm(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-20 text-right">{annualKm.toLocaleString()} km</span>
              </div>
            </div>

            {/* Home charging % */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Home charging share <InfoTooltip content="The percentage of your total charging done at home using a wall socket or home charger. Home electricity is typically 40-60% cheaper than public DC fast chargers. More home charging = lower total cost." /></label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={homeChargePercent}
                  onChange={(e) => setHomeChargePercent(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-medium text-ink w-12 text-right">{homeChargePercent}%</span>
              </div>
              <p className="text-xs text-ink-400 mt-1">Rest charged at public DC fast chargers</p>
            </div>

            {/* Years */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Ownership period <InfoTooltip content="How many years you plan to keep the car. Longer ownership periods increasingly favour EVs because their lower running costs compound, while the higher purchase price becomes a smaller factor." /></label>
              <div className="flex gap-2">
                {[5, 7, 10].map((y) => (
                  <button
                    key={y}
                    onClick={() => setYearsToCompare(y)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      yearsToCompare === y
                        ? 'bg-brand-600 text-white'
                        : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
                    }`}
                  >
                    {y} years
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {/* Winner card */}
          <div className={`rounded-card p-6 border ${
            winner === 'EV'
              ? 'bg-brand-50 border-brand-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">
              {yearsToCompare}-year winner <InfoTooltip content="The vehicle with the lower Total Cost of Ownership (purchase + running costs − resale value) over your chosen period. This accounts for the EV's higher sticker price but lower fuel, maintenance, and sometimes insurance costs." />
            </div>
            <div className={`text-3xl font-bold ${winner === 'EV' ? 'text-brand-700' : 'text-red-700'}`}>
              {winner === 'EV' ? 'Electric Vehicle' : 'Petrol Vehicle'}
            </div>
            <div className="text-sm text-ink-600 mt-2">
              Saves {fmtShort(Math.abs(results.savings), country)} over {yearsToCompare} years
            </div>
            {results.breakEvenYear && (
              <div className="text-xs text-ink-500 mt-1">
                Break-even at year {results.breakEvenYear} <InfoTooltip content="The year when cumulative EV costs drop below cumulative ICE costs. Before this point the petrol car is cheaper overall; after it the EV pulls ahead because its lower running costs outweigh the higher sticker price." />
              </div>
            )}
          </div>

          {/* EV TCO */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">EV total cost <InfoTooltip content="Purchase price (minus any government incentive) + all charging costs + maintenance + insurance over the full period, minus the estimated resale value at the end." /></div>
            <div className="text-2xl font-bold text-ink">{fmtShort(results.evTCO, country)}</div>
            <div className="text-sm text-ink-500 mt-2">Energy: {fmt(results.evFuelPerMonth, country)}/mo</div>
            <div className="text-sm text-ink-500">Resale: {fmtShort(results.evResidual, country)}</div>
          </div>

          {/* ICE TCO */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">ICE total cost</div>
            <div className="text-2xl font-bold text-ink">{fmtShort(results.iceTCO, country)}</div>
            <div className="text-sm text-ink-500 mt-2">Fuel: {fmt(results.iceFuelPerMonth, country)}/mo</div>
            <div className="text-sm text-ink-500">Resale: {fmtShort(results.iceResidual, country)}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cumulative cost over time */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Cumulative cost over time <InfoTooltip content="Shows total money spent (purchase + running costs) for each vehicle year by year. The point where the EV line crosses below the ICE line is the break-even year." /></h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={results.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtShort(v, country)} />
                <Tooltip formatter={(v: number) => fmt(v, country)} />
                <Legend />
                <Bar dataKey="EV" fill="#0E9F6E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ICE" fill="#A7AFA4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost breakdown */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Cost breakdown <InfoTooltip content="Breaks down total ownership costs into 5 categories: (1) Purchase price net of incentives, (2) Energy/fuel over the full period, (3) Maintenance (oil changes, brake pads, etc.), (4) Insurance premiums, (5) Resale value (shown as negative — it's money you get back)." /></h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={results.breakdownData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtShort(v, country)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v: number) => fmt(v, country)} />
                <Legend />
                <Bar dataKey="EV" fill="#0E9F6E" radius={[0, 4, 4, 0]} />
                <Bar dataKey="ICE" fill="#A7AFA4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CO₂ comparison */}
        <div className="bg-paper-200 border border-ink/10 rounded-card p-6 mb-8">
          <h3 className="text-sm font-semibold text-ink mb-3">CO₂ emissions comparison (annual) <InfoTooltip content="EV emissions come from the electricity grid (0.55 kg CO₂ per kWh — a Southeast Asian average including coal, gas, and renewables). ICE emissions use 2.31 kg CO₂ per litre of petrol (covers both tailpipe and refinery). EVs typically emit 50-70% less CO₂ even on a fossil-heavy grid." /></h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-ink-500 uppercase tracking-wide mb-1">EV</div>
              <div className="text-xl font-bold text-brand-700">{results.co2EvPerYear.toLocaleString()} kg CO₂</div>
              <div className="text-xs text-ink-500 mt-0.5">Includes grid electricity emissions</div>
            </div>
            <div>
              <div className="text-xs text-ink-500 uppercase tracking-wide mb-1">ICE</div>
              <div className="text-xl font-bold text-ink-700">{results.co2IcePerYear.toLocaleString()} kg CO₂</div>
              <div className="text-xs text-ink-500 mt-0.5">Tailpipe + refinery emissions</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-ink/10">
            <div className="text-sm text-brand-700 font-medium">
              EV saves {((1 - results.co2EvPerYear / results.co2IcePerYear) * 100).toFixed(0)}% CO₂ per year ({(results.co2IcePerYear - results.co2EvPerYear).toLocaleString()} kg avoided)
            </div>
          </div>
        </div>

        {/* Assumptions */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Key assumptions <InfoTooltip content="These are the default values used in the calculation. You can override the vehicle prices and driving distance above. Maintenance, insurance, and depreciation rates are simplified regional estimates — not a workshop invoice — and your actual numbers will vary." /></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-xs text-ink-500">
            <div className="flex items-center gap-1">Petrol price: {fmt(PETROL_PRICE[country], country, 2)}/litre <InfoTooltip content={PETROL_PRICE_NOTE[country]} /></div>
            <div>ICE consumption: {ICE_FUEL_CONSUMPTION_L100KM} L/100km</div>
            <div>EV efficiency: {DEFAULT_EV_EFFICIENCY} kWh/100km</div>
            <div className="flex items-center gap-1">Home tariff: {fmt(ELECTRICITY_TARIFF[country], country, 4)}/kWh <InfoTooltip content={RESIDENTIAL_TARIFF_NOTE[country]} /></div>
            <div>Public charging: ~{fmt(ELECTRICITY_TARIFF[country] * 1.8, country, 3)}/kWh</div>
            <div>EV depreciation: {EV_DEPRECIATION_RATE * 100}%/yr</div>
            <div>ICE depreciation: {ICE_DEPRECIATION_RATE * 100}%/yr</div>
            <div className="flex items-center gap-1">EV maintenance: {fmt(EV_ANNUAL_MAINTENANCE[country], country)}/yr <InfoTooltip content="Simplified regional estimate, not a workshop invoice. ICE is about 2.3–2.5× EV (Malaysia RM2,000 vs RM800 a year)." /></div>
            <div>ICE maintenance: {fmt(ICE_ANNUAL_MAINTENANCE[country], country)}/yr</div>
            <div className="flex items-center gap-1">EV insurance: {fmt(EV_INSURANCE[country], country)}/yr <InfoTooltip content="Simplified regional estimate, not a broker quote. Same class of assumption as the maintenance figures on this page." /></div>
            <div>ICE insurance: {fmt(ICE_INSURANCE[country], country)}/yr</div>
          </div>
          <p className="text-xs text-ink-400 mt-4">
            Defaults pair like-for-like compact SUVs — BYD Atto 3 vs Honda HR-V — so the purchase gap reflects a real EV premium rather than a vehicle-class mismatch. In Thailand the HR-V is sold only as a hybrid (a tougher-than-petrol benchmark). In Singapore the Atto 3 default is the SGCarMart COE-inclusive drive-away of S$181,888 (60.5 kWh, 20 May 2026); COE is included and moves with the quota. Listed prices already reflect each market&apos;s EV tax and rebate position. Maintenance, insurance, depreciation, road tax, and financing are simplified regional estimates — ICE maintenance is about 2.3–2.5× EV — not a workshop invoice. Rates last verified {RATE_VERIFIED_ON}. You can override the vehicle prices above.
          </p>
        </div>
      </section>

      <NextSteps route="/calculators/ev-vs-ice" />
    </main>
  )
}
