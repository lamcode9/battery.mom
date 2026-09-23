'use client'

import Link from 'next/link'
import InfoTooltip from '@/components/InfoTooltip'
import { CURRENCY_SYMBOLS as CURRENCY, COUNTRY_NAMES } from '@/lib/constants'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'

interface BESSProduct {
  name: string
  capacityKwh: number
  usableCapacityKwh: number
  roundTripEfficiency: number
  warrantyCycles: number
  warrantyYears: number
  continuousPowerKw: number
  peakPowerKw: number
  priceLocalCurrency: Record<string, number>
  v2xSupport: string
  manufacturer: string
  releaseYear: number
  isAvailable: boolean
}

interface BESSDetailClientProps {
  product: BESSProduct
  slug: string
}

export default function BESSDetailClient({ product, slug }: BESSDetailClientProps) {
  const formatCurrency = (amount: number, country: string) => {
    return `${CURRENCY[country]}${amount.toLocaleString('en-US')}`
  }

  // Degradation curve: LFP batteries lose ~2% capacity per 1000 cycles
  const degradationData = Array.from({ length: product.warrantyYears + 1 }, (_, year) => {
    const cyclesPerYear = product.warrantyCycles / product.warrantyYears
    const totalCycles = year * cyclesPerYear
    // LFP degradation: roughly 2% per 1000 cycles, floor at 70%
    const degradationRate = 0.02 * (totalCycles / 1000)
    const capacityPercent = Math.max(70, 100 * (1 - degradationRate))
    const usableKwh = product.usableCapacityKwh * (capacityPercent / 100)
    return {
      year,
      capacityPercent: Math.round(capacityPercent * 10) / 10,
      usableKwh: Math.round(usableKwh * 10) / 10,
      cycles: Math.round(totalCycles),
    }
  })

  // Cost per kWh per cycle across countries
  const costPerCycleData = Object.entries(product.priceLocalCurrency)
    .filter(([, price]) => price > 0)
    .map(([country, price]) => ({
      country: COUNTRY_NAMES[country] || country,
      countryCode: country,
      costPerKwhCycle: Math.round((price / (product.usableCapacityKwh * product.warrantyCycles)) * 1000) / 1000,
      price,
    }))
    .sort((a, b) => a.costPerKwhCycle - b.costPerKwhCycle)

  // Regional pricing comparison
  const pricingData = Object.entries(product.priceLocalCurrency)
    .filter(([, price]) => price > 0)
    .map(([country, price]) => ({
      country: COUNTRY_NAMES[country] || country,
      countryCode: country,
      price,
      priceFormatted: formatCurrency(price, country),
      // Normalize to USD equivalent for comparison (rough estimates)
      priceUsdEquiv: country === 'SG' ? price / 1.35 :
        country === 'MY' ? price / 4.7 :
        country === 'ID' ? price / 15800 :
        country === 'TH' ? price / 35 :
        country === 'VN' ? price / 25000 :
        country === 'PH' ? price / 56 : 0,
    }))

  // Performance radar data
  const maxCapacity = 20 // kWh for normalization
  const maxPower = 20 // kW
  const maxEfficiency = 100 // %
  const maxWarranty = 15 // years
  const maxCycles = 10000

  const radarData = [
    { metric: 'Capacity', value: (product.capacityKwh / maxCapacity) * 100, raw: `${product.capacityKwh} kWh` },
    { metric: 'Power', value: (product.continuousPowerKw / maxPower) * 100, raw: `${product.continuousPowerKw} kW` },
    { metric: 'Efficiency', value: product.roundTripEfficiency, raw: `${product.roundTripEfficiency}%` },
    { metric: 'Warranty', value: (product.warrantyYears / maxWarranty) * 100, raw: `${product.warrantyYears} yrs` },
    { metric: 'Cycles', value: (product.warrantyCycles / maxCycles) * 100, raw: `${product.warrantyCycles}` },
    { metric: 'Peak Power', value: (product.peakPowerKw / maxPower) * 100, raw: `${product.peakPowerKw} kW` },
  ]

  // Daily energy scenarios
  const dailyScenarios = [
    { scenario: 'Light Use', dailyKwh: 8, description: 'Small apartment, efficient appliances' },
    { scenario: 'Average Home', dailyKwh: 15, description: 'Typical family home' },
    { scenario: 'Heavy Use', dailyKwh: 25, description: 'Large home, AC, pool pump' },
    { scenario: 'Home + EV', dailyKwh: 35, description: 'Average home + daily EV charging' },
  ].map(s => ({
    ...s,
    hoursOfBackup: Math.round((product.usableCapacityKwh / (s.dailyKwh / 24)) * 10) / 10,
    daysOfPartialBackup: Math.round((product.usableCapacityKwh / (s.dailyKwh * 0.3)) * 10) / 10,
  }))

  return (
    <main className="min-h-screen pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/bess" className="hover:text-gray-700">Battery Storage</Link>
          <span>/</span>
          <Link href="/bess/home" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-600">{product.manufacturer}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{product.releaseYear}</span>
              <span className="text-gray-400">•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                product.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {product.isAvailable ? 'Available' : 'Discontinued'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                product.v2xSupport !== 'No' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
              }`}>
                {product.v2xSupport}
              </span>
            </div>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Capacity <InfoTooltip content="Total energy the battery can store. 'Usable capacity' is less because manufacturers reserve 5-10% to protect battery longevity (you can't fully drain or fill it). Always compare usable capacity when shopping." /></div>
            <div className="text-xl font-bold text-gray-900">
              {product.capacityKwh}<span className="text-sm font-normal text-gray-500 ml-1">kWh</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{product.usableCapacityKwh} kWh usable</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Efficiency <InfoTooltip content="Round-trip efficiency: the percentage of energy you get back out of the battery compared to what you put in. 95% means for every 10 kWh stored, you get 9.5 kWh back. The rest is lost as heat during charging and discharging." /></div>
            <div className="text-xl font-bold text-gray-900">
              {product.roundTripEfficiency}<span className="text-sm font-normal text-gray-500 ml-1">%</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Round-trip</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Power <InfoTooltip content="Continuous power (kW) is the steady output the battery can maintain indefinitely. Peak power is a short burst (seconds to minutes) for high-draw appliances like air conditioners or EV chargers starting up." /></div>
            <div className="text-xl font-bold text-gray-900">
              {product.continuousPowerKw}<span className="text-sm font-normal text-gray-500 ml-1">kW</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{product.peakPowerKw} kW peak</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Warranty <InfoTooltip content="Guaranteed minimum performance period. The battery is warranted for X years OR Y cycles (whichever comes first). Most LFP home batteries guarantee 70-80% capacity retention at end of warranty." /></div>
            <div className="text-xl font-bold text-gray-900">
              {product.warrantyYears}<span className="text-sm font-normal text-gray-500 ml-1">years</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{product.warrantyCycles.toLocaleString()} cycles</div>
          </div>
        </div>

        {/* Pricing by Country */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional pricing</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(product.priceLocalCurrency)
              .filter(([, price]) => price > 0)
              .map(([country, price]) => (
                <div key={country} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 mb-1">{COUNTRY_NAMES[country]}</div>
                  <div className="text-sm font-bold text-gray-900">{formatCurrency(price, country)}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    ~${Math.round(pricingData.find(p => p.countryCode === country)?.priceUsdEquiv || 0).toLocaleString()} USD
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Degradation Curve */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Battery degradation over time <InfoTooltip content="All batteries slowly lose capacity over time. LFP batteries typically lose ~2% per 1,000 full charge-discharge cycles. A well-used home battery doing 1 cycle/day would lose ~7% after 10 years. The curve shows estimated capacity remaining each year." /></h3>
            <p className="text-xs text-gray-500 mb-4">Estimated capacity retention over warranty period</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={degradationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} unit="%" domain={[60, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit=" kWh" />
                <ChartHoverTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="capacityPercent" stroke="#ef4444" strokeWidth={2} name="Capacity %" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="usableKwh" stroke="#10b981" strokeWidth={2} name="Usable kWh" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Radar */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Performance overview</h3>
            <p className="text-xs text-gray-500 mb-4">Relative performance across key metrics</p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={product.name} dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                <ChartHoverTooltip
                  formatter={(_value, _name, item) => {
                    const raw = item.payload?.raw
                    const metric = item.payload?.metric
                    return [
                      typeof raw === 'string' || typeof raw === 'number' ? raw : _value,
                      typeof metric === 'string' ? metric : 'Value',
                    ]
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Backup Duration Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Backup duration scenarios <InfoTooltip content="How long the battery can power your home during a blackout. 'Full backup' runs everything at your normal usage rate. 'Essential loads only (30%)' means fridge, lights, WiFi, and phone chargers, which extends backup time about 3x." /></h3>
          <p className="text-xs text-gray-500 mb-4">
            How long the {product.name} ({product.usableCapacityKwh} kWh usable) can power your home
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dailyScenarios.map(s => (
              <div key={s.scenario} className="border border-gray-100 rounded-lg p-4">
                <div className="font-medium text-gray-900 text-sm">{s.scenario}</div>
                <div className="text-xs text-gray-500 mb-3">{s.description}</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-gray-500">Full backup</div>
                    <div className="text-lg font-bold text-emerald-600">{s.hoursOfBackup} hours</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Essential loads only (30%)</div>
                    <div className="text-lg font-bold text-blue-600">{s.daysOfPartialBackup} days</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Battery specifications</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Capacity</span>
                <span className="font-medium">{product.capacityKwh} kWh</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Usable Capacity</span>
                <span className="font-medium">{product.usableCapacityKwh} kWh</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Round-Trip Efficiency</span>
                <span className="font-medium">{product.roundTripEfficiency}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Continuous Power</span>
                <span className="font-medium">{product.continuousPowerKw} kW</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Peak Power</span>
                <span className="font-medium">{product.peakPowerKw} kW</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Depth of Discharge <InfoTooltip content="DoD (Depth of Discharge) = usable capacity ÷ total capacity. A 95% DoD means you can use 95% of the battery's stored energy. Higher DoD = better value for money. LFP batteries typically have 90-95% DoD." /></span>
                <span className="font-medium">{Math.round((product.usableCapacityKwh / product.capacityKwh) * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Warranty and lifecycle</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Warranty Period</span>
                <span className="font-medium">{product.warrantyYears} years</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Warranty Cycles</span>
                <span className="font-medium">{product.warrantyCycles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Cycles per Year</span>
                <span className="font-medium">{Math.round(product.warrantyCycles / product.warrantyYears)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">V2X Support</span>
                <span className={`font-medium ${product.v2xSupport !== 'No' ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {product.v2xSupport}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Manufacturer</span>
                <span className="font-medium">{product.manufacturer}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Release Year</span>
                <span className="font-medium">{product.releaseYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Levelised Cost of Storage (LCOS) <InfoTooltip content="LCOS = purchase price ÷ (usable capacity × total warranty cycles). This is the cost per kWh per cycle, the unit cost of using the battery. Lower LCOS = better long-term value. Compare across countries and products." /></h3>
          <p className="text-xs text-gray-500 mb-4">Cost per kWh per cycle across Southeast Asian markets</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costPerCycleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="country" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartHoverTooltip
                formatter={(value: number) => [`$${value.toFixed(3)}/kWh-cycle`, 'Cost']}
              />
              <Bar dataKey="costPerKwhCycle" radius={[4, 4, 0, 0]}>
                {costPerCycleData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Navigation */}
        <div className="text-center py-8 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/bess/home"
              className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Zero-Bill Calculator
            </Link>
            <Link
              href="/bess"
              className="inline-flex items-center px-5 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              All BESS Solutions
            </Link>
            <Link
              href="/suggest-correction"
              className="inline-flex items-center px-5 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Suggest a correction
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
