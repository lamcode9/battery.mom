export type Country = 'SG' | 'MY'

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
  modelTrim: string
  imageUrl: string
  batteryWeightKg: number
  curbWeightKg: number
  batteryWeightPercentage: number
  powerRatingKw: number
  powerRatingExplanation: string
  efficiencyKwhPer100km: number
  rangeKm: number
  manufacturerCostUsd: number
  batteryManufacturer: string
  batteryTechnology: BatteryTechnology
  chargingTimeDc0To80Min: number
  chargingCapabilities: string
  basePriceLocalCurrency: number
  optionPrices: OptionPrice[]
  onTheRoadPriceLocalCurrency: number
  rebates: Rebate[]
  isAvailable: boolean
  updatedAt: string
  createdAt: string
}

