import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evcompare-sea.vercel.app'
  
  // Fetch all available vehicles for dynamic sitemap entries
  const vehicles = await prisma.vehicle.findMany({
    where: { isAvailable: true },
    select: { id: true, updatedAt: true },
  })

  const vehicleUrls = vehicles.map((vehicle) => ({
    url: `${baseUrl}/vehicles/${vehicle.id}`,
    lastModified: vehicle.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
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
    ...vehicleUrls,
  ]
}

