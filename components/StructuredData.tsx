'use client'

import { useEffect, useState } from 'react'
import { Vehicle } from '@/types/vehicle'
import { useVehicleStore } from '@/store/VehicleStore'
import type { Country } from '@prisma/client'

/**
 * JSON-LD structured data for SEO
 * Helps search engines understand vehicle data
 */

const getCountryName = (country: Country): string => {
  const names: Record<Country, string> = {
    SG: 'Singapore',
    MY: 'Malaysia',
    ID: 'Indonesia',
    PH: 'Philippines',
    TH: 'Thailand',
    VN: 'Vietnam',
  }
  return names[country] || country
}

const getCurrencyForCountry = (country: Country): string => {
  const currencies: Record<Country, string> = {
    SG: 'SGD',
    MY: 'MYR',
    ID: 'IDR',
    PH: 'PHP',
    TH: 'THB',
    VN: 'VND',
  }
  return currencies[country] || 'USD'
}

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
    description: `Electric vehicle available in ${getCountryName(vehicle.country)}. Range: ${vehicle.rangeKm || 'N/A'}km, Power: ${vehicle.powerRatingKw || 'N/A'}kW, Efficiency: ${vehicle.efficiencyKwhPer100km || 'N/A'}kWh/100km`,
    brand: {
      '@type': 'Brand',
      name: vehicle.name.split(' ')[0], // Extract manufacturer
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: getCurrencyForCountry(vehicle.country),
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
      name: 'battery.mom',
      description: 'Compare electric vehicles available across Southeast Asia',
      url: typeof window !== 'undefined' ? window.location.origin : '',
    }

    // Website structured data
    const websiteData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'battery.mom',
      description: 'Compare electric vehicles available across Southeast Asia',
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

