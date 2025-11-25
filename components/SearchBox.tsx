'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Fuse from 'fuse.js'
import { useVehicleStore } from '@/store/VehicleStore'
import { Vehicle } from '@/types/vehicle'
import { debounce } from 'lodash'
import Image from 'next/image'

export default function SearchBox() {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<Vehicle[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { vehicles, selectedVehicles, addVehicle, isVehicleSelected, selectedCountry } = useVehicleStore()
  const searchRef = useRef<HTMLDivElement>(null)

  // Filter vehicles by country
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => v.country === selectedCountry && v.isAvailable)
  }, [vehicles, selectedCountry])

  // Setup Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(filteredVehicles, {
      keys: ['name', 'modelTrim'],
      threshold: 0.3,
      includeScore: true,
    })
  }, [filteredVehicles])

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        if (!term.trim()) {
          setSuggestions([])
          return
        }

        const results = fuse.search(term)
        const matched = results.map(result => result.item).slice(0, 5)
        setSuggestions(matched)
      }, 200),
    [fuse]
  )

  useEffect(() => {
    debouncedSearch(searchTerm)
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchTerm, debouncedSearch])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (vehicle: Vehicle) => {
    if (!isVehicleSelected(vehicle.id) && selectedVehicles.length < 4) {
      addVehicle(vehicle)
      setSearchTerm('')
      setShowSuggestions(false)
    }
  }

  const formatPrice = (price: number, country: 'SG' | 'MY') => {
    const currency = country === 'SG' ? 'SGD' : 'MYR'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search EVs like Tesla Model 3, BYD Atto 3..."
          className="w-full px-4 py-3 pl-12 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ev-primary focus:border-transparent"
          aria-label="Search for electric vehicles"
          aria-autocomplete="list"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions.map((vehicle) => {
            const isSelected = isVehicleSelected(vehicle.id)
            const isDisabled = selectedVehicles.length >= 4 && !isSelected

            return (
              <button
                key={vehicle.id}
                onClick={() => handleSelect(vehicle)}
                disabled={isDisabled || isSelected}
                className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left ${
                  isSelected || isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                aria-label={`Select ${vehicle.name} ${vehicle.modelTrim}`}
              >
                <div className="relative w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                  <Image
                    src={vehicle.imageUrl}
                    alt={`${vehicle.name} ${vehicle.modelTrim}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {vehicle.name}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {vehicle.modelTrim}
                  </div>
                  <div className="text-sm font-medium text-ev-primary mt-1">
                    {formatPrice(vehicle.onTheRoadPriceLocalCurrency, vehicle.country)}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-xs bg-ev-primary text-white px-2 py-1 rounded">
                    Selected
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {showSuggestions && searchTerm && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No vehicles found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  )
}

