'use client'

import { useState } from 'react'
import { useVehicleStore } from '@/store/VehicleStore'
import { Vehicle } from '@/types/vehicle'
import StatsGrid from './StatsGrid'

interface VehicleCardProps {
  vehicle: Vehicle
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const { removeVehicle } = useVehicleStore()

  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const handleToggleOption = (name: string) => {
    setSelectedOptions((prev) =>
      prev.includes(name) ? prev.filter((opt) => opt !== name) : [...prev, name]
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-1">
              {vehicle.name}
            </h2>
            <p className="text-base text-gray-600">{vehicle.modelTrim}</p>
          </div>
          <button
            onClick={() => removeVehicle(vehicle.id)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm font-medium"
            aria-label={`Remove ${vehicle.name} from comparison`}
          >
            Remove
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <StatsGrid
          vehicle={vehicle}
          selectedOptions={selectedOptions}
          onToggleOption={handleToggleOption}
        />
      </div>
    </div>
  )
}

