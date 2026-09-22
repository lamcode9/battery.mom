import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import VehicleDetailClient from './page-client'
import type { Vehicle } from '@/types/vehicle'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    })

    if (!vehicle) {
      return {
        title: 'Vehicle not found, battery.mom',
      }
    }

    const title = `${vehicle.name}${vehicle.modelTrim ? ` ${vehicle.modelTrim}` : ''}, battery.mom`
    const description = `${vehicle.name} specs: ${vehicle.rangeKm || vehicle.rangeWltpKm || 'N/A'} km range, ${vehicle.efficiencyKwhPer100km || 'N/A'} kWh/100km efficiency, ${vehicle.batteryCapacityKwh || 'N/A'} kWh battery. Local pricing and charging details for ${vehicle.country}.`

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
      title: 'Vehicle details, battery.mom',
    }
  }
}



export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    })

    if (!vehicle) {
      notFound()
    }

    return <VehicleDetailClient vehicle={vehicle as unknown as Vehicle} />
  } catch (error) {
    console.error('Error fetching vehicle:', error)
    notFound()
  }
}
