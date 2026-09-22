'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Vehicle } from '@/types/vehicle'
import { useVehicleStore } from '@/store/VehicleStore'
import DataFreshness from '@/components/DataFreshness'
import InfoTooltip from '@/components/InfoTooltip'
import { CURRENCY_SYMBOLS as CURRENCY, COUNTRY_NAMES } from '@/lib/constants'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import ResponsiveContainer from '@/components/ResponsiveContainer'
import { ChartHoverTooltip } from '@/components/ChartTooltip'
import { CHART } from '@/lib/chart-theme'

interface VehicleDetailClientProps {
  vehicle: Vehicle
}

// Battery technology colors
const TECH_COLORS: Record<string, string> = {
  LFP: CHART.primary, // emerald
  NMC: CHART.highlight, // gold
  SolidState: CHART.comparison, // ink-green
  Other: CHART.comparisonLight, // gray-green
}

export default function VehicleDetailClient({ vehicle }: VehicleDetailClientProps) {
  const { addVehicle, selectedVehicles } = useVehicleStore()
  const [priceHistory, setPriceHistory] = useState<{date: string; basePrice: number}[]>([])
  const [priceMetrics, setPriceMetrics] = useState<{priceChange: number | null; priceChangePercent: number | null; dataPoints: number} | null>(null)

  useEffect(() => {
    fetch(`/api/vehicles/${vehicle.id}/price-history`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.history?.length > 0) {
          setPriceHistory(data.history)
          setPriceMetrics(data.metrics)
        }
      })
      .catch(() => {}) // Silent fail — price history is optional
  }, [vehicle.id])

  const handleCompareClick = () => {
    // Add this vehicle to the comparison if not already selected
    if (!selectedVehicles.find(v => v.id === vehicle.id)) {
      addVehicle(vehicle)
    }
    // Navigate to comparison page (will happen via Link)
  }
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '—'
    return `${CURRENCY[vehicle.country]}${amount.toLocaleString('en-US')}`
  }

  // Calculate range at different speeds (simplified model)
  const rangeData = [
    { speed: 'City (30 km/h)', range: Math.round((vehicle.rangeKm || vehicle.rangeWltpKm || 0) * 1.2) },
    { speed: 'Highway (80 km/h)', range: Math.round((vehicle.rangeKm || vehicle.rangeWltpKm || 0) * 0.85) },
    { speed: 'Mixed (60 km/h)', range: vehicle.rangeKm || vehicle.rangeWltpKm || 0 },
  ]

  // Energy consumption breakdown (estimated)
  const energyBreakdown = [
    { name: 'Motor/Drive', value: Math.round((vehicle.efficiencyKwhPer100km || 0) * 0.6), color: CHART.primary },
    { name: 'HVAC/Climate', value: Math.round((vehicle.efficiencyKwhPer100km || 0) * 0.15), color: CHART.highlight },
    { name: 'Electronics', value: Math.round((vehicle.efficiencyKwhPer100km || 0) * 0.1), color: CHART.comparison },
    { name: 'Charging Loss', value: Math.round((vehicle.efficiencyKwhPer100km || 0) * 0.08), color: CHART.negative },
    { name: 'Other', value: Math.round((vehicle.efficiencyKwhPer100km || 0) * 0.07), color: CHART.comparisonLight },
  ].filter(item => item.value > 0)

  // Battery degradation over 10 years (simplified)
  const degradationData = Array.from({ length: 11 }, (_, year) => ({
    year: year,
    capacity: Math.max(70, 100 - (year * 2.5)), // 2.5% degradation per year, floor at 70%
    range: Math.max(
      Math.round(((vehicle.rangeKm || vehicle.rangeWltpKm || 0) * (100 - (year * 2.5))) / 100),
      Math.round((vehicle.rangeKm || vehicle.rangeWltpKm || 0) * 0.7)
    ),
  }))

  // Charging time estimates
  const chargingData = [
    { method: 'DC Fast (150kW)', time: vehicle.chargingTimeDc0To80Min ? `${vehicle.chargingTimeDc0To80Min} min` : 'N/A', energy: '80%' },
    { method: 'DC Fast (50kW)', time: vehicle.chargingTimeDc0To80Min ? `${Math.round(vehicle.chargingTimeDc0To80Min * 3)} min` : 'N/A', energy: '80%' },
    { method: 'AC Home (11kW)', time: `${Math.round((vehicle.batteryCapacityKwh || 0) * 0.8 / 11 * 60)} min`, energy: '80%' },
    { method: 'AC Public (22kW)', time: `${Math.round((vehicle.batteryCapacityKwh || 0) * 0.8 / 22 * 60)} min`, energy: '80%' },
  ]

  return (
    <main className="min-h-screen pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-ink-500 mb-4">
            <Link href="/ev" className="hover:text-ink-700">Electric Vehicles</Link>
            <span>/</span>
            <span className="text-ink">{vehicle.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-ink tracking-tight mb-2">
                {vehicle.name}
                {vehicle.modelTrim && <span className="text-ink-600"> {vehicle.modelTrim}</span>}
              </h1>
              <div className="flex items-center gap-4 text-lg text-ink-600 mb-3">
                <span className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    vehicle.isAvailable ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </span>
                <span>{COUNTRY_NAMES[vehicle.country]}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  vehicle.batteryTechnology === 'LFP' ? 'bg-brand-50 text-brand-700' :
                  vehicle.batteryTechnology === 'NMC' ? 'bg-blue-50 text-blue-700' :
                  'bg-paper-200 text-ink-700'
                }`}>
                  {vehicle.batteryTechnology || 'Unknown'} Battery
                </span>
              </div>
              <DataFreshness lastUpdated={new Date(vehicle.updatedAt)} />
            </div>

            {vehicle.basePriceLocalCurrency && (
              <div className="lg:text-right">
                <div className="text-3xl font-bold text-ink mb-1">
                  {formatCurrency(vehicle.basePriceLocalCurrency)}
                </div>
                <div className="text-sm text-ink-500 flex items-center gap-1">
                  {vehicle.country === 'SG'
                    ? 'Drive-away price'
                    : 'Base price (before options)'}
                  <InfoTooltip
                    content={
                      vehicle.country === 'SG'
                        ? 'Tesla Model 3/Y RWD and BYD Atto 3 Extended are sourced COE-inclusive drive-away quotes. COE is included and moves with the quota. Other Singapore rows may still show a manufacturer "from" price. We did not add an estimated COE on top. Confirm the OTR cheque on SGCarMart.'
                        : 'Manufacturer starting price in local currency before optional extras. Malaysia OTR figures are Peninsular list prices where sourced and exclude insurance unless noted.'
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1 flex items-center gap-1">Range <InfoTooltip content="Maximum distance on a full charge under standardised test conditions. Real-world range is typically 10–20% less due to climate, driving style, and terrain." /></div>
            <div className="text-xl font-bold text-ink">
              {vehicle.rangeKm || vehicle.rangeWltpKm || 'N/A'}
              {vehicle.rangeKm && <span className="text-sm font-normal text-ink-500 ml-1">km</span>}
            </div>
            <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-1">
              {vehicle.rangeWltpKm ? 'WLTP' : vehicle.rangeEpaKm ? 'EPA' : 'Real-world'}
              <InfoTooltip content="WLTP is the European test standard. EPA is the US standard and generally more conservative. Real-world estimates account for typical driving conditions." />
            </div>
          </div>

          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1 flex items-center gap-1">Efficiency <InfoTooltip content="How much energy the car uses per 100 km, the EV equivalent of litres per 100 km. Lower is better. A typical EV uses 14–20 kWh/100 km." /></div>
            <div className="text-xl font-bold text-ink">
              {vehicle.efficiencyKwhPer100km || 'N/A'}
              {vehicle.efficiencyKwhPer100km && <span className="text-sm font-normal text-ink-500 ml-1">kWh/100km</span>}
            </div>
            <div className="text-xs text-ink-500 mt-0.5">Energy consumption</div>
          </div>

          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1 flex items-center gap-1">Battery <InfoTooltip content="Total energy the battery can store, in kilowatt-hours. Larger capacity generally means longer range, and also more weight and cost." /></div>
            <div className="text-xl font-bold text-ink">
              {vehicle.batteryCapacityKwh || 'N/A'}
              {vehicle.batteryCapacityKwh && <span className="text-sm font-normal text-ink-500 ml-1">kWh</span>}
            </div>
            <div className="text-xs text-ink-500 mt-0.5">{vehicle.batteryManufacturer || 'Unknown'} {vehicle.batteryTechnology}</div>
          </div>

          <div className="bg-paper-100 border border-ink/10 rounded-card p-5">
            <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1 flex items-center gap-1">0-100 km/h <InfoTooltip content="Time in seconds from standstill to 100 km/h (≈ 0-60 mph). EVs deliver instant torque, so they often out-accelerate comparable petrol cars." /></div>
            <div className="text-xl font-bold text-ink">
              {vehicle.acceleration0To100Kmh || 'N/A'}
              {vehicle.acceleration0To100Kmh && <span className="text-sm font-normal text-ink-500 ml-1">sec</span>}
            </div>
            <div className="text-xs text-ink-500 mt-0.5">Acceleration</div>
          </div>
        </div>

        {/* Performance & Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Specs */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">Performance and dimensions</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-600 flex items-center gap-1">Power <InfoTooltip content="Peak motor output in kilowatts. 1 kW ≈ 1.34 horsepower. Higher power means faster acceleration and higher top speeds." /></span>
                <span className="font-medium">{vehicle.powerRatingKw || 'N/A'} kW</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-600 flex items-center gap-1">Torque <InfoTooltip content="Rotational force in Newton-metres. EVs deliver peak torque instantly from zero rpm, giving quick off-the-line acceleration compared to petrol cars." /></span>
                <span className="font-medium">{vehicle.torqueNm || 'N/A'} Nm</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-600">Top Speed</span>
                <span className="font-medium">{vehicle.topSpeedKmh || 'N/A'} km/h</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-600 flex items-center gap-1">Curb Weight <InfoTooltip content="Total vehicle weight with all fluids and a full battery, but without passengers or cargo." /></span>
                <span className="font-medium">{vehicle.curbWeightKg || 'N/A'} kg</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-600">Battery Weight</span>
                <span className="font-medium">{vehicle.batteryWeightKg || 'N/A'} kg</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-600 flex items-center gap-1">Battery % of Weight <InfoTooltip content="What fraction of the car's total weight is the battery pack. Typically 25–40% for EVs. Heavier batteries add range but reduce efficiency." /></span>
                <span className="font-medium">{vehicle.batteryWeightPercentage || 'N/A'}%</span>
              </div>
            </div>
          </div>

          {/* Battery & Warranty */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">Battery and warranty</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-600">Battery Warranty</span>
                <span className="font-medium">{vehicle.batteryWarranty || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-600 flex items-center gap-1">Bidirectional <InfoTooltip content="Can this car send power back to your home (V2H) or the grid (V2G)? Useful for backup power during outages or selling stored energy back." /></span>
                <span className={`font-medium ${vehicle.hasBidirectional ? 'text-brand-700' : 'text-ink-500'}`}>
                  {vehicle.hasBidirectional ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ink/5">
                <span className="text-ink-600 flex items-center gap-1">OTA Updates <InfoTooltip content="Over-the-Air software updates pushed to your car remotely, the way a phone gets an update. Can add features or fix bugs without visiting a dealer." /></span>
                <span className="font-medium">{vehicle.otaUpdates || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-600">Battery Manufacturer</span>
                <span className="font-medium">{vehicle.batteryManufacturer || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Range at Different Speeds */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-1">Range by driving style <InfoTooltip content="Estimates using multipliers on rated range: City ×1.2 (regen braking helps), Highway ×0.85 (air resistance), Mixed ×1.0. Real-world results depend on terrain, weather, and driving habits." /></h3>
            <p className="text-xs text-ink-500 mb-4">Estimated range at different average speeds</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rangeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="speed" tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} />
                <YAxis tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} unit=" km" />
                <ChartHoverTooltip />
                <Bar dataKey="range" fill={CHART.primary} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Energy consumption breakdown */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-1">Energy consumption breakdown <InfoTooltip content="Industry-average energy split: Motor ~60%, Climate ~15%, Electronics ~10%, Charging losses ~8%, Other ~7%. These are typical proportions, not vehicle-specific measurements." /></h3>
            <p className="text-xs text-ink-500 mb-4">Where the {vehicle.efficiencyKwhPer100km} kWh/100km goes</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={energyBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {energyBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartHoverTooltip formatter={(value) => [`${value} kWh/100km`, '']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Battery Degradation */}
        <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
          <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-1">Battery degradation over time <InfoTooltip content="Assumes 2.5% capacity loss per year with a floor at 70%. Actual degradation depends on climate, charging habits, and chemistry. LFP batteries typically degrade slower than NMC." /></h3>
          <p className="text-xs text-ink-500 mb-4">Estimated capacity and range retention (2.5% degradation/year)</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={degradationData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="year" tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} unit=" years" />
              <YAxis yAxisId="left" tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} unit="%" domain={[60, 100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} unit=" km" />
              <ChartHoverTooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="capacity" stroke={CHART.negative} strokeWidth={2} name="Battery capacity" />
              <Line yAxisId="right" type="monotone" dataKey="range" stroke={CHART.primary} strokeWidth={2} name="Range" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Price History (only shown if data exists) */}
        {priceHistory.length > 0 && (
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-ink">Price history</h3>
              {priceMetrics?.priceChange !== null && priceMetrics?.priceChange !== undefined && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  priceMetrics.priceChange > 0 ? 'bg-red-50 text-red-700' :
                  priceMetrics.priceChange < 0 ? 'bg-brand-50 text-brand-700' :
                  'bg-paper-200 text-ink-700'
                }`}>
                  {priceMetrics.priceChange > 0 ? '+' : ''}{priceMetrics.priceChangePercent}% since tracking
                </span>
              )}
            </div>
            <p className="text-xs text-ink-500 mb-4">Monthly price snapshots in local currency</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="date" tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} />
                <YAxis tick={{ fontSize: CHART.axisFontSize, fill: CHART.axis }} />
                <ChartHoverTooltip
                  formatter={(value: number) => [formatCurrency(value), 'Base Price']}
                />
                <Line type="monotone" dataKey="basePrice" stroke={CHART.primary} strokeWidth={2} dot={{ r: 3 }} name="Base Price" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Charging Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Charging Times */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">Charging times</h3>
            <div className="space-y-3">
              {chargingData.map((charge) => (
                <div key={charge.method} className="flex justify-between items-center py-2 border-b border-ink/5 last:border-b-0">
                  <div>
                    <div className="font-medium text-ink">{charge.method}</div>
                    <div className="text-xs text-ink-500">to {charge.energy}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{charge.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-500 mt-3">
              {vehicle.chargingCapabilities || 'Standard charging capabilities'}
            </p>
          </div>

          {/* Options & Pricing */}
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">Options and pricing</h3>
            {vehicle.optionPrices && vehicle.optionPrices.length > 0 ? (
              <div className="space-y-3 mb-4">
                {vehicle.optionPrices.map((option, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-ink/5 last:border-b-0">
                    <span className="text-ink-600">{option.name}</span>
                    <span className="font-medium">{formatCurrency(option.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink-500 text-sm mb-4">No optional equipment listed</p>
            )}

            {vehicle.rebates && vehicle.rebates.length > 0 && (
              <div className="mt-4 pt-4 border-t border-ink/5">
                <h4 className="text-sm font-semibold text-ink mb-2">Available rebates</h4>
                <div className="space-y-2">
                  {vehicle.rebates.map((rebate, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-ink-600">{rebate.name}</span>
                        <span className="font-medium text-brand-700">-{formatCurrency(rebate.amount)}</span>
                      </div>
                      {rebate.description && (
                        <p className="text-xs text-ink-500 mt-0.5">{rebate.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technology Features */}
        {vehicle.technologyFeatures && (
          <div className="bg-paper-100 border border-ink/10 rounded-card p-6 mb-8">
            <h3 className="text-lg font-semibold text-ink mb-3">Technology features</h3>
            <p className="text-ink-600 leading-relaxed">{vehicle.technologyFeatures}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="text-center py-8 border-t border-ink/10">
          <p className="text-ink-600 text-sm mb-4">Compare with other vehicles</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/ev"
              onClick={handleCompareClick}
              className="inline-flex items-center px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Compare This Vehicle
            </Link>
            <Link
              href="/ev"
              className="inline-flex items-center px-5 py-2.5 bg-paper-100 text-ink-800 border border-ink/15 rounded-lg hover:bg-paper-200 transition-colors text-sm font-medium"
            >
              Back to Comparison
            </Link>
            <Link
              href="/calculators/ev-vs-ice"
              className="inline-flex items-center px-5 py-2.5 bg-paper-100 text-ink-800 border border-ink/15 rounded-lg hover:bg-paper-200 transition-colors text-sm font-medium"
            >
              TCO Calculator
            </Link>
            <Link
              href="/suggest-correction"
              className="inline-flex items-center px-5 py-2.5 bg-paper-100 text-ink-800 border border-ink/15 rounded-lg hover:bg-paper-200 transition-colors text-sm font-medium"
            >
              Suggest a correction
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}