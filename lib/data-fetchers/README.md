# Data Fetchers

This directory contains utilities for fetching and transforming EV vehicle data.

## Files

### `ev-api.ts`
Fetches vehicle data from API Ninjas Electric Vehicle API.
- Free tier: 10 requests/day, 1000/month
- Returns standardized vehicle data
- Handles rate limiting and errors

### `scraper.ts`
Web scraping utilities for Singapore and Malaysia car listing sites.
- **SGCarMart**: Singapore EV listings
- **Carlist.my**: Malaysia EV listings
- **Note**: Currently placeholder - implement with proper HTML parsing

### `vehicle-transformer.ts`
Transforms API/scraped data into our database format.
- Generates vehicle IDs
- Infers battery technology and manufacturer
- Estimates missing data (weight, cost, etc.)
- Handles country-specific pricing and rebates

## Usage

```typescript
import { fetchVehiclesFromAPI } from './ev-api'
import { transformAndSaveVehicle } from './vehicle-transformer'

// Fetch from API
const vehicles = await fetchVehiclesFromAPI(process.env.API_NINJAS_KEY)

// Transform and save
for (const vehicle of vehicles) {
  await transformAndSaveVehicle({
    ...vehicle,
    country: 'SG',
  })
}
```

## Data Sources

### Primary: API Ninjas
- **URL**: https://api-ninjas.com/api/electricvehicle
- **Free Tier**: Yes
- **Rate Limit**: 10/day, 1000/month
- **Data Quality**: Good (range, efficiency, power)

### Future: Web Scraping
- **SGCarMart**: https://www.sgcarmart.com
- **Carlist.my**: https://www.carlist.my
- **Purpose**: Get pricing and availability for SG/MY

## Adding New Data Sources

1. Create a new fetcher function in `ev-api.ts` or `scraper.ts`
2. Transform data to match `VehicleInput` interface
3. Use `transformAndSaveVehicle()` to save to database
4. Update cron job to call new fetcher

