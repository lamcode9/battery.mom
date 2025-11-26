import type { Country } from '@prisma/client'

const CURRENCY_BY_COUNTRY: Record<Country, string> = {
  SG: 'SGD',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  TH: 'THB',
  VN: 'VND',
}

export function formatPrice(price: number, country: Country): string {
  const currency = CURRENCY_BY_COUNTRY[country] || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price)
}

const BATTERY_WEIGHT_TO_KWH_RATIO = 6.5
const ELECTRICITY_RATE_BY_COUNTRY: Partial<Record<Country, number>> = {
  SG: 0.32, // SGD per kWh (avg fast-charger price)
  MY: 0.55, // MYR per kWh (avg DC charging price)
  // Default rates for other countries (can be updated later)
  ID: 0.40, // IDR per kWh (approximate)
  PH: 0.50, // PHP per kWh (approximate)
  TH: 0.45, // THB per kWh (approximate)
  VN: 0.35, // VND per kWh (approximate)
}

export function estimateBatteryCapacityFromWeight(weightKg: number): number {
  if (!weightKg) return 0
  return Math.round(weightKg / BATTERY_WEIGHT_TO_KWH_RATIO)
}

export function getElectricityRate(country: Country): number {
  return ELECTRICITY_RATE_BY_COUNTRY[country] || 0.40 // Default rate
}

export function estimateCostPerKm(
  country: Country,
  batteryWeightKg: number,
  rangeKm: number
): number {
  if (!batteryWeightKg || !rangeKm) return 0
  const capacity = estimateBatteryCapacityFromWeight(batteryWeightKg)
  const costPerFullCharge = capacity * getElectricityRate(country)
  return costPerFullCharge / rangeKm
}

/**
 * Convert kilowatts to horsepower (1 kW ≈ 1.341 hp)
 */
export function convertKwToHp(kw: number): number {
  return Math.round(kw * 1.341)
}

/**
 * Get acceleration value, using API data if available, otherwise return null
 */
export function getAcceleration0To100Kmh(
  acceleration0To100Kmh: number | null | undefined,
  _powerKw?: number | null | undefined,
  _weightKg?: number | null | undefined
): number | null {
  return acceleration0To100Kmh ?? null
}

/**
 * Format value as "N/A" if null/undefined, otherwise format the number
 */
export function formatValueOrNA(
  value: number | null | undefined,
  formatter?: (val: number) => string
): string {
  if (value === null || value === undefined) return 'N/A'
  return formatter ? formatter(value) : String(value)
}

/**
 * Format price as "N/A" if null/undefined
 */
export function formatPriceOrNA(
  price: number | null | undefined,
  country: Country
): string {
  if (price === null || price === undefined) return 'N/A'
  return formatPrice(price, country)
}

/**
 * Format string as "N/A" if null/undefined/empty
 */
export function formatStringOrNA(value: string | null | undefined): string {
  if (!value || value.trim() === '') return 'N/A'
  return value
}

