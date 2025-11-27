// @ts-nocheck
import { prisma } from '../lib/prisma'

async function checkCounts() {
  try {
    const total = await prisma.vehicle.count()
    console.log(`Total vehicles in database: ${total}`)
    
    const byCountry = await prisma.vehicle.groupBy({
      by: ['country'],
      _count: true,
      orderBy: { country: 'asc' }
    })
    
    console.log('\nBy country:')
    byCountry.forEach(({ country, _count }) => {
      console.log(`  ${country}: ${_count}`)
    })
    
    const available = await prisma.vehicle.count({
      where: { isAvailable: true }
    })
    console.log(`\nAvailable vehicles: ${available}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCounts()

