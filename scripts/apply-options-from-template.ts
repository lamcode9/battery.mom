/**
 * Apply options from missing-options-template.json to vehicles-data.json
 * This script reads the template, finds matching vehicles, and updates their options
 */

import * as fs from 'fs'
import * as path from 'path'

interface VehicleOptionTemplate {
  name: string
  modelTrim: string | null
  country: string
  currentOptions: Array<{ name: string; price: number }>
  suggestedOptions: Array<{ name: string; price: number | null; source: string }>
  manufacturerUrl: string | null
  notes: string
}

interface TemplateData {
  vehicles: VehicleOptionTemplate[]
  instructions: string
  lastUpdated: string
}

interface VehicleData {
  name: string
  modelTrim?: string | null
  country: string
  optionPrices?: Array<{ name: string; price: number }>
  [key: string]: any
}

function findMatchingVehicle(
  vehicles: VehicleData[],
  template: VehicleOptionTemplate
): VehicleData | null {
  return (
    vehicles.find(
      (v) =>
        v.name === template.name &&
        (v.modelTrim || null) === (template.modelTrim || null) &&
        v.country === template.country
    ) || null
  )
}

function applyOptionsFromTemplate() {
  const templatePath = path.join(process.cwd(), 'data', 'missing-options-template.json')
  const vehiclesPath = path.join(process.cwd(), 'data', 'vehicles-data.json')

  if (!fs.existsSync(templatePath)) {
    console.error(`Template file not found: ${templatePath}`)
    console.error('Please run: npx tsx scripts/populate-missing-options.ts first')
    process.exit(1)
  }

  if (!fs.existsSync(vehiclesPath)) {
    console.error(`Vehicles file not found: ${vehiclesPath}`)
    process.exit(1)
  }

  console.log('Reading template and vehicles data...\n')

  const templateData: TemplateData = JSON.parse(
    fs.readFileSync(templatePath, 'utf-8')
  )
  const vehiclesData: VehicleData[] = JSON.parse(
    fs.readFileSync(vehiclesPath, 'utf-8')
  )

  console.log(`Template contains ${templateData.vehicles.length} vehicles`)
  console.log(`Vehicles data contains ${vehiclesData.length} vehicles\n`)

  // Filter to only vehicles with verified options (price is not null)
  const verifiedOptions = templateData.vehicles.filter((v) =>
    v.suggestedOptions.some((opt) => opt.price !== null)
  )

  if (verifiedOptions.length === 0) {
    console.log('No vehicles with verified options found in template.')
    console.log('Please update the template with verified pricing first.')
    process.exit(0)
  }

  console.log(`Found ${verifiedOptions.length} vehicles with verified options\n`)

  let updated = 0
  let notFound = 0
  const notFoundVehicles: string[] = []

  verifiedOptions.forEach((template) => {
    const vehicle = findMatchingVehicle(vehiclesData, template)

    if (!vehicle) {
      notFound++
      notFoundVehicles.push(
        `${template.name} ${template.modelTrim || 'Base'} (${template.country})`
      )
      return
    }

    // Convert suggested options to optionPrices format
    // Only include options with verified pricing
    const verifiedOptionPrices = template.suggestedOptions
      .filter((opt) => opt.price !== null)
      .map((opt) => ({
        name: opt.name,
        price: opt.price!,
      }))

    if (verifiedOptionPrices.length > 0) {
      // Merge with existing options if any
      const existingOptions = Array.isArray(vehicle.optionPrices)
        ? vehicle.optionPrices
        : []
      
      // Create a map to avoid duplicates
      const optionsMap = new Map<string, number>()
      
      // Add existing options
      existingOptions.forEach((opt) => {
        optionsMap.set(opt.name, opt.price)
      })
      
      // Add/update with template options
      verifiedOptionPrices.forEach((opt) => {
        optionsMap.set(opt.name, opt.price)
      })
      
      // Convert back to array
      vehicle.optionPrices = Array.from(optionsMap.entries()).map(([name, price]) => ({
        name,
        price,
      }))

      updated++
      console.log(
        `✓ Updated ${template.name} ${template.modelTrim || 'Base'} (${template.country}): ${vehicle.optionPrices.length} options`
      )
    }
  })

  if (updated > 0) {
    // Backup original file
    const backupPath = `${vehiclesPath}.backup.${Date.now()}`
    fs.copyFileSync(vehiclesPath, backupPath)
    console.log(`\n✓ Backup created: ${backupPath}`)

    // Write updated data
    fs.writeFileSync(vehiclesPath, JSON.stringify(vehiclesData, null, 2))
    console.log(`✓ Updated ${vehiclesPath}`)
    console.log(`\nSummary:`)
    console.log(`  - Updated: ${updated} vehicles`)
    if (notFound > 0) {
      console.log(`  - Not found: ${notFound} vehicles`)
      console.log(`\nVehicles not found in data file:`)
      notFoundVehicles.forEach((v) => console.log(`  - ${v}`))
    }
    console.log(`\nNext step: Run database sync`)
    console.log(`  npx tsx scripts/run-cron.ts`)
  } else {
    console.log('\nNo vehicles were updated.')
    if (notFound > 0) {
      console.log(`\n${notFound} vehicles from template were not found in vehicles-data.json`)
    }
  }
}

applyOptionsFromTemplate()

