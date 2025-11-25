'use client'

import { Vehicle } from '@/types/vehicle'
import * as TooltipRadix from '@radix-ui/react-tooltip'
import {
  estimateBatteryCapacityFromWeight,
  getElectricityRate,
  estimateCostPerKm,
} from '@/lib/utils'

interface StatsGridProps {
  vehicle: Vehicle
  selectedOptions: string[]
  onToggleOption: (name: string) => void
}

const currencyRates: Record<'SG' | 'MY', number> = {
  SG: 1.35,
  MY: 4.7,
}

const batteryTechColors: Record<string, string> = {
  NMC: '#10b981',
  LFP: '#3b82f6',
  SolidState: '#8b5cf6',
  Other: '#6b7280',
}

const formatLocalPrice = (price: number, country: 'SG' | 'MY', digits: number = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: country === 'SG' ? 'SGD' : 'MYR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(price)

const formatCostPerKm = (value: number, country: 'SG' | 'MY') =>
  formatLocalPrice(value, country, 2)

const getInsurancePremium = (basePrice: number) => Math.round(basePrice * 0.03)
const getGovFees = (country: 'SG' | 'MY') => (country === 'SG' ? 18000 : 9000)

export default function StatsGrid({ vehicle, selectedOptions, onToggleOption }: StatsGridProps) {
  const batteryCapacityEstimate = estimateBatteryCapacityFromWeight(vehicle.batteryWeightKg)
  const totalRebates = vehicle.rebates.reduce((sum, rebate) => sum + rebate.amount, 0)
  const selectedOptionsTotal = vehicle.optionPrices
    .filter((option) => selectedOptions.includes(option.name))
    .reduce((sum, option) => sum + option.price, 0)

  const insurancePremium = getInsurancePremium(vehicle.basePriceLocalCurrency)
  const governmentFees = getGovFees(vehicle.country)

  const dynamicOtr =
    vehicle.basePriceLocalCurrency +
    selectedOptionsTotal +
    insurancePremium +
    governmentFees -
    totalRebates

  const costPerKm = estimateCostPerKm(
    vehicle.country,
    vehicle.batteryWeightKg,
    vehicle.rangeKm
  )

  const chargingRangePerHour =
    vehicle.chargingTimeDc0To80Min > 0
      ? Math.round(
          (vehicle.rangeKm * 0.8) /
            (vehicle.chargingTimeDc0To80Min / 60)
        )
      : null

  const batteryCostLocal =
    vehicle.manufacturerCostUsd *
    currencyRates[vehicle.country]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Battery Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">🔋 Battery Insights</h3>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Battery Weight</div>
            <div className="text-2xl font-bold text-ev-primary">{vehicle.batteryWeightKg} kg</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Vehicle Weight</div>
            <div className="text-2xl font-bold text-gray-800">{vehicle.curbWeightKg} kg</div>
          </div>
          <TooltipRadix.Provider>
            <TooltipRadix.Root>
              <TooltipRadix.Trigger asChild>
                <div className="bg-ev-primary/10 rounded-lg p-4 cursor-help">
                  <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    Battery Ratio
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-ev-primary">{vehicle.batteryWeightPercentage.toFixed(1)}%</div>
                </div>
              </TooltipRadix.Trigger>
              <TooltipRadix.Portal>
                <TooltipRadix.Content
                  className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-50"
                  sideOffset={5}
                >
                  Higher % means more battery-focused design, but watch for efficiency trade-offs
                  <TooltipRadix.Arrow className="fill-gray-900" />
                </TooltipRadix.Content>
              </TooltipRadix.Portal>
            </TooltipRadix.Root>
          </TooltipRadix.Provider>
        </div>
      </div>

      {/* Power */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">⚡ Power</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Battery Capacity (est.)</div>
            <div className="text-2xl font-bold text-ev-secondary">
              {batteryCapacityEstimate} kWh
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Power Rating</div>
            <div className="text-2xl font-bold text-ev-secondary">{vehicle.powerRatingKw} kW</div>
          </div>
        </div>
      </div>

      {/* Efficiency & Range */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">📊 Efficiency & Range</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Efficiency</span>
            <span className="font-semibold text-gray-900">
              {vehicle.efficiencyKwhPer100km} kWh/100km
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Range (WLTP/EPA)</span>
            <span className="font-semibold text-gray-900">{vehicle.rangeKm} km</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Cost / km</span>
            <span className="font-semibold text-ev-primary">
              {formatCostPerKm(costPerKm, vehicle.country)}
            </span>
          </div>
        </div>
      </div>

      {/* Costs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">💰 Costs</h3>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Battery Cost (est.)</div>
            <div className="text-xl font-bold text-gray-800">
              {formatLocalPrice(batteryCostLocal, vehicle.country)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Base Price</div>
            <div className="text-xl font-bold text-gray-800">
              {formatLocalPrice(vehicle.basePriceLocalCurrency, vehicle.country)}
            </div>
          </div>

          {vehicle.optionPrices.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">Options</div>
              <div className="space-y-2">
                {vehicle.optionPrices.map((option) => (
                  <label key={option.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-ev-primary focus:ring-ev-primary"
                        checked={selectedOptions.includes(option.name)}
                        onChange={() => onToggleOption(option.name)}
                      />
                      <span className="text-gray-700">{option.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatLocalPrice(option.price, vehicle.country)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="bg-ev-primary/10 rounded-lg p-4 border-2 border-ev-primary space-y-2">
            <div className="text-sm text-gray-600 flex justify-between">
              <span>Base + Selected Options</span>
              <span className="font-semibold text-gray-900">
                {formatLocalPrice(
                  vehicle.basePriceLocalCurrency + selectedOptionsTotal,
                  vehicle.country
                )}
              </span>
            </div>
            <div className="text-sm text-gray-600 flex justify-between">
              <span>Insurance Premium</span>
              <span className="font-semibold text-gray-900">
                {formatLocalPrice(insurancePremium, vehicle.country)}
              </span>
            </div>
            <div className="text-sm text-gray-600 flex justify-between">
              <span>Gov / Ownership Fees</span>
              <span className="font-semibold text-gray-900">
                {formatLocalPrice(governmentFees, vehicle.country)}
              </span>
            </div>
            {totalRebates > 0 && (
              <div className="text-sm text-green-700 flex justify-between">
                <span>Rebates</span>
                <span>-{formatLocalPrice(totalRebates, vehicle.country)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-ev-primary/40 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Dynamic OTR Price</div>
                <div className="text-xs text-gray-500">Includes insurance + permits</div>
              </div>
              <div className="text-2xl font-bold text-ev-primary">
                {formatLocalPrice(dynamicOtr, vehicle.country)}
              </div>
            </div>
          </div>

          {vehicle.rebates.length > 0 && (
            <details className="bg-green-50 rounded-lg p-4">
              <summary className="text-sm font-medium text-green-800 cursor-pointer">
                Rebates ({vehicle.rebates.length})
              </summary>
              <ul className="mt-2 space-y-2 text-sm">
                {vehicle.rebates.map((rebate) => (
                  <li key={rebate.name} className="text-green-700">
                    <div className="font-medium">{rebate.name}</div>
                    <div className="text-xs text-green-600">{rebate.description}</div>
                    <div className="font-semibold">
                {formatLocalPrice(rebate.amount, vehicle.country)}
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      {/* Technology */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">🔬 Technology</h3>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Battery Manufacturer</div>
            <div className="text-lg font-bold text-gray-800">{vehicle.batteryManufacturer}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Battery Technology</div>
            <div
              className="text-lg font-bold inline-block px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: batteryTechColors[vehicle.batteryTechnology] || batteryTechColors.Other }}
            >
              {vehicle.batteryTechnology}
            </div>
          </div>
        </div>
      </div>

      {/* Charging */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">🔌 Charging</h3>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">DC Fast Charge (0-80%)</div>
            <div className="text-2xl font-bold text-ev-accent">{vehicle.chargingTimeDc0To80Min} min</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <div className="text-sm text-gray-600 mb-1">Charging Capabilities</div>
            <div className="text-sm font-medium text-gray-800">{vehicle.chargingCapabilities}</div>
            {chargingRangePerHour && (
              <div className="text-xs text-gray-600">
                ~{chargingRangePerHour} km of range per hour on DC fast charge
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

