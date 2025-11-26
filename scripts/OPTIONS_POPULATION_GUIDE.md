# Vehicle Options Population Guide

This guide explains how to populate missing vehicle options in the database using the provided scripts.

## Overview

The database currently has **196 vehicles (71%) without options**. These scripts help you:
1. Identify vehicles missing options
2. Generate templates with suggested options
3. Apply verified options to the database

## Scripts

### 1. `populate-missing-options.ts`
Generates a template file with suggested options for all vehicles without options.

**Usage:**
```bash
npx tsx scripts/populate-missing-options.ts
```

**Output:**
- `data/missing-options-template.json` - JSON template with all vehicles and suggested options
- `data/missing-options-summary.txt` - Human-readable summary report

**What it does:**
- Identifies all vehicles without options
- Provides manufacturer website URLs
- Suggests common options based on vehicle brand and type
- Includes estimated pricing (where available)

### 2. `apply-options-from-template.ts`
Applies verified options from the template to `vehicles-data.json`.

**Usage:**
```bash
npx tsx scripts/apply-options-from-template.ts
```

**What it does:**
- Reads the template file
- Finds matching vehicles in `vehicles-data.json`
- Updates vehicles with verified options (where price is not null)
- Creates a backup before making changes
- Merges with existing options (avoids duplicates)

### 3. `analyze-vehicle-options.ts`
Analyzes the current state of options in the database.

**Usage:**
```bash
npx tsx scripts/analyze-vehicle-options.ts
```

**Output:**
- Summary statistics
- List of vehicles without options
- List of vehicles with partial options
- Top vehicles by options count

## Workflow

### Step 1: Generate Template
```bash
npx tsx scripts/populate-missing-options.ts
```

This creates `data/missing-options-template.json` with suggested options.

### Step 2: Review and Verify Options
1. Open `data/missing-options-template.json`
2. For each vehicle, visit the manufacturer website URL provided
3. Verify the actual options and pricing for that specific trim and country
4. Update the `suggestedOptions` array:
   - Set `price` to the actual price (or `null` if unknown)
   - Update `source` with where you found the information
   - Add any additional options you find

**Example:**
```json
{
  "name": "Tesla Model 3",
  "modelTrim": "RWD",
  "country": "SG",
  "suggestedOptions": [
    {
      "name": "Full Self-Driving",
      "price": 12000,
      "source": "Tesla Singapore website - verified 2024-11-26"
    },
    {
      "name": "Enhanced Autopilot",
      "price": 5000,
      "source": "Tesla Singapore website - verified 2024-11-26"
    }
  ]
}
```

### Step 3: Apply Verified Options
Once you've verified options in the template:

```bash
npx tsx scripts/apply-options-from-template.ts
```

This will:
- Only apply options where `price` is not `null` (verified)
- Create a backup of `vehicles-data.json`
- Update the vehicles with new options
- Merge with existing options (no duplicates)

### Step 4: Sync to Database
After applying options:

```bash
npx tsx scripts/run-cron.ts
```

This syncs the updated data from `vehicles-data.json` to the database.

## Tips

### Finding Options on Manufacturer Websites

1. **Tesla**: 
   - Visit `tesla.com/en_sg` or `tesla.com/en_my`
   - Use the "Design" or "Order" page for each model
   - Options are usually listed under "Add-ons" or "Upgrades"

2. **BMW**:
   - Visit `bmw.com.sg` or `bmw.com.my`
   - Use the configurator tool
   - Options are typically under "Accessories" or "Packages"

3. **Porsche**:
   - Visit `porsche.com/singapore` or `porsche.com/malaysia`
   - Use the configurator
   - Options are listed with detailed pricing

4. **Audi**:
   - Visit `audi.com.sg` or `audi.com.my`
   - Check the "Build & Price" section
   - Options are usually categorized by type

5. **BYD/Hyundai/Kia**:
   - Visit local dealer websites
   - Check official brand websites
   - Options may be listed in brochures or spec sheets

### Common Options by Brand

**Tesla:**
- Full Self-Driving (FSD)
- Enhanced Autopilot
- 7-Seater Option (Model Y)
- Tow Hitch
- Wheel upgrades
- Premium Interior

**BMW:**
- M Sport Package
- Premium Package
- Technology Package
- Adaptive M Suspension
- Comfort Package

**Porsche:**
- Adaptive Air Suspension
- Porsche Ceramic Composite Brake (PCCB)
- Rear-axle steering
- BOSE Sound System
- Passenger Display

**Audi:**
- S Line Package
- Technology Package
- Comfort Package
- Sport Package

**BYD:**
- Sunroof
- 360 Camera
- Premium Audio
- Extended Range Battery

## Priority Vehicles

Based on popularity and market presence, consider prioritizing:

1. **Tesla Models** (highest priority)
   - Model 3 (all trims)
   - Model Y (all trims)

2. **Premium Brands**
   - Porsche (Macan Electric, Taycan)
   - BMW (i4, iX series)
   - Audi (e-tron series)
   - Mercedes (EQC, EQE, EQS)

3. **Popular Mass Market**
   - BYD (Atto 3, Dolphin, Seal)
   - Hyundai Ioniq 5/6
   - Kia EV6

## Verification Checklist

Before applying options, verify:
- [ ] Option name matches manufacturer's official name
- [ ] Price is accurate for the specific country
- [ ] Price is for the correct trim level
- [ ] Option is actually available (not discontinued)
- [ ] Source URL is documented

## Troubleshooting

**Template not found:**
- Run `populate-missing-options.ts` first

**Vehicles not found when applying:**
- Check that vehicle name, trim, and country match exactly
- Verify the vehicle exists in `vehicles-data.json`

**Options not appearing after sync:**
- Check that options have valid pricing (not null)
- Verify JSON syntax is correct
- Check database sync logs for errors

## Files Generated

- `data/missing-options-template.json` - Template with suggested options
- `data/missing-options-summary.txt` - Human-readable summary
- `data/vehicles-data.json.backup.*` - Automatic backups when applying options

## Next Steps

1. Start with high-priority vehicles (Tesla, premium brands)
2. Verify options from official manufacturer websites
3. Update template with verified data
4. Apply options in batches (e.g., by brand)
5. Sync to database after each batch

