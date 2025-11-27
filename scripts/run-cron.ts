// @ts-nocheck
/**
 * Script to manually run the cron job
 * Usage: npx tsx scripts/run-cron.ts
 */

import { prisma } from '../lib/prisma'
import { fetchVehiclesFromFile } from '../lib/data-fetchers/file-data'
import { transformAndSaveVehicle } from '../lib/data-fetchers/vehicle-transformer'

async function runCron() {
  const startTime = Date.now()
  let vehiclesProcessed = 0
  let vehiclesCreated = 0
  let vehiclesUpdated = 0
  let errors: string[] = []

  try {
    console.log('Starting vehicle data update cron job at:', new Date().toISOString())

    // Step 1: Fetch vehicles from file
    console.log('Reading vehicles from data/vehicles-data.json...')
    const fileVehicles = await fetchVehiclesFromFile()
    console.log(`Found ${fileVehicles.length} vehicles in file`)

    if (fileVehicles.length === 0) {
      console.warn('No vehicles found in data/vehicles-data.json')
      console.log('Please add vehicles to data/vehicles-data.json')
      process.exit(1)
    }

    // Step 2: Process and save all vehicles from file
    for (const vehicle of fileVehicles) {
      try {
        const existing = await prisma.vehicle.findFirst({
          where: {
            name: vehicle.name,
            modelTrim: vehicle.modelTrim || null,
            country: vehicle.country,
          },
        })

        await transformAndSaveVehicle({
          name: vehicle.name,
          modelTrim: vehicle.modelTrim,
          rangeKm: vehicle.rangeKm,
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
          curbWeightKg: vehicle.curbWeightKg,
          batteryWeightPercentage: vehicle.batteryWeightPercentage,
          batteryManufacturer: vehicle.batteryManufacturer,
          batteryTechnology: vehicle.batteryTechnology,
          batteryWarranty: vehicle.batteryWarranty,
          chargingCapabilities: vehicle.chargingCapabilities,
          technologyFeatures: vehicle.technologyFeatures,
          basePrice: vehicle.basePrice,
          optionPrices: vehicle.optionPrices,
          country: vehicle.country,
          isAvailable: vehicle.isAvailable,
        })

        vehiclesProcessed++
        if (existing) {
          vehiclesUpdated++
          console.log(`✓ Updated: ${vehicle.name} (${vehicle.country})`)
        } else {
          vehiclesCreated++
          console.log(`✓ Created: ${vehicle.name} (${vehicle.country})`)
        }
      } catch (error) {
        const errorMsg = `Error processing ${vehicle.name} (${vehicle.country}): ${error instanceof Error ? error.message : 'Unknown'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    // Step 4: Mark vehicles as unavailable if not updated in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const outdatedCount = await prisma.vehicle.updateMany({
      where: {
        updatedAt: { lt: sevenDaysAgo },
        isAvailable: true,
      },
      data: {
        isAvailable: false,
      },
    })

    const duration = Date.now() - startTime

    // Log to audit table
    await prisma.auditLog.create({
      data: {
        action: 'CRON_RUN',
        changes: {
          timestamp: new Date().toISOString(),
          vehiclesProcessed,
          vehiclesCreated,
          vehiclesUpdated,
          outdatedMarked: outdatedCount.count,
          errors: errors.length > 0 ? errors : undefined,
          durationMs: duration,
        },
      },
    })

    console.log('\n' + '='.repeat(50))
    console.log(`Cron job completed in ${(duration / 1000).toFixed(2)}s`)
    console.log(`Processed: ${vehiclesProcessed}`)
    console.log(`Created: ${vehiclesCreated}`)
    console.log(`Updated: ${vehiclesUpdated}`)
    console.log(`Outdated marked: ${outdatedCount.count}`)
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}`)
      errors.forEach(err => console.error(`  - ${err}`))
    }
    console.log('='.repeat(50))

    process.exit(0)
  } catch (error) {
    console.error('Cron job error:', error)

    await prisma.auditLog.create({
      data: {
        action: 'CRON_ERROR',
        changes: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
    })

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runCron()
