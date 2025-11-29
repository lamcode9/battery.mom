'use client'

import { useState, useMemo, ReactNode, useRef, useEffect, isValidElement } from 'react'
import { createPortal } from 'react-dom'
import { useVehicleStore } from '@/store/VehicleStore'
import { Vehicle } from '@/types/vehicle'
import type { Country } from '@prisma/client'
import Papa from 'papaparse'
import {
  ResponsiveContainer,
  BarChart,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Tooltip,
  Scatter,
} from 'recharts'
import { 
  calculateCostPerKm, 
  getElectricityRate, 
  convertKwToHp,
  getAcceleration0To100Kmh,
  formatValueOrNA,
  formatPriceOrNA,
  formatStringOrNA,
  formatPrice as formatPriceUtil,
} from '@/lib/utils'

type SortField = 'name' | 'rangeKm' | 'efficiencyKwhPer100km' | 'basePriceLocalCurrency' | 'powerRatingKw' | 'batteryWeightKg'
type SortDirection = 'asc' | 'desc'

const CURRENCY_BY_COUNTRY: Record<Country, string> = {
  SG: 'SGD',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  TH: 'THB',
  VN: 'VND',
}

// Chart container sizing constants - adjust these to change all chart container heights
const CHART_CONTAINER_HEIGHT = 'h-64' // Tailwind class: h-64 = 256px (16rem)
const CHART_CONTAINER_PADDING_TOP = 'pt-4' // Top padding
const CHART_CONTAINER_PADDING_BOTTOM = 'pb-0' // Bottom padding
const CHART_CONTAINER_PADDING_X = 'px-3' // Horizontal padding
const CHART_AREA_PADDING_BOTTOM = 'pb-0' // Bottom padding for chart area

const formatPrice = (price: number, country: Country, digits: number = 0) => {
  const currency = CURRENCY_BY_COUNTRY[country] || 'USD'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(price)
  }

/**
 * Info box component explaining Cost / km calculation
 */
function CostPerKmInfoBox({ 
  country 
}: { 
  country: Country
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const electricityRate = getElectricityRate(country)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  // Calculate position when opening
  const getPosition = () => {
    if (!buttonRef.current || !isOpen) return null
    const rect = buttonRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 6,
      left: rect.left,
    }
  }

  const position = getPosition()

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Show cost per km definition"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && position && typeof window !== 'undefined' && createPortal((
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          {/* Info Box - rendered via portal to appear above table */}
          <div 
            className="fixed w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-3">Cost / km Definition</div>
            
            <div className="space-y-2 text-xs text-gray-700">
              <div>
                <div className="font-medium text-gray-900 mb-1">Formula:</div>
                <div className="bg-gray-50 p-2 rounded font-mono text-[10px]">
                  Cost/km = (Battery Capacity × Electricity Rate) ÷ Range
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <div className="font-medium text-gray-900 mb-1.5">Key Assumptions:</div>
                <ul className="space-y-1.5 text-gray-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Uses actual battery capacity from vehicle specifications</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Electricity rate: <span className="font-medium">{formatPriceUtil(electricityRate, country, 2)}/kWh</span> (typical DC fast charger)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Uses WLTP or EPA rated range</span>
                  </li>
                </ul>
              </div>
              
              <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                <div className="font-medium text-gray-700 mb-0.5">Note:</div>
                <div>Rates vary by location and charging method. Home charging may be cheaper. Values shown are for comparison purposes.</div>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </>
      ), document.body)}
    </div>
  )
}

/**
 * Info box component for Cost / km chart footnote 1
 */
function CostPerKmChartInfoBox({
  countriesRepresented,
  ICE_FACTS
}: {
  countriesRepresented: Country[]
  ICE_FACTS: Partial<Record<Country, { models: string[]; costPerKm: number; currency: string; blurb: string }>>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const getPosition = () => {
    if (!buttonRef.current || !isOpen) return null
    const rect = buttonRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 6,
      left: rect.left,
    }
  }

  const position = getPosition()

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
        aria-label="Show cost per km calculation details"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && position && typeof window !== 'undefined' && createPortal((
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-3">Cost / km Calculation</div>
            <div className="space-y-2 text-xs text-gray-700">
              <div>
                <div className="font-medium text-gray-900 mb-1">Formula:</div>
                <div className="bg-gray-50 p-2 rounded font-mono text-[10px]">
                  Cost/km = (Battery capacity in kWh × average electricity rate) ÷ rated range
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="font-medium text-gray-900 mb-1.5">Electricity Rates:</div>
                <div className="text-gray-600">
                  We use{' '}
                  {countriesRepresented.map((country, index) => {
                    const rate = getElectricityRate(country)
                    const currency = ICE_FACTS[country]?.currency || 'USD'
                    const countryName = {
                      SG: 'Singapore',
                      MY: 'Malaysia',
                      ID: 'Indonesia',
                      PH: 'Philippines',
                      TH: 'Thailand',
                      VN: 'Vietnam'
                    }[country] || country

                    const separator = index === countriesRepresented.length - 1 ? '' :
                                     index === countriesRepresented.length - 2 ? ' and ' : ', '

                    return (
                      <span key={country}>
                        {currency} {rate.toFixed(2)}/kWh for {countryName}{separator}
                      </span>
                    )
                  })}
                  .
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </>
      ), document.body)}
    </div>
  )
}

/**
 * Info box component for ICE comparison (footnote 2)
 */
function ICEComparisonInfoBox({
  countriesRepresented,
  ICE_FACTS,
  formatCostPerKm
}: {
  countriesRepresented: Country[]
  ICE_FACTS: Partial<Record<Country, { models: string[]; costPerKm: number; currency: string; blurb: string }>>
  formatCostPerKm: (value: number, country: Country) => string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const getPosition = () => {
    if (!buttonRef.current || !isOpen) return null
    const rect = buttonRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 6,
      left: rect.left,
    }
  }

  const position = getPosition()

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
        aria-label="Show ICE comparison details"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && position && typeof window !== 'undefined' && createPortal((
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-3">ICE Comparison</div>
            <div className="space-y-2 text-xs text-gray-700">
              {countriesRepresented.map((country) => {
                const fact = ICE_FACTS[country]
                if (!fact) return null
                return (
                  <div key={country} className="pb-2 border-b border-gray-100 last:border-0 last:pb-4">
                    <div className="font-medium text-gray-900 mb-1">
                      {(() => {
                        const countryNames = {
                          SG: 'Singapore',
                          MY: 'Malaysia',
                          ID: 'Indonesia',
                          PH: 'Philippines',
                          TH: 'Thailand',
                          VN: 'Vietnam'
                        }
                        return countryNames[country] || country
                      })()}
                    </div>
                    <div className="text-gray-600">
                      Comparable ICE sedans such as <span className="font-semibold">{fact.models.join(' or ')}</span> average around{' '}
                      <span className="font-semibold">
                        {formatCostPerKm(fact.costPerKm, country)}
                      </span>
                      . {fact.blurb}
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </>
      ), document.body)}
    </div>
  )
}

/**
 * Info box component for Public Fast legend
 */
function PublicFastInfoBox() {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const getPosition = () => {
    if (!buttonRef.current || !isOpen) return null
    const rect = buttonRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 6,
      left: rect.left,
    }
  }

  const position = getPosition()

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
        aria-label="Show public fast charging info"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && position && typeof window !== 'undefined' && createPortal((
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-2">Public Fast Charging</div>
            <div className="text-xs text-gray-600 mb-2">
              *Public: 100 kW DC – the most common fast-charger power in urban SEA 2025–26 (200–350 kW hubs expanding fast).*
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </>
      ), document.body)}
    </div>
  )
}

/**
 * Info box component for Home Solar legend
 */
function HomeSolarInfoBox() {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const getPosition = () => {
    if (!buttonRef.current || !isOpen) return null
    const rect = buttonRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 6,
      left: rect.left,
    }
  }

  const position = getPosition()

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
        aria-label="Show home solar info"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && position && typeof window !== 'undefined' && createPortal((
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-2">Home Solar Charging</div>
            <div className="text-xs text-gray-600 mb-2">
              *Home solar: Real daily production of a 10 kW rooftop system (4–5.5 peak sun hours). Most urban owners mix ~60% public + 40% home charging.*
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </>
      ), document.body)}
    </div>
  )
}

/**
 * Info box component explaining Cost / Full Charge calculation
 */
function CostPerFullChargeInfoBox({ 
  country 
}: { 
  country: Country
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const electricityRate = getElectricityRate(country)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  // Calculate position when opening
  const getPosition = () => {
    if (!buttonRef.current || !isOpen) return null
    const rect = buttonRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 6,
      left: rect.left,
    }
  }

  const position = getPosition()

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Show cost per full charge definition"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && position && typeof window !== 'undefined' && createPortal((
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          {/* Info Box - rendered via portal to appear above table */}
          <div 
            className="fixed w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-3">Cost / Full Charge Definition</div>
            
            <div className="space-y-2 text-xs text-gray-700">
              <div>
                <div className="font-medium text-gray-900 mb-1">Formula:</div>
                <div className="bg-gray-50 p-2 rounded font-mono text-[10px]">
                  Cost/Full Charge = Battery Capacity × Electricity Rate
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <div className="font-medium text-gray-900 mb-1.5">Key Assumptions:</div>
                <ul className="space-y-1.5 text-gray-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Uses actual battery capacity from vehicle specifications</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>Electricity rate: <span className="font-medium">{formatPriceUtil(electricityRate, country, 2)}/kWh</span> (typical DC fast charger)</span>
                  </li>
                </ul>
              </div>
              
              <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                <div className="font-medium text-gray-700 mb-0.5">Note:</div>
                <div>Rates vary by location and charging method. Home charging may be cheaper. Values shown are for comparison purposes.</div>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </>
      ), document.body)}
    </div>
  )
}

export default function ComparisonTable() {
  const { selectedVehicles, clearAll } = useVehicleStore()
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const formatCostPerKm = (value: number, country: Country) =>
    formatPrice(value, country, 2)

  const getCostPerKm = (vehicle: Vehicle) => {
    if (!vehicle.batteryCapacityKwh || vehicle.rangeKm === null || vehicle.rangeKm === undefined) {
      return null
    }
    return calculateCostPerKm(vehicle.country, vehicle.batteryCapacityKwh, vehicle.rangeKm)
  }
  
  const getCostPerFullCharge = (vehicle: Vehicle) => {
    if (!vehicle.batteryCapacityKwh) {
      return null
    }
    return vehicle.batteryCapacityKwh * getElectricityRate(vehicle.country)
  }

  const vehicleColors = ['#0ea5e9', '#10b981', '#f97316', '#a855f7']

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    if (!sortField) return selectedVehicles

    return [...selectedVehicles].sort((a, b) => {
      const aVal = a[sortField] as number | null | undefined
      const bVal = b[sortField] as number | null | undefined
      // Handle null/undefined values - put them at the end
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
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
    const values = selectedVehicles
      .map(v => v[field] as number | null | undefined)
      .filter((v): v is number => v !== null && v !== undefined)
    if (values.length === 0) return null
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values)
    return best
  }

  const exportToCSV = () => {
    const data = selectedVehicles.map(v => ({
      Name: v.name,
      'Model/Trim': v.modelTrim || 'N/A',
      'Battery Weight (kg)': v.batteryWeightKg !== null && v.batteryWeightKg !== undefined ? Math.round(v.batteryWeightKg) : 'N/A',
      'Vehicle Weight (kg)': v.curbWeightKg !== null && v.curbWeightKg !== undefined ? Math.round(v.curbWeightKg) : 'N/A',
      'Battery Weight %': v.batteryWeightPercentage !== null && v.batteryWeightPercentage !== undefined ? v.batteryWeightPercentage.toFixed(1) : 'N/A',
      'Power (kW)': v.powerRatingKw !== null && v.powerRatingKw !== undefined ? v.powerRatingKw : 'N/A',
      'Top Speed (km/h)': v.topSpeedKmh !== null && v.topSpeedKmh !== undefined ? v.topSpeedKmh : 'N/A',
      'Efficiency (kWh/100km)': v.efficiencyKwhPer100km !== null && v.efficiencyKwhPer100km !== undefined ? v.efficiencyKwhPer100km : 'N/A',
      'Range (km)': v.rangeKm !== null && v.rangeKm !== undefined ? v.rangeKm : 'N/A',
      'Cost / km': getCostPerKm(v) !== null ? getCostPerKm(v) : 'N/A',
      'Base Price': v.basePriceLocalCurrency !== null && v.basePriceLocalCurrency !== undefined ? v.basePriceLocalCurrency : 'N/A',
      'Battery Manufacturer': v.batteryManufacturer || 'N/A',
      'Battery Technology': v.batteryTechnology || 'N/A',
      'Battery Warranty': v.batteryWarranty || 'N/A',
      'Technology Features': v.technologyFeatures || 'N/A',
      'Charging Time 0-80% (min)': v.chargingTimeDc0To80Min !== null && v.chargingTimeDc0To80Min !== undefined ? v.chargingTimeDc0To80Min : 'N/A',
      'Charging Capabilities': v.chargingCapabilities || 'N/A',
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
    const ranges = selectedVehicles.map(v => v.rangeKm).filter((v): v is number => v !== null && v !== undefined)
    const prices = selectedVehicles.map(v => v.basePriceLocalCurrency).filter((v): v is number => v !== null && v !== undefined)
    const efficiencies = selectedVehicles.map(v => v.efficiencyKwhPer100km).filter((v): v is number => v !== null && v !== undefined)

    if (ranges.length === 0 || prices.length === 0 || efficiencies.length === 0) return []

    // Helper to get full vehicle label
    const getVehicleLabel = (vehicle: Vehicle) => {
      return vehicle.modelTrim ? `${vehicle.name} ${vehicle.modelTrim}` : vehicle.name
    }

    const maxRange = Math.max(...ranges)
    const minRange = Math.min(...ranges)
    const maxRangeVehicle = selectedVehicles.find(v => v.rangeKm === maxRange)
    const minRangeVehicle = selectedVehicles.find(v => v.rangeKm === minRange)

    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const maxPriceVehicle = selectedVehicles.find(v => v.basePriceLocalCurrency === maxPrice)
    const minPriceVehicle = selectedVehicles.find(v => v.basePriceLocalCurrency === minPrice)

    const minEfficiency = Math.min(...efficiencies)
    const maxEfficiency = Math.max(...efficiencies)
    const minEfficiencyVehicle = selectedVehicles.find(v => v.efficiencyKwhPer100km === minEfficiency)
    const maxEfficiencyVehicle = selectedVehicles.find(v => v.efficiencyKwhPer100km === maxEfficiency)

    // Range vs Price insight - only if they're different vehicles
    if (maxRangeVehicle && minPriceVehicle && maxRangeVehicle.id !== minPriceVehicle.id) {
      const priceDiff = maxRangeVehicle.basePriceLocalCurrency
      const minPriceValue = minPriceVehicle.basePriceLocalCurrency
      if (priceDiff !== null && minPriceValue !== null && priceDiff > minPriceValue) {
      insights.push(
          `${getVehicleLabel(maxRangeVehicle)} wins on range (${maxRange}km) but costs ${((priceDiff - minPriceValue) / minPriceValue * 100).toFixed(0)}% more than ${getVehicleLabel(minPriceVehicle)}`
      )
      }
    }

    // Efficiency insight - only if they're different vehicles
    if (minEfficiencyVehicle && maxEfficiencyVehicle && minEfficiencyVehicle.id !== maxEfficiencyVehicle.id) {
      insights.push(
        `${getVehicleLabel(minEfficiencyVehicle)} is the most efficient (${minEfficiency} kWh/100km), using ${((maxEfficiency - minEfficiency) / maxEfficiency * 100).toFixed(0)}% less energy than ${getVehicleLabel(maxEfficiencyVehicle)}`
      )
    }

    // Price difference insight - only if they're different vehicles
    if (maxPriceVehicle && minPriceVehicle && maxPriceVehicle.id !== minPriceVehicle.id) {
      const priceDiff = maxPrice - minPrice
      insights.push(
        `Price difference: ${formatPrice(priceDiff, maxPriceVehicle.country)} between ${getVehicleLabel(maxPriceVehicle)} and ${getVehicleLabel(minPriceVehicle)}`
      )
    }

    return insights
  }

  if (selectedVehicles.length < 2) {
    return null
  }

  const insights = generateInsights()
  // Helper function to format vehicle label with trim
  const getVehicleLabel = (vehicle: Vehicle) => {
    return vehicle.modelTrim ? `${vehicle.name} ${vehicle.modelTrim}` : vehicle.name
  }

  // Daily yield (kWh) for 10 kW solar system by country
  const dailyYield: Record<Country, number> = {
    SG: 42, // Singapore
    MY: 45, // Malaysia
    ID: 48, // Indonesia
    PH: 46, // Philippines
    TH: 48, // Thailand
    VN: 45, // Vietnam
  }

  // Extract maximum DC charging rate from chargingCapabilities (e.g., "DC Fast Charge: Up to 250kW" -> 250)
  const getMaxDcChargingRate = (vehicle: Vehicle): number => {
    if (!vehicle.chargingCapabilities) return 100 // Default to 100 kW if not specified
    const match = vehicle.chargingCapabilities.match(/(?:up to|max|maximum)\s*(\d+)\s*kw/i)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
    // Fallback: try to find any number followed by kW
    const fallbackMatch = vehicle.chargingCapabilities.match(/(\d+)\s*kw/i)
    if (fallbackMatch && fallbackMatch[1]) {
      return parseInt(fallbackMatch[1], 10)
    }
    return 100 // Default to 100 kW
  }

  // Calculate public fast charge minutes using vehicle's max DC charging rate
  // Assumptions:
  // - Charger power is capped at 100 kW (typical fast charger)
  // - If the vehicle's max DC rate is LOWER than 100 kW, use that lower vehicle rate
  // Formula: (batteryCapacityKwh * 0.8) / effectiveMaxChargingRateKw * 60, rounded to nearest 5 min
  const getPublicFastMinutes = (vehicle: Vehicle): number | null => {
    if (!vehicle.batteryCapacityKwh || vehicle.batteryCapacityKwh <= 0) {
      return null
    }
    const parsedMaxChargingRate = getMaxDcChargingRate(vehicle)
    // Cap at 100 kW but respect vehicles that can only take less than that
    const effectiveMaxChargingRate = Math.min(parsedMaxChargingRate, 100)
    const minutes = Math.ceil(vehicle.batteryCapacityKwh * 0.8 / effectiveMaxChargingRate * 60)
    // Round to nearest 5 minutes
    return Math.round(minutes / 5) * 5
  }

  // Calculate home solar days: (batteryCapacityKwh * 0.6) / dailyYield[country]
  // Assumes 20-80% charge (60% of battery capacity)
  const getHomeSolarDays = (vehicle: Vehicle): number | null => {
    if (!vehicle.batteryCapacityKwh || vehicle.batteryCapacityKwh <= 0) {
      return null
    }
    const yieldValue = dailyYield[vehicle.country] || 45
    return (vehicle.batteryCapacityKwh * 0.6) / yieldValue
  }

  const batteryCapacityChartData = sortedVehicles
    .map((vehicle, idx) => ({
      label: getVehicleLabel(vehicle),
      value: vehicle.batteryCapacityKwh,
    color: vehicleColors[idx % vehicleColors.length],
  }))
    .filter((d): d is { label: string; value: number; color: string } => d.value !== null && d.value !== undefined && d.value > 0)

  const publicFastVsHomeSolarChartData = sortedVehicles
    .map((vehicle, idx) => {
      const publicMinutes = getPublicFastMinutes(vehicle)
      const homeDays = getHomeSolarDays(vehicle)
      if (publicMinutes === null || homeDays === null) return null
      return {
        label: getVehicleLabel(vehicle),
        publicFast: publicMinutes,
        homeSolar: homeDays,
        color: vehicleColors[idx % vehicleColors.length],
      }
    })
    .filter((d): d is { label: string; publicFast: number; homeSolar: number; color: string } => d !== null)

  const efficiencyChartData = sortedVehicles
    .map((vehicle, idx) => ({
    label: getVehicleLabel(vehicle),
      value: vehicle.efficiencyKwhPer100km,
    color: vehicleColors[idx % vehicleColors.length],
  }))
    .filter((d): d is { label: string; value: number; color: string } => d.value !== null && d.value !== undefined)
  const rangeChartData = sortedVehicles
    .map((vehicle, idx) => ({
    label: getVehicleLabel(vehicle),
    value: vehicle.rangeKm,
    color: vehicleColors[idx % vehicleColors.length],
  }))
    .filter((d): d is { label: string; value: number; color: string } => d.value !== null && d.value !== undefined)
  const countriesRepresented = Array.from(new Set(selectedVehicles.map((v) => v.country)))

  const ICE_FACTS: Partial<Record<Country, { models: string[]; costPerKm: number; currency: string; blurb: string }>> = {
    SG: {
      models: ['Toyota Corolla Altis 1.6', 'Honda Civic 1.5T'],
      costPerKm: 0.20, // 2.60 ÷ 13 = 0.20
      currency: 'SGD',
      blurb: 'Assumes RON95 @ SGD 2.60/L with ~13 km/L real-world efficiency.',
    },
    MY: {
      models: ['Honda City 1.5L', 'Toyota Vios 1.5L'],
      costPerKm: 0.16, // 2.05 ÷ 13 = 0.16
      currency: 'MYR',
      blurb: 'Assumes RON95 @ MYR 2.05/L with ~13 km/L efficiency.',
    },
    ID: {
      models: ['Toyota Avanza 1.3', 'Honda Brio 1.2'],
      costPerKm: 1318.18, // 14500 ÷ 11 = 1318.18
      currency: 'IDR',
      blurb: 'Assumes Pertamax @ IDR 14,500/L with ~11 km/L real-world efficiency.',
    },
    PH: {
      models: ['Toyota Vios 1.3', 'Mitsubishi Mirage 1.2'],
      costPerKm: 4.77, // 62 ÷ 13 = 4.77
      currency: 'PHP',
      blurb: 'Assumes RON95 @ PHP 62/L with ~13 km/L real-world efficiency.',
    },
    TH: {
      models: ['Toyota Altis 1.6', 'Honda City 1.5'],
      costPerKm: 2.23, // 29 ÷ 13 = 2.23
      currency: 'THB',
      blurb: 'Assumes Gasohol 95 @ THB 29/L with ~13 km/L real-world efficiency.',
    },
    VN: {
      models: ['Toyota Vios 1.5', 'Honda City 1.5'],
      costPerKm: 2083.33, // 25000 ÷ 12 = 2083.33
      currency: 'VND',
      blurb: 'Assumes RON95 @ VND 25,000/L with ~12 km/L real-world efficiency.',
    },
  }
  
  const costPerKmChartData = [
    ...sortedVehicles
      .map((vehicle, idx) => {
        const cost = getCostPerKm(vehicle)
        if (cost === null) return null
        return {
          label: getVehicleLabel(vehicle),
          value: Number(cost.toFixed(3)),
          color: vehicleColors[idx % vehicleColors.length],
          country: vehicle.country,
        }
      })
      .filter((d): d is { label: string; value: number; color: string; country: Country } => d !== null),
    ...countriesRepresented
      .filter((country): country is Country => ICE_FACTS[country] !== undefined)
      .map((country) => ({
        label: `ICE²`,
        value: ICE_FACTS[country]!.costPerKm,
        color: '#6b7280', // medium-dark grey
        country: country,
      })),
  ]
  const bestRange = getBestValue('rangeKm', true)
  const bestEfficiency = getBestValue('efficiencyKwhPer100km', false)
  const bestPrice = getBestValue('basePriceLocalCurrency', false)
  const bestCostPerKm =
    selectedVehicles.length > 0
      ? (() => {
          const costs = selectedVehicles
            .map((vehicle) => getCostPerKm(vehicle))
            .filter((v): v is number => v !== null && v !== undefined)
          return costs.length > 0 ? Math.min(...costs) : null
        })()
      : null
  
  // Calculate best values for all metrics
  const bestPowerKw = getBestValue('powerRatingKw', true)
  const bestPowerHp = bestPowerKw ? convertKwToHp(bestPowerKw) : null
  const bestAcceleration = selectedVehicles.length > 0
    ? (() => {
        const accels = selectedVehicles
          .map(v => getAcceleration0To100Kmh(v.acceleration0To100Kmh, v.powerRatingKw, v.curbWeightKg))
          .filter((v): v is number => v !== null && v !== undefined)
        return accels.length > 0 ? Math.min(...accels) : null
      })()
    : null
  const bestTopSpeed = selectedVehicles.length > 0
    ? (() => {
        const topSpeeds = selectedVehicles
          .map(v => v.topSpeedKmh)
          .filter((v): v is number => v !== null && v !== undefined)
        return topSpeeds.length > 0 ? Math.max(...topSpeeds) : null
      })()
    : null
  const bestRangeWltp = selectedVehicles.length > 0
    ? (() => {
        const ranges = selectedVehicles
          .map(v => v.rangeWltpKm ?? v.rangeKm)
          .filter((v): v is number => v !== null && v !== undefined)
        return ranges.length > 0 ? Math.max(...ranges) : null
      })()
    : null
  const bestRangeEpa = selectedVehicles.length > 0
    ? (() => {
        const ranges = selectedVehicles
          .map(v => v.rangeEpaKm)
          .filter((v): v is number => v !== null && v !== undefined)
        return ranges.length > 0 ? Math.max(...ranges) : null
      })()
    : null
  const bestCostPerFullCharge = selectedVehicles.length > 0
    ? (() => {
        const costs = selectedVehicles
          .map(v => getCostPerFullCharge(v))
          .filter((v): v is number => v !== null && v !== undefined)
        return costs.length > 0 ? Math.min(...costs) : null
      })()
    : null
  const bestBatteryCapacity = selectedVehicles.length > 0
    ? (() => {
        const capacities = selectedVehicles
          .map(v => v.batteryCapacityKwh)
          .filter((v): v is number => v !== null && v !== undefined && v > 0)
        return capacities.length > 0 ? Math.max(...capacities) : null
      })()
    : null
  const bestChargingTime = selectedVehicles.length > 0
    ? (() => {
        const times = selectedVehicles
          .map(v => v.chargingTimeDc0To80Min)
          .filter((v): v is number => v !== null && v !== undefined)
        return times.length > 0 ? Math.min(...times) : null
      })()
    : null
  const bestVehicleWeight = selectedVehicles.length > 0
    ? (() => {
        const weights = selectedVehicles
          .map(v => v.curbWeightKg)
          .filter((v): v is number => v !== null && v !== undefined)
        return weights.length > 0 ? Math.min(...weights) : null
      })()
    : null
  const bestBatteryWeight = selectedVehicles.length > 0
    ? (() => {
        const weights = selectedVehicles
          .map(v => v.batteryWeightKg)
          .filter((v): v is number => v !== null && v !== undefined)
        return weights.length > 0 ? Math.min(...weights) : null
      })()
    : null
  const bestBatteryWeightPercent = selectedVehicles.length > 0
    ? (() => {
        const percentages = selectedVehicles
          .map(v => v.batteryWeightPercentage)
          .filter((v): v is number => v !== null && v !== undefined)
        return percentages.length > 0 ? Math.min(...percentages) : null
      })()
    : null
  const bestBasePrice = selectedVehicles.length > 0
    ? (() => {
        const prices = selectedVehicles
          .map(v => v.basePriceLocalCurrency)
          .filter((v): v is number => v !== null && v !== undefined)
        return prices.length > 0 ? Math.min(...prices) : null
      })()
    : null

  return (
    <div className="mt-8 mb-12 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-4 pt-4 pb-2 text-black">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-bold">Side-by-Side Comparison</h2>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              Export CSV
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pt-2 pb-2 space-y-4">
        <h3 className="font-semibold text-gray-800">
          Data Snapshot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricChart title="Battery Capacity (kWh)" data={batteryCapacityChartData} suffix=" kWh">
            Total energy storage capacity.
          </MetricChart>
          <PublicFastVsHomeSolarChart 
            data={publicFastVsHomeSolarChartData}
            country={sortedVehicles[0]?.country || 'MY'}
          />
          <MetricChart title="Range (km)" data={rangeChartData} suffix=" km">
            WLTP rated range per full charge.
          </MetricChart>
          <MetricChart
            title={
              <div className="flex items-center gap-1.5">
                <span>Cost / km</span>
                <CostPerKmChartInfoBox countriesRepresented={countriesRepresented} ICE_FACTS={ICE_FACTS} />
              </div>
            }
            data={costPerKmChartData}
            formatter={(value, entry) =>
              formatCostPerKm(
                value,
                ((entry?.payload?.country as Country) ?? sortedVehicles[0]?.country) || 'SG'
              )
            }
            customLabelRenderer={(label: string) => {
              if (label === 'ICE²') {
                return (
                  <div className="flex items-center gap-1">
                    <span>ICE</span>
                    <ICEComparisonInfoBox countriesRepresented={countriesRepresented} ICE_FACTS={ICE_FACTS} formatCostPerKm={formatCostPerKm} />
                  </div>
                )
              }
              return label
            }}
          >
            Based on average DC charging tariffs.
          </MetricChart>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="pt-6 pb-3 px-6 flex justify-center">
          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-5 max-w-3xl w-full">
            <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center gap-2">
              💡 Key Insights
            </h3>
            <ul className="list-disc list-outside space-y-2 text-sm text-blue-800 pl-6">
              {insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="pt-3 pb-6 px-6 border-b border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          Detailed Comparison
        </h3>
        {sortedVehicles.length > 2 && (
          <p className="text-xs text-gray-500 md:hidden">
            💡 Scroll horizontally to see all vehicles
          </p>
        )}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col className="w-24 md:w-32 lg:w-40" />
            {sortedVehicles.map((_, index) => {
              // Calculate equal width for vehicle columns
              // Remaining space divided equally
              const vehicleColumnWidth = `calc((100% - 6rem) / ${sortedVehicles.length})`;
              return <col key={index} style={{ width: vehicleColumnWidth }} />;
            })}
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <span className="break-words leading-tight">Specification</span>
              </th>
              {sortedVehicles.map((vehicle) => (
                <th
                  key={vehicle.id}
                  className="px-3 py-2 text-center text-xs font-semibold text-gray-700"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="font-semibold text-xs">{vehicle.name}</div>
                    <div className="text-[10px] text-light-gray-500">{vehicle.modelTrim}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* 1. Power (kW) */}
            <tr>
              <td
                className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ev-primary max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]"
                onClick={() => handleSort('powerRatingKw')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSort('powerRatingKw')
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Sort by power rating"
                aria-sort={sortField === 'powerRatingKw' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex flex-col leading-tight">
                  <span>Power {sortField === 'powerRatingKw' && (sortDirection === 'asc' ? '↑' : '↓')}</span>
                  <span className="text-[10px] text-gray-500">(kW)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => (
                <td
                  key={vehicle.id}
                  className={`px-3 py-2 text-center text-xs ${
                    bestPowerKw !== null && vehicle.powerRatingKw === bestPowerKw
                      ? 'bg-green-100 font-semibold text-green-800'
                      : 'text-gray-600'
                  }`}
                >
                  {formatValueOrNA(vehicle.powerRatingKw, (v) => `${v}`)}
                </td>
              ))}
            </tr>
            {/* 2. Power in Horsepower (hp) */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Power</span>
                  <span className="text-[10px] text-gray-500">(hp)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const hp = vehicle.powerRatingKw !== null && vehicle.powerRatingKw !== undefined 
                  ? convertKwToHp(vehicle.powerRatingKw) 
                  : null
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      bestPowerHp !== null && hp !== null && hp === bestPowerHp
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatValueOrNA(hp, (v) => `${v} hp`)}
                </td>
                )
              })}
            </tr>
            {/* 3. Torque (Nm) */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Torque</span>
                  <span className="text-[10px] text-gray-500">(Nm)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const isBest = selectedVehicles.length > 0 && vehicle.torqueNm !== null && vehicle.torqueNm !== undefined
                  ? (() => {
                      const torques = selectedVehicles
                        .map(v => v.torqueNm)
                        .filter((v): v is number => v !== null && v !== undefined)
                      return torques.length > 0 && vehicle.torqueNm === Math.max(...torques)
                    })()
                  : false
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatValueOrNA(vehicle.torqueNm, (v) => `${v}`)}
                </td>
                )
              })}
            </tr>
            {/* 4. Acceleration */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Acceleration</span>
                  <span className="text-[10px] text-gray-500">(0-100 km/h)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const accel = getAcceleration0To100Kmh(
                  vehicle.acceleration0To100Kmh,
                  vehicle.powerRatingKw,
                  vehicle.curbWeightKg
                )
                const isBest = bestAcceleration !== null && accel !== null && accel === bestAcceleration
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatValueOrNA(accel, (v) => `${v.toFixed(1)}s`)}
              </td>
                )
              })}
            </tr>
            {/* 5. Top Speed (km/h) */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Top Speed</span>
                  <span className="text-[10px] text-gray-500">(km/h)</span>
                </div>
                </td>
              {sortedVehicles.map((vehicle) => {
                const isBest = selectedVehicles.length > 0 && vehicle.topSpeedKmh !== null && vehicle.topSpeedKmh !== undefined
                  ? (() => {
                      const topSpeeds = selectedVehicles
                        .map(v => v.topSpeedKmh)
                        .filter((v): v is number => v !== null && v !== undefined)
                      return topSpeeds.length > 0 && vehicle.topSpeedKmh === Math.max(...topSpeeds)
                    })()
                  : false
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatValueOrNA(vehicle.topSpeedKmh, (v) => `${v}`)}
                </td>
                )
              })}
            </tr>
            {/* 6. Range - WLTP (km) */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Range - WLTP</span>
                  <span className="text-[10px] text-gray-500">(km)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const rangeWltp = vehicle.rangeWltpKm ?? vehicle.rangeKm
                const rangeWltpDisplay = vehicle.rangeWltpKm ? Math.round(vehicle.rangeWltpKm) : vehicle.rangeKm
                const isBest = bestRangeWltp !== null && rangeWltp === bestRangeWltp
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatValueOrNA(rangeWltpDisplay, (v) => `${v}`)}
                  </td>
                )
              })}
            </tr>
            {/* 7. Range - EPA (km) */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Range - EPA</span>
                  <span className="text-[10px] text-gray-500">(km)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const rangeEpa = vehicle.rangeEpaKm ?? (vehicle.rangeKm !== null && vehicle.rangeKm !== undefined ? Math.round(vehicle.rangeKm * 0.75) : null)
                const rangeEpaDisplay = vehicle.rangeEpaKm !== null && vehicle.rangeEpaKm !== undefined 
                  ? Math.round(vehicle.rangeEpaKm) 
                  : (vehicle.rangeKm !== null && vehicle.rangeKm !== undefined ? Math.round(vehicle.rangeKm * 0.75) : null)
                const isBest = bestRangeEpa !== null && rangeEpa === bestRangeEpa
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatValueOrNA(rangeEpaDisplay, (v) => `${v}`)}
                </td>
                )
              })}
            </tr>
            {/* 8. Efficiency (kWh/100km) */}
            <tr>
              <td
                className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ev-primary max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]"
                onClick={() => handleSort('efficiencyKwhPer100km')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSort('efficiencyKwhPer100km')
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Sort by efficiency"
                aria-sort={sortField === 'efficiencyKwhPer100km' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex flex-col leading-tight">
                  <span>Efficiency {sortField === 'efficiencyKwhPer100km' && (sortDirection === 'asc' ? '↑' : '↓')}</span>
                  <span className="text-[10px] text-gray-500">(kWh/100km)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => (
                <td
                  key={vehicle.id}
                  className={`px-3 py-2 text-center text-xs ${
                    vehicle.efficiencyKwhPer100km === bestEfficiency
                      ? 'bg-green-100 font-semibold text-green-800'
                      : 'text-gray-600'
                  }`}
                >
                  {formatValueOrNA(vehicle.efficiencyKwhPer100km, (v) => `${v}`)}
                </td>
              ))}
            </tr>
            {/* 9. Cost / km */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex items-center gap-1.5">
                  <span className="break-words leading-tight">Cost / km</span>
                  <CostPerKmInfoBox 
                    country={sortedVehicles[0]?.country || 'SG'}
                  />
                </div>
              </td>
              {sortedVehicles.map((vehicle) => (
                <td
                  key={vehicle.id}
                  className={`px-3 py-2 text-center text-xs ${
                    bestCostPerKm !== null && getCostPerKm(vehicle) === bestCostPerKm
                      ? 'bg-green-100 font-semibold text-green-800'
                      : 'text-gray-600'
                  }`}
                >
                  {getCostPerKm(vehicle) !== null 
                    ? formatCostPerKm(getCostPerKm(vehicle)!, vehicle.country)
                    : 'N/A'}
                </td>
              ))}
            </tr>
            {/* 9. Cost / full charge */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex items-center gap-1.5">
                  <span className="break-words leading-tight">Cost / Full Charge</span>
                  <CostPerFullChargeInfoBox 
                    country={sortedVehicles[0]?.country || 'SG'}
                  />
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const cost = getCostPerFullCharge(vehicle)
                const isBest = bestCostPerFullCharge !== null && cost === bestCostPerFullCharge
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {cost !== null ? formatPrice(cost, vehicle.country) : 'N/A'}
                  </td>
                )
              })}
            </tr>
            {/* 11. Vehicle Base Price */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <span className="break-words leading-tight">Vehicle Base Price</span>
              </td>
              {sortedVehicles.map((vehicle) => {
                const isBest = bestBasePrice !== null && vehicle.basePriceLocalCurrency === bestBasePrice
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatPriceOrNA(vehicle.basePriceLocalCurrency, vehicle.country)}
                  </td>
                )
              })}
            </tr>
            {/* 12. Battery Capacity */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Battery Capacity</span>
                  <span className="text-[10px] text-gray-500">(kWh)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const capacity = (vehicle.batteryCapacityKwh !== null && vehicle.batteryCapacityKwh !== undefined && vehicle.batteryCapacityKwh > 0) ? vehicle.batteryCapacityKwh : null
                const isBest = bestBatteryCapacity !== null && capacity !== null && capacity === bestBatteryCapacity
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatValueOrNA(capacity, (v) => `${v} kWh`)}
                  </td>
                )
              })}
            </tr>
            {/* 12. DC Fast Charge 0-80% (min) */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>DC Fast Charge</span>
                  <span className="text-[10px] text-gray-500">0-80% (min)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const isBest = bestChargingTime !== null && vehicle.chargingTimeDc0To80Min === bestChargingTime
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {vehicle.chargingTimeDc0To80Min}
                  </td>
                )
              })}
            </tr>
            {/* 13. Charging Capabilities */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <span className="break-words leading-tight">Charging Capabilities</span>
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-3 py-2 text-center text-xs text-gray-600">
                  {formatStringOrNA(vehicle.chargingCapabilities)}
                </td>
              ))}
            </tr>
            {/* 14. Vehicle Weight (kg) */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Vehicle Weight</span>
                  <span className="text-[10px] text-gray-500">(kg)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const weight = vehicle.curbWeightKg !== null && vehicle.curbWeightKg !== undefined
                  ? Math.round(vehicle.curbWeightKg)
                  : null
                const isBest = bestVehicleWeight !== null && weight !== null && vehicle.curbWeightKg === bestVehicleWeight
                return (
                  <td
                    key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {formatValueOrNA(weight, (v) => `${v} kg`)}
              </td>
                )
              })}
            </tr>
            {/* 15. Battery Weight (kg) */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Battery Weight</span>
                  <span className="text-[10px] text-gray-500">(kg)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const weight = vehicle.batteryWeightKg !== null && vehicle.batteryWeightKg !== undefined
                  ? Math.round(vehicle.batteryWeightKg)
                  : null
                const isBest = bestBatteryWeight !== null && weight !== null && vehicle.batteryWeightKg === bestBatteryWeight
                return (
                <td
                  key={vehicle.id}
                    className={`px-3 py-2 text-center text-xs ${
                      isBest
                        ? 'bg-green-100 font-semibold text-green-800'
                        : 'text-gray-600'
                  }`}
                >
                    {formatValueOrNA(weight, (v) => `${v} kg`)}
                </td>
                )
              })}
            </tr>
            {/* 16. Battery Weight % */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <div className="flex flex-col leading-tight">
                  <span>Battery Weight</span>
                  <span className="text-[10px] text-gray-500">(%)</span>
                </div>
              </td>
              {sortedVehicles.map((vehicle) => {
                const isBest = bestBatteryWeightPercent !== null && vehicle.batteryWeightPercentage === bestBatteryWeightPercent
                return (
                <td
                  key={vehicle.id}
                  className={`px-3 py-2 text-center text-xs ${
                      isBest
                      ? 'bg-green-100 font-semibold text-green-800'
                      : 'text-gray-600'
                  }`}
                >
                    {formatValueOrNA(vehicle.batteryWeightPercentage, (v) => `${v.toFixed(1)}%`)}
                </td>
                )
              })}
            </tr>
            {/* 17. Battery Manufacturer */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <span className="break-words leading-tight">Battery Manufacturer</span>
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-3 py-2 text-center text-xs text-gray-600">
                  {formatStringOrNA(vehicle.batteryManufacturer)}
                </td>
              ))}
            </tr>
            {/* 18. Battery Technology */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <span className="break-words leading-tight">Battery Technology</span>
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-3 py-2 text-center text-xs text-gray-600">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-200">
                    {formatStringOrNA(vehicle.batteryTechnology)}
                  </span>
                </td>
              ))}
            </tr>
            {/* 19. Battery Warranty */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <span className="break-words leading-tight">Battery Warranty</span>
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-3 py-2 text-center text-xs text-gray-600">
                  {formatStringOrNA(vehicle.batteryWarranty)}
                </td>
              ))}
            </tr>
            {/* 20. Over the air (OTA) updates */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <span className="break-words leading-tight">Over the Air (OTA) Updates</span>
              </td>
              {sortedVehicles.map((vehicle) => {
                // Check if technologyFeatures mentions OTA
                const hasOTA = vehicle.technologyFeatures?.toLowerCase().includes('ota') || 
                              vehicle.technologyFeatures?.toLowerCase().includes('over-the-air') ||
                              vehicle.technologyFeatures?.toLowerCase().includes('over the air')
                return (
                  <td key={vehicle.id} className="px-3 py-2 text-center text-xs text-gray-600">
                    {hasOTA ? 'Yes' : (vehicle.technologyFeatures ? 'N/A' : 'N/A')}
                  </td>
                )
              })}
            </tr>
            {/* 21. Technology Features */}
            <tr>
              <td className="px-2 py-2 text-xs font-medium text-gray-700 sticky left-0 bg-white z-10 max-w-[6rem] md:max-w-[8rem] lg:max-w-[10rem]">
                <span className="break-words leading-tight">Technology Features</span>
              </td>
              {sortedVehicles.map((vehicle) => (
                <td key={vehicle.id} className="px-3 py-2 text-center text-xs text-gray-600">
                  {formatStringOrNA(vehicle.technologyFeatures)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

interface MetricDatum {
  label: string
  value: number
  color: string
  country?: Country
}

interface PublicFastVsHomeSolarDatum {
  label: string
  publicFast: number
  homeSolar: number
  color: string
}

interface PublicFastVsHomeSolarChartProps {
  data: PublicFastVsHomeSolarDatum[]
  country: Country
}

/**
 * Info box component for Time-to-Charge chart
 */
function TimeToChargeInfoBox() {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const getPosition = () => {
    if (!buttonRef.current || !isOpen) return null
    const rect = buttonRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 6,
      left: rect.left,
    }
  }

  const position = getPosition()

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
        aria-label="Show time-to-charge info"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && position && typeof window !== 'undefined' && createPortal((
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="text-xs font-semibold text-gray-900 mb-3">Charging time</div>
            <div className="space-y-3 text-xs text-gray-700">
              <div>
                <div className="font-medium text-gray-900 mb-1.5">Public fast charging:</div>
                <div className="text-gray-600 mb-2">
                  Assume 100 kW DC — the most common fast charger in urban SEA 2025–26. Almost all real sessions are 20→80 %. Future plans for 200–350 kW hubs expanding fast.
                </div>
                <div className="bg-gray-50 p-2 rounded font-mono text-[10px] text-gray-700">
                  Minutes = (Battery Capacity × 0.8) ÷ Max DC Rate (kW) × 60
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="font-medium text-gray-900 mb-1.5">Home solar:</div>
                <div className="text-gray-600 mb-2">
                  Real daily yield of a 10 kW system (4–5.5 peak sun hours). Daily yield varies by country based on average sunlight hours.
                </div>
                <div className="bg-gray-50 p-2 rounded font-mono text-[10px] text-gray-700">
                  Days = (Battery Capacity × 0.6) ÷ Daily Yield (kWh/day)
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Assumes 20→80% charge (60% of battery capacity)
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </>
      ), document.body)}
    </div>
  )
}

/**
 * Shared CustomTick component for X-axis labels
 * Standardized formatting: fontSize 9, gray color, multi-line wrapping
 */
const CustomXAxisTick = ({ x, y, payload, customLabel }: any) => {
  const label = payload.value
  const maxWidth = 60 // Maximum width in pixels for each line
  const words = label.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  words.forEach((word: string) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    // Approximate width: ~6px per character for fontSize 9
    if (testLine.length * 6 <= maxWidth || !currentLine) {
      currentLine = testLine
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  })
  if (currentLine) lines.push(currentLine)
  
  // If custom label renderer is provided and label matches, use custom rendering
  // Only use foreignObject for React components, not plain strings
  if (customLabel && isValidElement(customLabel)) {
    return (
      <foreignObject x={x - 30} y={y + 10} width="60" height="40">
        <div className="flex items-center justify-center text-[9px] text-gray-600">
          {customLabel}
        </div>
      </foreignObject>
    )
  }
  
  // For regular labels (including string returns from customLabelRenderer), use SVG text
  return (
    <g transform={`translate(${x},${y + 5})`}>
      <text
        x={0}
        y={0}
        dy={0}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={9}
      >
        {lines.map((line, idx) => (
          <tspan
            key={idx}
            x={0}
            dy={idx === 0 ? 0 : 12}
            textAnchor="middle"
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

/**
 * Grouped bar chart component for Public Fast vs Home Solar
 */
function PublicFastVsHomeSolarChart({ data, country }: PublicFastVsHomeSolarChartProps) {

  // Format minutes as single value with ~ (e.g., "~15 min", "~25 min")
  const formatMinutesSingle = (minutes: number): string => {
    return `~${minutes} min`
  }

  // Custom legend without info boxes - pattern based (no colors)
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex justify-center gap-4 mt-1.5 mb-0.5">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1">
            {entry.value === 'publicFast' ? (
              <div className="w-2.5 h-2.5 border border-gray-400 bg-gray-200" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full border border-gray-400 bg-gray-200" />
            )}
            <span className="text-[10px] text-gray-600">
              {entry.value === 'publicFast' ? 'Public Fast' : 'Home Solar'}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg px-3 pt-4 pb-0 flex flex-col gap-0">
      <div>
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-800">Typical Top-Up (20-80%)</p>
          <TimeToChargeInfoBox />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Public fast charging; Home Solar
        </p>
        <div className="flex justify-center gap-3 mt-5 mb-0">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 border border-gray-400 bg-gray-200" />
            <span className="text-[9px] text-gray-600">Public Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full border border-gray-400 bg-gray-200" />
            <span className="text-[9px] text-gray-600">Home Solar</span>
          </div>
        </div>
      </div>
      <div className="h-64 flex items-end justify-center pb-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 25, right: 10, left: 10, bottom: 23 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="label" 
              interval={0}
              tick={(props) => <CustomXAxisTick {...props} />}
              height={70}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 9, fill: '#6b7280' }} 
              width={30}
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: '#9ca3af' } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 9, fill: '#6b7280' }} 
              width={40}
              tickFormatter={(value: number) => value.toFixed(1)}
              label={{ value: 'Days', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 10, fill: '#9ca3af' } }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'publicFast') {
                  return [formatMinutesSingle(value), 'Public Fast (20→80 %)']
                } else {
                  return [`${value.toFixed(1)} days`, 'Home Solar']
                }
              }}
              labelStyle={{ fontSize: 11, fontWeight: 600 }}
              contentStyle={{ fontSize: 11 }}
            />
            <Bar 
              yAxisId="left"
              dataKey="publicFast" 
              name="publicFast"
              fill="#0ea5e9"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, idx) => (
                <Cell 
                  key={`public-${idx}`} 
                  fill={entry.color}
                />
              ))}
              <LabelList
                dataKey="publicFast"
                position="inside"
                formatter={(value: number) => formatMinutesSingle(value)}
                style={{ fontSize: 9, fill: '#fff', fontWeight: 500 }}
              />
            </Bar>
            <Scatter
              yAxisId="right"
              dataKey="homeSolar"
              name="homeSolar"
              fill="#10b981"
              shape={(props: any) => {
                const { cx, cy, payload } = props
                // Access color from payload (ComposedChart passes full data object)
                const dotColor = payload.color || '#10b981'
                const homeSolarValue = payload.homeSolar || payload.y
                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={dotColor}
                      stroke="#000"
                      strokeWidth={1.5}
                    />
                    <text
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#374151"
                    >
                      {homeSolarValue?.toFixed(1)} days
                    </text>
                  </g>
                )
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface MetricChartProps {
  title: string | ReactNode
  data: MetricDatum[]
  suffix?: string
  formatter?: (value: number, entry?: any) => string
  children?: ReactNode
  customLabelRenderer?: (label: string) => ReactNode
}

function MetricChart({ title, data, suffix, formatter, children, customLabelRenderer }: MetricChartProps) {

  return (
    <div className="bg-gray-50 rounded-lg px-3 pt-4 pb-0 flex flex-col gap-3">
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        {children && <p className="text-xs text-gray-500 mt-1">{children}</p>}
      </div>
      <div className="h-64 flex items-end justify-center pb-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 25, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="label" 
              interval={0}
              tick={(props) => {
                const label = props.payload.value
                if (customLabelRenderer) {
                  const customLabel = customLabelRenderer(label)
                  return <CustomXAxisTick {...props} customLabel={customLabel} />
                }
                return <CustomXAxisTick {...props} />
              }}
              height={70}
            />
            <YAxis 
              tick={{ fontSize: 9, fill: '#6b7280' }} 
              width={50}
              tickFormatter={(value: number) => value.toFixed(2)}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
              <LabelList
                dataKey="value"
                position="inside"
                formatter={(value: number, entry: any) => {
                  const formatted = formatter ? formatter(value, entry) : `${value}${suffix ?? ''}`
                  return formatted
                }}
                style={{ fontSize: 10, fill: '#fff', fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

