import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, country: 'SG' | 'MY'): string {
  const currency = country === 'SG' ? 'SGD' : 'MYR'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

const BATTERY_WEIGHT_TO_KWH_RATIO = 6.5
const ELECTRICITY_RATE_BY_COUNTRY: Record<'SG' | 'MY', number> = {
  SG: 0.32, // SGD per kWh (avg fast-charger price)
  MY: 0.55, // MYR per kWh (avg DC charging price)
}

export function estimateBatteryCapacityFromWeight(weightKg: number): number {
  if (!weightKg) return 0
  return Math.round(weightKg / BATTERY_WEIGHT_TO_KWH_RATIO)
}

export function getElectricityRate(country: 'SG' | 'MY'): number {
  return ELECTRICITY_RATE_BY_COUNTRY[country]
}

export function estimateCostPerKm(
  country: 'SG' | 'MY',
  batteryWeightKg: number,
  rangeKm: number
): number {
  if (!batteryWeightKg || !rangeKm) return 0
  const capacity = estimateBatteryCapacityFromWeight(batteryWeightKg)
  const costPerFullCharge = capacity * getElectricityRate(country)
  return costPerFullCharge / rangeKm
}

