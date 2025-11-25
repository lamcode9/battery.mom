'use client'

import { useState, useMemo, ReactNode } from 'react'
import { useVehicleStore } from '@/store/VehicleStore'
import Image from 'next/image'
import { Vehicle } from '@/types/vehicle'
import Papa from 'papaparse'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { estimateCostPerKm, getElectricityRate } from '@/lib/utils'

type SortField = 'name' | 'rangeKm' | 'efficiencyKwhPer100km' | 'onTheRoadPriceLocalCurrency' | 'powerRatingKw' | 'batteryWeightKg'
type SortDirection = 'asc' | 'desc'

export default function ComparisonTable() {
  const { selectedVehicles, clearAll } = useVehicleStore()
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const formatPrice = (price: number, country: 'SG' | 'MY', digits: number = 0) => {
    const currency = country === 'SG' ? 'SGD' : 'MYR'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(price)
  }

  const formatCostPerKm = (value: number, country: 'SG' | 'MY') =>
    formatPrice(value, country, 2)

  const getCostPerKm = (vehicle: Vehicle) =>
    estimateCostPerKm(vehicle.country, vehicle.batteryWeightKg, vehicle.rangeKm)

  const vehicleColors = ['#0ea5e9', '#10b981', '#f97316', '#a855f7']

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    if (!sortField) return selectedVehicles

    return [...selectedVehicles].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [selectedVehicles, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getBestValue = (field: keyof Vehicle, higherIsBetter: boolean = true) => {
    if (selectedVehicles.length === 0) return null
    const values = selectedVehicles.map(v => v[field] as number)
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values)
    return best
  }

  const exportToCSV = () => {
    const data = selectedVehicles.map(v => ({
      Name: v.name,
      'Model/Trim': v.modelTrim,
      'Battery Weight (kg)': v.batteryWeightKg,
      'Vehicle Weight (kg)': v.curbWeightKg,
      'Battery Weight %': v.batteryWeightPercentage,
      'Power (kW)': v.powerRatingKw,
      'Efficiency (kWh/100km)': v.efficiencyKwhPer100km,
      'Range (km)': v.rangeKm,
      'Cost / km': getCostPerKm(v),
      'Base Price': v.basePriceLocalCurrency,
      'On The Road Price': v.onTheRoadPriceLocalCurrency,
      'Battery Manufacturer': v.batteryManufacturer,
      'Battery Technology': v.batteryTechnology,
      'Charging Time 0-80% (min)': v.chargingTimeDc0To80Min,
      'Charging Capabilities': v.chargingCapabilities,
    }))

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ev-comparison-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const generateInsights = () => {
    if (selectedVehicles.length < 2) return []

    const insights: string[] = []
    const ranges = selectedVehicles.map(v => v.rangeKm)
    const prices = selectedVehicles.map(v => v.onTheRoadPriceLocalCurrency)
    const efficiencies = selectedVehicles.map(v => v.efficiencyKwhPer100km)

    const maxRange = Math.max(...ranges)
    const minRange = Math.min(...ranges)
    const maxRangeVehicle = selectedVehicles.find(v => v.rangeKm === maxRange)
    const minRangeVehicle = selectedVehicles.find(v => v.rangeKm === minRange)

    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const maxPriceVehicle = selectedVehicles.find(v => v.onTheRoadPriceLocalCurrency === maxPrice)
    const minPriceVehicle = selectedVehicles.find(v => v.onTheRoadPriceLocalCurrency === minPrice)

    const minEfficiency = Math.min(...efficiencies)
    const maxEfficiency = Math.max(...efficiencies)
    const minEfficiencyVehicle = selectedVehicles.find(v => v.efficiencyKwhPer100km === minEfficiency)
    const maxEfficiencyVehicle = selectedVehicles.find(v => v.efficiencyKwhPer100km === maxEfficiency)

    if (maxRangeVehicle && minRangeVehicle && maxRangeVehicle.id !== minRangeVehicle.id) {
      const diff = ((maxRange - minRange) / minRange) * 100
      insights.push(
        `${maxRangeVehicle.name} wins on range (${maxRange}km) but costs ${((maxPrice - minPrice) / minPrice * 100).toFixed(0)}% more than ${minPriceVehicle?.name}`
      )
    }

    if (minEfficiencyVehicle && maxEfficiencyVehicle && minEfficiencyVehicle.id !== maxEfficiencyVehicle.id) {
      insights.push(
        `${minEfficiencyVehicle.name} is the most efficient (${minEfficiency} kWh/100km), using ${((maxEfficiency - minEfficiency) / maxEfficiency * 100).toFixed(0)}% less energy than ${maxEfficiencyVehicle.name}`
      )
    }

    if (maxPriceVehicle && minPriceVehicle && maxPriceVehicle.id !== minPriceVehicle.id) {
      const priceDiff = maxPrice - minPrice
      insights.push(
        `Price difference: ${formatPrice(priceDiff, maxPriceVehicle.country)} between ${maxPriceVehicle.name} and ${minPriceVehicle.name}`
      )
    }

    return insights
  }

  if (selectedVehicles.length < 2) {
    return null
  }

  const insights = generateInsights()
  const efficiencyChartData = sortedVehicles.map((vehicle, idx) => ({
    label: vehicle.name,
    value: Number(vehicle.efficiencyKwhPer100km.toFixed(2)),
    color: vehicleColors[idx % vehicleColors.length],
  }))
  const rangeChartData = sortedVehicles.map((vehicle, idx) => ({
    label: vehicle.name,
    value: vehicle.rangeKm,
    color: vehicleColors[idx % vehicleColors.length],
  }))
  const costPerKmChartData = sortedVehicles.map((vehicle, idx) => ({
    label: vehicle.name,
    value: Number(getCostPerKm(vehicle).toFixed(3)),
    color: vehicleColors[idx % vehicleColors.length],
    country: vehicle.country,
  }))
  const bestRange = getBestValue('rangeKm', true)
  const bestEfficiency = getBestValue('efficiencyKwhPer100km', false)
  const bestPrice = getBestValue('onTheRoadPriceLocalCurrency', false)
  const bestCostPerKm =
    selectedVehicles.length > 0
      ? Math.min(...selectedVehicles.map((vehicle) => getCostPerKm(vehicle)))
      : null

  const countriesRepresented = Array.from(new Set(selectedVehicles.map((v) => v.country)))

  const ICE_FACTS: Record<
    'SG' | 'MY',
    { models: string[]; costPerKm: number; currency: 'SGD' | 'MYR'; blurb: string }
  > = {
    SG: {
      models: ['Toyota Corolla Altis 1.6', 'Honda Civic 1.5T'],
      costPerKm: 0.24,
      currency: 'SGD',
      blurb: 'Assumes RON95 @ SGD 2.60/L with ~15 km/L real-world efficiency.',
    },
    MY: {
      models: ['Honda City 1.5L', 'Toyota Vios 1.5L'],
      costPerKm: 0.30,
      currency: 'MYR',
      blurb: 'Assumes RON95 @ MYR 2.05/L with ~14 km/L efficiency.',
    },
  }

  return (
    <div className="mt-8 mb-12 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-ev-primary to-ev-secondary p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold">Side-by-Side Comparison</h2>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              Export CSV
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Key Insights</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            {insights.map((insight, idx) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-6 border-b border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          📈 Efficiency, Range & Cost Snapshot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricChart title="Efficiency (kWh/100km)" data={efficiencyChartData} suffix=" kWh">
            Lower numbers indicate better energy use.
          </MetricChart>
          <MetricChart title="Range (km)" data={rangeChartData} suffix=" km">
            WLTP/EPA rated range per full charge.
          </MetricChart>
          <MetricChart
            title="Cost / km"
            data={costPerKmChartData}
            formatter={(value, entry) =>
              formatCostPerKm(
                value,
                ((entry?.payload?.country as 'SG' | 'MY') ?? sortedVehicles[0]?.country) || 'SG'
              )
            }
          >
            Based on average DC charging tariffs.
          </MetricChart>
        </div>
        <p className="text-xs text-gray-500">
          Cost/km = (Battery capacity in kWh × average electricity rate) ÷ rated range. We use SGD{' '}
          {getElectricityRate('SG').toFixed(2)}/kWh for Singapore and MYR{' '}
          {getElectricityRate('MY').toFixed(2)}/kWh for Malaysia.
        </p>
        {countriesRepresented.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            <h4 className="font-semibold mb-2">🤔 Did you know?</h4>
            <div className="space-y-2">
              {countriesRepresented.map((country) => {
                const fact = ICE_FACTS[country]
                if (!fact) return null
                return (
                  <p key={country} className="leading-relaxed">
                    In {country === 'SG' ? 'Singapore' : 'Malaysia'}, comparable ICE sedans such as{' '}
                    <span className="font-semibold">{fact.models.join(' or ')}</span> average around{' '}
                    <span className="font-semibold">
                      {fact.currency} {fact.costPerKm.toFixed(2)} per km
                    </span>{' '}
                    ({fact.blurb})
                  </p>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                Specification
              </th>
              {sortedVehicles.map((vehicle) => (
                <th
                  key={vehicle.id}
                  className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[200px]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-24 h-16 rounded overflow-hidden bg-gray-200">
                      <Image
                        src={vehicle.imageUrl}
                        alt={`${vehicle.name} ${vehicle.modelTrim}`}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="font-bold">{vehicle.name}</div>
                    <div className="text-xs text-gray-600">{vehicle.modelTrim}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                Battery Weight (kg)
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-4 py-3 text-center text-gray-600">
                  {vehicle.batteryWeightKg}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                Vehicle Weight (kg)
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-4 py-3 text-center text-gray-600">
                  {vehicle.curbWeightKg}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                Battery Weight %
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-4 py-3 text-center text-gray-600">
                  {vehicle.batteryWeightPercentage.toFixed(1)}%
                </td>
              ))}
            </tr>
            <tr>
              <td
                className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('powerRatingKw')}
              >
                Power (kW) {sortField === 'powerRatingKw' && (sortDirection === 'asc' ? '↑' : '↓')}
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-4 py-3 text-center text-gray-600">
                  {vehicle.powerRatingKw}
                </td>
              ))}
            </tr>
            <tr>
              <td
                className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('efficiencyKwhPer100km')}
              >
                Efficiency (kWh/100km) {sortField === 'efficiencyKwhPer100km' && (sortDirection === 'asc' ? '↑' : '↓')}
              </td>
              {sortedVehicles.map((vehicle) => (
                <td
                  key={vehicle.id}
                  className={`px-4 py-3 text-center ${
                    vehicle.efficiencyKwhPer100km === bestEfficiency
                      ? 'bg-green-100 font-semibold text-green-800'
                      : 'text-gray-600'
                  }`}
                >
                  {vehicle.efficiencyKwhPer100km}
                </td>
              ))}
            </tr>
            <tr>
              <td
                className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('rangeKm')}
              >
                Range (km) {sortField === 'rangeKm' && (sortDirection === 'asc' ? '↑' : '↓')}
              </td>
              {sortedVehicles.map((vehicle) => (
                <td
                  key={vehicle.id}
                  className={`px-4 py-3 text-center ${
                    vehicle.rangeKm === bestRange
                      ? 'bg-green-100 font-semibold text-green-800'
                      : 'text-gray-600'
                  }`}
                >
                  {vehicle.rangeKm}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                Base Price
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-4 py-3 text-center text-gray-600">
                  {formatPrice(vehicle.basePriceLocalCurrency, vehicle.country)}
                </td>
              ))}
            </tr>
            <tr>
              <td
                className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('onTheRoadPriceLocalCurrency')}
              >
                On The Road Price {sortField === 'onTheRoadPriceLocalCurrency' && (sortDirection === 'asc' ? '↑' : '↓')}
              </td>
              {sortedVehicles.map((vehicle) => (
                <td
                  key={vehicle.id}
                  className={`px-4 py-3 text-center font-semibold ${
                    vehicle.onTheRoadPriceLocalCurrency === bestPrice
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-800'
                  }`}
                >
                  {formatPrice(vehicle.onTheRoadPriceLocalCurrency, vehicle.country)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                Cost / km
              </td>
              {sortedVehicles.map((vehicle) => (
                <td
                  key={vehicle.id}
                  className={`px-4 py-3 text-center ${
                    bestCostPerKm !== null && getCostPerKm(vehicle) === bestCostPerKm
                      ? 'bg-green-100 font-semibold text-green-800'
                      : 'text-gray-600'
                  }`}
                >
                  {formatCostPerKm(getCostPerKm(vehicle), vehicle.country)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                Battery Manufacturer
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-4 py-3 text-center text-gray-600">
                  {vehicle.batteryManufacturer}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                Battery Technology
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-4 py-3 text-center text-gray-600">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-200">
                    {vehicle.batteryTechnology}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                DC Fast Charge 0-80% (min)
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-4 py-3 text-center text-gray-600">
                  {vehicle.chargingTimeDc0To80Min}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                Charging Capabilities
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-4 py-3 text-center text-sm text-gray-600">
                  {vehicle.chargingCapabilities}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface MetricDatum {
  label: string
  value: number
  color: string
  country?: 'SG' | 'MY'
}

interface MetricChartProps {
  title: string
  data: MetricDatum[]
  suffix?: string
  formatter?: (value: number, entry?: any) => string
  children?: ReactNode
}

function MetricChart({ title, data, suffix, formatter, children }: MetricChartProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-3">
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        {children && <p className="text-xs text-gray-500 mt-1">{children}</p>}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis />
            <RechartsTooltip
              formatter={(value, _name, entry) => {
                const val = value as number
                const formatted = formatter ? formatter(val, entry) : `${val}${suffix ?? ''}`
                return [formatted, entry?.payload?.label as string]
              }}
              labelFormatter={(label) => label as string}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

