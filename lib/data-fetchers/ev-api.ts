/**
 * EV Data Fetcher using API Ninjas Electric Vehicle API
 * Free tier: 10 requests/day, 1000 requests/month
 * Get API key: https://api-ninjas.com/api/electricvehicle
 */

type MaybeString = string | undefined

interface APIVehicle {
  make: string
  model: string
  year_start?: string
  battery_useable_capacity?: MaybeString
  battery_capacity?: MaybeString
  energy_consumption_combined_mild_weather?: MaybeString
  energy_consumption_combined_cold_weather?: MaybeString
  vehicle_consumption?: MaybeString
  electric_range?: MaybeString
  charge_power_10p_80p?: MaybeString
  charge_power_max?: MaybeString
  total_power?: MaybeString
  acceleration_0_100_kmh?: MaybeString
  gross_vehicle_weight?: MaybeString
  car_body?: MaybeString
}

export interface TransformedVehicle {
  name: string
  modelTrim: string
  rangeKm: number
  efficiencyKwhPer100km: number
  powerRatingKw: number
  batteryCapacityKwh?: number
  chargingTimeDc0To80Min?: number
  imageUrl?: string
  rawData: APIVehicle
}

const DEFAULT_MODEL_QUERIES = [
  'Model 3',
  'Model Y',
  'Atto 3',
  'Seal',
  'IONIQ 5',
  'IONIQ 6',
  'EV6',
  'XC40',
]

const REQUEST_INTERVAL_MS = Number(
  process.env.API_NINJAS_REQUEST_INTERVAL_MS ?? '1100'
)
const MAX_REQUESTS_PER_RUN = Number(
  process.env.API_NINJAS_MAX_REQUESTS ?? '8'
)

export async function fetchVehiclesFromAPI(
  apiKey?: string
): Promise<TransformedVehicle[]> {
  if (!apiKey) {
    console.warn('API_NINJAS_KEY not set, skipping API fetch')
    return []
  }

  const userQueries = process.env.API_NINJAS_MODELS
    ? process.env.API_NINJAS_MODELS.split(',').map((q) => q.trim()).filter(Boolean)
    : undefined

  const queries = (userQueries?.length ? userQueries : DEFAULT_MODEL_QUERIES).slice(
    0,
    MAX_REQUESTS_PER_RUN
  )

  const uniqueVehicles = new Map<string, TransformedVehicle>()

  for (const query of queries) {
    try {
      const fetched = await fetchVehiclesByModel(query, apiKey)
      for (const vehicle of fetched) {
        const key = `${vehicle.name}-${vehicle.modelTrim}`
        if (!uniqueVehicles.has(key)) {
          uniqueVehicles.set(key, vehicle)
        }
      }
    } catch (error) {
      console.error(`Error fetching vehicles for query "${query}":`, error)
    }

    if (REQUEST_INTERVAL_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS))
    }
  }

  return Array.from(uniqueVehicles.values())
}

async function fetchVehiclesByModel(
  model: string,
  apiKey: string
): Promise<TransformedVehicle[]> {
  const url = `https://api.api-ninjas.com/v1/electricvehicle?model=${encodeURIComponent(
    model
  )}`

  const response = await fetch(url, {
    headers: {
      'X-Api-Key': apiKey,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key')
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded')
    }
    throw new Error(`API error: ${response.status}`)
  }

  const data: APIVehicle[] = await response.json()
  return data
    .map(transformVehicle)
    .filter((vehicle): vehicle is TransformedVehicle => vehicle !== null)
}

function transformVehicle(apiVehicle: APIVehicle): TransformedVehicle | null {
  const batteryCapacityKwh =
    parseNumber(apiVehicle.battery_useable_capacity) ??
    parseNumber(apiVehicle.battery_capacity)

  const efficiencyWhPerKm =
    parseNumber(apiVehicle.energy_consumption_combined_mild_weather) ??
    parseNumber(apiVehicle.energy_consumption_combined_cold_weather) ??
    parseNumber(apiVehicle.vehicle_consumption)

  const efficiencyKwhPer100km = efficiencyWhPerKm
    ? (efficiencyWhPerKm / 1000) * 100
    : batteryCapacityKwh
    ? (batteryCapacityKwh / (parseNumber(apiVehicle.electric_range) ?? 400)) * 100
    : undefined

  if (!efficiencyKwhPer100km && !batteryCapacityKwh) {
    return null
  }

  const rangeFromAPI = parseNumber(apiVehicle.electric_range)
  const computedRange =
    batteryCapacityKwh && efficiencyWhPerKm
      ? Math.round(
          batteryCapacityKwh / (efficiencyWhPerKm / 1000) // kWh / (kWh per km)
        )
      : undefined

  const rangeKm = rangeFromAPI || computedRange || 420
  const powerRatingKw =
    parseNumber(apiVehicle.total_power, /([0-9.]+)\s?kW/) ?? 150

  const chargingPowerKw =
    parseNumber(apiVehicle.charge_power_10p_80p, /([0-9.]+)\s?kW/) ??
    parseNumber(apiVehicle.charge_power_max, /([0-9.]+)\s?kW/) ??
    120

  const chargingTimeDc0To80Min =
    batteryCapacityKwh && chargingPowerKw
      ? Math.round(((batteryCapacityKwh * 0.7) / chargingPowerKw) * 60)
      : undefined

  const modelTrim =
    apiVehicle.year_start && apiVehicle.year_start !== 'No Data'
      ? apiVehicle.year_start
      : 'Base'

  return {
    name: `${apiVehicle.make} ${apiVehicle.model}`.trim(),
    modelTrim,
    rangeKm,
    efficiencyKwhPer100km: efficiencyKwhPer100km ?? 17,
    powerRatingKw,
    batteryCapacityKwh,
    chargingTimeDc0To80Min,
    imageUrl: buildImageUrl(apiVehicle),
    rawData: apiVehicle,
  }
}

function parseNumber(value?: string, pattern?: RegExp): number | undefined {
  if (!value) return undefined
  const sanitized = value.replace(/,/g, '.')
  const regex = pattern ?? /([0-9.]+)/
  const match = sanitized.match(regex)
  if (!match) return undefined
  const parsed = parseFloat(match[1])
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildImageUrl(vehicle: APIVehicle) {
  const query = encodeURIComponent(`${vehicle.make} ${vehicle.model}`)
  return `https://source.unsplash.com/featured/?${query}`
}

/**
 * Get manufacturer cost estimate based on battery capacity
 * Using industry estimates: ~$100-150 per kWh
 */
export function estimateManufacturerCost(batteryCapacityKwh?: number): number {
  if (!batteryCapacityKwh) return 30000 // Default estimate
  // Rough estimate: $120/kWh for battery + $20k base vehicle cost
  return batteryCapacityKwh * 120 + 20000
}

/**
 * Estimate battery weight from capacity (rough: ~6-7 kg per kWh)
 */
export function estimateBatteryWeight(batteryCapacityKwh?: number): number {
  if (!batteryCapacityKwh) return 400 // Default
  return batteryCapacityKwh * 6.5
}

/**
 * Estimate curb weight from battery weight and vehicle class
 */
export function estimateCurbWeight(
  batteryWeightKg: number,
  powerKw: number
): number {
  // Base weight + battery weight + motor weight
  // Rough estimate: 1200kg base + battery + (power/2) for motor weight
  return 1200 + batteryWeightKg + powerKw / 2
}

