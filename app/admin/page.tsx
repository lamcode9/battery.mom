import type { Metadata } from 'next'
import AdminDashboardClient from './page-client'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Admin dashboard, battery.mom',
  description: 'Internal data review dashboard.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function getAdminStats() {
  const [
    totalVehicles,
    availableVehicles,
    countryCounts,
    pendingCorrections,
    recentCorrections,
    recentAuditLogs,
    staleVehicles,
    priceSnapshotCount,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { isAvailable: true } }),
    prisma.vehicle.groupBy({
      by: ['country'],
      _count: { _all: true },
      where: { isAvailable: true },
    }),
    prisma.correction.count({ where: { status: 'pending' } }),
    prisma.correction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.vehicle.count({
      where: {
        isAvailable: true,
        updatedAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // >90 days old
        },
      },
    }),
    prisma.priceSnapshot.count(),
  ])

  // Data freshness breakdown
  const now = Date.now()
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  const sixtyDays = 60 * 24 * 60 * 60 * 1000
  const ninetyDays = 90 * 24 * 60 * 60 * 1000

  const [fresh, aging, stale] = await Promise.all([
    prisma.vehicle.count({
      where: {
        isAvailable: true,
        updatedAt: { gte: new Date(now - thirtyDays) },
      },
    }),
    prisma.vehicle.count({
      where: {
        isAvailable: true,
        updatedAt: {
          gte: new Date(now - ninetyDays),
          lt: new Date(now - thirtyDays),
        },
      },
    }),
    prisma.vehicle.count({
      where: {
        isAvailable: true,
        updatedAt: { lt: new Date(now - ninetyDays) },
      },
    }),
  ])

  return {
    totalVehicles,
    availableVehicles,
    countryCounts: countryCounts.map((c) => ({
      country: c.country,
      count: c._count._all,
    })),
    pendingCorrections,
    recentCorrections: recentCorrections.map((c) => ({
      id: c.id,
      type: c.type,
      country: c.country,
      itemName: c.itemName,
      field: c.field,
      currentValue: c.currentValue,
      suggestedValue: c.suggestedValue,
      source: c.source,
      email: c.email,
      notes: c.notes,
      status: c.status,
      reviewedAt: c.reviewedAt?.toISOString() ?? null,
      reviewedBy: c.reviewedBy,
      createdAt: c.createdAt.toISOString(),
    })),
    recentAuditLogs: recentAuditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      vehicleId: l.vehicleId,
      vehicleName: l.vehicleName,
      changes: l.changes,
      createdAt: l.createdAt.toISOString(),
    })),
    staleVehicles,
    priceSnapshotCount,
    freshness: { fresh, aging, stale },
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats()
  return <AdminDashboardClient stats={stats} />
}
