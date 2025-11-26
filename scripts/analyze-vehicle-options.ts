/**
 * Analyze vehicle options in the database and identify gaps
 * @ts-nocheck - This is a utility script, not part of the Next.js build
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface VehicleOptionAnalysis {
  name: string
  country: string
  trims: Array<{
    trim: string | null
    hasOptions: boolean
    optionsCount: number
    options: Array<{ name: string; price: number }>
  }>
  totalOptions: number
  hasAnyOptions: boolean
}

async function analyzeVehicleOptions() {
  console.log('Analyzing vehicle options in database...\n')

  const vehicles = await prisma.vehicle.findMany({
    select: {
      name: true,
      modelTrim: true,
      country: true,
      optionPrices: true,
    },
    orderBy: [{ name: 'asc' }, { modelTrim: 'asc' }],
  })

  // Group by vehicle name and country
  const grouped: Record<string, VehicleOptionAnalysis> = {}

  vehicles.forEach((v) => {
    const key = `${v.name}||${v.country}`
    if (!grouped[key]) {
      grouped[key] = {
        name: v.name,
        country: v.country,
        trims: [],
        totalOptions: 0,
        hasAnyOptions: false,
      }
    }

    const optionPricesRaw = Array.isArray(v.optionPrices) ? v.optionPrices : []
    // Type guard to ensure optionPrices is the correct type
    const optionPrices: Array<{ name: string; price: number }> = optionPricesRaw.filter(
      (opt): opt is { name: string; price: number } =>
        typeof opt === 'object' &&
        opt !== null &&
        'name' in opt &&
        'price' in opt &&
        typeof (opt as any).name === 'string' &&
        typeof (opt as any).price === 'number'
    )
    const hasOptions = optionPrices.length > 0

    grouped[key].trims.push({
      trim: v.modelTrim,
      hasOptions,
      optionsCount: optionPrices.length,
      options: optionPrices,
    })

    grouped[key].totalOptions += optionPrices.length
    if (hasOptions) {
      grouped[key].hasAnyOptions = true
    }
  })

  const analysis = Object.values(grouped)

  // Statistics
  const totalVehicles = vehicles.length
  const vehiclesWithOptions = vehicles.filter(
    (v) => Array.isArray(v.optionPrices) && v.optionPrices.length > 0
  ).length
  const vehiclesWithoutOptions = totalVehicles - vehiclesWithOptions

  const modelsWithAnyOptions = analysis.filter((a) => a.hasAnyOptions).length
  const modelsWithoutAnyOptions = analysis.length - modelsWithAnyOptions

  console.log('=== SUMMARY ===')
  console.log(`Total vehicles: ${totalVehicles}`)
  console.log(`Vehicles with options: ${vehiclesWithOptions} (${((vehiclesWithOptions / totalVehicles) * 100).toFixed(1)}%)`)
  console.log(`Vehicles without options: ${vehiclesWithoutOptions} (${((vehiclesWithoutOptions / totalVehicles) * 100).toFixed(1)}%)`)
  console.log(`\nTotal unique models: ${analysis.length}`)
  console.log(`Models with at least one trim having options: ${modelsWithAnyOptions}`)
  console.log(`Models with no options at all: ${modelsWithoutAnyOptions}`)

  // Vehicles without options
  console.log('\n=== VEHICLES WITHOUT OPTIONS ===')
  const withoutOptions = analysis
    .filter((a) => !a.hasAnyOptions)
    .slice(0, 20)
  
  withoutOptions.forEach((a) => {
    console.log(`\n${a.name} (${a.country}):`)
    a.trims.forEach((t) => {
      console.log(`  - ${t.trim || 'Base'}: No options`)
    })
  })

  if (withoutOptions.length > 20) {
    console.log(`\n... and ${withoutOptions.length - 20} more models without options`)
  }

  // Vehicles with partial options (some trims have options, others don't)
  console.log('\n=== VEHICLES WITH PARTIAL OPTIONS ===')
  const partialOptions = analysis.filter(
    (a) =>
      a.hasAnyOptions &&
      a.trims.some((t) => !t.hasOptions) &&
      a.trims.some((t) => t.hasOptions)
  )

  partialOptions.slice(0, 15).forEach((a) => {
    console.log(`\n${a.name} (${a.country}):`)
    a.trims.forEach((t) => {
      if (t.hasOptions) {
        console.log(`  ✓ ${t.trim || 'Base'}: ${t.optionsCount} options`)
        t.options.forEach((opt) => {
          console.log(`    - ${opt.name}: ${opt.price}`)
        })
      } else {
        console.log(`  ✗ ${t.trim || 'Base'}: No options`)
      }
    })
  })

  if (partialOptions.length > 15) {
    console.log(`\n... and ${partialOptions.length - 15} more models with partial options`)
  }

  // Top vehicles by options count
  console.log('\n=== TOP VEHICLES BY OPTIONS COUNT ===')
  const topByOptions = analysis
    .filter((a) => a.hasAnyOptions)
    .sort((a, b) => b.totalOptions - a.totalOptions)
    .slice(0, 10)

  topByOptions.forEach((a) => {
    console.log(`\n${a.name} (${a.country}): ${a.totalOptions} total options`)
    a.trims.forEach((t) => {
      if (t.hasOptions) {
        console.log(`  ${t.trim || 'Base'}: ${t.optionsCount} options`)
        t.options.forEach((opt) => {
          console.log(`    - ${opt.name}: ${opt.price}`)
        })
      }
    })
  })

  // Recommendations
  console.log('\n=== RECOMMENDATIONS ===')
  console.log(`1. ${vehiclesWithoutOptions} vehicles (${((vehiclesWithoutOptions / totalVehicles) * 100).toFixed(1)}%) have no options listed`)
  console.log(`2. ${partialOptions.length} models have partial options (some trims have options, others don't)`)
  console.log(`3. Consider checking manufacturer websites for:`)
  
  const topMissing = analysis
    .filter((a) => !a.hasAnyOptions)
    .slice(0, 10)
    .map((a) => `${a.name} (${a.country})`)
  
  topMissing.forEach((name) => {
    console.log(`   - ${name}`)
  })

  await prisma.$disconnect()
}

analyzeVehicleOptions()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

