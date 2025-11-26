/**
 * File-based Vehicle Data Fetcher
 * Reads vehicle data from data/vehicles-data.json
 */

import fs from 'fs'
import path from 'path'
import type { Country } from '@prisma/client'

type CountryCode = 'SG' | 'MY' | 'ID' | 'PH' | 'TH' | 'VN'

export interface FileVehicleData {
  name: string
  modelTrim?: string
  country: CountryCode
  powerRatingKw?: number
  torqueNm?: number
  acceleration0To100Kmh?: number
  topSpeedKmh?: number
  efficiencyKwhPer100km?: number
  rangeWltpKm?: number
  rangeEpaKm?: number
  rangeKm?: number
  batteryCapacityKwh?: number
  batteryWeightKg?: number
  curbWeightKg?: number
  batteryWeightPercentage?: number
  batteryManufacturer?: string
  batteryTechnology?: 'NMC' | 'LFP' | 'SolidState' | 'Other'
  batteryWarranty?: string
  chargingTimeDc0To80Min?: number
  chargingCapabilities?: string
  technologyFeatures?: string
  basePriceLocalCurrency?: number
  optionPrices?: Array<{ name: string; price: number }>
  isAvailable?: boolean
  grossVehicleWeightKg?: number
}

export interface TransformedFileVehicle {
  name: string
  modelTrim?: string
  rangeKm?: number
  rangeWltpKm?: number
  rangeEpaKm?: number
  efficiencyKwhPer100km?: number
  powerRatingKw?: number
  torqueNm?: number
  batteryCapacityKwh?: number
  chargingTimeDc0To80Min?: number
  acceleration0To100Kmh?: number
  topSpeedKmh?: number
  grossVehicleWeightKg?: number
  batteryWeightKg?: number
  curbWeightKg?: number
  batteryWeightPercentage?: number
  batteryManufacturer?: string
  batteryTechnology?: 'NMC' | 'LFP' | 'SolidState' | 'Other'
  batteryWarranty?: string
  chargingCapabilities?: string
  technologyFeatures?: string
  basePrice?: number
  optionPrices?: Array<{ name: string; price: number }>
  country: Country
  isAvailable: boolean
}

/**
 * Read vehicles from JSON file
 */
export async function fetchVehiclesFromFile(): Promise<TransformedFileVehicle[]> {
  const filePath = path.join(process.cwd(), 'data', 'vehicles-data.json')
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}. Using empty array.`)
      return []
    }

    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const vehicles: FileVehicleData[] = JSON.parse(fileContent)

    if (!Array.isArray(vehicles)) {
      console.error('Invalid file format: vehicles-data.json must contain an array')
      return []
    }

    // Transform file data to our format
    return vehicles.map(transformFileVehicle).filter((v): v is TransformedFileVehicle => v !== null)
  } catch (error) {
    console.error('Error reading vehicles-data.json:', error)
    return []
  }
}

/**
 * Transform file vehicle data to our internal format
 */
function transformFileVehicle(vehicle: FileVehicleData): TransformedFileVehicle | null {
  // Validate required fields
  if (!vehicle.name || !vehicle.country) {
    console.warn(`Skipping vehicle: missing required fields (name or country)`)
    return null
  }

  // Validate country - accept all valid country codes
  const validCountries: CountryCode[] = ['SG', 'MY', 'ID', 'PH', 'TH', 'VN']
  const countryUpper = vehicle.country.toUpperCase() as CountryCode
  if (!validCountries.includes(countryUpper)) {
    console.warn(`Skipping vehicle "${vehicle.name}": invalid country "${vehicle.country}"`)
    return null
  }
  
  // Normalize country to uppercase and convert to Prisma Country type
  const normalizedCountry = countryUpper as Country

  // Calculate curb weight from gross weight if not provided
  let curbWeightKg = vehicle.curbWeightKg
  if (!curbWeightKg && vehicle.grossVehicleWeightKg) {
    // Approximate: curb weight is typically ~200kg less than gross weight
    curbWeightKg = Math.round(vehicle.grossVehicleWeightKg - 200)
  }

  // Calculate battery weight percentage if we have both values
  let batteryWeightPercentage = vehicle.batteryWeightPercentage
  if (!batteryWeightPercentage && vehicle.batteryWeightKg && curbWeightKg) {
    batteryWeightPercentage = Math.round((vehicle.batteryWeightKg / curbWeightKg) * 100 * 10) / 10
  }

  return {
    name: vehicle.name.trim(),
    modelTrim: vehicle.modelTrim?.trim(),
    rangeKm: vehicle.rangeKm ?? vehicle.rangeWltpKm,
    rangeWltpKm: vehicle.rangeWltpKm,
    rangeEpaKm: vehicle.rangeEpaKm,
    efficiencyKwhPer100km: vehicle.efficiencyKwhPer100km,
    powerRatingKw: vehicle.powerRatingKw,
    torqueNm: vehicle.torqueNm,
    batteryCapacityKwh: vehicle.batteryCapacityKwh,
    chargingTimeDc0To80Min: vehicle.chargingTimeDc0To80Min,
    acceleration0To100Kmh: vehicle.acceleration0To100Kmh,
    topSpeedKmh: vehicle.topSpeedKmh,
    grossVehicleWeightKg: vehicle.grossVehicleWeightKg,
    batteryWeightKg: vehicle.batteryWeightKg,
    curbWeightKg,
    batteryWeightPercentage,
    batteryManufacturer: vehicle.batteryManufacturer,
    batteryTechnology: vehicle.batteryTechnology,
    batteryWarranty: vehicle.batteryWarranty,
    chargingCapabilities: vehicle.chargingCapabilities,
    technologyFeatures: vehicle.technologyFeatures,
    basePrice: vehicle.basePriceLocalCurrency,
    optionPrices: vehicle.optionPrices || [],
    country: normalizedCountry,
    isAvailable: vehicle.isAvailable ?? true,
  }
}

