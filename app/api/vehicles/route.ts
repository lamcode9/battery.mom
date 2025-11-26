import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Country } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const country = searchParams.get('country') as Country | null
    const available = searchParams.get('available')
    
    const where: any = {}
    
    if (country) {
      where.country = country
    }
    
    if (available !== null) {
      where.isAvailable = available === 'true'
    }
    
    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    })
    
    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to fetch vehicles',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

