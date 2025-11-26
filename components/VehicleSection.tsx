'use client'

import { useEffect, useState } from 'react'
import { useVehicleStore } from '@/store/VehicleStore'
import VehicleCard from './VehicleCard'
import { VehicleCardSkeleton } from './LoadingSkeleton'

export default function VehicleSection() {
  const { selectedVehicles, vehicles, setVehicles, selectedCountry } = useVehicleStore()
  const [isLoading, setIsLoading] = useState(true)

  // Fetch vehicles on mount and when country changes
  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/vehicles?country=${selectedCountry}&available=true`)
        if (response.ok) {
          const data = await response.json()
          setVehicles(data)
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVehicles()
  }, [selectedCountry, setVehicles])

  if (selectedVehicles.length === 0) {
    return (
      <div className="p-8">
        <p className="text-gray-600 text-center">
            Use the search box above to find and compare electric vehicles available in{' '}
            {selectedCountry === 'SG' ? 'Singapore' : 'Malaysia'}.
          </p>
        </div>
    )
  }

  if (isLoading && selectedVehicles.length === 0) {
    return (
      <div className="space-y-6">
        <VehicleCardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {selectedVehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
      
      {selectedVehicles.length < 4 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 font-medium mb-2">
            Add up to {4 - selectedVehicles.length} more vehicle{4 - selectedVehicles.length > 1 ? 's' : ''} for side-by-side comparison
          </p>
          <p className="text-sm text-blue-600">
            Use the search box above to find more EVs
          </p>
        </div>
      )}
    </div>
  )
}

