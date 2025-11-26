/**
 * Script to help populate missing vehicle options from manufacturer websites
 * This script identifies vehicles without options and provides a template for adding them
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface VehicleOptionTemplate {
  name: string
  modelTrim: string | null
  country: string
  currentOptions: Array<{ name: string; price: number }>
  suggestedOptions: Array<{ name: string; price: number | null; source: string }>
  manufacturerUrl: string | null
  notes: string
}

/**
 * Get manufacturer website URL based on vehicle name and country
 */
function getManufacturerUrl(vehicleName: string, country: string): string | null {
  const nameLower = vehicleName.toLowerCase()
  
  if (nameLower.includes('tesla')) {
    return country === 'SG' 
      ? 'https://www.tesla.com/en_sg' 
      : country === 'MY'
      ? 'https://www.tesla.com/en_my'
      : 'https://www.tesla.com'
  }
  if (nameLower.includes('byd')) {
    return country === 'SG' 
      ? 'https://www.byd.com/sg' 
      : country === 'MY'
      ? 'https://www.byd.com/my'
      : 'https://www.byd.com'
  }
  if (nameLower.includes('hyundai') || nameLower.includes('ioniq')) {
    return country === 'SG' 
      ? 'https://www.hyundai.com.sg' 
      : country === 'MY'
      ? 'https://www.hyundai.com.my'
      : 'https://www.hyundai.com'
  }
  if (nameLower.includes('kia') || nameLower.includes('ev6')) {
    return country === 'SG' 
      ? 'https://www.kia.com.sg' 
      : country === 'MY'
      ? 'https://www.kia.com.my'
      : 'https://www.kia.com'
  }
  if (nameLower.includes('bmw') || nameLower.includes('i4') || nameLower.includes('ix')) {
    return country === 'SG' 
      ? 'https://www.bmw.com.sg' 
      : country === 'MY'
      ? 'https://www.bmw.com.my'
      : 'https://www.bmw.com'
  }
  if (nameLower.includes('porsche')) {
    return country === 'SG' 
      ? 'https://www.porsche.com/singapore' 
      : country === 'MY'
      ? 'https://www.porsche.com/malaysia'
      : 'https://www.porsche.com'
  }
  if (nameLower.includes('audi')) {
    return country === 'SG' 
      ? 'https://www.audi.com.sg' 
      : country === 'MY'
      ? 'https://www.audi.com.my'
      : 'https://www.audi.com'
  }
  if (nameLower.includes('volvo')) {
    return country === 'SG' 
      ? 'https://www.volvocars.com/sg' 
      : country === 'MY'
      ? 'https://www.volvocars.com/my'
      : 'https://www.volvocars.com'
  }
  if (nameLower.includes('mercedes') || nameLower.includes('eqc') || nameLower.includes('eqe') || nameLower.includes('eqs')) {
    return country === 'SG' 
      ? 'https://www.mercedes-benz.com.sg' 
      : country === 'MY'
      ? 'https://www.mercedes-benz.com.my'
      : 'https://www.mercedes-benz.com'
  }
  if (nameLower.includes('mg')) {
    return country === 'SG' 
      ? 'https://www.mg.com.sg' 
      : country === 'MY'
      ? 'https://www.mg.com.my'
      : 'https://www.mg.co.uk'
  }
  if (nameLower.includes('mini')) {
    return country === 'SG' 
      ? 'https://www.mini.com.sg' 
      : country === 'MY'
      ? 'https://www.mini.com.my'
      : 'https://www.mini.com'
  }
  
  return null
}

/**
 * Get common options suggestions based on vehicle brand and type
 */
function getSuggestedOptions(vehicleName: string, modelTrim: string | null, country: string): Array<{ name: string; price: number | null; source: string }> {
  const nameLower = vehicleName.toLowerCase()
  const trimLower = (modelTrim || '').toLowerCase()
  const suggestions: Array<{ name: string; price: number | null; source: string }> = []
  
  // Tesla common options
  if (nameLower.includes('tesla')) {
    if (!trimLower.includes('performance')) {
      suggestions.push({ name: 'Full Self-Driving', price: country === 'SG' ? 12000 : country === 'MY' ? 20000 : null, source: 'Tesla website' })
      suggestions.push({ name: 'Enhanced Autopilot', price: country === 'SG' ? 5000 : country === 'MY' ? 8000 : null, source: 'Tesla website' })
    }
    if (nameLower.includes('model y')) {
      suggestions.push({ name: '7-Seater Option', price: country === 'SG' ? 8000 : country === 'MY' ? 10000 : null, source: 'Tesla website' })
      suggestions.push({ name: 'Tow Hitch', price: country === 'SG' ? 2000 : country === 'MY' ? 4000 : null, source: 'Tesla website' })
    }
    if (nameLower.includes('model 3')) {
      if (trimLower.includes('performance')) {
        suggestions.push({ name: 'Track Package', price: country === 'SG' ? 8000 : country === 'MY' ? 15000 : null, source: 'Tesla website' })
      } else {
        suggestions.push({ name: '19" Sport Wheels', price: country === 'SG' ? 2000 : country === 'MY' ? 4000 : null, source: 'Tesla website' })
      }
    }
  }
  
  // BMW common options
  if (nameLower.includes('bmw')) {
    suggestions.push({ name: 'M Sport Package', price: country === 'SG' ? 10000 : country === 'MY' ? 12000 : null, source: 'BMW website' })
    suggestions.push({ name: 'Premium Package', price: country === 'SG' ? 15000 : country === 'MY' ? 18000 : null, source: 'BMW website' })
    if (trimLower.includes('m50') || trimLower.includes('m')) {
      suggestions.push({ name: 'Adaptive M Suspension', price: country === 'SG' ? 12000 : country === 'MY' ? 15000 : null, source: 'BMW website' })
    }
  }
  
  // Porsche common options
  if (nameLower.includes('porsche')) {
    suggestions.push({ name: 'Adaptive Air Suspension', price: country === 'SG' ? 25000 : country === 'MY' ? 28000 : null, source: 'Porsche website' })
    if (trimLower.includes('turbo')) {
      suggestions.push({ name: 'Porsche Ceramic Composite Brake (PCCB)', price: country === 'SG' ? 35000 : country === 'MY' ? 40000 : null, source: 'Porsche website' })
      suggestions.push({ name: 'Rear-axle steering', price: country === 'SG' ? 22000 : country === 'MY' ? 25000 : null, source: 'Porsche website' })
    }
    suggestions.push({ name: 'BOSE Sound System', price: country === 'SG' ? 8000 : country === 'MY' ? 10000 : null, source: 'Porsche website' })
  }
  
  // Audi common options
  if (nameLower.includes('audi')) {
    suggestions.push({ name: 'S Line Package', price: country === 'SG' ? 12000 : country === 'MY' ? 15000 : null, source: 'Audi website' })
    suggestions.push({ name: 'Technology Package', price: country === 'SG' ? 15000 : country === 'MY' ? 18000 : null, source: 'Audi website' })
  }
  
  // BYD common options
  if (nameLower.includes('byd') || nameLower.includes('atto') || nameLower.includes('dolphin') || nameLower.includes('seal')) {
    suggestions.push({ name: 'Sunroof', price: country === 'SG' ? 2500 : country === 'MY' ? 4000 : null, source: 'BYD website' })
    suggestions.push({ name: '360 Camera', price: country === 'SG' ? 1500 : country === 'MY' ? 2500 : null, source: 'BYD website' })
    suggestions.push({ name: 'Premium Audio', price: country === 'SG' ? 2000 : country === 'MY' ? 3000 : null, source: 'BYD website' })
  }
  
  // Hyundai/Kia common options
  if (nameLower.includes('hyundai') || nameLower.includes('ioniq') || nameLower.includes('kia')) {
    suggestions.push({ name: 'N Line Package', price: country === 'SG' ? 5000 : country === 'MY' ? 8000 : null, source: 'Hyundai/Kia website' })
    suggestions.push({ name: 'Tech Pack', price: country === 'SG' ? 5000 : country === 'MY' ? 6000 : null, source: 'Hyundai/Kia website' })
  }
  
  // Volvo common options
  if (nameLower.includes('volvo')) {
    suggestions.push({ name: 'Plus Pack', price: country === 'SG' ? 4000 : country === 'MY' ? 5000 : null, source: 'Volvo website' })
    suggestions.push({ name: 'Ultra Pack', price: country === 'SG' ? 8000 : country === 'MY' ? 10000 : null, source: 'Volvo website' })
  }
  
  return suggestions
}

async function generateOptionsTemplate() {
  console.log('Generating options template for vehicles without options...\n')

  const vehicles = await prisma.vehicle.findMany({
    select: {
      name: true,
      modelTrim: true,
      country: true,
      optionPrices: true,
    },
    orderBy: [{ name: 'asc' }, { modelTrim: 'asc' }],
  })

  const vehiclesWithoutOptions = vehicles.filter(
    (v) => !Array.isArray(v.optionPrices) || v.optionPrices.length === 0
  )

  console.log(`Found ${vehiclesWithoutOptions.length} vehicles without options\n`)

  // Group by vehicle name and country for better organization
  const grouped: Record<string, VehicleOptionTemplate[]> = {}

  vehiclesWithoutOptions.forEach((v) => {
    const key = `${v.name}||${v.country}`
    if (!grouped[key]) {
      grouped[key] = []
    }

    const manufacturerUrl = getManufacturerUrl(v.name, v.country)
    const suggestedOptions = getSuggestedOptions(v.name, v.modelTrim, v.country)

    grouped[key].push({
      name: v.name,
      modelTrim: v.modelTrim,
      country: v.country,
      currentOptions: [],
      suggestedOptions,
      manufacturerUrl,
      notes: `Check ${manufacturerUrl || 'manufacturer website'} for official options and pricing`,
    })
  })

  // Generate template file
  const template: {
    vehicles: VehicleOptionTemplate[]
    instructions: string
    lastUpdated: string
  } = {
    vehicles: Object.values(grouped).flat(),
    instructions: `
INSTRUCTIONS FOR POPULATING OPTIONS:

1. Review the suggested options for each vehicle
2. Visit the manufacturer website URL provided
3. Verify actual options and pricing for the specific trim and country
4. Update the suggestedOptions array with verified data
5. Once verified, you can use this data to update vehicles-data.json

To update vehicles-data.json:
- Find the vehicle entry by name, modelTrim, and country
- Add or update the "optionPrices" array with the verified options
- Format: [{"name": "Option Name", "price": 1234}]
- Run the database sync: npx tsx scripts/run-cron.ts
    `.trim(),
    lastUpdated: new Date().toISOString(),
  }

  const outputPath = path.join(process.cwd(), 'data', 'missing-options-template.json')
  fs.writeFileSync(outputPath, JSON.stringify(template, null, 2))

  console.log(`✓ Template generated: ${outputPath}`)
  console.log(`\nTotal vehicles without options: ${vehiclesWithoutOptions.length}`)
  console.log(`\nNext steps:`)
  console.log(`1. Review ${outputPath}`)
  console.log(`2. Visit manufacturer websites to verify options and pricing`)
  console.log(`3. Update the template with verified data`)
  console.log(`4. Use the template to update vehicles-data.json`)
  console.log(`5. Run: npx tsx scripts/run-cron.ts`)

  // Also generate a summary report
  const summaryPath = path.join(process.cwd(), 'data', 'missing-options-summary.txt')
  let summary = `VEHICLES WITHOUT OPTIONS - SUMMARY\n`
  summary += `Generated: ${new Date().toISOString()}\n`
  summary += `Total: ${vehiclesWithoutOptions.length} vehicles\n\n`

  Object.entries(grouped).forEach(([key, vehicles]) => {
    const [name, country] = key.split('||')
    summary += `\n${name} (${country}):\n`
    vehicles.forEach((v) => {
      summary += `  - ${v.modelTrim || 'Base'}\n`
      if (v.manufacturerUrl) {
        summary += `    URL: ${v.manufacturerUrl}\n`
      }
      if (v.suggestedOptions.length > 0) {
        summary += `    Suggested options:\n`
        v.suggestedOptions.forEach((opt) => {
          summary += `      - ${opt.name}${opt.price ? ` (${opt.price})` : ' (check pricing)'}\n`
        })
      }
    })
  })

  fs.writeFileSync(summaryPath, summary)
  console.log(`\n✓ Summary report generated: ${summaryPath}`)

  await prisma.$disconnect()
}

generateOptionsTemplate()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

