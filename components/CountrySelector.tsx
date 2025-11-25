'use client'

import { useEffect } from 'react'
import { useVehicleStore } from '@/store/VehicleStore'
import * as Select from '@radix-ui/react-select'

export default function CountrySelector() {
  const { selectedCountry, setSelectedCountry } = useVehicleStore()

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="country-select" className="text-sm font-medium text-gray-700">
        Country:
      </label>
      <Select.Root value={selectedCountry} onValueChange={(value: 'SG' | 'MY') => setSelectedCountry(value)}>
        <Select.Trigger
          id="country-select"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ev-primary focus:ring-offset-2"
          aria-label="Select country"
        >
          <Select.Value />
          <Select.Icon className="ml-2">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M4 6H11L7.5 10.5L4 6Z" fill="currentColor" />
            </svg>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200">
            <Select.Viewport className="p-1">
              <Select.Item
                value="SG"
                className="relative flex items-center px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-ev-primary/10 focus:bg-ev-primary/10 focus:outline-none cursor-pointer"
              >
                <Select.ItemText>🇸🇬 Singapore</Select.ItemText>
              </Select.Item>
              <Select.Item
                value="MY"
                className="relative flex items-center px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-ev-primary/10 focus:bg-ev-primary/10 focus:outline-none cursor-pointer"
              >
                <Select.ItemText>🇲🇾 Malaysia</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

