'use client'

import { useEffect, useState } from 'react'
import { Vehicle } from '@/types/vehicle'
import { useVehicleStore } from '@/store/VehicleStore'

/**
 * JSON-LD structured data for SEO
 * Helps search engines understand vehicle data
 */
export default function StructuredData() {
  const { vehicles } = useVehicleStore()
  const [structuredData, setStructuredData] = useState<string>('')

  useEffect(() => {
    if (vehicles.length === 0) return

    // Generate structured data for all vehicles
    const vehicleStructuredData = vehicles.map((vehicle: Vehicle) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicle.name} ${vehicle.modelTrim || ''}`.trim(),
    description: `Electric vehicle available in ${vehicle.country === 'SG' ? 'Singapore' : 'Malaysia'}. Range: ${vehicle.rangeKm || 'N/A'}km, Power: ${vehicle.powerRatingKw || 'N/A'}kW, Efficiency: ${vehicle.efficiencyKwhPer100km || 'N/A'}kWh/100km`,
    brand: {
      '@type': 'Brand',
      name: vehicle.name.split(' ')[0], // Extract manufacturer
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: vehicle.country === 'SG' ? 'SGD' : 'MYR',
      price: vehicle.basePriceLocalCurrency || 0,
      availability: vehicle.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    additionalProperty: [
      ...(vehicle.batteryWeightKg ? [{
        '@type': 'PropertyValue',
        name: 'Battery Weight',
        value: `${vehicle.batteryWeightKg} kg`,
      }] : []),
      ...(vehicle.rangeKm ? [{
        '@type': 'PropertyValue',
        name: 'Range',
        value: `${vehicle.rangeKm} km`,
      }] : []),
      ...(vehicle.powerRatingKw ? [{
        '@type': 'PropertyValue',
        name: 'Power Rating',
        value: `${vehicle.powerRatingKw} kW`,
      }] : []),
      ...(vehicle.efficiencyKwhPer100km ? [{
        '@type': 'PropertyValue',
        name: 'Efficiency',
        value: `${vehicle.efficiencyKwhPer100km} kWh/100km`,
      }] : []),
      ...(vehicle.batteryTechnology ? [{
        '@type': 'PropertyValue',
        name: 'Battery Technology',
        value: vehicle.batteryTechnology,
      }] : []),
    ],
  }))

    // Organization structured data
    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'EVCompare SEA',
      description: 'Compare electric vehicles available in Singapore and Malaysia',
      url: typeof window !== 'undefined' ? window.location.origin : '',
    }

    // Website structured data
    const websiteData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'EVCompare SEA',
      description: 'Compare electric vehicles available in Singapore and Malaysia',
      url: typeof window !== 'undefined' ? window.location.origin : '',
    }

    const data = {
      '@context': 'https://schema.org',
      '@graph': [organizationData, websiteData, ...vehicleStructuredData],
    }

    setStructuredData(JSON.stringify(data))
  }, [vehicles])

  if (!structuredData) {
    return null
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: structuredData,
      }}
    />
  )
}

