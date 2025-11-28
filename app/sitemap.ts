import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://battery.mom'
  
  // Base sitemap entries (always included)
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Try to fetch vehicles from database, but handle case where DATABASE_URL is not available during build
  try {
    if (!process.env.DATABASE_URL) {
      // During build time, DATABASE_URL might not be available
      // Return base sitemap without vehicle entries
      return baseEntries
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { isAvailable: true },
      select: { id: true, updatedAt: true },
      take: 1000, // Limit to prevent sitemap from being too large
    })

    const vehicleUrls = vehicles.map((vehicle) => ({
      url: `${baseUrl}/vehicles/${vehicle.id}`,
      lastModified: vehicle.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...baseEntries, ...vehicleUrls]
  } catch (error) {
    // If database query fails (e.g., during build), return base sitemap
    console.warn('Could not fetch vehicles for sitemap:', error instanceof Error ? error.message : 'Unknown error')
    return baseEntries
  }
}

