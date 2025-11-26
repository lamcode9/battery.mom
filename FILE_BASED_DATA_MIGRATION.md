# File-Based Data Migration Guide

## Overview

The system has been migrated from API Ninjas to a file-based data source. All vehicle data is now stored in `data/vehicles-data.json` and read from there instead of making API calls.

## What Changed

### 1. New Files Created

- **`data/vehicles-data.json`** - Main data file (populate this with your vehicle data)
- **`data/vehicles-template.json`** - Template showing the structure
- **`data/VEHICLE_DATA_FORMAT.md`** - Complete documentation of all fields
- **`data/README.md`** - Quick start guide
- **`lib/data-fetchers/file-data.ts`** - New file reader module

### 2. Files Modified

- **`app/api/cron/update-vehicles/route.ts`** - Now reads from file instead of API
- **`scripts/run-cron.ts`** - Updated to use file-based data
- **`lib/data-fetchers/vehicle-transformer.ts`** - Enhanced to handle all file-based fields

### 3. Files No Longer Used (but kept for reference)

- **`lib/data-fetchers/ev-api.ts`** - API Ninjas integration (kept but not used)

## How It Works

1. **Data Source**: `data/vehicles-data.json` contains all vehicle data in JSON format
2. **File Reader**: `lib/data-fetchers/file-data.ts` reads and validates the JSON file
3. **Transformer**: `lib/data-fetchers/vehicle-transformer.ts` transforms file data to database format
4. **Cron Job**: `app/api/cron/update-vehicles/route.ts` syncs file data to database

## Setup Instructions

### Step 1: Populate the Data File

1. Open `data/vehicles-data.json`
2. Add your vehicle data following the format in `data/vehicles-template.json`
3. See `data/VEHICLE_DATA_FORMAT.md` for complete field documentation

### Step 2: Run the Sync

**Option A: Manual Sync**
```bash
npx tsx scripts/run-cron.ts
```

**Option B: Automatic Sync**
- The Vercel Cron job will automatically sync daily
- Or trigger manually via the cron endpoint

### Step 3: Verify

Check your database to ensure vehicles were created/updated correctly.

## Data File Format

The `vehicles-data.json` file is an array of vehicle objects. Each vehicle must have:

**Required Fields:**
- `name` (string) - Vehicle name
- `country` (string) - "SG" or "MY"
- `isAvailable` (boolean) - Whether vehicle is available

**Optional Fields:**
- All performance metrics (power, acceleration, efficiency, range)
- Battery information (capacity, weight, technology, manufacturer)
- Weight information (curb weight, gross weight)
- Charging information (DC fast charge time, capabilities)
- Pricing (base price, options)

See `data/VEHICLE_DATA_FORMAT.md` for complete details.

## Example Entry

```json
{
  "name": "Tesla Model 3",
  "modelTrim": "2024",
  "country": "SG",
  "powerRatingKw": 283,
  "acceleration0To100Kmh": 4.4,
  "efficiencyKwhPer100km": 13.2,
  "rangeWltpKm": 629,
  "rangeEpaKm": 576,
  "batteryCapacityKwh": 75,
  "batteryWeightKg": 478,
  "curbWeightKg": 1847,
  "batteryWeightPercentage": 25.9,
  "batteryManufacturer": "CATL",
  "batteryTechnology": "LFP",
  "chargingTimeDc0To80Min": 25,
  "chargingCapabilities": "DC Fast Charge: Up to 250kW, AC: 11kW",
  "basePriceLocalCurrency": 75000,
  "optionPrices": [
    {
      "name": "Premium Interior",
      "price": 5000
    }
  ],
  "isAvailable": true
}
```

## Benefits

1. **No API Limits** - No rate limits or API key requirements
2. **Full Control** - You control all data and can add any fields
3. **Offline Capable** - Works without internet connection
4. **Fast** - No API calls, instant data loading
5. **Complete Data** - Can include all fields, not limited by API response
6. **Version Control** - Data file can be tracked in git

## Migration Checklist

- [x] Created file-based data fetcher
- [x] Updated cron job to use file data
- [x] Updated run-cron script
- [x] Enhanced vehicle transformer for all fields
- [x] Created template and documentation files
- [ ] Populate `data/vehicles-data.json` with your vehicle data
- [ ] Test sync by running `npx tsx scripts/run-cron.ts`
- [ ] Verify vehicles appear in database
- [ ] Update Vercel Cron configuration if needed

## Troubleshooting

### File Not Found Error
- Ensure `data/vehicles-data.json` exists
- Check file path is correct (should be in project root `data/` folder)

### Invalid JSON Error
- Validate JSON using a JSON validator
- Check for missing commas, brackets, or quotes

### Missing Required Fields
- Ensure all vehicles have `name`, `country`, and `isAvailable` fields

### Country Validation Error
- Country must be exactly "SG" or "MY" (case-sensitive)

### Battery Technology Error
- Must be one of: "NMC", "LFP", "SolidState", "Other"

## Next Steps

1. Populate `data/vehicles-data.json` with your vehicle data
2. Run the sync script to test
3. Verify data appears correctly in the website
4. Set up daily cron job (if not already configured)

## Support

For questions or issues:
1. Check `data/VEHICLE_DATA_FORMAT.md` for field documentation
2. Review `data/vehicles-template.json` for examples
3. Check console logs when running the sync script

