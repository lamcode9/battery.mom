export type Country = 'SG' | 'MY' | 'ID' | 'PH' | 'TH' | 'VN'

export interface BESS {
  id: string
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
  country: Country
}

