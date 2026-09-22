import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import VehicleComparisonClient from './page-client'
import type { Vehicle } from '@/types/vehicle'

interface PageProps {
  params: Promise<{
    id1: string
    id2: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id1, id2 } = await params

  try {
    const [vehicle1, vehicle2] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: id1 } }),
      prisma.vehicle.findUnique({ where: { id: id2 } }),
    ])

    if (!vehicle1 || !vehicle2) {
      return {
        title: 'Vehicle comparison, battery.mom',
      }
    }

    const title = `${vehicle1.name}${vehicle1.modelTrim ? ` ${vehicle1.modelTrim}` : ''} vs ${vehicle2.name}${vehicle2.modelTrim ? ` ${vehicle2.modelTrim}` : ''}, battery.mom`
    const description = `Compare ${vehicle1.name} vs ${vehicle2.name}: ${vehicle1.rangeKm || vehicle1.rangeWltpKm || 'N/A'}km vs ${vehicle2.rangeKm || vehicle2.rangeWltpKm || 'N/A'}km range, ${vehicle1.efficiencyKwhPer100km || 'N/A'} vs ${vehicle2.efficiencyKwhPer100km || 'N/A'} kWh/100km efficiency, ${vehicle1.basePriceLocalCurrency || 'N/A'} vs ${vehicle2.basePriceLocalCurrency || 'N/A'} pricing.`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
    }
  } catch (error) {
    return {
      title: 'Vehicle comparison, battery.mom',
    }
  }
}

export default async function VehicleComparisonPage({ params }: PageProps) {
  const { id1, id2 } = await params

  try {
    const [vehicle1, vehicle2] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: id1 } }),
      prisma.vehicle.findUnique({ where: { id: id2 } }),
    ])

    if (!vehicle1 || !vehicle2) {
      notFound()
    }

    // Don't allow comparing the same vehicle
    if (id1 === id2) {
      notFound()
    }

    return (
      <VehicleComparisonClient
        vehicle1={vehicle1 as unknown as Vehicle}
        vehicle2={vehicle2 as unknown as Vehicle}
      />
    )
  } catch (error) {
    console.error('Error fetching vehicles for comparison:', error)
    notFound()
  }
}
