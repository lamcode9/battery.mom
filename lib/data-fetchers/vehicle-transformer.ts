/**
 * Transform API/scraped data into our Vehicle model format
 */

import { prisma } from '@/lib/prisma'
import type { Country } from '@prisma/client'

interface VehicleInput {
  name: string
  modelTrim?: string
  rangeKm?: number // Legacy field
  rangeWltpKm?: number // WLTP range in km
  rangeEpaKm?: number // EPA range in km
  efficiencyKwhPer100km?: number
  powerRatingKw?: number
  torqueNm?: number
  batteryCapacityKwh?: number
  chargingTimeDc0To80Min?: number
  acceleration0To100Kmh?: number // 0-100 km/h in seconds (≈ 0-60 mph)
  topSpeedKmh?: number // Top speed in km/h
  grossVehicleWeightKg?: number // Gross vehicle weight from API (kg)
  batteryWeightKg?: number
  curbWeightKg?: number
  batteryWeightPercentage?: number
  batteryManufacturer?: string
  batteryTechnology?: 'NMC' | 'LFP' | 'SolidState' | 'Other'
  batteryWarranty?: string
  chargingCapabilities?: string
  technologyFeatures?: string
  country: Country
  basePrice?: number
  optionPrices?: Array<{ name: string; price: number }>
  isAvailable?: boolean
}

/**
 * Generate vehicle ID from name and trim
 */
export function generateVehicleId(name: string, modelTrim: string, country: Country): string {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${modelTrim.toLowerCase().replace(/\s+/g, '-')}-${country.toLowerCase()}`
}

/**
 * Transform and save vehicle to database
 */
export async function transformAndSaveVehicle(input: VehicleInput) {
  const vehicleId = generateVehicleId(input.name, input.modelTrim || 'base', input.country)
  
  // Build vehicle data, omitting undefined values for Prisma
  const vehicleData: any = {
    id: vehicleId,
    country: input.country,
    name: input.name,
    optionPrices: input.optionPrices || [],
    rebates: [],
    isAvailable: input.isAvailable ?? true,
    imageUrl: null, // Explicitly set to null since we removed this field
  }
  
  // Only include fields that have values
  if (input.modelTrim) vehicleData.modelTrim = input.modelTrim
  if (input.powerRatingKw !== undefined && input.powerRatingKw !== null) vehicleData.powerRatingKw = input.powerRatingKw
  if (input.torqueNm !== undefined && input.torqueNm !== null) vehicleData.torqueNm = input.torqueNm
  if (input.acceleration0To100Kmh !== undefined && input.acceleration0To100Kmh !== null) vehicleData.acceleration0To100Kmh = input.acceleration0To100Kmh
  if (input.topSpeedKmh !== undefined && input.topSpeedKmh !== null) vehicleData.topSpeedKmh = input.topSpeedKmh
  if (input.efficiencyKwhPer100km !== undefined && input.efficiencyKwhPer100km !== null) vehicleData.efficiencyKwhPer100km = input.efficiencyKwhPer100km
  if (input.rangeKm !== undefined && input.rangeKm !== null) vehicleData.rangeKm = input.rangeKm
  if (input.rangeWltpKm !== undefined && input.rangeWltpKm !== null) vehicleData.rangeWltpKm = input.rangeWltpKm
  if (input.rangeEpaKm !== undefined && input.rangeEpaKm !== null) vehicleData.rangeEpaKm = input.rangeEpaKm
  if (input.chargingTimeDc0To80Min !== undefined && input.chargingTimeDc0To80Min !== null) vehicleData.chargingTimeDc0To80Min = input.chargingTimeDc0To80Min
  if (input.basePrice !== null && input.basePrice !== undefined) vehicleData.basePriceLocalCurrency = input.basePrice
  if (input.batteryWeightKg !== undefined && input.batteryWeightKg !== null) vehicleData.batteryWeightKg = input.batteryWeightKg
  if (input.curbWeightKg !== undefined && input.curbWeightKg !== null) vehicleData.curbWeightKg = input.curbWeightKg
  if (input.batteryWeightPercentage !== undefined && input.batteryWeightPercentage !== null) vehicleData.batteryWeightPercentage = input.batteryWeightPercentage
  if (input.batteryManufacturer) vehicleData.batteryManufacturer = input.batteryManufacturer
  if (input.batteryTechnology) vehicleData.batteryTechnology = input.batteryTechnology
  if (input.batteryWarranty) vehicleData.batteryWarranty = input.batteryWarranty
  if (input.chargingCapabilities) vehicleData.chargingCapabilities = input.chargingCapabilities
  if (input.technologyFeatures) vehicleData.technologyFeatures = input.technologyFeatures

  await prisma.vehicle.upsert({
    where: { id: vehicleId },
    update: vehicleData,
    create: vehicleData,
  })

  return vehicleData
}

