import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health check endpoint for cron job monitoring
 * Returns the last cron run status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get the most recent cron run
    const lastCronRun = await prisma.auditLog.findFirst({
      where: {
        action: {
          in: ['CRON_RUN', 'CRON_ERROR'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get the most recent error
    const lastError = await prisma.auditLog.findFirst({
      where: {
        action: 'CRON_ERROR',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get vehicle statistics
    const totalVehicles = await prisma.vehicle.count()
    const availableVehicles = await prisma.vehicle.count({
      where: { isAvailable: true },
    })
    const recentUpdates = await prisma.vehicle.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    const status = {
      healthy: lastCronRun?.action === 'CRON_RUN',
      lastRun: lastCronRun
        ? {
            timestamp: lastCronRun.createdAt.toISOString(),
            action: lastCronRun.action,
            changes: lastCronRun.changes,
          }
        : null,
      lastError: lastError
        ? {
            timestamp: lastError.createdAt.toISOString(),
            error: lastError.changes,
          }
        : null,
      statistics: {
        totalVehicles,
        availableVehicles,
        recentlyUpdated: recentUpdates,
      },
      nextScheduledRun: getNextCronRunTime(),
    }

    return NextResponse.json(status, {
      status: status.healthy ? 200 : 503,
    })
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate the next cron run time (2 AM UTC daily)
 */
function getNextCronRunTime(): string {
  const now = new Date()
  const nextRun = new Date()
  nextRun.setUTCHours(2, 0, 0, 0)

  // If it's already past 2 AM today, schedule for tomorrow
  if (now.getUTCHours() >= 2) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1)
  }

  return nextRun.toISOString()
}

