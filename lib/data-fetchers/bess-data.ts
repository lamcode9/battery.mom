import { BESS, Country } from '@/types/bess'
import bessDataRaw from '@/data/BESS-Home-data.json'

// Handle both array and default export
const bessData = Array.isArray(bessDataRaw) ? bessDataRaw : (bessDataRaw as any).default || []

export interface BESSDataItem {
  name: string
  capacityKwh: number
  usableCapacityKwh: number
  roundTripEfficiency: number
  warrantyCycles: number
  warrantyYears: number
  continuousPowerKw: number
  peakPowerKw: number
  priceLocalCurrency: Record<Country, number>
  v2xSupport: string
  manufacturer: string
  releaseYear: number
  isAvailable: boolean
}

export function loadBESSData(country: Country): BESS[] {
  const data = bessData as BESSDataItem[]
  
  return data
    .filter(item => item.isAvailable && item.priceLocalCurrency[country])
    .map((item, index) => ({
      id: `bess-${index}-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: item.name,
      capacityKwh: item.capacityKwh,
      usableCapacityKwh: item.usableCapacityKwh,
      roundTripEfficiency: item.roundTripEfficiency,
      warrantyCycles: item.warrantyCycles,
      warrantyYears: item.warrantyYears,
      continuousPowerKw: item.continuousPowerKw,
      peakPowerKw: item.peakPowerKw,
      priceLocalCurrency: item.priceLocalCurrency,
      v2xSupport: item.v2xSupport,
      manufacturer: item.manufacturer,
      releaseYear: item.releaseYear,
      isAvailable: item.isAvailable,
      country: country,
    }))
}

