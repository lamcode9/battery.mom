/**
 * Transform API/scraped data into our Vehicle model format
 */

import { prisma } from '@/lib/prisma'
import type { Country, BatteryTechnology } from '@prisma/client'
import {
  estimateManufacturerCost,
  estimateBatteryWeight,
  estimateCurbWeight,
} from './ev-api'

interface VehicleInput {
  name: string
  modelTrim: string
  rangeKm: number
  efficiencyKwhPer100km: number
  powerRatingKw: number
  batteryCapacityKwh?: number
  chargingTimeDc0To80Min?: number
  country: Country
  basePrice?: number
  otrPrice?: number
  imageUrl?: string
}

/**
 * Generate vehicle ID from name and trim
 */
export function generateVehicleId(name: string, modelTrim: string, country: Country): string {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${modelTrim.toLowerCase().replace(/\s+/g, '-')}-${country.toLowerCase()}`
}

/**
 * Determine battery technology from manufacturer/model
 */
export function inferBatteryTechnology(name: string): BatteryTechnology {
  const nameLower = name.toLowerCase()
  
  // Tesla uses various, but newer models use LFP
  if (nameLower.includes('tesla')) {
    if (nameLower.includes('model 3') && nameLower.includes('standard')) {
      return 'LFP'
    }
    return 'NMC'
  }
  
  // BYD primarily uses LFP
  if (nameLower.includes('byd')) {
    return 'LFP'
  }
  
  // Hyundai/Kia use NMC
  if (nameLower.includes('hyundai') || nameLower.includes('ioniq') || nameLower.includes('kia')) {
    return 'NMC'
  }
  
  // Default to NMC
  return 'NMC'
}

/**
 * Infer battery manufacturer from vehicle name
 */
export function inferBatteryManufacturer(name: string): string {
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('tesla')) {
    return 'Panasonic/CATL'
  }
  if (nameLower.includes('byd')) {
    return 'BYD'
  }
  if (nameLower.includes('hyundai') || nameLower.includes('ioniq')) {
    return 'SK Innovation'
  }
  if (nameLower.includes('kia')) {
    return 'LG Chem'
  }
  
  return 'Unknown'
}

/**
 * Generate power rating explanation
 */
export function generatePowerExplanation(powerKw: number): string {
  if (powerKw >= 300) {
    return `Power rating (kW) is like the engine's muscle – higher means quicker acceleration, but efficiency matters more for daily drives. Think ${powerKw}kW as very powerful, great for highway merging and spirited driving.`
  } else if (powerKw >= 200) {
    return `Power rating (kW) is like the engine's muscle – higher means quicker acceleration, but efficiency matters more for daily drives. Think ${powerKw}kW as zippy city commuting with excellent highway performance.`
  } else if (powerKw >= 100) {
    return `Power rating (kW) is like the engine's muscle – higher means quicker acceleration, but efficiency matters more for daily drives. Think ${powerKw}kW as zippy city commuting with good highway performance.`
  } else {
    return `Power rating (kW) is like the engine's muscle – higher means quicker acceleration, but efficiency matters more for daily drives. Think ${powerKw}kW as adequate for city commuting.`
  }
}

/**
 * Get rebates for country
 */
export function getCountryRebates(country: Country, basePrice: number) {
  if (country === 'SG') {
    return [
      {
        name: 'EV Early Adoption Incentive',
        amount: Math.min(20000, basePrice * 0.1), // 10% or max 20k
        description: 'Singapore government rebate for early EV adopters',
      },
    ]
  } else {
    // Malaysia
    return [
      {
        name: 'VEP Exemption',
        amount: 5000,
        description: 'Malaysia VEP exemption for EVs',
      },
    ]
  }
}

/**
 * Transform and save vehicle to database
 */
export async function transformAndSaveVehicle(input: VehicleInput) {
  const batteryWeightKg = estimateBatteryWeight(input.batteryCapacityKwh)
  const curbWeightKg = estimateCurbWeight(batteryWeightKg, input.powerRatingKw)
  const batteryWeightPercentage = (batteryWeightKg / curbWeightKg) * 100
  const manufacturerCostUsd = estimateManufacturerCost(input.batteryCapacityKwh)

  const vehicleId = generateVehicleId(input.name, input.modelTrim, input.country)
  
  // Default pricing if not provided
  const basePrice = input.basePrice || (input.country === 'SG' ? 150000 : 120000)
  const otrPrice = input.otrPrice || basePrice * (input.country === 'SG' ? 1.25 : 1.12)
  const rebates = getCountryRebates(input.country, basePrice)
  const totalRebates = rebates.reduce((sum, r) => sum + r.amount, 0)

  const vehicleData = {
    id: vehicleId,
    country: input.country,
    name: input.name,
    modelTrim: input.modelTrim,
    imageUrl: input.imageUrl || `https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800`,
    batteryWeightKg,
    curbWeightKg,
    batteryWeightPercentage,
    powerRatingKw: input.powerRatingKw,
    powerRatingExplanation: generatePowerExplanation(input.powerRatingKw),
    efficiencyKwhPer100km: input.efficiencyKwhPer100km,
    rangeKm: input.rangeKm,
    manufacturerCostUsd,
    batteryManufacturer: inferBatteryManufacturer(input.name),
    batteryTechnology: inferBatteryTechnology(input.name),
    chargingTimeDc0To80Min: input.chargingTimeDc0To80Min || 30,
    chargingCapabilities: input.chargingTimeDc0To80Min
      ? `Up to ${Math.round(input.chargingTimeDc0To80Min * 10)}kW DC, 11kW AC`
      : 'Up to 150kW DC, 11kW AC',
    basePriceLocalCurrency: basePrice,
    optionPrices: [],
    onTheRoadPriceLocalCurrency: otrPrice,
    rebates,
    isAvailable: true,
  }

  // Upsert vehicle
  await prisma.vehicle.upsert({
    where: { id: vehicleId },
    update: vehicleData,
    create: vehicleData,
  })

  return vehicleData
}

