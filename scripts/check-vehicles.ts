/**
 * Script to check vehicles in database vs API
 * Usage: npx tsx scripts/check-vehicles.ts
 */

import { prisma } from '../lib/prisma'

async function checkVehicles() {
  try {
    // Get all vehicles from database
    const allVehicles = await prisma.vehicle.findMany({
      orderBy: { name: 'asc' },
    })

    const sgVehicles = allVehicles.filter(v => v.country === 'SG')
    const myVehicles = allVehicles.filter(v => v.country === 'MY')
    const availableVehicles = allVehicles.filter(v => v.isAvailable)
    const unavailableVehicles = allVehicles.filter(v => !v.isAvailable)

    console.log('='.repeat(60))
    console.log('DATABASE VEHICLE COUNT')
    console.log('='.repeat(60))
    console.log(`Total vehicles: ${allVehicles.length}`)
    console.log(`  - Singapore (SG): ${sgVehicles.length}`)
    console.log(`  - Malaysia (MY): ${myVehicles.length}`)
    console.log(`  - Available: ${availableVehicles.length}`)
    console.log(`  - Unavailable: ${unavailableVehicles.length}`)
    console.log('='.repeat(60))

    // Test API endpoint
    console.log('\nTesting API endpoint...')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    try {
      const response = await fetch(`${baseUrl}/api/vehicles?available=true`)
      if (response.ok) {
        const apiVehicles = await response.json()
        console.log(`✓ API returned ${apiVehicles.length} available vehicles`)
        
        const apiSg = apiVehicles.filter((v: any) => v.country === 'SG').length
        const apiMy = apiVehicles.filter((v: any) => v.country === 'MY').length
        console.log(`  - SG: ${apiSg}`)
        console.log(`  - MY: ${apiMy}`)
        
        if (apiVehicles.length !== availableVehicles.length) {
          console.log(`\n⚠️  Mismatch: API returned ${apiVehicles.length} but database has ${availableVehicles.length} available vehicles`)
        } else {
          console.log(`\n✓ API matches database count`)
        }
      } else {
        console.log(`✗ API request failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`✗ Could not reach API (site may not be running): ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.log(`  Make sure the site is running at ${baseUrl}`)
    }

    // Show sample vehicles
    console.log('\n' + '='.repeat(60))
    console.log('SAMPLE VEHICLES (first 5)')
    console.log('='.repeat(60))
    allVehicles.slice(0, 5).forEach(v => {
      console.log(`- ${v.name} (${v.modelTrim || 'N/A'}) - ${v.country} - ${v.isAvailable ? 'Available' : 'Unavailable'}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkVehicles()

