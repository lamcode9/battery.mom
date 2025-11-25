'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useVehicleStore } from '@/store/VehicleStore'
import { Vehicle } from '@/types/vehicle'
import StatsGrid from './StatsGrid'

interface VehicleCardProps {
  vehicle: Vehicle
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const { removeVehicle } = useVehicleStore()

  const defaultOptionSelection = useMemo(
    () => vehicle.optionPrices.map((option) => option.name),
    [vehicle.optionPrices]
  )
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultOptionSelection)

  const handleToggleOption = (name: string) => {
    setSelectedOptions((prev) =>
      prev.includes(name) ? prev.filter((opt) => opt !== name) : [...prev, name]
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-ev-primary to-ev-secondary p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-24 md:w-48 md:h-32 rounded-lg overflow-hidden bg-white flex-shrink-0">
              <Image
                src={vehicle.imageUrl}
                alt={`${vehicle.name} ${vehicle.modelTrim}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 128px, 192px"
              />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">
                {vehicle.name}
              </h2>
              <p className="text-lg opacity-90">{vehicle.modelTrim}</p>
            </div>
          </div>
          <button
            onClick={() => removeVehicle(vehicle.id)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
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

