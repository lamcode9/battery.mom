# Vehicle Data File Format

This document describes the format for the `vehicles-data.json` file used to populate vehicle data in the database.

## File Location
- **Template**: `data/vehicles-template.json`
- **Data File**: `data/vehicles-data.json`

## Required Fields

### Basic Information
- **name** (string, required): Full vehicle name (e.g., "Tesla Model 3")
- **modelTrim** (string, optional): Model year or trim variant (e.g., "2024", "Performance")
- **country** (string, required): Country code - must be "SG" or "MY"
- **isAvailable** (boolean, required): Whether the vehicle is currently available

### Performance Metrics
- **powerRatingKw** (number, optional): Power output in kilowatts
- **torqueNm** (number, optional): Torque in Newton meters (Nm)
- **acceleration0To100Kmh** (number, optional): 0-100 km/h acceleration time in seconds
- **efficiencyKwhPer100km** (number, optional): Energy consumption in kWh per 100km

### Range
- **rangeWltpKm** (number, optional): WLTP range in kilometers
- **rangeEpaKm** (number, optional): EPA range in kilometers
- **rangeKm** (number, optional): Legacy range field (use rangeWltpKm if available)

### Battery Information
- **batteryCapacityKwh** (number, optional): Battery capacity in kilowatt-hours
- **batteryWeightKg** (number, optional): Battery weight in kilograms
- **batteryWeightPercentage** (number, optional): Battery weight as percentage of curb weight
- **batteryManufacturer** (string, optional): Battery manufacturer name (e.g., "CATL", "BYD", "LG Chem")
- **batteryTechnology** (string, optional): Battery technology type - must be one of:
  - "NMC" (Nickel Manganese Cobalt)
  - "LFP" (Lithium Iron Phosphate)
  - "SolidState" (Solid State)
  - "Other"
- **batteryWarranty** (string, optional): Battery warranty description (e.g., "8 years / 160,000 km")

### Weight Information
- **curbWeightKg** (number, optional): Curb weight in kilograms (vehicle weight without passengers/cargo)
- **grossVehicleWeightKg** (number, optional): Gross vehicle weight in kilograms (maximum loaded weight)

### Charging
- **chargingTimeDc0To80Min** (number, optional): DC fast charging time from 0-80% in minutes
- **chargingCapabilities** (string, optional): Description of charging capabilities (e.g., "DC Fast Charge: Up to 250kW, AC: 11kW")

### Technology
- **technologyFeatures** (string, optional): Technology features description (e.g., "Autopilot, Sentry Mode, Dog Mode, Over-the-Air Updates")

### Pricing
- **basePriceLocalCurrency** (number, optional): Base price in local currency (SGD for SG, MYR for MY)
- **optionPrices** (array, optional): Array of optional equipment with prices
  ```json
  [
    {
      "name": "Premium Interior",
      "price": 5000
    }
  ]
  ```

## Example Entry

```json
{
  "name": "Tesla Model 3",
  "modelTrim": "2024",
  "country": "SG",
  "powerRatingKw": 283,
  "torqueNm": 450,
  "acceleration0To100Kmh": 4.4,
  "efficiencyKwhPer100km": 13.2,
  "rangeWltpKm": 629,
  "rangeEpaKm": 576,
  "rangeKm": 629,
  "batteryCapacityKwh": 75,
  "batteryWeightKg": 478,
  "curbWeightKg": 1847,
  "batteryWeightPercentage": 25.9,
  "batteryManufacturer": "CATL",
  "batteryTechnology": "LFP",
  "batteryWarranty": "8 years / 160,000 km",
  "chargingTimeDc0To80Min": 25,
  "chargingCapabilities": "DC Fast Charge: Up to 250kW, AC: 11kW",
  "technologyFeatures": "Autopilot, Sentry Mode, Dog Mode, Over-the-Air Updates",
  "basePriceLocalCurrency": 75000,
  "optionPrices": [
    {
      "name": "Premium Interior",
      "price": 5000
    },
    {
      "name": "Full Self-Driving",
      "price": 12000
    }
  ],
  "isAvailable": true,
  "grossVehicleWeightKg": 2047
}
```

## Notes

1. **All fields except `name` and `country` are optional** - use `null` or omit the field if data is not available
2. **Country codes**: Must be exactly "SG" or "MY" (case-sensitive)
3. **Battery Technology**: Must match one of the enum values exactly
4. **Arrays**: `optionPrices` should be an empty array `[]` if no data is available
5. **Numbers**: Use integers for whole numbers (e.g., `25` for minutes), decimals for precise values (e.g., `4.4` for seconds)
6. **File Format**: The file must be valid JSON - use a JSON validator if you encounter errors

## Data Sources

You can populate this data from:
- Official manufacturer websites
- Automotive review sites
- Government vehicle registration databases
- EV comparison websites
- Manufacturer press releases and specifications

## Validation

Before uploading, ensure:
- ✅ JSON is valid (use a JSON validator)
- ✅ All required fields (`name`, `country`, `isAvailable`) are present
- ✅ Country codes are "SG" or "MY"
- ✅ Battery technology values match enum values
- ✅ All numbers are valid (not strings)
- ✅ Arrays are properly formatted

