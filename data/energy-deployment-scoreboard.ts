export type ElectricitySourceKey =
  | 'coal'
  | 'naturalGas'
  | 'oil'
  | 'renewables'
  | 'nuclear'

export type RenewableSourceKey =
  | 'hydro'
  | 'bioenergy'
  | 'solarPv'
  | 'wind'
  | 'other'

export type RegionalMixKey =
  | 'world'
  | 'china'
  | 'india'
  | 'southeastAsia'
  | 'unitedStates'
  | 'europeanUnion'
  | 'restOfWorld'

export type BatteryStorageRegionKey =
  | 'global'
  | 'china'
  | 'unitedStates'
  | 'europe'
  | 'restOfWorld'

export interface GlobalElectricityGenerationPoint {
  year: number
  coal: number
  naturalGas: number
  oil: number
  renewables: number
  nuclear: number
}

export interface RenewableGenerationPoint {
  year: number
  hydro: number
  bioenergy: number
  solarPv: number
  wind: number
  other: number
}

export interface BatteryPowerAdditionPoint {
  year: number
  utilityScaleGw: number
  behindMeterGw: number
}

export interface BatteryEnergyMilestone {
  year: number
  annualAdditionsGwh?: number
  cumulativeGwh?: number
  note: string
  status: 'historical' | 'estimate' | 'forecast'
}

export interface BatteryPackPricePoint {
  year: number
  pricePerKwh: number
  note?: string
}

export interface GlobalEvSalesPoint {
  year: number
  salesMillions: number
}

export interface RegionalElectricityMix {
  key: RegionalMixKey
  label: string
  coal: number
  oil: number
  naturalGas: number
  nuclear: number
  renewables: number
}

export interface BatteryStorageRegion {
  key: BatteryStorageRegionKey
  label: string
  points: BatteryPowerAdditionPoint[]
}

export interface SourceNote {
  label: string
  url: string
  note: string
}

export const ELECTRICITY_SOURCE_META: Record<
  ElectricitySourceKey,
  { label: string; color: string; shortLabel: string }
> = {
  coal: { label: 'Coal', shortLabel: 'Coal', color: '#374151' },
  naturalGas: { label: 'Natural gas', shortLabel: 'Gas', color: '#38bdf8' },
  oil: { label: 'Oil', shortLabel: 'Oil', color: '#f97316' },
  renewables: { label: 'Renewables', shortLabel: 'Renew.', color: '#10b981' },
  nuclear: { label: 'Nuclear', shortLabel: 'Nuclear', color: '#8b5cf6' },
}

export const RENEWABLE_SOURCE_META: Record<
  RenewableSourceKey,
  { label: string; color: string; shortLabel: string }
> = {
  hydro: { label: 'Hydro', shortLabel: 'Hydro', color: '#0ea5e9' },
  bioenergy: { label: 'Bioenergy', shortLabel: 'Bio', color: '#84cc16' },
  solarPv: { label: 'Solar PV', shortLabel: 'Solar', color: '#f59e0b' },
  wind: { label: 'Wind', shortLabel: 'Wind', color: '#14b8a6' },
  other: { label: 'Other renewables', shortLabel: 'Other', color: '#a3e635' },
}

export const GLOBAL_ELECTRICITY_GENERATION: GlobalElectricityGenerationPoint[] = [
  { year: 2015, coal: 9545.3, naturalGas: 5543.9, oil: 1034.6, renewables: 5578.9, nuclear: 2570.1 },
  { year: 2016, coal: 9593.7, naturalGas: 5846.2, oil: 944.4, renewables: 5969.5, nuclear: 2608.4 },
  { year: 2017, coal: 9971.8, naturalGas: 5931.4, oil: 846.8, renewables: 6343.3, nuclear: 2636.1 },
  { year: 2018, coal: 10188.2, naturalGas: 6179.1, oil: 784.8, renewables: 6772.5, nuclear: 2709.0 },
  { year: 2019, coal: 9985.4, naturalGas: 6330.2, oil: 755.7, renewables: 7143.7, nuclear: 2790.1 },
  { year: 2020, coal: 9523.0, naturalGas: 6357.5, oil: 715.6, renewables: 7590.5, nuclear: 2676.3 },
  { year: 2021, coal: 10315.9, naturalGas: 6524.7, oil: 787.5, renewables: 8045.4, nuclear: 2813.8 },
  { year: 2022, coal: 10489.1, naturalGas: 6509.1, oil: 807.4, renewables: 8646.3, nuclear: 2682.8 },
  { year: 2023, coal: 10752.0, naturalGas: 6642.7, oil: 782.6, renewables: 9074.5, nuclear: 2740.5 },
  { year: 2024, coal: 10906.7, naturalGas: 6783.1, oil: 755.4, renewables: 9946.8, nuclear: 2824.2 },
  { year: 2025, coal: 10857.9, naturalGas: 6821.8, oil: 742.4, renewables: 10807.8, nuclear: 2858.5 },
]

export const GLOBAL_RENEWABLE_GENERATION: RenewableGenerationPoint[] = [
  { year: 2015, hydro: 3898.8, bioenergy: 508.7, solarPv: 245.0, wind: 834.5, other: 91.8 },
  { year: 2016, hydro: 4036.8, bioenergy: 554.4, solarPv: 320.1, wind: 963.6, other: 94.5 },
  { year: 2017, hydro: 4089.8, bioenergy: 589.1, solarPv: 430.7, wind: 1135.2, other: 98.5 },
  { year: 2018, hydro: 4216.3, bioenergy: 621.6, solarPv: 555.8, wind: 1277.1, other: 101.8 },
  { year: 2019, hydro: 4269.9, bioenergy: 650.1, solarPv: 686.8, wind: 1430.0, other: 107.0 },
  { year: 2020, hydro: 4360.8, bioenergy: 685.8, solarPv: 831.6, wind: 1602.1, other: 110.3 },
  { year: 2021, hydro: 4297.9, bioenergy: 741.7, solarPv: 1028.3, wind: 1867.1, other: 110.4 },
  { year: 2022, hydro: 4345.3, bioenergy: 772.7, solarPv: 1296.0, wind: 2120.4, other: 112.0 },
  { year: 2023, hydro: 4249.3, bioenergy: 772.9, solarPv: 1604.6, wind: 2333.1, other: 114.6 },
  { year: 2024, hydro: 4460.2, bioenergy: 793.5, solarPv: 2052.9, wind: 2524.4, other: 115.8 },
  { year: 2025, hydro: 4470.2, bioenergy: 840.3, solarPv: 2653.1, wind: 2723.3, other: 120.9 },
]

export const ELECTRICITY_GENERATION_CHANGE_2025 = [
  { source: 'Solar PV', changeTwh: 600.2, color: RENEWABLE_SOURCE_META.solarPv.color },
  { source: 'Wind', changeTwh: 198.9, color: RENEWABLE_SOURCE_META.wind.color },
  { source: 'Hydro', changeTwh: 9.9, color: RENEWABLE_SOURCE_META.hydro.color },
  { source: 'Other renewables', changeTwh: 51.9, color: RENEWABLE_SOURCE_META.other.color },
  { source: 'Nuclear', changeTwh: 34.2, color: ELECTRICITY_SOURCE_META.nuclear.color },
  { source: 'Natural gas', changeTwh: 38.8, color: ELECTRICITY_SOURCE_META.naturalGas.color },
  { source: 'Coal', changeTwh: -48.8, color: ELECTRICITY_SOURCE_META.coal.color },
  { source: 'Oil', changeTwh: -13.0, color: ELECTRICITY_SOURCE_META.oil.color },
]

export const GLOBAL_BATTERY_POWER_ADDITIONS: BatteryPowerAdditionPoint[] = [
  { year: 2020, utilityScaleGw: 3.8, behindMeterGw: 2.3 },
  { year: 2021, utilityScaleGw: 6.4, behindMeterGw: 3.1 },
  { year: 2022, utilityScaleGw: 12.2, behindMeterGw: 6.1 },
  { year: 2023, utilityScaleGw: 32.2, behindMeterGw: 11.8 },
  { year: 2024, utilityScaleGw: 63.2, behindMeterGw: 14.1 },
  { year: 2025, utilityScaleGw: 86.8, behindMeterGw: 20.9 },
]

export const BATTERY_ENERGY_MILESTONES: BatteryEnergyMilestone[] = [
  {
    year: 2020,
    annualAdditionsGwh: 11.8,
    note: 'Early storage market scale, before the recent utility-scale acceleration.',
    status: 'historical',
  },
  {
    year: 2023,
    annualAdditionsGwh: 96.1,
    note: 'First year global stationary storage additions approached 0.1 TWh.',
    status: 'historical',
  },
  {
    year: 2024,
    annualAdditionsGwh: 169,
    cumulativeGwh: 638,
    note: 'Back-derived from the 2025 cumulative midpoint (885 GWh) less 2025 additions (247 GWh); consistent with BNEF outlook language that 2035 cumulative storage is roughly 12x the 2024 base.',
    status: 'estimate',
  },
  {
    year: 2025,
    annualAdditionsGwh: 247,
    cumulativeGwh: 885,
    note: 'Current best public estimate range is roughly 0.85-0.91 TWh deployed when 2025 additions are included.',
    status: 'estimate',
  },
  {
    year: 2035,
    cumulativeGwh: 7300,
    note: 'BNEF outlook projection for cumulative stationary energy storage capacity.',
    status: 'forecast',
  },
]

// BloombergNEF annual Lithium-Ion Battery Price Survey — volume-weighted average
// pack price across EV and stationary storage, nominal US$/kWh. Continuous 2018-2025
// run; each value is the figure BNEF reported in that year's survey. The pre-2018
// anchor ($1,191/kWh in 2010) and the 2010-2018 fall are carried in BATTERY_PRICE_CONTEXT.
export const BATTERY_PACK_PRICES: BatteryPackPricePoint[] = [
  { year: 2018, pricePerKwh: 176 },
  { year: 2019, pricePerKwh: 156 },
  { year: 2020, pricePerKwh: 137 },
  { year: 2021, pricePerKwh: 132 },
  { year: 2022, pricePerKwh: 151, note: 'First annual rise on record, driven by a lithium and raw-material price spike.' },
  { year: 2023, pricePerKwh: 139 },
  { year: 2024, pricePerKwh: 115, note: 'Largest annual drop since 2017; average EV packs fell to $97/kWh, below $100 for the first time.' },
  { year: 2025, pricePerKwh: 108, note: 'New record low; EV packs stayed below $100/kWh for a second year running.' },
]

export const BATTERY_PRICE_CONTEXT = {
  price2010PerKwh: 1191,
  latestYear: 2025,
  latestPricePerKwh: 108,
  declineSince2010Pct: 91,
  evPackPrice2024PerKwh: 97,
  chinaPackPrice2024PerKwh: 94,
}

// IEA Global EV Outlook headline totals for global electric car sales (BEV + PHEV),
// million units. Values are IEA's stated annual headline figures, rounded as IEA
// reports them ("around 3 million" in 2020 … "exceeded 20 million" in 2025).
export const GLOBAL_EV_SALES: GlobalEvSalesPoint[] = [
  { year: 2020, salesMillions: 3.0 },
  { year: 2021, salesMillions: 6.6 },
  { year: 2022, salesMillions: 10.5 },
  { year: 2023, salesMillions: 13.9 },
  { year: 2024, salesMillions: 17.0 },
  { year: 2025, salesMillions: 20.0 },
]

export const EV_MARKET_CONTEXT = {
  latestYear: 2025,
  globalSalesMillions: 20,
  globalSalesSharePct: 25,
  chinaShareOfGlobalPct: 60,
  chinaSalesMillions: 13,
  chinaDomesticEvSharePct: 55,
  china2024ShareOfGlobalPct: 65,
}

export const REGIONAL_ELECTRICITY_MIX: RegionalElectricityMix[] = [
  { key: 'world', label: 'World', coal: 33.8, oil: 2.3, naturalGas: 21.2, nuclear: 8.9, renewables: 33.6 },
  { key: 'china', label: 'China', coal: 55.0, oil: 0.1, naturalGas: 3.3, nuclear: 4.5, renewables: 36.7 },
  { key: 'india', label: 'India', coal: 71.0, oil: 0.2, naturalGas: 2.7, nuclear: 2.5, renewables: 23.6 },
  { key: 'southeastAsia', label: 'Southeast Asia', coal: 48.0, oil: 1.1, naturalGas: 24.3, nuclear: 0.0, renewables: 26.5 },
  { key: 'unitedStates', label: 'United States', coal: 17.3, oil: 0.7, naturalGas: 39.8, nuclear: 17.6, renewables: 24.5 },
  { key: 'europeanUnion', label: 'European Union', coal: 9.9, oil: 1.5, naturalGas: 16.9, nuclear: 23.2, renewables: 48.2 },
  { key: 'restOfWorld', label: 'Rest of world', coal: 15.6, oil: 6.2, naturalGas: 36.0, nuclear: 8.3, renewables: 33.7 },
]

export const BATTERY_STORAGE_REGIONS: BatteryStorageRegion[] = [
  {
    key: 'global',
    label: 'Global',
    points: GLOBAL_BATTERY_POWER_ADDITIONS,
  },
  {
    key: 'china',
    label: 'China',
    points: [
      { year: 2023, utilityScaleGw: 19.4, behindMeterGw: 3.2 },
      { year: 2024, utilityScaleGw: 43.4, behindMeterGw: 3.6 },
      { year: 2025, utilityScaleGw: 55.1, behindMeterGw: 8.0 },
    ],
  },
  {
    key: 'unitedStates',
    label: 'United States',
    points: [
      { year: 2023, utilityScaleGw: 8.0, behindMeterGw: 0.8 },
      { year: 2024, utilityScaleGw: 10.3, behindMeterGw: 1.7 },
      { year: 2025, utilityScaleGw: 16.2, behindMeterGw: 2.7 },
    ],
  },
  {
    key: 'europe',
    label: 'Europe',
    points: [
      { year: 2023, utilityScaleGw: 2.4, behindMeterGw: 6.9 },
      { year: 2024, utilityScaleGw: 4.1, behindMeterGw: 7.4 },
      { year: 2025, utilityScaleGw: 5.7, behindMeterGw: 3.7 },
    ],
  },
  {
    key: 'restOfWorld',
    label: 'Rest of world',
    points: [
      { year: 2023, utilityScaleGw: 2.4, behindMeterGw: 0.9 },
      { year: 2024, utilityScaleGw: 5.4, behindMeterGw: 1.4 },
      { year: 2025, utilityScaleGw: 9.8, behindMeterGw: 6.5 },
    ],
  },
]

export const RENEWABLE_CAPACITY_ADDITIONS_2025 = [
  { source: 'Solar PV', additionsGw: 605, color: RENEWABLE_SOURCE_META.solarPv.color },
  { source: 'Wind', additionsGw: 159, color: RENEWABLE_SOURCE_META.wind.color },
  { source: 'Other renewables', additionsGw: 33, color: RENEWABLE_SOURCE_META.other.color },
]

export const SOLAR_WIND_SELECTED_MARKETS_2025 = [
  { market: 'China', solarPvGw: 367.5, windGw: 116.6 },
  { market: 'European Union', solarPvGw: 68.7, windGw: 14.4 },
  { market: 'India', solarPvGw: 48.3, windGw: 6.3 },
  { market: 'United States', solarPvGw: 43.1, windGw: 5.8 },
  { market: 'Brazil', solarPvGw: 12.6, windGw: 1.8 },
  { market: 'Saudi Arabia', solarPvGw: 6.9, windGw: 0.0 },
]

export const ENERGY_DEPLOYMENT_SNAPSHOT = {
  year: 2025,
  batteryPowerAdditionsGw: 107.7,
  batteryEnergyAdditionsGwh: 247,
  batteryCumulativeEnergyGwhLow: 855,
  batteryCumulativeEnergyGwhHigh: 913,
  batteryCumulativeDisplayGwh: 885,
  utilityScalePowerSharePct: 81,
  lfpDeploymentSharePct: 90,
  solarGenerationGrowthTwh: 600.2,
  renewableGenerationTwh: 10807.8,
  fossilGenerationTwh: 18422.1,
  lowCarbonSharePct: 42.5,
  renewableCapacityAdditionsGw: 797,
  irenaRenewableCapacityAdditionsGw: 692,
  irenaRenewablesShareOfExpansionPct: 85.6,
  forecast2035CumulativeGwh: 7300,
  forecast2035PowerGw: 2000,
}

export const DATA_SOURCES: SourceNote[] = [
  {
    label: 'IEA Global Energy Review 2026 - battery storage',
    url: 'https://www.iea.org/reports/global-energy-review-2026/technology-battery-storage',
    note: 'Power-capacity additions by year and region; 2025 values based on Benchmark data.',
  },
  {
    label: 'IEA Global Energy Review 2026 - electricity supply',
    url: 'https://www.iea.org/reports/global-energy-review-2026/electricity-supply',
    note: 'Global generation by source, regional electricity mix, and 2025 generation changes.',
  },
  {
    label: 'IEA Global Energy Review 2026 - solar PV and wind',
    url: 'https://www.iea.org/reports/global-energy-review-2026/technology-solar-pv-and-wind',
    note: 'Renewable capacity additions and selected market solar/wind additions.',
  },
  {
    label: 'IRENA Renewable Capacity Statistics 2026 press release',
    url: 'https://www.irena.org/News/pressreleases/2026/Apr/Near-700-GW-Surge-in-2025-Proves-Renewable-Energy-Resilience',
    note: 'Global renewable capacity expansion and share of total power expansion.',
  },
  {
    label: 'IEA Global EV Outlook 2026',
    url: 'https://www.iea.org/reports/global-ev-outlook-2026/trends-in-electric-cars',
    note: 'Global electric car sales exceeded 20 million in 2025 (a quarter of new cars); China supplied about 60% of global sales.',
  },
  {
    label: 'IEA Global EV Outlook 2025',
    url: 'https://www.iea.org/reports/global-ev-outlook-2025/executive-summary',
    note: 'Historical sales milestones: ~3M (2020), 6.6M (2021), >10M (2022), ~14M (2023), 17M+ (2024); China ~11M in 2024.',
  },
  {
    label: 'BloombergNEF 2024 Lithium-Ion Battery Price Survey',
    url: 'https://about.bnef.com/insights/commodities/lithium-ion-battery-pack-prices-see-largest-drop-since-2017-falling-to-115-per-kilowatt-hour-bloombergnef/',
    note: 'Volume-weighted average pack price of $115/kWh in 2024; average EV packs reached $97/kWh.',
  },
  {
    label: 'BloombergNEF 2025 Lithium-Ion Battery Price Survey',
    url: 'https://about.bnef.com/insights/clean-transport/lithium-ion-battery-pack-prices-fall-to-108-per-kilowatt-hour-despite-rising-metal-prices-bloombergnef/',
    note: 'Latest survey: volume-weighted average pack price fell to a record $108/kWh in 2025.',
  },
  {
    label: 'BloombergNEF 2H 2025 Energy Storage Market Outlook',
    url: 'https://about.bnef.com/insights/clean-energy/global-energy-storage-boom-three-things-to-know/',
    note: 'Long-run cumulative energy storage projection of 2 TW / 7.3 TWh by 2035.',
  },
  {
    label: 'Carbon Brief summary of Ember Global Electricity Review 2026',
    url: 'https://www.carbonbrief.org/clean-energy-pushes-fossil-fuel-power-into-reverse-for-first-time-ever/',
    note: 'Public GWh storage-addition context and battery capacity relative to daily solar generation.',
  },
]
