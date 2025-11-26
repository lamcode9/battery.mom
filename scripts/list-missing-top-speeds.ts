/**
 * List vehicles that need top speed data
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

function getVehicleKey(name: string, modelTrim?: string): string {
  return modelTrim ? `${name} ${modelTrim}` : name
}

async function main() {
  const filePath = path.join(process.cwd(), 'data', 'vehicles-data.json')
  const vehicles: VehicleData[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  
  const missing = new Map<string, { count: number; countries: Set<string> }>()
  
  for (const vehicle of vehicles) {
    if (!vehicle.topSpeedKmh) {
      const key = getVehicleKey(vehicle.name, vehicle.modelTrim)
      if (!missing.has(key)) {
        missing.set(key, { count: 0, countries: new Set() })
      }
      const entry = missing.get(key)!
      entry.count++
      entry.countries.add(vehicle.country)
    }
  }
  
  console.log(`\nVehicles missing top speed: ${missing.size} unique models\n`)
  console.log('Format: Vehicle Name | Model Trim | Count | Countries')
  console.log('─'.repeat(80))
  
  Array.from(missing.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([key, data]) => {
      const countries = Array.from(data.countries).sort().join(', ')
      console.log(`${key.padEnd(50)} | ${String(data.count).padStart(3)} | ${countries}`)
    })
  
  console.log(`\nTotal entries missing top speed: ${vehicles.filter(v => !v.topSpeedKmh).length}`)
}

main().catch(console.error)

