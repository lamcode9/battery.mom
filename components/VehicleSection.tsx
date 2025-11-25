'use client'

import { useEffect } from 'react'
import { useVehicleStore } from '@/store/VehicleStore'
import VehicleCard from './VehicleCard'
import { Vehicle } from '@/types/vehicle'

export default function VehicleSection() {
  const { selectedVehicles, vehicles, setVehicles, selectedCountry } = useVehicleStore()

  // Fetch vehicles on mount and when country changes
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(`/api/vehicles?country=${selectedCountry}&available=true`)
        if (response.ok) {
          const data = await response.json()
          setVehicles(data)
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error)
      }
    }

    fetchVehicles()
  }, [selectedCountry, setVehicles])

  if (selectedVehicles.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
        <div className="max-w-md mx-auto">
          <svg
            className="w-24 h-24 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Pick your first EV to dive in!
          </h2>
          <p className="text-gray-600">
            Use the search box above to find and compare electric vehicles available in{' '}
            {selectedCountry === 'SG' ? 'Singapore' : 'Malaysia'}.
          </p>
        </div>
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

