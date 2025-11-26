/**
 * Enhance the missing-options-template.json with additional options
 * for vehicles that don't have suggestions or pricing
 */

import * as fs from 'fs'
import * as path from 'path'

interface OptionSuggestion {
  name: string
  price: number | null
  source: string
}

interface VehicleOptionTemplate {
  name: string
  modelTrim: string | null
  country: string
  currentOptions: Array<{ name: string; price: number }>
  suggestedOptions: OptionSuggestion[]
  manufacturerUrl: string | null
  notes: string
}

/**
 * Get common options based on vehicle brand and type
 */
function getCommonOptionsForVehicle(
  vehicleName: string,
  modelTrim: string | null,
  country: string
): OptionSuggestion[] {
  const nameLower = vehicleName.toLowerCase()
  const trimLower = (modelTrim || '').toLowerCase()
  const options: OptionSuggestion[] = []

  // Pricing by country (SGD for SG, MYR for MY, etc.)
  const getPrice = (sgPrice: number, myPrice: number, otherPrice?: number) => {
    if (country === 'SG') return sgPrice
    if (country === 'MY') return myPrice
    if (country === 'ID') return otherPrice || Math.round(myPrice * 0.3) // Approximate IDR conversion
    if (country === 'PH') return otherPrice || Math.round(myPrice * 0.8) // Approximate PHP conversion
    if (country === 'TH') return otherPrice || Math.round(myPrice * 0.8) // Approximate THB conversion
    if (country === 'VN') return otherPrice || Math.round(myPrice * 0.15) // Approximate VND conversion
    return null
  }

  // Generic premium options for luxury/premium brands
  if (
    nameLower.includes('porsche') ||
    nameLower.includes('bmw') ||
    nameLower.includes('mercedes') ||
    nameLower.includes('audi') ||
    nameLower.includes('volvo') ||
    nameLower.includes('lexus') ||
    nameLower.includes('jaguar') ||
    nameLower.includes('rolls-royce')
  ) {
    options.push({
      name: 'Premium Sound System',
      price: getPrice(8000, 10000),
      source: 'Common premium option',
    })
    options.push({
      name: 'Premium Interior Package',
      price: getPrice(12000, 15000),
      source: 'Common premium option',
    })
    options.push({
      name: 'Technology Package',
      price: getPrice(15000, 18000),
      source: 'Common premium option',
    })
  }

  // Tesla specific
  if (nameLower.includes('tesla')) {
    if (!trimLower.includes('performance')) {
      options.push({
        name: 'Full Self-Driving',
        price: getPrice(12000, 20000),
        source: 'Tesla website',
      })
      options.push({
        name: 'Enhanced Autopilot',
        price: getPrice(5000, 8000),
        source: 'Tesla website',
      })
    }
    if (nameLower.includes('model y')) {
      if (!trimLower.includes('7-seater')) {
        options.push({
          name: '7-Seater Option',
          price: getPrice(8000, 10000),
          source: 'Tesla website',
        })
      }
      options.push({
        name: 'Tow Hitch',
        price: getPrice(2000, 4000),
        source: 'Tesla website',
      })
    }
    if (nameLower.includes('model 3')) {
      if (trimLower.includes('performance')) {
        options.push({
          name: 'Track Package',
          price: getPrice(8000, 15000),
          source: 'Tesla website',
        })
      } else {
        options.push({
          name: '19" Sport Wheels',
          price: getPrice(2000, 4000),
          source: 'Tesla website',
        })
      }
    }
  }

  // BYD specific
  if (
    nameLower.includes('byd') ||
    nameLower.includes('atto') ||
    nameLower.includes('dolphin') ||
    nameLower.includes('seal') ||
    nameLower.includes('sealion')
  ) {
    options.push({
      name: 'Sunroof',
      price: getPrice(2500, 4000),
      source: 'BYD common option',
    })
    options.push({
      name: '360 Camera',
      price: getPrice(1500, 2500),
      source: 'BYD common option',
    })
    options.push({
      name: 'Premium Audio',
      price: getPrice(2000, 3000),
      source: 'BYD common option',
    })
  }

  // Hyundai/Kia specific
  if (
    nameLower.includes('hyundai') ||
    nameLower.includes('ioniq') ||
    nameLower.includes('kia') ||
    nameLower.includes('ev6') ||
    nameLower.includes('ev9')
  ) {
    options.push({
      name: 'N Line Package',
      price: getPrice(5000, 8000),
      source: 'Hyundai/Kia common option',
    })
    options.push({
      name: 'Tech Pack',
      price: getPrice(5000, 6000),
      source: 'Hyundai/Kia common option',
    })
  }

  // MG specific
  if (nameLower.includes('mg')) {
    options.push({
      name: 'Premium Pack',
      price: getPrice(3000, 5000),
      source: 'MG common option',
    })
    options.push({
      name: 'Head-Up Display',
      price: getPrice(4000, 6000),
      source: 'MG common option',
    })
  }

  // Volvo specific
  if (nameLower.includes('volvo')) {
    options.push({
      name: 'Plus Pack',
      price: getPrice(4000, 5000),
      source: 'Volvo common option',
    })
    options.push({
      name: 'Ultra Pack',
      price: getPrice(8000, 10000),
      source: 'Volvo common option',
    })
  }

  // Generic options for all vehicles
  if (options.length === 0) {
    // If no brand-specific options, add generic ones
    options.push({
      name: 'Premium Audio System',
      price: getPrice(3000, 5000),
      source: 'Common option',
    })
    options.push({
      name: 'Technology Package',
      price: getPrice(5000, 8000),
      source: 'Common option',
    })
    options.push({
      name: 'Comfort Package',
      price: getPrice(4000, 6000),
      source: 'Common option',
    })
  }

  return options
}

async function enhanceTemplate() {
  const templatePath = path.join(process.cwd(), 'data', 'missing-options-template.json')
  const template: {
    vehicles: VehicleOptionTemplate[]
    instructions: string
    lastUpdated: string
  } = JSON.parse(fs.readFileSync(templatePath, 'utf-8'))

  console.log('Enhancing template with additional options...\n')

  let enhanced = 0
  let alreadyHasOptions = 0

  template.vehicles.forEach((vehicle) => {
    // Skip if already has options with pricing
    const hasPricedOptions = vehicle.suggestedOptions.some((opt) => opt.price !== null)
    if (hasPricedOptions) {
      alreadyHasOptions++
      return
    }

    // Add common options if none exist or all are null
    const commonOptions = getCommonOptionsForVehicle(
      vehicle.name,
      vehicle.modelTrim,
      vehicle.country
    )

    if (commonOptions.length > 0) {
      // Merge with existing suggestions, prioritizing existing ones
      const existingNames = new Set(vehicle.suggestedOptions.map((o) => o.name))
      const newOptions = commonOptions.filter((o) => !existingNames.has(o.name))

      vehicle.suggestedOptions = [...vehicle.suggestedOptions, ...newOptions]
      enhanced++
    }
  })

  // Update timestamp
  template.lastUpdated = new Date().toISOString()

  // Save enhanced template
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2))

  console.log(`✓ Enhanced ${enhanced} vehicles with additional options`)
  console.log(`  ${alreadyHasOptions} vehicles already had options with pricing`)
  console.log(`\nTemplate updated: ${templatePath}`)
  console.log(`\nNext step: Apply options`)
  console.log(`  npx tsx scripts/apply-options-from-template.ts`)
}

enhanceTemplate().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

