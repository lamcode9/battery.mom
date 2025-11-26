'use client'

import { Vehicle } from '@/types/vehicle'
import type { Country } from '@prisma/client'
import {
  estimateBatteryCapacityFromWeight,
  estimateCostPerKm,
  convertKwToHp,
  getAcceleration0To100Kmh,
  formatValueOrNA,
  formatPriceOrNA,
  formatStringOrNA,
} from '@/lib/utils'

interface StatsGridProps {
  vehicle: Vehicle
  selectedOptions: string[]
  onToggleOption: (name: string) => void
}

const batteryTechColors: Record<string, string> = {
  NMC: '#10b981',
  LFP: '#3b82f6',
  SolidState: '#8b5cf6',
  Other: '#6b7280',
}

const CURRENCY_BY_COUNTRY: Record<Country, string> = {
  SG: 'SGD',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  TH: 'THB',
  VN: 'VND',
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
 * Get official manufacturer website URL based on vehicle name and country
 */
const getOfficialWebsiteUrl = (vehicleName: string, country: Country): string | null => {
  const nameLower = vehicleName.toLowerCase()
  
  if (nameLower.includes('tesla')) {
    return country === 'SG' ? 'https://www.tesla.com/en_sg' : 'https://www.tesla.com/en_my'
  }
  if (nameLower.includes('byd')) {
    return country === 'SG' ? 'https://www.byd.com/sg' : 'https://www.byd.com/my'
  }
  if (nameLower.includes('hyundai') || nameLower.includes('ioniq')) {
    return country === 'SG' ? 'https://www.hyundai.com.sg' : 'https://www.hyundai.com.my'
  }
  if (nameLower.includes('kia') || nameLower.includes('ev6')) {
    return country === 'SG' ? 'https://www.kia.com.sg' : 'https://www.kia.com.my'
  }
  
  return null
}

export default function StatsGrid({ vehicle, selectedOptions, onToggleOption }: StatsGridProps) {
  const batteryCapacityEstimate = vehicle.batteryWeightKg 
    ? estimateBatteryCapacityFromWeight(vehicle.batteryWeightKg)
    : null
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

  const costPerKm = (vehicle.batteryWeightKg && vehicle.rangeKm)
    ? estimateCostPerKm(
    vehicle.country,
    vehicle.batteryWeightKg,
    vehicle.rangeKm
  )
    : null

  const chargingRangePerMinute =
    (vehicle.chargingTimeDc0To80Min && vehicle.chargingTimeDc0To80Min > 0 && vehicle.rangeKm)
      ? (vehicle.rangeKm * 0.8) / vehicle.chargingTimeDc0To80Min
      : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Performance */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-1.5 border-b border-gray-200">Performance</h3>
        <div className="bg-gray-50 rounded-md p-3 space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Power</div>
            <div className="text-base font-semibold text-gray-900">
              {formatValueOrNA(vehicle.powerRatingKw, (v) => `${v} kW`)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Horsepower</div>
            <div className="text-base font-semibold text-gray-900">
              {formatValueOrNA(powerHp, (v) => `${v} hp`)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">0-100 km/h</div>
            <div className="text-base font-semibold text-gray-900">
              {formatValueOrNA(acceleration0To100Kmh, (v) => `${v.toFixed(1)}s`)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Top Speed</div>
            <div className="text-base font-semibold text-gray-900">
              {formatValueOrNA(vehicle.topSpeedKmh, (v) => `${v} km/h`)}
            </div>
          </div>
        </div>
      </div>

      {/* Battery */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-1.5 border-b border-gray-200">Battery</h3>
        <div className="bg-gray-50 rounded-md p-3 space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Battery Capacity</div>
            <div className="text-base font-semibold text-gray-900">
              {formatValueOrNA(batteryCapacityEstimate, (v) => `${v} kWh`)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Battery Manufacturer</div>
            <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
              {vehicle.batteryManufacturer ? (
                <>
                  <span>{vehicle.batteryManufacturer}</span>
                  {vehicle.batteryTechnology && (
                    <span
                      className="text-xs font-semibold inline-block px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: batteryTechColors[vehicle.batteryTechnology] || batteryTechColors.Other }}
                    >
                      {vehicle.batteryTechnology}
                    </span>
                  )}
                </>
              ) : (
                <span>N/A</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Charger Power Rating</div>
            <div className="text-base font-semibold text-gray-900">
              {vehicle.chargingCapabilities 
                ? formatStringOrNA(vehicle.chargingCapabilities.replace(/DC\s+Fast\s+Charge/gi, 'DC').replace(/Fast\s+Charge/gi, '').replace(/Up\s+to/gi, '').replace(/\s+/g, ' ').trim())
                : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Battery Warranty</div>
            <div className="text-base font-semibold text-gray-900">
              {formatStringOrNA(vehicle.batteryWarranty)}
            </div>
          </div>
        </div>
      </div>

      {/* Efficiency & Range */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-1.5 border-b border-gray-200">Efficiency & Range</h3>
        <div className="bg-gray-50 rounded-md p-3 space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Efficiency</div>
            <div className="text-base font-semibold text-gray-900">
              {formatValueOrNA(vehicle.efficiencyKwhPer100km, (v) => `${v} kWh/100km`)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Range (WLTP | EPA)</div>
            <div className="text-base font-semibold text-gray-900">
              {formatValueOrNA(vehicle.rangeWltpKm ?? vehicle.rangeKm, (v) => `${v} km`)} <span className="text-gray-500 font-normal">|</span> {formatValueOrNA(vehicle.rangeEpaKm, (v) => `${v} km`)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Charging Speed</div>
            <div className="text-base font-semibold text-gray-900">
              {formatValueOrNA(vehicle.chargingTimeDc0To80Min, (v) => `${v} min`)}
              {chargingRangePerMinute && (
                <span className="text-base font-normal text-gray-600 ml-1">
                  (~{chargingRangePerMinute.toFixed(1)} km/min)
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Cost / km</div>
            <div className="text-base font-semibold text-gray-900">
              {costPerKm !== null ? formatCostPerKm(costPerKm, vehicle.country) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Costs */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-1.5 border-b border-gray-200">Pricing</h3>
        <div className="space-y-2">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-xs text-gray-500 mb-0.5">Base Price</div>
            <div className="text-base font-semibold text-gray-900">
              {formatPriceOrNA(vehicle.basePriceLocalCurrency, vehicle.country)}
            </div>
          </div>

          {vehicle.optionPrices.length > 0 && (
            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-xs text-gray-500 mb-1.5">Options</div>
              <div className="space-y-1.5">
                {vehicle.optionPrices.map((option) => (
                  <label key={option.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-ev-primary focus:ring-ev-primary w-3.5 h-3.5"
                        checked={selectedOptions.includes(option.name)}
                        onChange={() => onToggleOption(option.name)}
                      />
                      <span className="text-gray-700">{option.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 text-xs">
                      {formatLocalPrice(option.price, vehicle.country)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="bg-ev-primary/5 rounded-md p-3 border border-ev-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-700">Total Price</div>
                <div className="text-[10px] text-gray-500">Base price + selected options</div>
              </div>
              <div className="text-lg font-bold text-ev-primary">
                {totalPrice !== null ? formatLocalPrice(totalPrice, vehicle.country) : 'N/A'}
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-ev-primary/20">
              * Excludes government fees, taxes, and rebates
            </div>
          </div>

          {getOfficialWebsiteUrl(vehicle.name, vehicle.country) && (
            <div className="bg-gray-50 rounded-md p-3">
              <a
                href={getOfficialWebsiteUrl(vehicle.name, vehicle.country) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-ev-primary hover:text-ev-primary/80 hover:underline flex items-center gap-1"
              >
                <span>Official Website</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
                    </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-1.5 border-b border-gray-200">Features</h3>
        <div className="space-y-2">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-xs text-gray-500 mb-0.5"></div>
            <div className="text-sm font-normal text-gray-900">
              {formatStringOrNA(vehicle.technologyFeatures)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

