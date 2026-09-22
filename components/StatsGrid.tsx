'use client'

import { Vehicle } from '@/types/vehicle'
import type { Country } from '@prisma/client'
import { useState } from 'react'
import {
  calculateCostPerKm,
  convertKwToHp,
  getAcceleration0To100Kmh,
  formatValueOrNA,
  formatPriceOrNA,
  formatStringOrNA,
  getElectricityRate,
  formatPrice,
} from '@/lib/utils'
import { CURRENCY_BY_COUNTRY } from '@/lib/constants'
import { CHART_SERIES } from '@/lib/chart-theme'

interface StatsGridProps {
  vehicle: Vehicle
  selectedOptions: string[]
  onToggleOption: (name: string) => void
}

const batteryTechColors: Record<string, string> = {
  NMC: CHART_SERIES[0],
  LFP: CHART_SERIES[1],
  SolidState: CHART_SERIES[2],
  Other: CHART_SERIES[3],
}

const formatLocalPrice = (price: number, country: Country, digits: number = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: CURRENCY_BY_COUNTRY[country] || 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(price)

const formatCostPerKm = (value: number, country: Country) =>
  formatLocalPrice(value, country, 2)

/**
 * Info box component explaining Cost / km calculation
 */
function CostPerKmInfoBox({ 
  costPerKm, 
  country, 
  batteryCapacityKwh,
  rangeKm 
}: { 
  costPerKm: number | null
  country: Country
  batteryCapacityKwh: number | null | undefined
  rangeKm: number | null | undefined
}) {
  const [isOpen, setIsOpen] = useState(false)

  // Always show the button, but only show content if we have the required data
  const hasData = costPerKm !== null && batteryCapacityKwh && batteryCapacityKwh > 0 && rangeKm
  const electricityRate = getElectricityRate(country)
  const costPerFullCharge = batteryCapacityKwh && batteryCapacityKwh > 0 ? batteryCapacityKwh * electricityRate : null

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-ink-400 hover:text-ink-600 transition-colors"
        aria-label="Show cost per km calculation details"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          {/* Info Box */}
          <div className="absolute left-0 top-6 w-72 bg-paper-100 border border-ink/10 rounded-lg shadow-lg p-4 z-20">
            <div className="text-xs font-semibold text-ink mb-3">Cost / km Calculation</div>
            
            {hasData ? (
              <div className="space-y-2 text-xs text-ink-700">
                <div>
                  <div className="font-medium text-ink mb-1">Formula:</div>
                  <div className="bg-paper-200 p-2 rounded font-mono text-[10px]">
                    Cost/km = (Battery Capacity × Electricity Rate) ÷ Range
                  </div>
                </div>
                
                <div className="pt-2 border-t border-ink/5">
                  <div className="font-medium text-ink mb-1.5">Key Assumptions:</div>
                  <ul className="space-y-1.5 text-ink-600">
                    <li className="flex items-start gap-1.5">
                      <span className="text-ink-400 mt-0.5">•</span>
                      <span>Battery capacity: <span className="font-medium">{batteryCapacityKwh} kWh</span></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-ink-400 mt-0.5">•</span>
                      <span>Electricity rate: <span className="font-medium">{formatLocalPrice(electricityRate, country, 2)}/kWh</span> (avg fast-charger)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-ink-400 mt-0.5">•</span>
                      <span>Range: <span className="font-medium">{rangeKm} km</span></span>
                    </li>
                    {costPerFullCharge && (
                      <li className="flex items-start gap-1.5">
                        <span className="text-ink-400 mt-0.5">•</span>
                        <span>Cost per full charge: <span className="font-medium">{formatLocalPrice(costPerFullCharge, country, 2)}</span></span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="pt-2 border-t border-ink/5 text-[10px] text-ink-500">
                  <div className="font-medium text-ink-700 mb-0.5">Note:</div>
                  <div>Rates vary by location and charging method. Home charging may be cheaper.</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-ink-600">
                Battery capacity data is required to calculate cost per km. Please ensure all vehicles have batteryCapacityKwh in the data file.
              </div>
            )}
            
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 text-xs text-ink-500 hover:text-ink-700"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Get official manufacturer website URL based on vehicle name and country
 */
const getOfficialWebsiteUrl = (vehicleName: string, country: Country): string | null => {
  const nameLower = vehicleName.toLowerCase()
  
  // Tesla
  if (nameLower.includes('tesla')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.tesla.com/en_sg',
      MY: 'https://www.tesla.com/en_my',
      ID: 'https://www.tesla.com/en_id',
      PH: 'https://www.tesla.com/en_ph',
      TH: 'https://www.tesla.com/en_th',
      VN: 'https://www.tesla.com/en_vn',
    }
    return urls[country] || 'https://www.tesla.com'
  }
  
  // BYD
  if (nameLower.includes('byd')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.byd.com/sg',
      MY: 'https://www.byd.com/my',
      ID: 'https://www.byd.com/id',
      PH: 'https://www.byd.com/ph',
      TH: 'https://www.byd.com/th',
      VN: 'https://www.byd.com/vn',
    }
    return urls[country] || 'https://www.byd.com'
  }
  
  // Hyundai
  if (nameLower.includes('hyundai') || nameLower.includes('ioniq')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.hyundai.com.sg',
      MY: 'https://www.hyundai.com.my',
      ID: 'https://www.hyundai.co.id',
      PH: 'https://www.hyundai.com.ph',
      TH: 'https://www.hyundai.co.th',
      VN: 'https://www.hyundai.com.vn',
    }
    return urls[country] || 'https://www.hyundai.com'
  }
  
  // Kia
  if (nameLower.includes('kia') || nameLower.includes('ev6')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.kia.com.sg',
      MY: 'https://www.kia.com.my',
      ID: 'https://www.kia.co.id',
      PH: 'https://www.kia.com.ph',
      TH: 'https://www.kia.co.th',
      VN: 'https://www.kia.com.vn',
    }
    return urls[country] || 'https://www.kia.com'
  }
  
  // BMW
  if (nameLower.includes('bmw') || nameLower.includes('ix') || nameLower.includes('i4') || nameLower.includes('i7')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.bmw.com.sg',
      MY: 'https://www.bmw.com.my',
      ID: 'https://www.bmw.co.id',
      PH: 'https://www.bmw.com.ph',
      TH: 'https://www.bmw.co.th',
      VN: 'https://www.bmw.com.vn',
    }
    return urls[country] || 'https://www.bmw.com'
  }
  
  // Mercedes-Benz
  if (nameLower.includes('mercedes') || nameLower.includes('eq') || nameLower.includes('eqa') || nameLower.includes('eqb') || nameLower.includes('eqe') || nameLower.includes('eqs')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.mercedes-benz.com.sg',
      MY: 'https://www.mercedes-benz.com.my',
      ID: 'https://www.mercedes-benz.co.id',
      PH: 'https://www.mercedes-benz.com.ph',
      TH: 'https://www.mercedes-benz.co.th',
      VN: 'https://www.mercedes-benz.com.vn',
    }
    return urls[country] || 'https://www.mercedes-benz.com'
  }
  
  // Audi
  if (nameLower.includes('audi') || nameLower.includes('e-tron') || nameLower.includes('etron')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.audi.com.sg',
      MY: 'https://www.audi.com.my',
      ID: 'https://www.audi.co.id',
      PH: 'https://www.audi.com.ph',
      TH: 'https://www.audi.co.th',
      VN: 'https://www.audi.com.vn',
    }
    return urls[country] || 'https://www.audi.com'
  }
  
  // Porsche
  if (nameLower.includes('porsche') || nameLower.includes('taycan') || nameLower.includes('macan')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.porsche.com.sg',
      MY: 'https://www.porsche.com.my',
      ID: 'https://www.porsche.co.id',
      PH: 'https://www.porsche.com.ph',
      TH: 'https://www.porsche.co.th',
      VN: 'https://www.porsche.com.vn',
    }
    return urls[country] || 'https://www.porsche.com'
  }
  
  // MG (Morris Garages)
  if (nameLower.includes('mg ') || nameLower.startsWith('mg')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.mg.co.sg',
      MY: 'https://www.mg.com.my',
      ID: 'https://www.mg.co.id',
      PH: 'https://www.mg.com.ph',
      TH: 'https://www.mg.co.th',
      VN: 'https://www.mg.com.vn',
    }
    return urls[country] || 'https://www.mg.co.uk'
  }
  
  // Volvo
  if (nameLower.includes('volvo') || nameLower.includes('xc40') || nameLower.includes('xc90') || nameLower.includes('ex30') || nameLower.includes('ex90')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.volvocars.com.sg',
      MY: 'https://www.volvocars.com.my',
      ID: 'https://www.volvocars.co.id',
      PH: 'https://www.volvocars.com.ph',
      TH: 'https://www.volvocars.co.th',
      VN: 'https://www.volvocars.com.vn',
    }
    return urls[country] || 'https://www.volvocars.com'
  }
  
  // Nissan
  if (nameLower.includes('nissan') || nameLower.includes('leaf') || nameLower.includes('ariya')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.nissan.com.sg',
      MY: 'https://www.nissan.com.my',
      ID: 'https://www.nissan.co.id',
      PH: 'https://www.nissan.com.ph',
      TH: 'https://www.nissan.co.th',
      VN: 'https://www.nissan.com.vn',
    }
    return urls[country] || 'https://www.nissan.com'
  }
  
  // Toyota
  if (nameLower.includes('toyota') || nameLower.includes('bz') || nameLower.includes('prius')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.toyota.com.sg',
      MY: 'https://www.toyota.com.my',
      ID: 'https://www.toyota.co.id',
      PH: 'https://www.toyota.com.ph',
      TH: 'https://www.toyota.co.th',
      VN: 'https://www.toyota.com.vn',
    }
    return urls[country] || 'https://www.toyota.com'
  }
  
  // VinFast
  if (nameLower.includes('vinfast') || nameLower.includes('vf ')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.vinfast.vn/en',
      MY: 'https://www.vinfast.vn/en',
      ID: 'https://www.vinfast.vn/en',
      PH: 'https://www.vinfast.vn/en',
      TH: 'https://www.vinfast.vn/en',
      VN: 'https://www.vinfast.vn',
    }
    return urls[country] || 'https://www.vinfast.vn'
  }
  
  // Chery
  if (nameLower.includes('chery')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.chery.com.sg',
      MY: 'https://www.chery.com.my',
      ID: 'https://www.chery.co.id',
      PH: 'https://www.chery.com.ph',
      TH: 'https://www.chery.co.th',
      VN: 'https://www.chery.com.vn',
    }
    return urls[country] || 'https://www.chery.com'
  }
  
  // Geely
  if (nameLower.includes('geely')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.geely.com.sg',
      MY: 'https://www.geely.com.my',
      ID: 'https://www.geely.co.id',
      PH: 'https://www.geely.com.ph',
      TH: 'https://www.geely.co.th',
      VN: 'https://www.geely.com.vn',
    }
    return urls[country] || 'https://www.geely.com'
  }
  
  // GAC
  if (nameLower.includes('gac') || nameLower.includes('aion')) {
    return 'https://www.gacmotor.com'
  }
  
  // Ora (Great Wall Motors)
  if (nameLower.includes('ora')) {
    return 'https://www.ora.com'
  }
  
  // Neta
  if (nameLower.includes('neta')) {
    return 'https://www.neta.com'
  }
  
  // Zeekr
  if (nameLower.includes('zeekr')) {
    return 'https://www.zeekr.com'
  }
  
  // Changan
  if (nameLower.includes('changan') || nameLower.includes('deepal')) {
    return 'https://www.changan.com'
  }
  
  // Wuling
  if (nameLower.includes('wuling')) {
    return 'https://www.wuling.com'
  }
  
  // DFSK
  if (nameLower.includes('dfsk') || nameLower.includes('seres')) {
    return 'https://www.dfsk.com'
  }
  
  // Maxus
  if (nameLower.includes('maxus')) {
    return 'https://www.maxus.com'
  }
  
  // Aletra
  if (nameLower.includes('aletra')) {
    return 'https://www.aletra.com'
  }
  
  // Jetour
  if (nameLower.includes('jetour')) {
    return 'https://www.jetour.com'
  }
  
  // Perodua
  if (nameLower.includes('perodua')) {
    return 'https://www.perodua.com.my'
  }
  
  // MINI
  if (nameLower.includes('mini')) {
    const urls: Record<Country, string> = {
      SG: 'https://www.mini.com.sg',
      MY: 'https://www.mini.com.my',
      ID: 'https://www.mini.co.id',
      PH: 'https://www.mini.com.ph',
      TH: 'https://www.mini.co.th',
      VN: 'https://www.mini.com.vn',
    }
    return urls[country] || 'https://www.mini.com'
  }
  
  // Smart
  if (nameLower.includes('smart')) {
    return 'https://www.smart.com'
  }
  
  // Opel
  if (nameLower.includes('opel')) {
    return 'https://www.opel.com'
  }
  
  // Hyptec
  if (nameLower.includes('hyptec')) {
    return null // No official website found
  }
  
  return null
}

export default function StatsGrid({ vehicle, selectedOptions, onToggleOption }: StatsGridProps) {
  // Debug: Log battery capacity to see what we're getting
  const batteryCapacityDisplay = (vehicle.batteryCapacityKwh !== null && vehicle.batteryCapacityKwh !== undefined && vehicle.batteryCapacityKwh > 0) ? vehicle.batteryCapacityKwh : null
  const selectedOptionsTotal = vehicle.optionPrices
    .filter((option) => selectedOptions.includes(option.name))
    .reduce((sum, option) => sum + option.price, 0)

  const powerHp = vehicle.powerRatingKw ? convertKwToHp(vehicle.powerRatingKw) : null
  // Use actual 0-100 km/h data from API if available, otherwise null
  const acceleration0To100Kmh = getAcceleration0To100Kmh(
    vehicle.acceleration0To100Kmh,
    vehicle.powerRatingKw,
    vehicle.curbWeightKg
  )

  const totalPrice = vehicle.basePriceLocalCurrency !== null && vehicle.basePriceLocalCurrency !== undefined
    ? vehicle.basePriceLocalCurrency + selectedOptionsTotal
    : null

  const costPerKm = (vehicle.batteryCapacityKwh && vehicle.batteryCapacityKwh > 0 && vehicle.rangeKm)
    ? calculateCostPerKm(
    vehicle.country,
    vehicle.batteryCapacityKwh,
    vehicle.rangeKm
  )
    : null

  const chargingRangePerMinute =
    (vehicle.chargingTimeDc0To80Min && vehicle.chargingTimeDc0To80Min > 0 && vehicle.rangeKm)
      ? (vehicle.rangeKm * 0.8) / vehicle.chargingTimeDc0To80Min
      : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Performance */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-ink uppercase tracking-wide pb-2 border-b border-ink/10">Performance</h3>
        <div className="bg-paper-200/50 rounded-lg p-4 space-y-4">
          <div className="pb-3 border-b border-ink/5 last:border-0 last:pb-0">
            <div className="text-xs text-ink-500 mb-1.5">Power</div>
            <div className="text-sm font-medium text-ink">
              {formatValueOrNA(vehicle.powerRatingKw, (v) => `${v} kW`)}
            </div>
          </div>
          <div className="pb-3 border-b border-ink/5 last:border-0 last:pb-0">
            <div className="text-xs text-ink-500 mb-1.5">Horsepower</div>
            <div className="text-sm font-medium text-ink">
              {formatValueOrNA(powerHp, (v) => `${v} hp`)}
            </div>
          </div>
          <div className="pb-3 border-b border-ink/5 last:border-0 last:pb-0">
            <div className="text-xs text-ink-500 mb-1.5">0-100 km/h</div>
            <div className="text-sm font-medium text-ink">
              {formatValueOrNA(acceleration0To100Kmh, (v) => `${v.toFixed(1)}s`)}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-500 mb-1.5">Top Speed</div>
            <div className="text-sm font-medium text-ink">
              {formatValueOrNA(vehicle.topSpeedKmh, (v) => `${v} km/h`)}
            </div>
          </div>
        </div>
      </div>

      {/* Battery */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-ink uppercase tracking-wide pb-2 border-b border-ink/10">Battery</h3>
        <div className="bg-paper-200/50 rounded-lg p-4 space-y-4">
          <div className="pb-3 border-b border-ink/5 last:border-0 last:pb-0">
            <div className="text-xs text-ink-500 mb-1.5">Battery Capacity</div>
            <div className="text-sm font-medium text-ink">
              {formatValueOrNA(batteryCapacityDisplay, (v) => `${v} kWh`)}
            </div>
          </div>
          <div className="pb-3 border-b border-ink/5 last:border-0 last:pb-0">
            <div className="text-xs text-ink-500 mb-1.5">Battery Manufacturer</div>
            <div className="text-sm font-medium text-ink flex items-center gap-2 flex-wrap">
              {vehicle.batteryManufacturer ? (
                <>
                  <span>{vehicle.batteryManufacturer}</span>
                  {vehicle.batteryTechnology && (
                    <span className="text-xs text-ink-600 px-2 py-0.5 bg-paper-300 rounded-md">
                      {vehicle.batteryTechnology}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-ink-500">N/A</span>
              )}
            </div>
          </div>
          <div className="pb-3 border-b border-ink/5 last:border-0 last:pb-0">
            <div className="text-xs text-ink-500 mb-1.5">Charger Power Rating</div>
            <div className="text-sm font-medium text-ink">
              {vehicle.chargingCapabilities 
                ? formatStringOrNA(vehicle.chargingCapabilities.replace(/DC\s+Fast\s+Charge/gi, 'DC').replace(/Fast\s+Charge/gi, '').replace(/Up\s+to/gi, '').replace(/\s+/g, ' ').trim())
                : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-500 mb-1.5">Battery Warranty</div>
            <div className="text-sm font-medium text-ink">
              {formatStringOrNA(vehicle.batteryWarranty)}
            </div>
          </div>
        </div>
      </div>

      {/* Efficiency & Range */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-ink uppercase tracking-wide pb-2 border-b border-ink/10">Efficiency and range</h3>
        <div className="bg-paper-200/50 rounded-lg p-4 space-y-4">
          <div className="pb-3 border-b border-ink/5 last:border-0 last:pb-0">
            <div className="text-xs text-ink-500 mb-1.5">Efficiency</div>
            <div className="text-sm font-medium text-ink">
              {formatValueOrNA(vehicle.efficiencyKwhPer100km, (v) => `${v} kWh/100km`)}
            </div>
          </div>
          <div className="pb-3 border-b border-ink/5 last:border-0 last:pb-0">
            <div className="text-xs text-ink-500 mb-1.5">Range (WLTP | EPA)</div>
            <div className="text-sm font-medium text-ink">
              {formatValueOrNA(vehicle.rangeWltpKm ?? vehicle.rangeKm, (v) => `${v} km`)} <span className="text-ink-400">|</span> {formatValueOrNA(vehicle.rangeEpaKm, (v) => `${v} km`)}
            </div>
          </div>
          <div className="pb-3 border-b border-ink/5 last:border-0 last:pb-0">
            <div className="text-xs text-ink-500 mb-1.5">Charging Speed</div>
            <div className="text-sm font-medium text-ink">
              {formatValueOrNA(vehicle.chargingTimeDc0To80Min, (v) => `${v} min`)}
              {chargingRangePerMinute && (
                <span className="text-xs text-ink-500 ml-2">
                  (~{chargingRangePerMinute.toFixed(1)} km/min)
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-500 mb-1.5 flex items-center gap-1.5">
              <span>Cost / km</span>
              <CostPerKmInfoBox 
                costPerKm={costPerKm}
                country={vehicle.country}
                batteryCapacityKwh={vehicle.batteryCapacityKwh}
                rangeKm={vehicle.rangeKm ?? vehicle.rangeWltpKm ?? vehicle.rangeEpaKm}
              />
            </div>
            <div className="text-sm font-medium text-ink">
              {costPerKm !== null ? formatCostPerKm(costPerKm, vehicle.country) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Costs */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-ink uppercase tracking-wide pb-2 border-b border-ink/10">Pricing</h3>
        <div className="bg-paper-200/50 rounded-lg p-4 space-y-4">
          <div className="pb-3 border-b border-ink/5">
            <div className="text-xs text-ink-500 mb-1.5">Base Price</div>
            <div className="text-sm font-medium text-ink">
              {formatPriceOrNA(vehicle.basePriceLocalCurrency, vehicle.country)}
            </div>
          </div>

          {vehicle.optionPrices.length > 0 && (
            <div className="pb-3 border-b border-ink/5">
              <div className="text-xs text-ink-500 mb-1.5">Options</div>
              <div className="space-y-1">
                {vehicle.optionPrices.map((option) => (
                  <label key={option.name} className="flex items-center justify-between text-xs cursor-pointer py-0.5 px-1.5 rounded hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        className="rounded border-ink/15 text-ink focus:ring-brand-500 w-3 h-3"
                        checked={selectedOptions.includes(option.name)}
                        onChange={() => onToggleOption(option.name)}
                      />
                      <span className="text-ink-700">{option.name}</span>
                    </div>
                    <span className="text-ink text-xs font-medium">
                      {formatLocalPrice(option.price, vehicle.country)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t-2 border-ink/10 bg-white/50 rounded-md p-3">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-xs text-ink-500 mb-0.5">Total Price</div>
                <div className="text-xs text-ink-400">Base price + selected options</div>
              </div>
              <div className="text-sm font-semibold text-ink">
                {totalPrice !== null ? formatLocalPrice(totalPrice, vehicle.country) : 'N/A'}
              </div>
            </div>
            <div className="text-xs text-ink-400 mt-2 pt-2 border-t border-ink/5">
              * Excludes government fees, taxes, and rebates
            </div>
          </div>

          {getOfficialWebsiteUrl(vehicle.name, vehicle.country) && (
            <a
              href={getOfficialWebsiteUrl(vehicle.name, vehicle.country) || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-ink-600 hover:text-ink transition-colors pt-2 border-t border-ink/5"
            >
              Official Website →
            </a>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-ink uppercase tracking-wide pb-2 border-b border-ink/10">Features</h3>
        <div className="bg-paper-200/50 rounded-lg p-4">
          {vehicle.technologyFeatures ? (
            <div className="text-sm text-ink-700 leading-relaxed">
              {(() => {
                // Clean the entire string first (before splitting) to handle commas inside parentheses
                let cleaned = vehicle.technologyFeatures
                
                // Remove parentheses containing currency codes with prices
                cleaned = cleaned.replace(/\s*\([^)]*?(?:RM|SGD|MYR|USD|EUR|GBP|IDR|PHP|THB|VND)\s*\d+[,\d\s]*\s*(?:option|Option|OPTION)?[^)]*?\)\s*/gi, '')
                
                // Remove any parentheses containing numbers followed by "option"
                cleaned = cleaned.replace(/\s*\([^)]*?\d+[,\d\s]+\s*(?:option|Option|OPTION)[^)]*?\)\s*/gi, '')
                
                // Split, trim, and filter
                const features = cleaned
                  .split(',')
                  .map((f) => f.trim())
                  .filter((f) => f.length > 0)
                
                return features.map((feature, index, array) => (
                  <span key={index}>
                    {feature}
                    {index < array.length - 1 && (
                      <span className="text-ink-400 mx-2 font-light">|</span>
                    )}
                  </span>
                ))
              })()}
            </div>
          ) : (
            <span className="text-sm text-ink-500">N/A</span>
          )}
        </div>
      </div>
    </div>
  )
}

