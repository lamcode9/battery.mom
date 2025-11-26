# API Ninjas Metrics Integration Summary

## Overview
This document summarizes which metrics from the comparison table can be pulled from API Ninjas Electric Vehicle API and their current integration status.

## Comparison Table Metrics vs API Ninjas

### ✅ Currently Using from API Ninjas

| Comparison Table Row | API Ninjas Field | Status | Notes |
|---------------------|------------------|--------|-------|
| 1. Power (kW) | `total_power` | ✅ Active | Extracted and stored |
| 2. Power (hp) | Calculated from kW | ✅ Active | Formula: `kW × 1.341` |
| 4. Acceleration (0-100 km/h) | `acceleration_0_100_kmh` | ✅ Active | Extracted and stored |
| 5. Range - WLTP (km) | `electric_range` | ✅ Active | Assumed to be WLTP |
| 6. Range - EPA (km) | Calculated from WLTP | ✅ Active | Formula: `WLTP × 0.75` |
| 7. Efficiency (kWh/100km) | `energy_consumption_combined_mild_weather` | ✅ Active | Converted from Wh/km |
| 10. Battery Capacity (kWh) | `battery_useable_capacity` / `battery_capacity` | ✅ Active | Uses useable if available |
| 11. DC Fast Charge 0-80% (min) | `charge_power_10p_80p` / `charge_power_max` | ✅ Active | Calculated from charging power |
| 12. Charging Capabilities | `charge_power_10p_80p` / `charge_power_max` | ✅ Active | Formatted as string |

### ✅ Just Added (New Integration)

| Comparison Table Row | API Ninjas Field | Status | Notes |
|---------------------|------------------|--------|-------|
| 13. Vehicle Weight (kg) | `gross_vehicle_weight` | ✅ **NEW** | Extracted, converted to curb weight (gross - 200kg) |

### ❌ Not Available from API Ninjas

| Comparison Table Row | Reason | Current Source |
|---------------------|--------|----------------|
| 3. Torque (Nm) | Not provided by API | Shows "N/A" |
| 8. Cost / km | Calculated field | Calculated from battery capacity, electricity rate, and range |
| 9. Cost / Full Charge | Calculated field | Calculated from battery capacity and electricity rate |
| 14. Battery Weight (kg) | Not provided by API | Estimated from battery capacity (6.5 kg/kWh ratio) |
| 15. Battery Weight % | Calculated field | Calculated from battery weight / vehicle weight |
| 16. Battery Manufacturer | Not provided by API | Inferred from vehicle name |
| 17. Battery Technology | Not provided by API | Inferred from vehicle name |
| 18. Battery Warranty | Not provided by API | Shows "N/A" |
| 19. OTA Updates | Not provided by API | Shows "N/A" |
| 20. Technology Features | Not provided by API | Shows "N/A" |

## Implementation Details

### Vehicle Weight Integration (NEW)

**API Field**: `gross_vehicle_weight`
- **Format**: May be provided as "1850 kg" or "1850"
- **Extraction**: Parsed using regex pattern `/([0-9.]+)\s*(?:kg|kilograms?)?/i`
- **Conversion**: Gross vehicle weight includes passengers/cargo (~200kg), so we subtract 200kg to approximate curb weight
- **Fallback**: If not available from API, falls back to estimation based on battery weight and power rating

### Code Changes Made

1. **`lib/data-fetchers/ev-api.ts`**:
   - Added `grossVehicleWeightKg?: number` to `TransformedVehicle` interface
   - Added extraction logic for `gross_vehicle_weight` field

2. **`lib/data-fetchers/vehicle-transformer.ts`**:
   - Added `grossVehicleWeightKg?: number` to `VehicleInput` interface
   - Updated `transformAndSaveVehicle` to use API weight if available, otherwise estimate

3. **`app/api/cron/update-vehicles/route.ts`**:
   - Updated both SG and MY vehicle processing to pass `grossVehicleWeightKg` from API data

## API Ninjas Fields Available (Not Currently Used)

The following fields are available from API Ninjas but not currently used:
- `car_body` - Vehicle body type (e.g., "SUV", "Sedan")
  - **Potential Use**: Could be used for filtering or categorization
  - **Status**: Available but not extracted

## Summary

**Total Metrics in Comparison Table**: 20 rows
**Available from API Ninjas**: 9 metrics (45%)
**Calculated/Estimated**: 7 metrics (35%)
**Not Available**: 4 metrics (20%)

## Next Steps

1. ✅ **Vehicle Weight** - Now integrated from API
2. ⏳ **Car Body Type** - Could be added for filtering/categorization (low priority)
3. ⏳ **Torque** - Not available from API, would need alternative source
4. ⏳ **Battery Warranty, OTA Updates, Technology Features** - Would require manufacturer-specific scraping or manual data entry

## Testing

After deployment, verify:
1. Vehicle weight data is being extracted from API responses
2. Weight values are reasonable (typically 1500-2500 kg for EVs)
3. Fallback to estimation works when API doesn't provide weight
4. Comparison table displays vehicle weight correctly

