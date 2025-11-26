/**
 * Check vehicles by country
 */

import { prisma } from '../lib/prisma'

async function checkAll() {
  const all = await prisma.vehicle.findMany({
    orderBy: { name: 'asc' },
  })

  const byCountry: Record<string, number> = {}
  for (const v of all) {
    byCountry[v.country] = (byCountry[v.country] || 0) + 1
  }

  console.log(`Total vehicles in database: ${all.length}`)
  console.log('\nBreakdown by country:')
  for (const [country, count] of Object.entries(byCountry).sort()) {
    console.log(`  ${country}: ${count}`)
  }

  await prisma.$disconnect()
}

checkAll()

