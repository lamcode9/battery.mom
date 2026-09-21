import type { Country } from '@prisma/client'
import { CURRENCY_BY_COUNTRY } from '@/lib/constants'
import { DC_FAST_CHARGING_RATE } from '@/data/rates'

export function formatPrice(price: number, country: Country, minimumFractionDigits: number = 0): string {
  const currency = CURRENCY_BY_COUNTRY[country] || 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits > 0 ? 2 : 0,
  }).format(price)
}

/**
 * Get electricity rate for EV charging in the specified country
 * Returns rate in local currency per kWh for DC fast charging
 */
export function getElectricityRate(country: Country): number {
  return DC_FAST_CHARGING_RATE[country] || 0.40 // Default fallback
}

/**
 * Calculate cost per km using actual battery capacity
 */
export function calculateCostPerKm(
  country: Country,
  batteryCapacityKwh: number | null | undefined,
  rangeKm: number
): number {
  if (!rangeKm || rangeKm <= 0) return 0
  if (!batteryCapacityKwh || batteryCapacityKwh <= 0) return 0
  
  const costPerFullCharge = batteryCapacityKwh * getElectricityRate(country)
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

/* ── Range helper ─────────────────────────────────────────────── */

/**
 * Return the range in km for a BEV.
 * Prefers WLTP, falls back to legacy rangeKm field.
 *
 * Note: The database now contains only pure BEVs.
 * PHEVs / hybrids / series hybrids have been removed.
 */
export function getRangeKm(v: {
  rangeKm?: number | null
  rangeWltpKm?: number | null
}): number | null {
  return v.rangeWltpKm ?? v.rangeKm ?? null
}

