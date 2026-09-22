'use client'

import Link from 'next/link'
import InfoTooltip from '@/components/InfoTooltip'
import { CURRENCY_SYMBOLS as CURRENCY, COUNTRY_NAMES } from '@/lib/constants'
import { Vehicle } from '@/types/vehicle'
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { CHART, CHART_TOOLTIP_STYLE } from '@/lib/chart-theme'

interface VehicleComparisonClientProps {
  vehicle1: Vehicle
  vehicle2: Vehicle
}

// Battery technology colors
const TECH_COLORS: Record<string, string> = {
  LFP: CHART.primary, // emerald
  NMC: CHART.highlight, // gold
  SolidState: CHART.comparison, // ink-green
  Other: CHART.comparisonLight, // gray-green
}

export default function VehicleComparisonClient({ vehicle1, vehicle2 }: VehicleComparisonClientProps) {
  // Format currency
  const formatCurrency = (amount: number, country: string) => {
    return `${CURRENCY[country as keyof typeof CURRENCY]}${amount.toLocaleString('en-US')}`
  }

  // Format value or N/A
  const formatValue = (value: number | null | undefined, unit: string = '') => {
    return value ? `${value}${unit}` : 'N/A'
  }

  // Calculate comparison data for charts
  const rangeComparison = [
    {
      metric: 'Range',
      [vehicle1.name]: vehicle1.rangeKm || vehicle1.rangeWltpKm || 0,
      [vehicle2.name]: vehicle2.rangeKm || vehicle2.rangeWltpKm || 0,
    },
  ]

  const efficiencyComparison = [
    {
      metric: 'Efficiency',
      [vehicle1.name]: vehicle1.efficiencyKwhPer100km || 0,
      [vehicle2.name]: vehicle2.efficiencyKwhPer100km || 0,
    },
  ]

  const priceComparison = [
    {
      metric: 'Base Price',
      [vehicle1.name]: vehicle1.basePriceLocalCurrency || 0,
      [vehicle2.name]: vehicle2.basePriceLocalCurrency || 0,
    },
  ]

  // Radar chart data (normalized 0-100 scale)
  const maxRange = Math.max(vehicle1.rangeKm || vehicle1.rangeWltpKm || 0, vehicle2.rangeKm || vehicle2.rangeWltpKm || 0)
  const maxEfficiency = Math.max(vehicle1.efficiencyKwhPer100km || 0, vehicle2.efficiencyKwhPer100km || 0)
  const maxPower = Math.max(vehicle1.powerRatingKw || 0, vehicle2.powerRatingKw || 0)
  const maxTorque = Math.max(vehicle1.torqueNm || 0, vehicle2.torqueNm || 0)
  const maxBattery = Math.max(vehicle1.batteryCapacityKwh || 0, vehicle2.batteryCapacityKwh || 0)

  const radarData = [
    {
      metric: 'Range',
      [vehicle1.name]: maxRange > 0 ? ((vehicle1.rangeKm || vehicle1.rangeWltpKm || 0) / maxRange) * 100 : 0,
      [vehicle2.name]: maxRange > 0 ? ((vehicle2.rangeKm || vehicle2.rangeWltpKm || 0) / maxRange) * 100 : 0,
    },
    {
      metric: 'Efficiency',
      [vehicle1.name]: maxEfficiency > 0 ? (1 - (vehicle1.efficiencyKwhPer100km || 0) / maxEfficiency) * 100 : 0,
      [vehicle2.name]: maxEfficiency > 0 ? (1 - (vehicle2.efficiencyKwhPer100km || 0) / maxEfficiency) * 100 : 0,
    },
    {
      metric: 'Power',
      [vehicle1.name]: maxPower > 0 ? ((vehicle1.powerRatingKw || 0) / maxPower) * 100 : 0,
      [vehicle2.name]: maxPower > 0 ? ((vehicle2.powerRatingKw || 0) / maxPower) * 100 : 0,
    },
    {
      metric: 'Torque',
      [vehicle1.name]: maxTorque > 0 ? ((vehicle1.torqueNm || 0) / maxTorque) * 100 : 0,
      [vehicle2.name]: maxTorque > 0 ? ((vehicle2.torqueNm || 0) / maxTorque) * 100 : 0,
    },
    {
      metric: 'Battery',
      [vehicle1.name]: maxBattery > 0 ? ((vehicle1.batteryCapacityKwh || 0) / maxBattery) * 100 : 0,
      [vehicle2.name]: maxBattery > 0 ? ((vehicle2.batteryCapacityKwh || 0) / maxBattery) * 100 : 0,
    },
  ]

  // Performance specs comparison
  const specsComparison = [
    {
      category: 'Performance',
      specs: [
        { label: 'Power', v1: formatValue(vehicle1.powerRatingKw, ' kW'), v2: formatValue(vehicle2.powerRatingKw, ' kW') },
        { label: 'Torque', v1: formatValue(vehicle1.torqueNm, ' Nm'), v2: formatValue(vehicle2.torqueNm, ' Nm') },
        { label: '0-100 km/h', v1: formatValue(vehicle1.acceleration0To100Kmh, ' sec'), v2: formatValue(vehicle2.acceleration0To100Kmh, ' sec') },
        { label: 'Top Speed', v1: formatValue(vehicle1.topSpeedKmh, ' km/h'), v2: formatValue(vehicle2.topSpeedKmh, ' km/h') },
      ],
    },
    {
      category: 'Range & Efficiency',
      specs: [
        { label: 'Range', v1: formatValue(vehicle1.rangeKm || vehicle1.rangeWltpKm, ' km'), v2: formatValue(vehicle2.rangeKm || vehicle2.rangeWltpKm, ' km') },
        { label: 'Efficiency', v1: formatValue(vehicle1.efficiencyKwhPer100km, ' kWh/100km'), v2: formatValue(vehicle2.efficiencyKwhPer100km, ' kWh/100km') },
        { label: 'Battery Capacity', v1: formatValue(vehicle1.batteryCapacityKwh, ' kWh'), v2: formatValue(vehicle2.batteryCapacityKwh, ' kWh') },
        { label: 'Battery Weight', v1: formatValue(vehicle1.batteryWeightKg, ' kg'), v2: formatValue(vehicle2.batteryWeightKg, ' kg') },
      ],
    },
    {
      category: 'Dimensions & Weight',
      specs: [
        { label: 'Curb Weight', v1: formatValue(vehicle1.curbWeightKg, ' kg'), v2: formatValue(vehicle2.curbWeightKg, ' kg') },
        { label: 'Battery Weight', v1: formatValue(vehicle1.batteryWeightKg, ' kg'), v2: formatValue(vehicle2.batteryWeightKg, ' kg') },
        { label: 'Battery % of Weight', v1: formatValue(vehicle1.batteryWeightPercentage, '%'), v2: formatValue(vehicle2.batteryWeightPercentage, '%') },
      ],
    },
    {
      category: 'Battery & Charging',
      specs: [
        { label: 'Battery Technology', v1: vehicle1.batteryTechnology || 'N/A', v2: vehicle2.batteryTechnology || 'N/A' },
        { label: 'Battery Manufacturer', v1: vehicle1.batteryManufacturer || 'N/A', v2: vehicle2.batteryManufacturer || 'N/A' },
        { label: 'Battery Warranty', v1: vehicle1.batteryWarranty || 'N/A', v2: vehicle2.batteryWarranty || 'N/A' },
        { label: 'DC Fast Charge (0-80%)', v1: formatValue(vehicle1.chargingTimeDc0To80Min, ' min'), v2: formatValue(vehicle2.chargingTimeDc0To80Min, ' min') },
        { label: 'Charging Capabilities', v1: vehicle1.chargingCapabilities || 'N/A', v2: vehicle2.chargingCapabilities || 'N/A' },
        { label: 'Bidirectional Charging', v1: vehicle1.hasBidirectional ? 'Yes' : 'No', v2: vehicle2.hasBidirectional ? 'Yes' : 'No' },
      ],
    },
    {
      category: 'Pricing',
      specs: [
        { label: 'Base Price', v1: vehicle1.basePriceLocalCurrency ? formatCurrency(vehicle1.basePriceLocalCurrency, vehicle1.country) : 'N/A', v2: vehicle2.basePriceLocalCurrency ? formatCurrency(vehicle2.basePriceLocalCurrency, vehicle2.country) : 'N/A' },
        { label: 'On-the-Road Price', v1: vehicle1.onTheRoadPriceLocalCurrency ? formatCurrency(vehicle1.onTheRoadPriceLocalCurrency, vehicle1.country) : 'N/A', v2: vehicle2.onTheRoadPriceLocalCurrency ? formatCurrency(vehicle2.onTheRoadPriceLocalCurrency, vehicle2.country) : 'N/A' },
      ],
    },
  ]

  return (
    <main className="min-h-screen pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-ink-500 mb-4">
            <Link href="/ev" className="hover:text-ink-700">Electric Vehicles</Link>
            <span>/</span>
            <span className="text-ink">Compare</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            {/* Vehicle 1 */}
            <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-ink mb-1">
                    {vehicle1.name}
                    {vehicle1.modelTrim && <span className="text-ink-600"> {vehicle1.modelTrim}</span>}
                  </h2>
                  <p className="text-sm text-ink-500">{COUNTRY_NAMES[vehicle1.country]}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  vehicle1.batteryTechnology === 'LFP' ? 'bg-brand-50 text-brand-700' :
                  vehicle1.batteryTechnology === 'NMC' ? 'bg-blue-50 text-blue-700' :
                  'bg-paper-200 text-ink-700'
                }`}>
                  {vehicle1.batteryTechnology || 'Unknown'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-ink">
                    {vehicle1.rangeKm || vehicle1.rangeWltpKm || 'N/A'}
                  </div>
                  <div className="text-xs text-ink-500">Range (km)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ink">
                    {vehicle1.efficiencyKwhPer100km || 'N/A'}
                  </div>
                  <div className="text-xs text-ink-500">kWh/100km</div>
                </div>
              </div>

              <Link
                href={`/ev/${vehicle1.id}`}
                className="inline-flex items-center text-sm text-brand-700 hover:text-brand-800 font-medium"
              >
                View full details →
              </Link>
            </div>

            {/* Vehicle 2 */}
            <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-ink mb-1">
                    {vehicle2.name}
                    {vehicle2.modelTrim && <span className="text-ink-600"> {vehicle2.modelTrim}</span>}
                  </h2>
                  <p className="text-sm text-ink-500">{COUNTRY_NAMES[vehicle2.country]}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  vehicle2.batteryTechnology === 'LFP' ? 'bg-brand-50 text-brand-700' :
                  vehicle2.batteryTechnology === 'NMC' ? 'bg-blue-50 text-blue-700' :
                  'bg-paper-200 text-ink-700'
                }`}>
                  {vehicle2.batteryTechnology || 'Unknown'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-ink">
                    {vehicle2.rangeKm || vehicle2.rangeWltpKm || 'N/A'}
                  </div>
                  <div className="text-xs text-ink-500">Range (km)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ink">
                    {vehicle2.efficiencyKwhPer100km || 'N/A'}
                  </div>
                  <div className="text-xs text-ink-500">kWh/100km</div>
                </div>
              </div>

              <Link
                href={`/ev/${vehicle2.id}`}
                className="inline-flex items-center text-sm text-brand-700 hover:text-brand-800 font-medium"
              >
                View full details →
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Range Comparison */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Range comparison</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rangeComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="metric" tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} />
                <YAxis tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} unit=" km" />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value} km`, '']} />
                <Bar dataKey={vehicle1.name} fill={CHART.primary} radius={[3, 3, 0, 0]} />
                <Bar dataKey={vehicle2.name} fill={CHART.highlight} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Efficiency comparison */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Efficiency comparison <InfoTooltip content="Energy consumed per 100 km (kWh/100km). Lower is better. The car travels further on the same energy. Typical range: 13-22 kWh/100km depending on vehicle size, weight, and aerodynamics." /></h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={efficiencyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="metric" tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} />
                <YAxis tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} unit=" kWh/100km" />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value} kWh/100km`, '']} />
                <Bar dataKey={vehicle1.name} fill={CHART.primary} radius={[3, 3, 0, 0]} />
                <Bar dataKey={vehicle2.name} fill={CHART.highlight} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Price Comparison */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-4">Price comparison</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priceComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="metric" tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} />
                <YAxis tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} tickFormatter={(value) => formatCurrency(value, vehicle1.country)} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [formatCurrency(value, vehicle1.country), '']} />
                <Bar dataKey={vehicle1.name} fill={CHART.primary} radius={[3, 3, 0, 0]} />
                <Bar dataKey={vehicle2.name} fill={CHART.highlight} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <h3 className="text-sm font-semibold text-ink mb-1">Performance Overview <InfoTooltip content="Each metric is normalised to a 0-100 scale where 100 = the better vehicle on that dimension. For efficiency, lower kWh/100km is better so the scale is inverted. A larger shape means stronger overall performance." /></h3>
          <p className="text-xs text-ink-500 mb-4">Normalized comparison across key metrics (higher is better)</p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} />
              <Radar name={vehicle1.name} dataKey={vehicle1.name} stroke={CHART.primary} fill={CHART.primary} fillOpacity={0.1} strokeWidth={2} />
              <Radar name={vehicle2.name} dataKey={vehicle2.name} stroke={CHART.highlight} fill={CHART.highlight} fillOpacity={0.1} strokeWidth={2} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Specs Comparison */}
        <div className="space-y-6 mb-8">
          {specsComparison.map((category) => (
            <div key={category.category} className="bg-paper-100 border border-ink/10 rounded-card overflow-hidden">
              <div className="px-6 py-4 border-b border-ink/5">
                <h3 className="text-lg font-semibold text-ink">{category.category}</h3>
              </div>
              <div className="divide-y divide-ink/5">
                {category.specs.map((spec, index) => (
                  <div key={index} className="px-6 py-3 grid grid-cols-3 gap-4">
                    <div className="font-medium text-ink">{spec.label}</div>
                    <div className="text-ink-700">{spec.v1}</div>
                    <div className="text-ink-700">{spec.v2}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Technology Features Comparison */}
        {(vehicle1.technologyFeatures || vehicle2.technologyFeatures) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {vehicle1.technologyFeatures && (
              <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
                <h3 className="text-lg font-semibold text-ink mb-3">{vehicle1.name} Features</h3>
                <p className="text-ink-600 leading-relaxed">{vehicle1.technologyFeatures}</p>
              </div>
            )}
            {vehicle2.technologyFeatures && (
              <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
                <h3 className="text-lg font-semibold text-ink mb-3">{vehicle2.name} Features</h3>
                <p className="text-ink-600 leading-relaxed">{vehicle2.technologyFeatures}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="text-center py-8 border-t border-ink/10">
          <p className="text-ink-600 text-sm mb-4">Compare more vehicles or view detailed specs</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/ev"
              className="inline-flex items-center px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Back to All Vehicles
            </Link>
            <Link
              href={`/ev/${vehicle1.id}`}
              className="inline-flex items-center px-5 py-2.5 bg-paper-100 text-ink-800 border border-ink/15 rounded-lg hover:bg-paper-200 transition-colors text-sm font-medium"
            >
              {vehicle1.name} Details
            </Link>
            <Link
              href={`/ev/${vehicle2.id}`}
              className="inline-flex items-center px-5 py-2.5 bg-paper-100 text-ink-800 border border-ink/15 rounded-lg hover:bg-paper-200 transition-colors text-sm font-medium"
            >
              {vehicle2.name} Details
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}