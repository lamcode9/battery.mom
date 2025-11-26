# Vehicle Data Directory

This directory contains the vehicle data files used to populate the database.

## Files

- **`vehicles-data.json`** - Main data file containing all vehicle information
- **`vehicles-template.json`** - Template file showing the structure and example data
- **`VEHICLE_DATA_FORMAT.md`** - Detailed documentation of the data format

## Usage

1. **Edit `vehicles-data.json`** to add or update vehicle data
2. **Run the cron job** to sync data to the database:
   ```bash
   npx tsx scripts/run-cron.ts
   ```
3. **Or wait for automatic sync** - The cron job runs daily via Vercel Cron

## File Format

See `VEHICLE_DATA_FORMAT.md` for complete documentation of all fields.

## Quick Start

1. Copy `vehicles-template.json` to `vehicles-data.json` (if not already done)
2. Add your vehicle data following the template structure
3. Ensure all required fields are present:
   - `name` (string, required)
   - `country` (string, required: "SG" or "MY")
   - `isAvailable` (boolean, required)
4. All other fields are optional - use `null` or omit if data is not available

## Validation

Before running the cron job, ensure:
- ✅ JSON is valid (use a JSON validator)
- ✅ All required fields are present
- ✅ Country codes are "SG" or "MY"
- ✅ Battery technology values match enum values (if provided)
- ✅ All numbers are valid (not strings)

## Notes

- The file is read on each cron job run
- Changes to the file will be reflected in the database on the next sync
- The cron job will create new vehicles or update existing ones based on `name` and `country`

