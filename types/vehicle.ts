export type Country = 'SG' | 'MY' | 'ID' | 'PH' | 'TH' | 'VN'

export type BatteryTechnology = 'NMC' | 'LFP' | 'SolidState' | 'Other'

export interface OptionPrice {
  name: string
  price: number
}

export interface Rebate {
  name: string
  amount: number
  description: string
}

export interface Vehicle {
  id: string
  country: Country
  name: string
  modelTrim: string | null
  imageUrl: string | null
  batteryWeightKg: number | null
  curbWeightKg: number | null
  batteryWeightPercentage: number | null
  powerRatingKw: number | null
  powerRatingExplanation: string | null
  torqueNm: number | null
  acceleration0To100Kmh?: number | null // 0-100 km/h in seconds (≈ 0-60 mph)
  topSpeedKmh: number | null // Top speed in km/h
  efficiencyKwhPer100km: number | null
  rangeKm: number | null // Legacy field
  rangeWltpKm?: number | null // WLTP range in km
  rangeEpaKm?: number | null // EPA range in km
  manufacturerCostUsd: number | null
  batteryManufacturer: string | null
  batteryTechnology: BatteryTechnology | null
  batteryWarranty: string | null
  chargingTimeDc0To80Min: number | null
  chargingCapabilities: string | null
  technologyFeatures: string | null
  basePriceLocalCurrency: number | null
  optionPrices: OptionPrice[]
  onTheRoadPriceLocalCurrency: number | null
  rebates: Rebate[]
  isAvailable: boolean
  updatedAt: string
  createdAt: string
}

