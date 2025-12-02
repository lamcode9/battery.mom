'use client'

import { useState, useEffect, useMemo } from 'react'
import { Country } from '@/types/bess'
import { BESS } from '@/types/bess'
import { Vehicle } from '@/types/vehicle'
import { loadBESSData } from '@/lib/data-fetchers/bess-data'
import {
  calculateZeroBill,
  findOptimalSystem,
  findBestNetSavingsSystem,
  findOffGridSystem,
  findZeroBillSystem,
  ZeroBillInputs,
  OptimalSystem,
  DEFAULT_HOUSEHOLD_LOADS,
  DEFAULT_DRIVING_DISTANCE,
  NET_METERING_TYPE,
  SOLAR_COST_PER_KW,
  CURRENCY_BY_COUNTRY,
  EXPORT_RATE_MULTIPLIER,
} from '@/lib/utils/zero-bill-calculator'
import {
  ResponsiveContainer,
  BarChart,
  ComposedChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  Cell,
} from 'recharts'

const COUNTRY_NAMES: Record<Country, string> = {
  MY: 'Malaysia',
  SG: 'Singapore',
  ID: 'Indonesia',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
}

const CURRENCY_SYMBOLS: Record<Country, string> = {
  MY: 'RM',
  SG: 'S$',
  ID: 'Rp',
  TH: '฿',
  VN: '₫',
  PH: '₱',
}

// InfoBox Component
function InfoBox({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative inline-block group ${className}`}>
      <button
        type="button"
        className="text-gray-400 hover:text-blue-600 transition-colors"
        aria-label="Show information"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <div className="absolute left-0 top-6 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="text-xs font-semibold text-gray-900 mb-2">{title || 'Information'}</div>
        <div className="text-xs text-gray-700 leading-relaxed space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  )
}

// Energy Flow Chart Component
function EnergyFlowChart({ energyFlow, country }: { energyFlow: any; country: Country }) {
  // Check if grid export should be shown for this country
  const showGridExport = EXPORT_RATE_MULTIPLIER[country].net_billing > 0
  
  // Detect mobile screen size
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Transform hourly data for chart
  // Get battery capacity from first hour's data if available, or use a default
  const maxBatteryCapacity = energyFlow.hourly.length > 0 
    ? Math.max(...energyFlow.hourly.map((h: any) => h.batteryLevel || 0), 0)
    : 0
  
  const chartData = energyFlow.hourly.map((hour: any) => {
    // Multiple layers of protection to ensure battery level is never negative
    let batteryLevel = hour.batteryLevel || 0
    
    // Debug: Log if we find negative values
    if (batteryLevel < 0) {
      console.warn(`Negative battery level detected at hour ${hour.hour}:`, batteryLevel, 'Raw data:', hour)
    }
    
    // Absolute clamping - ensure it's never negative, no matter what
    batteryLevel = Math.max(0, batteryLevel) // First clamp
    batteryLevel = Math.max(0, Math.round(batteryLevel * 100) / 100) // Round and clamp again
    batteryLevel = Math.abs(batteryLevel) // Use absolute value as final safety net
    
    // Final safety check - absolutely ensure it's never negative
    if (batteryLevel < 0 || isNaN(batteryLevel) || !isFinite(batteryLevel)) {
      console.error(`Invalid battery level at hour ${hour.hour}:`, batteryLevel, 'Setting to 0')
      batteryLevel = 0
    }
    
    const data: any = {
      hour: hour.hour,
      time: `${hour.hour.toString().padStart(2, '0')}:00`,
      Solar: hour.solar,
      'Battery Charge': hour.batteryCharge,
      'Battery Usage': hour.batteryDischarge,
      'Battery Level': batteryLevel, // Ensure never negative with multiple checks
      Grid: hour.gridSupply,
      'Household Load': hour.householdLoad,
      'EV Charging': hour.evCharging,
      'EV from Solar': hour.evChargingFromSolar,
      'EV from Battery': hour.evChargingFromBattery,
      'EV from Grid': hour.evChargingFromGrid,
    }
    
    // Only include Grid Export if the country supports it
    if (showGridExport) {
      data['Grid Export'] = -hour.gridExport // Negative to show below axis
    }
    
    return data
  })

  const COLORS = {
    Solar: '#10b981', // emerald-500
    'Battery Charge': '#0891b2', // cyan-600
    'Battery Usage': '#059669', // emerald-600
    'Battery Level': '#06b6d4', // cyan-500
    Grid: '#ef4444', // red-500
    'Grid Export': '#f59e0b', // amber-500
    'Household Load': '#6b7280', // gray-500
    'EV Charging': '#8b5cf6', // violet-500
    'EV from Solar': '#a78bfa', // violet-400
    'EV from Battery': '#7c3aed', // violet-600
    'EV from Grid': '#dc2626', // red-600
  }

  return (
    <div className="w-full pb-4">
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 500}>
        <ComposedChart
          data={chartData}
          margin={isMobile ? { top: 20, right: 20, left: 30, bottom: 40 } : { top: 40, right: 50, left: 50, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            fontSize={isMobile ? 9 : 11}
            height={isMobile ? 50 : 40}
            interval={isMobile ? 2 : 1} // Show every 2 hours on mobile, every hour on desktop
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
          />
          <YAxis 
            yAxisId="energy"
            stroke="#6b7280"
            fontSize={isMobile ? 10 : 12}
            width={isMobile ? 35 : 50}
            label={isMobile ? { value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '9px' } } : { value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
          />
          <YAxis 
            yAxisId="battery"
            orientation="right"
            stroke="#06b6d4"
            fontSize={isMobile ? 10 : 12}
            width={isMobile ? 35 : 50}
            domain={[0, 'auto']} // Ensure battery level Y-axis always starts at 0, never goes negative
            allowDataOverflow={false}
            label={isMobile ? { value: 'Battery (kWh)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '9px' } } : { value: 'Battery Level (kWh)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: isMobile ? '8px' : '12px',
              fontSize: isMobile ? '11px' : '12px',
            }}
            formatter={(value: number, name: string) => {
              const absValue = Math.abs(value)
              return [`${absValue.toFixed(2)} kWh`, name]
            }}
          />
          {/* Generation sources - stacked bars */}
          <Bar yAxisId="energy" dataKey="Solar" stackId="generation" fill={COLORS.Solar} />
          <Bar yAxisId="energy" dataKey="Battery Usage" stackId="generation" fill={COLORS['Battery Usage']} />
          <Bar yAxisId="energy" dataKey="Grid" stackId="generation" fill={COLORS.Grid} />
          
          {/* Consumption - stacked areas (Household Load + EV Charging + Battery Charging) */}
          <Area 
            yAxisId="energy"
            type="monotone" 
            dataKey="Household Load" 
            stackId="consumption" 
            fill={COLORS['Household Load']} 
            stroke={COLORS['Household Load']}
            fillOpacity={0.4}
          />
          <Area 
            yAxisId="energy"
            type="monotone" 
            dataKey="EV Charging" 
            stackId="consumption" 
            fill={COLORS['EV Charging']} 
            stroke={COLORS['EV Charging']}
            fillOpacity={0.4}
          />
          <Area 
            yAxisId="energy"
            type="monotone" 
            dataKey="Battery Charge" 
            stackId="consumption" 
            fill={COLORS['Battery Charge']} 
            stroke={COLORS['Battery Charge']}
            fillOpacity={0.4}
          />
          
          {/* Battery level - secondary line */}
          <Line 
            yAxisId="battery"
            type="monotone" 
            dataKey="Battery Level" 
            stroke={COLORS['Battery Level']} 
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          
          {/* Grid export - negative bar (only if country supports it) */}
          {showGridExport && (
            <Bar yAxisId="energy" dataKey="Grid Export" stackId="export" fill={COLORS['Grid Export']} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Combined Legend with Values */}
      <div className="-mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Generation Sources */}
          <div className={isMobile ? "p-2" : "p-3"}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Generation</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.Solar }}></div>
                  <span className="text-xs text-gray-700">Solar</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{energyFlow.solarGeneration.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS['Battery Usage'] }}></div>
                  <span className="text-xs text-gray-700">Battery</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{energyFlow.batteryDischarge.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.Grid }}></div>
                  <span className="text-xs text-gray-700">Grid</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{energyFlow.gridSupply.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Consumption */}
          <div className={isMobile ? "p-2" : "p-3"}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Consumption</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS['Household Load'] }}></div>
                  <span className="text-xs text-gray-700">Household</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{(energyFlow.daytimeLoad + energyFlow.nighttimeLoad).toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS['EV Charging'] }}></div>
                  <span className="text-xs text-gray-700">EV Charging</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{energyFlow.evCharging.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS['Battery Charge'] }}></div>
                  <span className="text-xs text-gray-700">Battery Charging</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{energyFlow.batteryCharging.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className={isMobile ? "p-2" : "p-3"}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">System Status</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 border-t-2 border-dashed" style={{ borderColor: COLORS['Battery Level'] }}></div>
                  <span className="text-xs text-gray-700">Battery Level</span>
                </div>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">
                  {maxBatteryCapacity > 0 ? maxBatteryCapacity.toFixed(1) : '0.0'}
                </span>
              </div>
              {showGridExport && energyFlow.excessSolarExported > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS['Grid Export'] }}></div>
                    <span className="text-xs text-gray-700">Grid Export</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900 tabular-nums">{energyFlow.excessSolarExported.toFixed(1)}</span>
                </div>
              )}
              {!showGridExport && (
                <div className="text-xs text-gray-400 italic">No grid export</div>
              )}
            </div>
          </div>
        </div>
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
          <div className="text-[10px] text-gray-500 text-center">All values in kWh/day</div>
        </div>
      </div>
    </div>
  )
}

export default function BatteriesAtHomePage() {
  const [country, setCountry] = useState<Country>('MY')
  const [solarSizeKw, setSolarSizeKw] = useState(10)
  const [includeSolarCost, setIncludeSolarCost] = useState(true)
  const [roofQuality, setRoofQuality] = useState<'Ideal' | 'Average' | 'Shaded'>('Average')
  const [batteries, setBatteries] = useState<Array<{ model: BESS | null; quantity: number }>>([
    { model: null, quantity: 0 },
  ])
  const [vehicles, setVehicles] = useState<Array<{ 
    model: Vehicle | null
    quantity: number
    drivingDistanceKm: number
    evHomeChargingPercentage: number
    evChargingTime: 'Night only' | 'Day only' | 'Both'
  }>>([
    { model: null, quantity: 0, drivingDistanceKm: 45, evHomeChargingPercentage: 60, evChargingTime: 'Night only' },
  ])
  const [dayLoad, setDayLoad] = useState<number>(8) // Default to Average (8 kWh)
  const [nightLoad, setNightLoad] = useState<number>(10) // Default to Average (10 kWh)
  // Always use net billing for all countries
  const netMetering = 'net_billing' as const
  const [optimizationMode, setOptimizationMode] = useState<'full_off_grid' | 'best_net_savings' | 'zero_bill'>('best_net_savings')

  const [bessList, setBessList] = useState<BESS[]>([])
  const [vehicleList, setVehicleList] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load BESS data
  useEffect(() => {
    setIsLoading(true)
    try {
      const bessData = loadBESSData(country)
      setBessList(bessData)
    } catch (error) {
      console.error('Error loading BESS data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [country])

  // Load vehicle data
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const response = await fetch(`/api/vehicles?country=${country}&available=true`)
        if (response.ok) {
          const data = await response.json()
          setVehicleList(data)
        }
      } catch (error) {
        console.error('Error loading vehicles:', error)
      }
    }
    loadVehicles()
  }, [country])


  // Update default driving distance when country changes
  useEffect(() => {
    setVehicles(prev => prev.map(v => ({ ...v, drivingDistanceKm: DEFAULT_DRIVING_DISTANCE[country] })))
  }, [country])

  // Update default loads when country changes
  useEffect(() => {
    setDayLoad(8) // Average
    setNightLoad(10) // Average
  }, [country])

  // Calculate outputs
  const inputs: ZeroBillInputs = useMemo(() => ({
    country,
    solarSizeKw,
    includeSolarCost,
    roofQuality,
    batteries: batteries.filter(b => b.model !== null && b.quantity > 0),
    vehicles: vehicles.filter(v => v.model !== null && v.quantity > 0).map(v => ({
      model: v.model,
      quantity: v.quantity,
      drivingDistanceKm: v.drivingDistanceKm,
      evHomeChargingPercentage: v.evHomeChargingPercentage,
      evChargingTime: v.evChargingTime,
    })),
    // Aggregate settings for backward compatibility (use first vehicle or defaults)
    drivingDistanceKm: vehicles.find(v => v.model !== null)?.drivingDistanceKm || 45,
    evHomeChargingPercentage: vehicles.find(v => v.model !== null)?.evHomeChargingPercentage || 60,
    evChargingTime: vehicles.find(v => v.model !== null)?.evChargingTime || 'Night only',
    dayLoad,
    nightLoad,
    netMetering: 'net_billing',
  }), [country, solarSizeKw, includeSolarCost, roofQuality, batteries, vehicles, dayLoad, nightLoad])

  const outputs = useMemo(() => calculateZeroBill(inputs), [inputs])

  // Calculate optimal system recommendation based on selected mode
  const optimalSystem = useMemo(() => {
    if (bessList.length === 0) return null
    
    const baseInputs = {
      country,
      includeSolarCost: true,
      roofQuality,
      vehicles: vehicles.filter(v => v.model !== null && v.quantity > 0).map(v => ({
        model: v.model,
        quantity: v.quantity,
        drivingDistanceKm: v.drivingDistanceKm,
        evHomeChargingPercentage: v.evHomeChargingPercentage,
        evChargingTime: v.evChargingTime,
      })),
      // Aggregate settings for backward compatibility
      drivingDistanceKm: vehicles.find(v => v.model !== null)?.drivingDistanceKm || 45,
      evHomeChargingPercentage: vehicles.find(v => v.model !== null)?.evHomeChargingPercentage || 60,
      evChargingTime: vehicles.find(v => v.model !== null)?.evChargingTime || 'Night only',
      dayLoad,
      nightLoad,
      netMetering: 'net_billing' as 'net_billing',
    }
    
    if (optimizationMode === 'full_off_grid') {
      return findOffGridSystem(baseInputs, bessList)
    } else if (optimizationMode === 'zero_bill') {
      return findZeroBillSystem(baseInputs, bessList)
    } else if (optimizationMode === 'best_net_savings') {
      return findBestNetSavingsSystem(baseInputs, bessList)
    } else {
      return findOptimalSystem(baseInputs, bessList)
    }
  }, [country, roofQuality, vehicles, dayLoad, nightLoad, bessList, optimizationMode])

  // Calculate outputs for optimal system (for displaying monthly bill in zero-bill mode)
  const optimalSystemOutputs = useMemo(() => {
    if (!optimalSystem) return null
    
    const baseInputs = {
      country,
      includeSolarCost: true,
      roofQuality,
      vehicles: vehicles.filter(v => v.model !== null && v.quantity > 0).map(v => ({
        model: v.model,
        quantity: v.quantity,
        drivingDistanceKm: v.drivingDistanceKm,
        evHomeChargingPercentage: v.evHomeChargingPercentage,
        evChargingTime: v.evChargingTime,
      })),
      drivingDistanceKm: vehicles.find(v => v.model !== null)?.drivingDistanceKm || 45,
      evHomeChargingPercentage: vehicles.find(v => v.model !== null)?.evHomeChargingPercentage || 60,
      evChargingTime: vehicles.find(v => v.model !== null)?.evChargingTime || 'Night only',
      dayLoad,
      nightLoad,
      netMetering: 'net_billing' as 'net_billing',
    }
    
    const testInputs: ZeroBillInputs = {
      ...baseInputs,
      solarSizeKw: optimalSystem.solarSizeKw,
      batteries: optimalSystem.batteries,
      includeSolarCost: true,
    }
    
    return calculateZeroBill(testInputs)
  }, [optimalSystem, country, roofQuality, vehicles, dayLoad, nightLoad])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: CURRENCY_BY_COUNTRY[country] || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const addBattery = () => {
    setBatteries([...batteries, { model: null, quantity: 0 }])
  }

  const removeBattery = (index: number) => {
    setBatteries(batteries.filter((_, i) => i !== index))
  }

  const updateBattery = (index: number, field: 'model' | 'quantity', value: BESS | null | number) => {
    const updated = [...batteries]
    updated[index] = { ...updated[index], [field]: value }
    // If model is selected and quantity is 0, default to 1
    if (field === 'model' && value !== null && updated[index].quantity === 0) {
      updated[index].quantity = 1
    }
    setBatteries(updated)
  }

  const addVehicle = () => {
    setVehicles([...vehicles, { 
      model: null, 
      quantity: 0, 
      drivingDistanceKm: DEFAULT_DRIVING_DISTANCE[country],
      evHomeChargingPercentage: 60,
      evChargingTime: 'Night only'
    }])
  }

  const removeVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index))
  }

  const updateVehicle = (
    index: number, 
    field: 'model' | 'quantity' | 'drivingDistanceKm' | 'evHomeChargingPercentage' | 'evChargingTime', 
    value: Vehicle | null | number | 'Night only' | 'Day only' | 'Both'
  ) => {
    const updated = [...vehicles]
    updated[index] = { ...updated[index], [field]: value }
    // If model is selected and quantity is 0, default to 1
    if (field === 'model' && value !== null && updated[index].quantity === 0) {
      updated[index].quantity = 1
    }
    setVehicles(updated)
  }

  return (
    <main className="min-h-screen pt-12 md:pt-14 bg-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 pb-8 max-w-7xl">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-left">
          Batteries at Home
        </h2>
        
        {/* Hero Intro Section */}
        <div className="mb-12 max-w-4xl">
          <div className="border-l-4 border-emerald-600 pl-6 md:pl-8 py-6 bg-gray-50/50">
            <div className="space-y-5">
              <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                Design your zero-bill setup — solar + battery + EV.
              </p>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-3xl">
                Real tariffs, real solar yield, real loads — find the right setup for your home
              </p>
              <div className="pt-2 border-t border-gray-200/60">
                <p className="text-base text-gray-600 leading-relaxed whitespace-nowrap">
                  Select your country to see setup costs to optimize your home to either go off-grid, zero-bill, max-savings or anything in between
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Country Selector */}
        <div className="mb-8 max-w-4xl">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <label htmlFor="country-select" className="text-sm font-medium text-gray-700">
                  Country:
                </label>
                <select
                  id="country-select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value as Country)}
                  className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-0 min-w-[180px]"
                >
                  {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Energy Flow Chart */}
        {outputs && outputs.energyFlow && (
          <div className="mb-12 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Daily Energy Flow</h2>
              <InfoBox title="Chart Explanation">
                <div className="space-y-1.5">
                  <div>This chart shows hourly energy flows throughout a typical day. Bars show generation (Solar, Battery, Grid) and areas show consumption (Household, EV, Battery Charging). The dashed line shows battery level.</div>
                  <div className="pt-1 border-t border-gray-200 text-[11px] text-gray-600">
                    Generation bars are stacked upward. Consumption areas are stacked downward. Grid Export (if applicable) appears as negative bars below the axis. Battery Level uses the right Y-axis.
                  </div>
                </div>
              </InfoBox>
            </div>
            <EnergyFlowChart energyFlow={outputs.energyFlow} country={country} />
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[6fr_4fr] gap-0 mb-12 border border-gray-200 rounded-lg overflow-hidden">
          {/* INPUTS COLUMN */}
          <div className="bg-gray-50 p-5 border-r border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurator</h2>
            {/* Unified Configuration Container */}
            <div className="space-y-6">
              {/* Power Usage Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-semibold text-gray-900">Power Usage</h2>
                    <InfoBox title="Power Usage Assumptions">
                      <div className="space-y-1.5">
                        <div><span className="font-semibold">Daytime Load:</span> Energy used during sun hours (typically 6am-6pm). Average household uses 8 kWh/day.</div>
                        <div><span className="font-semibold">Night Load:</span> Energy used during non-sun hours (typically 6pm-6am). Average household uses 10 kWh/day.</div>
                        <div className="pt-1 border-t border-gray-200 text-[11px] text-gray-600">
                          These values represent total household consumption excluding EV charging. EV charging is calculated separately based on your vehicle configuration.
                        </div>
                      </div>
                    </InfoBox>
                  </div>
                  <p className="text-xs text-gray-500">Configure your household energy consumption</p>
                </div>

                <div className="space-y-5">
                  {/* Daytime Household Load */}
                  <div className="group">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Daytime Load <span className="text-gray-400 font-normal">(sun hours)</span>
                      </label>
                      <span className="text-base font-semibold text-emerald-600 tabular-nums">
                        {dayLoad.toFixed(1)} <span className="text-xs text-gray-500 font-normal">kWh/day</span>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.1"
                        value={dayLoad}
                        onChange={(e) => setDayLoad(parseFloat(e.target.value))}
                        className="w-full h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-600 hover:accent-emerald-500 transition-all"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${(dayLoad / 20) * 100}%, #e5e7eb ${(dayLoad / 20) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      {/* Average marker */}
                      <div 
                        className="absolute top-0 h-2.5 w-0.5 bg-blue-400 pointer-events-none z-10"
                        style={{ left: `${(8 / 20) * 100}%` }}
                        title="Average: 8 kWh"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1.5 px-0.5">
                        <span>0</span>
                        <span className="text-blue-500 font-medium">Avg: 8</span>
                        <span>20</span>
                      </div>
                    </div>
                  </div>

                  {/* Night Household Load */}
                  <div className="group">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Night Load
                      </label>
                      <span className="text-base font-semibold text-emerald-600 tabular-nums">
                        {nightLoad.toFixed(1)} <span className="text-xs text-gray-500 font-normal">kWh/day</span>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.1"
                        value={nightLoad}
                        onChange={(e) => setNightLoad(parseFloat(e.target.value))}
                        className="w-full h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-600 hover:accent-emerald-500 transition-all"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${(nightLoad / 20) * 100}%, #e5e7eb ${(nightLoad / 20) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      {/* Average marker */}
                      <div 
                        className="absolute top-0 h-2.5 w-0.5 bg-blue-400 pointer-events-none z-10"
                        style={{ left: `${(10 / 20) * 100}%` }}
                        title="Average: 10 kWh"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1.5 px-0.5">
                        <span>0</span>
                        <span className="text-blue-500 font-medium">Avg: 10</span>
                        <span>20</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* EVs in Household */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">EVs in Household</h3>
                    <InfoBox title="EV Charging Configuration">
                      <div className="space-y-1.5">
                        <div><span className="font-semibold">Driving Distance:</span> Daily kilometers driven per vehicle. Used to calculate daily energy needs.</div>
                        <div><span className="font-semibold">Home Charging %:</span> Percentage of total charging done at home vs. public chargers. Home charging can use solar/battery (free) or grid.</div>
                        <div><span className="font-semibold">Charging Time:</span> When EV charging occurs. &quot;Night only&quot; charges during off-peak hours, &quot;Day only&quot; during peak solar generation, &quot;Both&quot; distributes throughout the day.</div>
                        <div className="pt-1 border-t border-gray-200 text-[11px] text-gray-600">
                          Public charging costs are calculated separately using country-specific public charging rates. Home charging from solar/battery is free; grid charging uses residential electricity rates.
                        </div>
                      </div>
                    </InfoBox>
                  </div>
                  <p className="text-xs text-gray-500">Configure your electric vehicles</p>
                </div>
                <div className="space-y-4">
                  {vehicles.map((vehicle, index) => (
                    <div key={index} className={`${index > 0 ? 'pt-4 border-t border-gray-200' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="relative">
                            <select
                              value={vehicle.model?.id || ''}
                              onChange={(e) => {
                                const model = e.target.value ? vehicleList.find(v => v.id === e.target.value) || null : null
                                updateVehicle(index, 'model', model)
                              }}
                              className="w-full text-sm px-3 py-2 pr-8 border-0 rounded-full bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-emerald-500 focus:bg-emerald-50 appearance-none cursor-pointer transition-colors"
                            >
                              <option value="">Select EV Model</option>
                              {vehicleList.map(v => (
                                <option key={v.id} value={v.id}>
                                  {v.name} {v.modelTrim ? `(${v.modelTrim})` : ''}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <label className="text-xs text-gray-500 whitespace-nowrap">Qty:</label>
                          <input
                            type="number"
                            min="0"
                            max="3"
                            value={vehicle.quantity}
                            onChange={(e) => updateVehicle(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-14 text-sm text-center px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <button
                            onClick={() => removeVehicle(index)}
                            className="ml-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove vehicle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {vehicle.model && (
                        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100 pl-1">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Driving Distance</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="10"
                                max="100"
                                step="1"
                                value={vehicle.drivingDistanceKm}
                                onChange={(e) => updateVehicle(index, 'drivingDistanceKm', parseInt(e.target.value))}
                                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                              />
                              <span className="text-sm font-semibold text-gray-900 w-12 text-right tabular-nums">{vehicle.drivingDistanceKm} km</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Home Charging %</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={vehicle.evHomeChargingPercentage}
                                onChange={(e) => updateVehicle(index, 'evHomeChargingPercentage', parseInt(e.target.value))}
                                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                              />
                              <span className="text-sm font-semibold text-gray-900 w-10 text-right tabular-nums">{vehicle.evHomeChargingPercentage}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Charging Time</label>
                            <div className="relative">
                              <select
                                value={vehicle.evChargingTime}
                                onChange={(e) => updateVehicle(index, 'evChargingTime', e.target.value as 'Night only' | 'Day only' | 'Both')}
                                className="w-full text-sm px-3 py-1.5 pr-7 border-0 rounded-full bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-emerald-500 focus:bg-emerald-50 appearance-none cursor-pointer transition-colors"
                              >
                                <option value="Night only">Night only</option>
                                <option value="Day only">Day only</option>
                                <option value="Both">Both</option>
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {vehicles.length < 3 && (
                    <button
                      onClick={addVehicle}
                      className="w-full py-2 text-sm font-medium text-gray-500 hover:text-emerald-600 rounded-lg transition-colors flex items-center justify-center gap-1.5 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Vehicle
                    </button>
                  )}
                </div>
              </div>

              {/* System Setup Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">System Setup</h2>
                  <p className="text-xs text-gray-500">Configure your solar and battery system</p>
                </div>
              
                {/* Optimization Goal Selector */}
                {optimalSystem && (
                  <div className="mb-6 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-2 mb-3">
                      <label className="block text-sm font-semibold text-gray-900">
                        Optimization Goal
                      </label>
                      <InfoBox title="Understanding Optimization Modes">
                        <div className="space-y-2">
                          <div>
                            <span className="font-semibold">Full Off-Grid:</span> Uses conservative sizing with 20% solar buffer and 2.5 days battery autonomy. Prioritizes maximum reliability and independence, typically resulting in a larger, more expensive system.
                          </div>
                          <div>
                            <span className="font-semibold">Zero-Bill:</span> Tests all combinations to find the minimum system that achieves zero monthly bill. May be smaller and cheaper than off-grid while still achieving zero bill.
                          </div>
                          <div>
                            <span className="font-semibold">Best Net Savings:</span> Optimizes for the best 25-year financial outcome, considering system costs, electricity savings, and EV charging costs. May recommend a system that doesn&apos;t achieve zero bill but maximizes total savings.
                          </div>
                        </div>
                      </InfoBox>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <button
                        onClick={() => setOptimizationMode('full_off_grid')}
                        className={`px-3 py-2.5 rounded-lg border font-medium text-xs transition-all ${
                          optimizationMode === 'full_off_grid'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                      >
                        Full Off-Grid
                      </button>
                      <button
                        onClick={() => setOptimizationMode('zero_bill')}
                        className={`px-3 py-2.5 rounded-lg border font-medium text-xs transition-all ${
                          optimizationMode === 'zero_bill'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                      >
                        Zero-Bill
                      </button>
                      <button
                        onClick={() => setOptimizationMode('best_net_savings')}
                        className={`px-3 py-2.5 rounded-lg border font-medium text-xs transition-all ${
                          optimizationMode === 'best_net_savings'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                      >
                        Best Net Savings
                      </button>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${optimizationMode === 'full_off_grid' ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
                        <p className="text-xs text-gray-600 flex-1">
                          <span className="font-semibold text-gray-900">Full Off-Grid:</span> Conservative system with 20% solar buffer and 2.5 days battery autonomy for maximum reliability
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${optimizationMode === 'zero_bill' ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
                        <p className="text-xs text-gray-600 flex-1">
                          <span className="font-semibold text-gray-900">Zero-Bill:</span> Optimized system that achieves zero monthly bill (may be smaller than off-grid)
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${optimizationMode === 'best_net_savings' ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
                        <p className="text-xs text-gray-600 flex-1">
                          <span className="font-semibold text-gray-900">Best Net Savings:</span> Best 25-year net savings including system and EV costs
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSolarSizeKw(optimalSystem.solarSizeKw)
                        setBatteries(optimalSystem.batteries)
                        setIncludeSolarCost(true)
                      }}
                      className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all text-sm shadow-sm hover:shadow-md"
                    >
                      Apply Recommended Setup
                    </button>
                  </div>
                )}


                <div className="space-y-5">
                  {/* Roof Solar Size Slider */}
                  <div className="group">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Solar System Size
                      </label>
                      <span className="text-base font-semibold text-emerald-600 tabular-nums">
                        {solarSizeKw} <span className="text-xs text-gray-500 font-normal">kW</span>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={solarSizeKw}
                        onChange={(e) => setSolarSizeKw(parseInt(e.target.value))}
                        className="w-full h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-600 hover:accent-emerald-500 transition-all"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${(solarSizeKw / 30) * 100}%, #e5e7eb ${(solarSizeKw / 30) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1.5 px-0.5">
                        <span>0</span>
                        <span>30</span>
                      </div>
                    </div>
                    {/* Include Solar Cost Toggle */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">
                            Include solar cost in calculations?
                          </label>
                          <InfoBox title="Solar Cost Information">
                            <div className="space-y-1.5">
                              <div>
                                <span className="font-semibold">Solar Cost:</span> Based on {CURRENCY_SYMBOLS[country]} {SOLAR_COST_PER_KW[country].toLocaleString()}/kW installed (2025 average, includes panels, inverters, installation).
                              </div>
                              <div className="pt-1 border-t border-gray-200 text-[11px] text-gray-600">
                                Toggle &quot;Include solar cost&quot; to include or exclude solar system cost from financial calculations. Useful for comparing battery-only systems or if you already have solar.
                              </div>
                            </div>
                          </InfoBox>
                        </div>
                        <div className="flex items-center gap-3">
                        <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-gray-200">
                          <button
                            onClick={() => setIncludeSolarCost(true)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                              includeSolarCost
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setIncludeSolarCost(false)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                              !includeSolarCost
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            No
                          </button>
                        </div>
                        {includeSolarCost && (
                          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                            {CURRENCY_SYMBOLS[country]} {SOLAR_COST_PER_KW[country].toLocaleString()}/kW
                          </span>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Roof Quality */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Roof Quality
                      </label>
                      <InfoBox title="Roof Quality Multipliers">
                        <div className="space-y-1.5">
                          <div><span className="font-semibold">Ideal (100%):</span> South-facing, no shading, optimal tilt angle.</div>
                          <div><span className="font-semibold">Average (90%):</span> Some shading or suboptimal orientation.</div>
                          <div><span className="font-semibold">Shaded (75%):</span> Significant shading or poor orientation.</div>
                          <div className="pt-1 border-t border-gray-200 text-[11px] text-gray-600">
                            Roof quality affects solar yield. The multiplier is applied to the base solar yield for your country.
                          </div>
                        </div>
                      </InfoBox>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Ideal', 'Average', 'Shaded'] as const).map(quality => (
                        <button
                          key={quality}
                          onClick={() => setRoofQuality(quality)}
                          className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                            roofQuality === quality
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          <div className="font-semibold">{quality}</div>
                          <div className="text-xs opacity-90">{quality === 'Ideal' ? '100%' : quality === 'Average' ? '90%' : '75%'}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Home Battery */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Home Battery System
                    </label>
                    <div className="space-y-3">
                      {batteries.map((battery, index) => (
                        <div key={index} className={`flex gap-2 items-center ${index > 0 ? 'pt-3 border-t border-gray-200' : ''}`}>
                          <div className="flex-1 relative">
                            <select
                              value={battery.model?.id || ''}
                              onChange={(e) => {
                                const model = e.target.value ? bessList.find(b => b.id === e.target.value) || null : null
                                updateBattery(index, 'model', model)
                              }}
                              className="w-full px-3 py-2 pr-8 border-0 rounded-full bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-emerald-500 focus:bg-emerald-50 appearance-none cursor-pointer transition-colors text-sm"
                            >
                              <option value="">Select Battery Model</option>
                              {bessList.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          <label className="text-xs text-gray-500 whitespace-nowrap">Qty:</label>
                          <input
                            type="number"
                            min="0"
                            max="4"
                            value={battery.quantity}
                            onChange={(e) => updateBattery(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="0"
                          />
                          <button
                            onClick={() => removeBattery(index)}
                            className="ml-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove battery"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {batteries.length < 4 && (
                        <button
                          onClick={addBattery}
                          className="w-full py-2 text-sm font-medium text-gray-500 hover:text-emerald-600 rounded-lg transition-colors flex items-center justify-center gap-1.5 hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Battery
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* OUTPUTS COLUMN */}
          <div className="bg-white p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Live Simulation</h2>
            </div>

            {/* Financial Overview */}
            <div className="mb-10">
              <h3 className="text-base font-bold text-gray-900 mb-6 pb-2 border-b-2 border-emerald-600">Financial Overview</h3>

              {/* Monthly View */}
              <div className="mb-8">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">Monthly View</h4>
                  <p className="text-xs text-gray-500">Monthly electricity bill comparison</p>
                </div>

                {/* Comparison Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Header Row */}
                  <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider"></div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                        <div>Without</div>
                        <div>System</div>
                      </div>
                      <div className="text-lg font-bold text-gray-900 tabular-nums">
                        {formatCurrency(outputs.monthlyBillWithoutSystem)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                        <div>With</div>
                        <div>System</div>
                      </div>
                      <div className="text-lg font-bold text-emerald-600 tabular-nums">
                        {formatCurrency(outputs.monthlyTotalCostWithSystem)}
                      </div>
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="divide-y divide-gray-100">
                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-3 py-1.5 items-center hover:bg-gray-50/50 transition-colors">
                      <div className="text-xs text-gray-700 font-medium">Household</div>
                      <div className="text-xs font-semibold text-gray-800 tabular-nums text-right">
                        {formatCurrency(outputs.monthlyBillWithoutSystemHousehold)}
                      </div>
                      <div className="text-xs font-semibold text-gray-800 tabular-nums text-right">
                        {formatCurrency(outputs.monthlyBillWithSystemHousehold)}
                      </div>
                    </div>
                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-3 py-1.5 items-center hover:bg-gray-50/50 transition-colors">
                      <div className="text-xs text-gray-700 font-medium">EV Total</div>
                      <div className="text-xs font-semibold text-gray-800 tabular-nums text-right">
                        {formatCurrency(outputs.monthlyBillWithoutSystemEvTotal)}
                      </div>
                      <div className="text-xs font-semibold text-gray-800 tabular-nums text-right">
                        {formatCurrency(outputs.monthlyBillWithSystemEvTotal)}
                      </div>
                    </div>
                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-3 py-1.5 items-center hover:bg-gray-50/50 transition-colors">
                      <div className="text-xs text-gray-600 pl-3 border-l-2 border-emerald-200">Home</div>
                      <div className="text-xs font-medium text-gray-700 tabular-nums text-right">
                        {formatCurrency(outputs.monthlyBillWithoutSystemEvHome)}
                      </div>
                      <div className="text-xs font-medium text-gray-700 tabular-nums text-right">
                        {formatCurrency(outputs.monthlyBillWithSystemEvHome)}
                      </div>
                    </div>
                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-3 py-1.5 items-center hover:bg-gray-50/50 transition-colors">
                      <div className="text-xs text-gray-600 pl-3 border-l-2 border-emerald-200">Public</div>
                      <div className="text-xs font-medium text-gray-700 tabular-nums text-right">
                        {formatCurrency(outputs.monthlyBillWithoutSystemEvPublic)}
                      </div>
                      <div className="text-xs font-medium text-gray-700 tabular-nums text-right">
                        {formatCurrency(outputs.monthlyBillWithSystemEvPublic)}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Savings */}
                  <div className="px-3 py-2 bg-emerald-50/30 border-t-2 border-emerald-200">
                    <div className="flex items-baseline justify-between">
                      <div className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Monthly Savings</div>
                      <div className={`text-sm font-bold tabular-nums ${
                        outputs.monthlySavings >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(outputs.monthlySavings)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 25-Year Projection */}
              <div className="pt-6 border-t border-gray-300">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">25-Year View</h4>
                    <InfoBox title="25-Year Projection Assumptions">
                      <div className="space-y-1.5">
                        <div>
                          <span className="font-semibold">Inflation Assumption:</span> Electricity tariffs and EV charging costs increase by 3% annually over 25 years.
                        </div>
                        <div className="pt-1 border-t border-gray-200 text-[11px] text-gray-600">
                          This projection includes: system upfront cost, monthly electricity bills, EV home charging costs, and EV public charging costs. System maintenance costs are included in the system cost calculation.
                        </div>
                      </div>
                    </InfoBox>
                  </div>
                  <p className="text-xs text-gray-500">Total cost over 25 years including electricity, EV charging, and system cost (3% annual inflation)</p>
                </div>

                {(solarSizeKw > 0 || batteries.some(b => b.model && b.quantity > 0)) ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Comparison Table */}
                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider"></div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                          <div>Without</div>
                          <div>System</div>
                        </div>
                        <div className="text-lg font-bold text-gray-900 tabular-nums">
                          {formatCurrency(outputs.totalCost25YearsWithoutSystem)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                          <div>With</div>
                          <div>System</div>
                        </div>
                        <div className="text-lg font-bold text-emerald-600 tabular-nums">
                          {formatCurrency(outputs.totalCost25YearsWithSystem)}
                        </div>
                      </div>
                    </div>

                    {/* Total Savings */}
                    <div className="px-3 py-2 bg-emerald-50/30 border-t-2 border-emerald-200">
                      <div className="flex items-baseline justify-between">
                        <div className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Total Savings Over 25 Years</div>
                        <div className={`text-sm font-bold tabular-nums ${
                          (outputs.totalCost25YearsWithoutSystem - outputs.totalCost25YearsWithSystem) >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(outputs.totalCost25YearsWithoutSystem - outputs.totalCost25YearsWithSystem)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Without System</div>
                      <div className="text-xs font-bold text-gray-900 tabular-nums">
                        {formatCurrency(outputs.totalCost25YearsWithoutSystem)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Energy Flow */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-emerald-600">
                <h3 className="text-base font-bold text-gray-900">Energy Flow</h3>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">kWh/month</span>
              </div>
              
              {EXPORT_RATE_MULTIPLIER[country].net_billing > 0 && (
                <div className="mb-5">
                  <InfoBox title="Net Billing Explanation">
                    <div className="space-y-1.5">
                      <div>
                        Excess solar exported to the grid is credited at {Math.round(EXPORT_RATE_MULTIPLIER[country].net_billing * 100)}% of the import tariff rate.
                      </div>
                      <div className="pt-1 border-t border-gray-200 text-[11px] text-gray-600">
                        This means you receive {Math.round(EXPORT_RATE_MULTIPLIER[country].net_billing * 100)}% credit for exported energy compared to what you pay for imported energy. Credits offset your monthly bill.
                      </div>
                    </div>
                  </InfoBox>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Energy Consumption */}
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50/50">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Total Energy Consumption</span>
                    <span className="text-xs font-bold text-gray-900 tabular-nums">
                      {outputs.monthlyTotalEnergyUsed.toFixed(1)}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600">Household</span>
                      <span className="text-xs font-semibold text-gray-800 tabular-nums">
                        {outputs.monthlyHomeEnergyUsed.toFixed(1)}
                      </span>
                    </div>
                    {(outputs.monthlyEvEnergyUsed > 0 || outputs.monthlyEvPublicChargingEnergy > 0) && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-600">EV Total</span>
                          <span className="text-xs font-semibold text-gray-800 tabular-nums">
                            {(outputs.monthlyEvEnergyUsed + outputs.monthlyEvPublicChargingEnergy).toFixed(1)}
                          </span>
                        </div>
                        <div className="pl-3 space-y-1 border-l-2 border-emerald-200">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Home charging</span>
                            <span className="font-medium text-gray-700 tabular-nums">
                              {outputs.monthlyEvEnergyUsed.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Public charging</span>
                            <span className="font-medium text-gray-700 tabular-nums">
                              {outputs.monthlyEvPublicChargingEnergy.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Energy Supply */}
                <div className="px-3 py-2">
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Home Energy Supply</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600">From Solar & Battery</span>
                      <span className="text-xs font-bold text-emerald-600 tabular-nums">
                        {((outputs.monthlyHomeEnergyUsed + outputs.monthlyEvEnergyUsed) - outputs.actualGridUsageThisMonth).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600">From Power Grid</span>
                      <span className="text-xs font-bold text-gray-900 tabular-nums">
                        {outputs.actualGridUsageThisMonth.toFixed(1)}
                      </span>
                    </div>
                    {EXPORT_RATE_MULTIPLIER[country].net_billing > 0 && (
                      <div className="pt-1.5 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-600">Grid Export</span>
                          <span className="text-xs font-bold text-blue-600 tabular-nums">
                            {outputs.monthlyGridExport.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* EV Charging Metrics */}
            {vehicles.some(v => v.model && v.quantity > 0) && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-emerald-600">
                  <h3 className="text-base font-bold text-gray-900">EV Charging</h3>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">kWh/month</span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50/50 border-b border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Total EV Charging</span>
                      <span className="text-xs font-bold text-gray-900 tabular-nums">
                        {(outputs.monthlyEvEnergyUsed + outputs.monthlyEvPublicChargingEnergy).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600">Home charging</span>
                      <span className="text-xs font-semibold text-gray-800 tabular-nums">
                        {outputs.monthlyEvEnergyUsed.toFixed(1)}
                      </span>
                    </div>
                    {outputs.monthlyEvEnergyUsed > 0 && (
                      <div className="pl-3 space-y-1 border-l-2 border-emerald-200">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500">From Solar & Battery (free)</span>
                          <span className="font-medium text-emerald-600 tabular-nums">
                            {(outputs.monthlyEvEnergyUsed - outputs.monthlyGridUsedForEvChargingHome).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500">From Grid</span>
                          <span className="font-medium text-gray-600 tabular-nums">
                            {outputs.monthlyGridUsedForEvChargingHome.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600">Public charging</span>
                      <span className="text-xs font-semibold text-gray-800 tabular-nums">
                        {outputs.monthlyEvPublicChargingEnergy.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-gray-50/30 border-t border-gray-200 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600">Public Charging Cost</span>
                      <span className="text-xs font-bold text-red-600 tabular-nums">
                        {formatCurrency(outputs.monthlyEvPublicChargingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
                      <span className="text-[10px] font-semibold text-gray-700">Savings from Home Charging</span>
                      <span className="text-xs font-bold text-emerald-600 tabular-nums">
                        {formatCurrency(outputs.monthlyEvChargingSavings)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Performance */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b-2 border-emerald-600">
                <h3 className="text-base font-bold text-gray-900">System Performance</h3>
                <InfoBox title="System Performance Metrics">
                  <div className="space-y-1.5">
                    <div><span className="font-semibold">System Cost:</span> Total upfront cost including solar panels, batteries, inverters, and installation (includes 5% maintenance reserve).</div>
                    <div><span className="font-semibold">Payback Period:</span> Years until cumulative savings equal system cost. Infinity means system never pays back.</div>
                    <div><span className="font-semibold">Zero-Bill Days:</span> Number of days per year when monthly bill is zero or negative (due to credits).</div>
                    <div><span className="font-semibold">CO₂ Avoided:</span> Annual CO₂ emissions avoided by using solar instead of grid electricity (based on country&apos;s grid emission factor).</div>
                  </div>
                </InfoBox>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors">
                  <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">System Cost</div>
                  <div className="text-xs font-bold text-gray-900 tabular-nums">
                    {formatCurrency(outputs.totalSystemCost)}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors">
                  <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">Payback Period</div>
                  <div className="text-xs font-bold text-gray-900">
                    {outputs.fullSystemPaybackYears === Infinity ? '∞' : `${outputs.fullSystemPaybackYears.toFixed(1)} yrs`}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors">
                  <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">Zero-Bill Days</div>
                  <div className="text-xs font-bold text-emerald-600">
                    {outputs.zeroBillDaysPerYear} <span className="text-[10px] text-gray-500 font-normal">days/yr</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors">
                  <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">CO₂ Avoided</div>
                  <div className="text-xs font-bold text-blue-600">
                    {outputs.co2AvoidedPerYear.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">kg/yr</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Breakdown */}
            {(includeSolarCost || outputs.batteryCost > 0) && (
              <div className="mb-10">
                <h3 className="text-base font-bold text-gray-900 mb-6 pb-2 border-b-2 border-emerald-600">System Cost Breakdown</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {includeSolarCost && (
                      <div className="flex justify-between items-center px-3 py-1.5 hover:bg-gray-50/50 transition-colors">
                        <span className="text-xs text-gray-700 font-medium">Solar ({solarSizeKw} kW)</span>
                        <span className="text-xs font-semibold text-gray-900 tabular-nums">{formatCurrency(outputs.solarCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center px-3 py-1.5 hover:bg-gray-50/50 transition-colors">
                      <span className="text-xs text-gray-700 font-medium">Battery</span>
                      <span className="text-xs font-semibold text-gray-900 tabular-nums">{formatCurrency(outputs.batteryCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Equilibrium Suggestion */}
            {outputs.equilibriumSuggestion && (
              <div className="text-xs text-gray-600 italic leading-relaxed">
                {outputs.equilibriumSuggestion}
              </div>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm">
            Share Design
          </button>
          <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm">
            Download PDF
          </button>
        </div>

        {/* Footnote */}
        <p className="text-xs text-gray-500 text-center max-w-3xl mx-auto">
          *Real 2025 tariffs/yields. Assumes average household. Actual varies by roof/usage/weather. Updated monthly.*
        </p>
      </section>
    </main>
  )
}
