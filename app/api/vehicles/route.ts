import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const country = searchParams.get('country') as 'SG' | 'MY' | null
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
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}

