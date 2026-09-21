# Data Maintenance Guide — battery.mom

> **Purpose**: This document maps every data file and constant in the project, explains its purpose, and defines the update schedule. Follow this when updating rates, prices, or vehicle data.

---

## Quick Reference — What to Update & When

| Frequency | What | File(s) | Section |
|-----------|------|---------|---------|
| **Monthly** | Petrol prices | `data/rates.ts` → `PETROL_PRICE_PER_LITRE` | All calculators |
| **Quarterly** | Electricity tariffs (residential + commercial + DC) | `data/rates.ts` → `RESIDENTIAL_TARIFF`, `COMMERCIAL_TARIFF`, `DC_FAST_CHARGING_RATE` | All calculators, EV page, BESS pages |
| **Quarterly** | TOU rates, demand charges | `data/rates.ts` → `TOU_RATES`, `DEMAND_CHARGE` | Commercial BESS |
| **Quarterly** | Carbon credit prices, USD exchange rates | `data/rates.ts` → `CARBON_CREDIT_PRICE_USD`, `USD_EXCHANGE_RATE` | ESG Dashboard |
| **Every 6 months** | Solar costs per kWp | `data/rates.ts` → `SOLAR_COST_PER_KWP` | Solar calculators |
| **Annually** | Solar yield, CO₂ grid factors | `data/rates.ts` → `SOLAR_YIELD_PER_KWP_DAY`, `CO2_GRID_FACTOR` | All green calculations |
| **Monthly / as needed** | EV vehicle specs & prices | `data/vehicles-data.json` | EV comparison page |
| **Every 6 months** | BESS product specs & prices | `data/BESS-Home-data.json` | BESS pages |
| **On policy change** | EV incentives | `data/rates.ts` → `EV_INCENTIVE` | EV vs ICE calculator |
| **Quarterly** | Scoreboard adoption metrics | `app/scoreboard/page-client.tsx` → `COUNTRIES` array | Scoreboard page |

---

## File Map — Where Data Lives

### 📊 `data/` — Static Data Files

| File | Contents | Used By | Update Frequency |
|------|----------|---------|------------------|
| `data/rates.ts` | **ALL rates, tariffs, costs, economic constants** — single source of truth | Every calculator, comparison, and BESS page | See table above |
| `data/vehicles-data.json` | 310+ EV specs (6 SEA countries) — name, battery, range, efficiency, price, features | EV page, API, cron job | Monthly |
| `data/BESS-Home-data.json` | 8 home battery products — specs, prices per country | BESS home page | Every 6 months |
| `data/VEHICLE_DATA_FORMAT.md` | Schema documentation for vehicles-data.json | Developer reference | As schema changes |
| `data/DATA-MAINTENANCE.md` | This file | Developer reference | — |

### 🔧 `lib/constants.ts` — Display Constants (Rarely Change)

| Constant | Purpose | Needs Updating? |
|----------|---------|-----------------|
| `COUNTRY_NAMES` | Display names (Singapore, Malaysia, etc.) | No |
| `CURRENCY_BY_COUNTRY` | ISO codes (SGD, MYR, etc.) | No |
| `CURRENCY_SYMBOLS` | Display symbols (S$, RM, etc.) | No |
| `COUNTRY_OPTIONS` | Picker options with flags | No |
| `ELECTRICITY_TARIFF` | ⚠️ **Legacy** — still imported by some components. Will migrate to `data/rates.ts` | See migration plan |
| `CO2_GRID_FACTOR` | ⚠️ **Legacy** — same as above | See migration plan |
| `formatCurrency()` | Currency formatting helper | No |
| `formatCompact()` | Compact number formatting | No |

### 🗄️ `prisma/schema.prisma` — Database Schema

The PostgreSQL database mirrors `vehicles-data.json` and adds:
- `PriceSnapshot` — monthly price history
- `AuditLog` — cron run logs
- `Correction` — user-submitted corrections
- `NewsletterSubscriber` — email signups

**Data flow**: `vehicles-data.json` → cron (`/api/cron/update-vehicles`) → PostgreSQL → API (`/api/vehicles`) → Frontend

### 📝 `content/` — Editorial Content

| File | Contents |
|------|----------|
| `content/articles.ts` | Article metadata (title, date, slug, description) |
| `content/*.tsx` | Full article bodies as React components |

### 🤖 `scripts/` — Data Population Scripts

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `seed.ts` | Bootstrap 5 sample vehicles (one-time) | Initial setup only |
| `run-cron.ts` | Sync JSON → PostgreSQL | Runs automatically via Vercel cron |
| `populate-missing-data.ts` | Fill missing specs from hardcoded lookup | After adding new vehicles |
| `add-missing-battery-capacities.js` | Fill missing battery capacity values | After adding new vehicles |
| `populate-bidirectional-capability.ts` | Set V2L/V2H flags | After adding new vehicles |
| `update-ota-updates.ts` | Sync OTA update field from JSON → DB | After updating JSON |
| `update-wltp-efficiency.ts` | Update efficiency with verified WLTP data | After research |
| `verify-tesla-specs.ts` | Cross-check Tesla specs against tesla.com | Monthly |

### 🔌 `lib/data-fetchers/` — Data Ingestion

| File | Status | Purpose |
|------|--------|---------|
| `file-data.ts` | **Active** | Reads `vehicles-data.json` → internal format |
| `vehicle-transformer.ts` | **Active** | Generates IDs, upserts to PostgreSQL |
| `bess-data.ts` | **Active** | Reads `BESS-Home-data.json` |
| `ev-api.ts` | Dormant | API Ninjas integration (limited free tier) |
| `scraper.ts` | Stub | SGCarMart/Carlist.my scraper (TODO) |
| `options-scraper.ts` | Dormant | Tesla/BYD/Hyundai option price scraper |

---

## How to Update Vehicle Data

1. Open `data/vehicles-data.json`
2. Find the vehicle by `name` + `country`
3. Update fields (price, range, efficiency, etc.)
4. Add new vehicles by copying an existing entry and modifying
5. Run `npx tsx scripts/run-cron.ts` to sync to database
6. Verify on the site

### Adding a New Vehicle
```json
{
  "name": "BYD Seal",
  "modelTrim": "Premium AWD",
  "country": "MY",
  "isAvailable": true,
  "basePriceLocalCurrency": 179800,
  "batteryCapacityKwh": 82.5,
  "batteryTechnology": "LFP",
  "batteryManufacturer": "BYD (Blade)",
  "batteryWarranty": "8 years / 150,000 km",
  "rangeKm": 520,
  "efficiencyKwhPer100km": 16.3,
  ...
}
```

---

## How to Update Rates & Tariffs

1. Open `data/rates.ts`
2. Find the relevant constant (e.g., `RESIDENTIAL_TARIFF`)
3. Update values for affected countries
4. Update `lastVerified` date in `DATA_PROVENANCE` for that category
5. All consuming components automatically pick up the new values

### Example — Updating Malaysia electricity tariff:
```ts
// In data/rates.ts
export const RESIDENTIAL_TARIFF: CountryMap<number> = {
  MY: 0.504,   // RM/kWh — TNB Tariff A, updated Q1 2026
  ...
}

// Also update provenance
electricityResidential: {
  lastVerified: '2026-03-15',
  ...
}
```

---

## Known Data Issues

### Constants Duplication (Migration In Progress)
Residential tariffs, petrol, and CO₂ grid factors were re-wired to `data/rates.ts` in the Sep 2026 freshness pass. Remaining local copies:

| Component | Local Constant | Should Import |
|-----------|---------------|---------------|
| `solar-payback/page.tsx` | `SOLAR_YIELD`, `SOLAR_COST_PER_KW` | `data/rates.ts` (values still differ from the canonical solar tables) |
| `zero-bill-calculator.ts` | `SOLAR_YIELD_PER_KW`, `SOLAR_COST_PER_KW` | `data/rates.ts` (same split) |
| `ev-charging-cost/page.tsx` | `AC_PUBLIC_RATE` | `AC_PUBLIC_RATE` from `data/rates.ts` (PH/TH/SG still disagree) |
| `bess/commercial/page-client.tsx` | `TARIFF`, `DEMAND_CHARGE` | `COMMERCIAL_TARIFF`, `DEMAND_CHARGE` from `data/rates.ts` |

### QuickPick "Best Selling" Label
The "Best Selling" category in QuickPickCards is **algorithmically computed** from range/value/efficiency — it does NOT use real sales data. The label should clarify this to users.

### Scoreboard Data
The Scoreboard page (`app/scoreboard/page-client.tsx`) has a large `COUNTRIES` array with hardcoded adoption metrics, EV counts, charger stats, etc. This should be separated into its own data file in `data/` for easier updating.

The global battery deployment subpage (`app/scoreboard/energy/page-client.tsx`) uses `data/energy-deployment-scoreboard.ts`. Update this file when refreshing IEA Global Energy Review, IRENA Renewable Capacity Statistics, BNEF energy storage outlook, or Ember/Carbon Brief electricity-review figures. Keep battery storage units separate from generation units: stationary batteries are GW/GWh storage, while fuels and renewables are TWh/year generation or GW plant capacity.

---

## Data Source Citations

Every rate and constant in `data/rates.ts` has full provenance metadata in the `DATA_PROVENANCE` object. Components display citations in their footer text.

To get a citation string for any data category:
```ts
import { getCitationFooter } from '@/data/rates'

// Returns: "Sources: TNB, EMA, PLN | Verified Dec 2025 | Updated quarterly"
const footer = getCitationFooter('electricityResidential')
```
