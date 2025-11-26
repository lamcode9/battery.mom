/**
 * Script to reset the database by clearing all vehicles
 * Usage: npx tsx scripts/reset-database.ts
 */

import { prisma } from '../lib/prisma'

async function resetDatabase() {
  try {
    console.log('Starting database reset...')
    
    // Delete all vehicles
    const deletedCount = await prisma.vehicle.deleteMany({})
    console.log(`✓ Deleted ${deletedCount.count} vehicles from database`)
    
    // Optionally clear audit logs (uncomment if needed)
    // const deletedLogs = await prisma.auditLog.deleteMany({})
    // console.log(`✓ Deleted ${deletedLogs.count} audit logs`)
    
    console.log('\n' + '='.repeat(50))
    console.log('Database reset completed successfully!')
    console.log('You can now run the cron job to populate from vehicles-data.json')
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('Error resetting database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()

