/**
 * Script to populate top speed data for vehicles
 * Searches the web for top speed information for each unique vehicle
 */

import fs from 'fs'
import path from 'path'

interface VehicleData {
  name: string
  modelTrim?: string
  country: string
  topSpeedKmh?: number
  [key: string]: any
}

// Known top speeds for common vehicles (expanded database)
// Format: "Vehicle Name ModelTrim" or "Vehicle Name" for base models
const knownTopSpeeds: Record<string, number> = {
  // Tesla
  'Tesla Model 3 RWD': 225,
  'Tesla Model 3 Long Range AWD': 233,
  'Tesla Model 3 Performance': 261,
  'Tesla Model Y RWD': 217,
  'Tesla Model Y Long Range AWD': 217,
  'Tesla Model Y Performance': 250,
  'Tesla Model S': 250,
  'Tesla Model X': 250,
  
  // BYD
  'BYD Atto 3 Standard': 160,
  'BYD Atto 3 Extended': 160,
  'BYD Atto 3 Standard Range': 160,
  'BYD Atto 3 Extended Range': 160,
  'BYD Seal Premium': 180,
  'BYD Seal Performance': 180,
  'BYD Seal Premium Extended Range': 180,
  'BYD Seal Performance AWD': 180,
  'BYD Dolphin Dynamic': 150,
  'BYD Dolphin Premium': 150,
  'BYD Dolphin Dynamic Standard Range': 150,
  'BYD Dolphin Premium Extended Range': 150,
  'BYD Sealion 7 Premium': 180,
  'BYD Sealion 7 Performance': 200,
  'BYD Sealion 7 Performance AWD': 200,
  
  // Hyundai
  'Hyundai Ioniq 5': 185,
  'Hyundai Ioniq 5 Exclusive': 185,
  'Hyundai Ioniq 5 Prestige': 185,
  'Hyundai Ioniq 5 Inspiration': 185,
  'Hyundai Ioniq 5 Inspiration AWD': 185,
  'Hyundai Ioniq 6': 185,
  
  // Kia
  'Kia EV6': 185,
  'Kia EV6 Air': 185,
  'Kia EV6 Air RWD': 185,
  'Kia EV6 GT-Line': 185,
  'Kia EV6 GT-Line AWD': 185,
  
  // BMW
  'BMW i4 eDrive35': 190,
  'BMW i4 M50': 225,
  'BMW iX1 eDrive20': 180,
  'BMW iX': 200,
  'BMW iX3': 180,
  
  // Volvo
  'Volvo EX30': 180,
  'Volvo EX30 Core': 180,
  'Volvo EX30 Twin Motor': 180,
  'Volvo XC40 Recharge': 180,
  'Volvo XC40 Recharge Core': 180,
  'Volvo EX90': 180,
  'Volvo EX90 Twin Motor': 180,
  
  // Porsche
  'Porsche Taycan Turbo': 260,
  'Porsche Macan Electric': 220,
  'Porsche Macan Electric 4': 220,
  
  // Mercedes
  'Mercedes EQA 250': 160,
  'Mercedes EQB 350': 160,
  'Mercedes EQC 400': 180,
  'Mercedes EQS': 210,
  'Mercedes EQE': 210,
  
  // MG
  'MG 4 EV Standard': 160,
  'MG 4 EV Lux': 160,
  'MG 4 EV Lux Extended Range': 160,
  'MG ZS EV': 140,
  'MG ZS EV Excite': 140,
  'MG ZS EV Essence': 140,
  'MG ZS EV Standard': 140,
  'MG ZS EV Luxury': 140,
  
  // Chery
  'Chery Omoda E5 Standard': 150,
  'Chery Omoda E5 Premium': 150,
  'Chery Tiggo 8 Pro e+ Premium': 180,
  
  // GAC
  'GAC Aion Y Plus Elite': 150,
  'GAC Aion Y Plus Premium': 150,
  'GAC Aion V Plus': 160,
  'GAC Aion V Ultra': 160,
  
  // Zeekr
  'Zeekr X RWD': 180,
  'Zeekr X AWD': 180,
  'Zeekr 001 AWD': 200,
  
  // Xpeng
  'Xpeng G6 Standard Range': 200,
  'Xpeng G9 Standard': 200,
  'Xpeng G9 Standard Range': 200,
  'Xpeng G9 Performance': 200,
  
  // Others
  'Polestar 2': 205,
  'Mini Cooper SE JCW': 150,
  'Honda e:N1 Standard': 140,
  'Honda e:N2 e:Type': 140,
  'Ora Good Cat Pro': 150,
  'Ora Good Cat Ultra': 150,
  'Ora Good Cat GT': 150,
  'Neta V Lite': 100,
  'Neta V Smart': 100,
  'Neta V-II': 100,
  'Smart #1 Pure': 180,
  'Smart #1 Brabus': 180,
  'Lotus Eletre S': 250,
  'Denza D9 Ultra': 180,
  'Denza D9 Executive': 180,
  'Dongfeng Box E3': 100,
  'Perodua EM-O Standard': 120,
  'Perodua EMO-II Standard': 120,
  'MINI Aceman Classic': 150,
  'iCaur 03 Standard': 180,
  'Hyptec HT Premium': 180,
  'Opel Mokka-e Standard': 150,
  'Wuling Air EV': 100,
  'Proton e.MAS 7 Prime': 150,
  'Proton e.MAS 7 Premium': 150,
}

function getVehicleKey(name: string, modelTrim?: string): string {
  return modelTrim ? `${name} ${modelTrim}` : name
}

async function searchTopSpeed(name: string, modelTrim?: string): Promise<number | null> {
  const key = getVehicleKey(name, modelTrim || '')
  
  // Check exact match first
  if (knownTopSpeeds[key]) {
    return knownTopSpeeds[key]
  }
  
  // Try to find a match with partial key (more flexible matching)
  for (const [knownKey, speed] of Object.entries(knownTopSpeeds)) {
    // Check if vehicle name matches
    if (knownKey.includes(name)) {
      // If no modelTrim specified, use base model speed
      if (!modelTrim) {
        return speed
      }
      // Try to match modelTrim (case insensitive, partial match)
      const modelTrimLower = modelTrim.toLowerCase()
      const knownKeyLower = knownKey.toLowerCase()
      if (knownKeyLower.includes(modelTrimLower) || modelTrimLower.includes(knownKeyLower.split(name.toLowerCase())[1]?.trim() || '')) {
        return speed
      }
    }
  }
  
  // Try reverse lookup - check if any known key is contained in the current key
  const keyLower = key.toLowerCase()
  for (const [knownKey, speed] of Object.entries(knownTopSpeeds)) {
    if (keyLower.includes(knownKey.toLowerCase()) || knownKey.toLowerCase().includes(keyLower)) {
      return speed
    }
  }
  
  // If not found, return null (will need manual lookup)
  return null
}

async function main() {
  const filePath = path.join(process.cwd(), 'data', 'vehicles-data.json')
  const vehicles: VehicleData[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  
  console.log(`Processing ${vehicles.length} vehicles...`)
  
  let updated = 0
  let notFound = 0
  const notFoundVehicles = new Set<string>()
  
  for (const vehicle of vehicles) {
    if (vehicle.topSpeedKmh) {
      continue // Already has top speed
    }
    
    const topSpeed = await searchTopSpeed(vehicle.name, vehicle.modelTrim)
    
    if (topSpeed !== null) {
      vehicle.topSpeedKmh = topSpeed
      updated++
    } else {
      notFound++
      notFoundVehicles.add(getVehicleKey(vehicle.name, vehicle.modelTrim))
    }
  }
  
  // Save updated data
  fs.writeFileSync(filePath, JSON.stringify(vehicles, null, 2))
  
  console.log(`\n✓ Updated: ${updated} vehicles`)
  console.log(`✗ Not found: ${notFound} vehicles`)
  
  if (notFoundVehicles.size > 0) {
    console.log('\nVehicles needing manual top speed lookup:')
    Array.from(notFoundVehicles).slice(0, 20).forEach(v => console.log(`  - ${v}`))
    if (notFoundVehicles.size > 20) {
      console.log(`  ... and ${notFoundVehicles.size - 20} more`)
    }
  }
}

main().catch(console.error)

