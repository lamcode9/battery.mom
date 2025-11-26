/**
 * Check Tesla vehicles for Malaysia
 */

import { prisma } from '../lib/prisma'

async function checkTesla() {
  const teslaVehicles = await prisma.vehicle.findMany({
    where: {
      name: { contains: 'Tesla', mode: 'insensitive' },
      country: 'MY',
      isAvailable: true,
    },
    orderBy: { name: 'asc' },
  })

  console.log(`Tesla vehicles in Malaysia (MY): ${teslaVehicles.length}`)
  console.log('\nList of Tesla vehicles:')
  teslaVehicles.forEach(v => {
    console.log(`  - ${v.name} (${v.modelTrim || 'N/A'}) - ID: ${v.id}`)
  })

  await prisma.$disconnect()
}

checkTesla()

