import { Country } from '@/types/bess'
import { BESS } from '@/types/bess'
import { Vehicle } from '@/types/vehicle'
import { getElectricityRate } from '@/lib/utils'

// Solar yield per kW installed (average 2025) - kWh/kW/day
export const SOLAR_YIELD_PER_KW: Record<Country, number> = {
  MY: 4.6,
  SG: 4.2,
  ID: 4.8,
  TH: 4.7,
  VN: 4.5,
  PH: 4.6,
}

// Solar cost per kW by country (2024/2025)
export const SOLAR_COST_PER_KW: Record<Country, number> = {
  MY: 3200,      // RM per kW (updated from 4000)
  SG: 2500,      // S$ per kW (updated from 3500)
  ID: 14000000,  // Rp per kW (updated from 15000000)
  TH: 32000,     // THB per kW (updated from 35000)
  VN: 19000000,  // VND per kW (updated from 20000000)
  PH: 38000,     // ₱ per kW (updated from 40000)
}

// Default driving distance per country (km/day)
export const DEFAULT_DRIVING_DISTANCE: Record<Country, number> = {
  MY: 45,
  SG: 30,
  ID: 50,
  TH: 40,
  VN: 35,
  PH: 45,
}

// Default household loads per country (kWh/day)
export const DEFAULT_HOUSEHOLD_LOADS: Record<Country, { day: number; night: number }> = {
  MY: { day: 8, night: 10 },      // 18 kWh/day total
  SG: { day: 6, night: 6 },        // 12 kWh/day (condo)
  ID: { day: 7, night: 9 },        // 16 kWh/day
  TH: { day: 10, night: 12 },      // 22 kWh/day (landed)
  VN: { day: 7, night: 8 },        // 15 kWh/day
  PH: { day: 9, night: 11 },       // 20 kWh/day
}

// Load profiles (kWh/day)
export const LOAD_PROFILES = {
  Low: { day: 4, night: 6 },
  Average: { day: 8, night: 10 },
  High: { day: 12, night: 14 },
}

// Roof quality multipliers
export const ROOF_QUALITY_MULTIPLIERS = {
  Ideal: 1.0,
  Average: 0.9,
  Shaded: 0.75,
}

// Net metering settings per country
export const NET_METERING_TYPE: Record<Country, 'full_export' | 'net_billing'> = {
  MY: 'full_export',
  SG: 'net_billing',
  ID: 'net_billing',
  TH: 'full_export',
  VN: 'full_export',
  PH: 'net_billing',
}

// Export rate multipliers for excess solar (as % of import tariff) per country
// Based on country-specific net metering/buyback programs
export const EXPORT_RATE_MULTIPLIER: Record<Country, { full_export: number; net_billing: number }> = {
  ID: { full_export: 0, net_billing: 0 },      // No buyback program, net metering abolished Feb 2024
  PH: { full_export: 0.8, net_billing: 0.5 },  // Net metering active, credit banking allowed
  TH: { full_export: 0.8, net_billing: 0.5 },  // Net metering/buyback available, tax breaks extended
  VN: { full_export: 0.8, net_billing: 0.5 },  // FiT allows buyback at partial import rate
  SG: { full_export: 0.8, net_billing: 0.5 },  // Net metering/export payment available
  MY: { full_export: 0, net_billing: 0 },      // No buyback program
}

// Electricity tariffs per country (Q3 2025 residential averages) - local currency per kWh
export const ELECTRICITY_TARIFFS: Record<Country, number> = {
  MY: 0.474,   // RM per kWh
  SG: 0.315,   // S$ per kWh
  ID: 1750,    // Rp per kWh
  TH: 4.59,    // THB per kWh
  VN: 2135,    // VND per kWh
  PH: 12.30,   // ₱ per kWh
}

// Currency symbols by country
export const CURRENCY_BY_COUNTRY: Record<Country, string> = {
  SG: 'SGD',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  TH: 'THB',
  VN: 'VND',
}

// CO₂ emissions factor (kg CO₂ per kWh) - average grid mix per country
export const CO2_EMISSIONS_FACTOR: Record<Country, number> = {
  MY: 0.65,    // kg CO₂/kWh (coal-heavy grid)
  SG: 0.45,    // kg CO₂/kWh (gas-heavy)
  ID: 0.70,    // kg CO₂/kWh (coal-heavy)
  TH: 0.55,    // kg CO₂/kWh (mixed)
  VN: 0.60,    // kg CO₂/kWh (coal-heavy)
  PH: 0.68,    // kg CO₂/kWh (coal-heavy)
}

// Constants
const BATTERY_DEGRADATION_RATE = 0.015 // 1.5% per year
const INVERTER_MAINTENANCE_PERCENT = 0.10 // 10% of total system cost
const YEARLY_OPEX_PERCENT = 0.005 // 0.5% of system cost per year
const TARIFF_INFLATION_RATE = 0.03 // 3% per year

export interface ZeroBillInputs {
  country: Country
  solarSizeKw: number
  includeSolarCost: boolean
  roofQuality: 'Ideal' | 'Average' | 'Shaded'
  batteries: Array<{ model: BESS | null; quantity: number }>
  vehicles: Array<{ 
    model: Vehicle | null
    quantity: number
    drivingDistanceKm?: number
    evHomeChargingPercentage?: number
    evChargingTime?: 'Night only' | 'Day only' | 'Both'
  }>
  drivingDistanceKm: number // Legacy: used as fallback if vehicle doesn't have per-vehicle setting
  evHomeChargingPercentage: number // Legacy: used as fallback
  evChargingTime: 'Night only' | 'Day only' | 'Both' // Legacy: used as fallback
  dayLoad: number | 'Low' | 'Average' | 'High'
  nightLoad: number | 'Low' | 'Average' | 'High'
  netMetering: 'full_export' | 'net_billing'
}

export interface OptimalSystem {
  solarSizeKw: number
  batteries: Array<{ model: BESS | null; quantity: number }>
  paybackYears: number
  monthlySavings: number
  totalSystemCost: number
  gridElectricityNeeded?: number // For off-grid verification
  totalCost25YearsWithSystem?: number // For best net savings
  totalCost25YearsWithoutSystem?: number // For best net savings
  netSavings25Years?: number // For best net savings
}

export interface ZeroBillOutputs {
  dailySolarGeneration: number
  batteryChargedFromSolarPercent: number
  evsChargedFreeAtHomePercent: number
  gridElectricityNeededThisMonth: number
  actualGridUsageThisMonth: number // Actual grid usage before export credit offset
  monthlyGridExport: number // Monthly grid export (kWh)
  monthlyExportCreditValue: number // Monthly export credit value in currency
  monthlyBillWithoutSystem: number
  monthlyBillWithSystem: number // Home electricity bill only
  monthlyTotalCostWithSystem: number // Total cost including home bill + public charging
  monthlyGridUsageCost: number // Grid usage cost before export credit offset
  monthlySavings: number
  fullSystemPaybackYears: number
  zeroBillDaysPerYear: number
  co2AvoidedPerYear: number
  equilibriumSuggestion: string
  solarCost: number
  batteryCost: number
  totalSystemCost: number
  netGainsAfter25Years: number // Net gains/expenses after 25 years with system
  netGainsAfter25YearsWithoutSystem: number // Net gains/expenses after 25 years without system
  totalElectricityBill25YearsWithSystem: number // Total electricity bill over 25 years with system
  totalElectricityBill25YearsWithoutSystem: number // Total electricity bill over 25 years without system
  totalCost25YearsWithSystem: number // Total cost over 25 years with system (electricity + EV + system cost)
  totalCost25YearsWithoutSystem: number // Total cost over 25 years without system (electricity + EV)
  // EV charging metrics
  monthlyGridUsedForEvCharging: number // Monthly grid electricity used for EV charging (kWh)
  monthlyGridUsedForEvChargingHome: number // Monthly grid electricity used for EV home charging (kWh)
  monthlyEvPublicChargingEnergy: number // Monthly energy used for EV public charging (kWh) - not from home grid
  monthlyEvPublicChargingCost: number // Monthly cost of EV charging away from home (public charging)
  monthlyEvChargingSavings: number // Monthly savings from charging at home vs public charging
  // Energy usage metrics
  monthlyTotalEnergyUsed: number // Total monthly energy used (home + EV)
  monthlyHomeEnergyUsed: number // Monthly energy used for home (kWh)
  monthlyEvEnergyUsed: number // Monthly energy used for EV charging at home (kWh)
  monthlyBillWithoutSystemHousehold: number // Monthly bill for household power without system
  monthlyBillWithoutSystemEvTotal: number // Monthly bill for total EV power (home + public)
  monthlyBillWithoutSystemEvHome: number // Monthly bill for EV home charging without system
  monthlyBillWithoutSystemEvPublic: number // Monthly bill for EV public charging without system
  monthlyBillWithSystemHousehold: number // Monthly bill for household power with system
  monthlyBillWithSystemEvTotal: number // Monthly bill for total EV power with system (home + public)
  monthlyBillWithSystemEvHome: number // Monthly bill for EV home charging with system
  monthlyBillWithSystemEvPublic: number // Monthly bill for EV public charging with system (same as without)
  // Detailed energy flow data for visualization
  energyFlow: {
    // Generation sources (kWh/day)
    solarGeneration: number
    batteryDischarge: number // Battery discharging to power loads/EVs
    gridSupply: number // Grid electricity used
    // Consumption (kWh/day)
    daytimeLoad: number
    nighttimeLoad: number
    batteryCharging: number
    evCharging: number
    evChargingFromSolar: number
    evChargingFromBattery: number
    evChargingFromGrid: number
    excessSolarExported: number
    // Hourly data (24 hours, 0-23)
    hourly: Array<{
      hour: number
      solar: number
      batteryCharge: number
      batteryDischarge: number
      batteryLevel: number // Battery state of charge at end of hour
      gridSupply: number
      gridExport: number
      householdLoad: number
      evCharging: number
      evChargingFromSolar: number
      evChargingFromBattery: number
      evChargingFromGrid: number
    }>
  }
}

export function calculateZeroBill(inputs: ZeroBillInputs): ZeroBillOutputs {
  const {
    country,
    solarSizeKw,
    includeSolarCost,
    roofQuality,
    batteries,
    vehicles,
    drivingDistanceKm,
    evHomeChargingPercentage,
    evChargingTime,
    dayLoad: dayLoadInput,
    nightLoad: nightLoadInput,
    netMetering,
  } = inputs

  // Calculate actual day and night loads
  const dayLoadKwh = typeof dayLoadInput === 'number' 
    ? dayLoadInput 
    : LOAD_PROFILES[dayLoadInput].day
  const nightLoadKwh = typeof nightLoadInput === 'number'
    ? nightLoadInput
    : LOAD_PROFILES[nightLoadInput].night

  const totalDailyLoad = dayLoadKwh + nightLoadKwh

  // Calculate daily solar generation
  const baseSolarYield = SOLAR_YIELD_PER_KW[country] * solarSizeKw
  const roofMultiplier = ROOF_QUALITY_MULTIPLIERS[roofQuality]
  const dailySolarGeneration = baseSolarYield * roofMultiplier

  // Calculate battery capacity (with degradation - assume 5 years average)
  const totalBatteryCapacity = batteries.reduce((sum, b) => {
    if (!b.model) return sum
    const degradedCapacity = b.model.usableCapacityKwh * (1 - BATTERY_DEGRADATION_RATE * 5)
    return sum + (degradedCapacity * b.quantity)
  }, 0)

  // Calculate EV charging needs based on driving distance (per-vehicle settings)
  let totalEvDailyKwhNeeded = 0
  
  // Safety check: ensure vehicles array exists
  if (vehicles && Array.isArray(vehicles)) {
    vehicles.forEach(v => {
      if (!v.model || !v.model.batteryCapacityKwh || v.quantity === 0) return
      const rangeKm = v.model.rangeWltpKm ?? v.model.rangeKm ?? 
                      (v.model.efficiencyKwhPer100km && v.model.efficiencyKwhPer100km > 0 && v.model.batteryCapacityKwh
                        ? (v.model.batteryCapacityKwh / v.model.efficiencyKwhPer100km * 100) 
                        : null)
      if (!rangeKm || rangeKm <= 0) return
      
      // Calculate kWh needed per km
      const kwhPerKm = v.model.batteryCapacityKwh / rangeKm
      if (isNaN(kwhPerKm) || !isFinite(kwhPerKm)) return
      
      // Use per-vehicle driving distance or fallback to global
      const vehicleDrivingDistance = v.drivingDistanceKm ?? drivingDistanceKm ?? 0
      if (isNaN(vehicleDrivingDistance) || !isFinite(vehicleDrivingDistance) || vehicleDrivingDistance <= 0) return
      
      // Total daily kWh needed for all vehicles of this type
      const dailyKwhPerVehicle = vehicleDrivingDistance * kwhPerKm
      if (isNaN(dailyKwhPerVehicle) || !isFinite(dailyKwhPerVehicle)) return
      
      totalEvDailyKwhNeeded += dailyKwhPerVehicle * v.quantity
    })
  }
  
  // Ensure totalEvDailyKwhNeeded is valid
  if (isNaN(totalEvDailyKwhNeeded) || !isFinite(totalEvDailyKwhNeeded) || totalEvDailyKwhNeeded < 0) {
    totalEvDailyKwhNeeded = 0
  }

  // Calculate EV charging at home (aggregate per-vehicle percentages)
  // Calculate weighted average of home charging percentage based on each vehicle's energy needs
  let weightedHomeChargingTotal = 0
  let totalVehicleEnergy = 0
  
  // Safety check: ensure vehicles array exists
  if (vehicles && Array.isArray(vehicles)) {
    vehicles.forEach(v => {
      if (!v.model || !v.model.batteryCapacityKwh || v.quantity === 0) return
      const rangeKm = v.model.rangeWltpKm ?? v.model.rangeKm ?? 
                      (v.model.efficiencyKwhPer100km && v.model.efficiencyKwhPer100km > 0 && v.model.batteryCapacityKwh
                        ? (v.model.batteryCapacityKwh / v.model.efficiencyKwhPer100km * 100) 
                        : null)
      if (!rangeKm || rangeKm <= 0) return
      
      const kwhPerKm = v.model.batteryCapacityKwh / rangeKm
      if (isNaN(kwhPerKm) || !isFinite(kwhPerKm)) return
      
      const vehicleDrivingDistance = v.drivingDistanceKm ?? drivingDistanceKm ?? 0
      if (isNaN(vehicleDrivingDistance) || !isFinite(vehicleDrivingDistance) || vehicleDrivingDistance <= 0) return
      
      const vehicleDailyKwh = vehicleDrivingDistance * kwhPerKm * v.quantity
      if (isNaN(vehicleDailyKwh) || !isFinite(vehicleDailyKwh)) return
      
      const vehicleHomeChargingPct = v.evHomeChargingPercentage ?? evHomeChargingPercentage ?? 0
      if (isNaN(vehicleHomeChargingPct) || !isFinite(vehicleHomeChargingPct)) return
      
      weightedHomeChargingTotal += vehicleDailyKwh * (vehicleHomeChargingPct / 100)
      totalVehicleEnergy += vehicleDailyKwh
    })
  }
  
  // Ensure calculations are valid
  if (isNaN(weightedHomeChargingTotal) || !isFinite(weightedHomeChargingTotal)) {
    weightedHomeChargingTotal = 0
  }
  if (isNaN(totalVehicleEnergy) || !isFinite(totalVehicleEnergy)) {
    totalVehicleEnergy = 0
  }
  
  const effectiveHomeChargingPercentage = totalVehicleEnergy > 0 
    ? (weightedHomeChargingTotal / totalVehicleEnergy) * 100 
    : (evHomeChargingPercentage || 0)
  
  // Ensure percentage is valid
  const safeHomeChargingPct = isNaN(effectiveHomeChargingPercentage) || !isFinite(effectiveHomeChargingPercentage)
    ? (evHomeChargingPercentage || 0)
    : Math.max(0, Math.min(100, effectiveHomeChargingPercentage))
  
  let evHomeChargingKwh = totalEvDailyKwhNeeded * (safeHomeChargingPct / 100)
  let evPublicChargingKwh = totalEvDailyKwhNeeded * (1 - safeHomeChargingPct / 100)
  
  // Ensure EV charging values are valid
  if (isNaN(evHomeChargingKwh) || !isFinite(evHomeChargingKwh) || evHomeChargingKwh < 0) {
    evHomeChargingKwh = 0
  }
  if (isNaN(evPublicChargingKwh) || !isFinite(evPublicChargingKwh) || evPublicChargingKwh < 0) {
    evPublicChargingKwh = 0
  }
  
  // Determine charging time: if all vehicles have same time, use it; otherwise use 'Both' as default
  const vehicleChargingTimes = vehicles
    .filter(v => v.model && v.quantity > 0)
    .map(v => v.evChargingTime ?? evChargingTime)
  const uniqueChargingTimes = Array.from(new Set(vehicleChargingTimes))
  const effectiveChargingTime = uniqueChargingTimes.length === 1 
    ? uniqueChargingTimes[0] 
    : uniqueChargingTimes.includes('Both') 
      ? 'Both' 
      : evChargingTime

  // Simulate daily energy flow
  let solarRemaining = dailySolarGeneration
  let batteryCharged = 0
  let totalFreeEvCharging = 0 // Total EV charging from free sources (solar + battery)
  let gridNeeded = 0

  // Priority 1: Power daytime load
  // Calculate how much day load couldn't be covered by solar (must come from grid)
  const dayLoadFromGrid = Math.max(0, dayLoadKwh - dailySolarGeneration)
  solarRemaining = Math.max(0, solarRemaining - dayLoadKwh)

  // Priority 2: Charge batteries (up to capacity)
  const batteryChargeNeeded = Math.min(totalBatteryCapacity, solarRemaining)
  batteryCharged = batteryChargeNeeded
  solarRemaining -= batteryChargeNeeded

  // Priority 3: Charge EVs at home during day (based on charging time preference)
  let evChargeFromSolar = 0
  let evChargeFromBattery = 0
  let evChargeFromGrid = 0
  let evChargeFromGridDay = 0 // EV charging from grid during day (when solar insufficient)
  
  if (effectiveChargingTime === 'Day only' || effectiveChargingTime === 'Both') {
    // Charge EVs during day from solar (free)
    evChargeFromSolar = Math.min(evHomeChargingKwh, solarRemaining)
    totalFreeEvCharging += evChargeFromSolar
    solarRemaining -= evChargeFromSolar
    
    // If charging is "Day only", any remaining EV charging needs come from grid
    if (effectiveChargingTime === 'Day only') {
      const evDayChargeRemaining = evHomeChargingKwh - evChargeFromSolar
      evChargeFromGridDay = Math.max(0, evDayChargeRemaining)
    }
  }

  // Priority 4: Export excess to grid
  const excessSolar = solarRemaining

  // Nighttime: Use battery to power night load
  // IMPORTANT: Battery can only discharge what was actually charged, not its full capacity
  const batteryEnergyAvailable = batteryCharged
  const batteryDischarge = Math.min(batteryEnergyAvailable, nightLoadKwh)
  const nightLoadRemaining = Math.max(0, nightLoadKwh - batteryDischarge)
  let batteryRemainingAfterNightLoad = Math.max(0, batteryEnergyAvailable - batteryDischarge)

  // EV charging at night (if applicable)
  if (effectiveChargingTime === 'Night only' || effectiveChargingTime === 'Both') {
    const evNightChargeNeeded = effectiveChargingTime === 'Night only' 
      ? evHomeChargingKwh 
      : evHomeChargingKwh - evChargeFromSolar
    
    if (evNightChargeNeeded > 0) {
      // First try to charge from battery (if available and has stored solar)
      if (totalBatteryCapacity > 0 && batteryRemainingAfterNightLoad > 0) {
        // Battery has stored solar, use it for EV charging (free)
        evChargeFromBattery = Math.min(evNightChargeNeeded, batteryRemainingAfterNightLoad)
        batteryRemainingAfterNightLoad -= evChargeFromBattery
        totalFreeEvCharging += evChargeFromBattery
      }
      
      // Remaining EV charging needs come from grid
      const evNightChargeRemaining = evNightChargeNeeded - evChargeFromBattery
      evChargeFromGrid = Math.max(0, evNightChargeRemaining)
    }
  }

  // Calculate grid electricity needed
  // IMPORTANT: Day loads not covered by solar, day EV charging not covered by solar, night loads, and night EV charging MUST come from grid
  // Excess solar exported during day creates credit that can offset the COST of grid purchases
  
  // Total grid electricity physically needed
  // Day loads not covered by solar + day EV charging not covered by solar + night loads + night EV charging
  const totalDayGridNeeded = dayLoadFromGrid + evChargeFromGridDay
  const totalNightGridNeeded = nightLoadRemaining + evChargeFromGrid
  const totalGridNeeded = totalDayGridNeeded + totalNightGridNeeded
  
  // Excess solar exported creates credit
  // For net billing: credit offsets usage on a 1:1 kWh basis (but at export rate)
  // For full export: credit offsets usage at 80% rate
  // We'll calculate the bill using currency-based offset for accuracy

  // Monthly calculations
  // Actual grid usage (before export credit) - this is the physical grid power used
  const actualMonthlyGridUsage = totalGridNeeded * 30
  // Monthly grid export and export credit will be calculated after hourly simulation
  // Monthly bill without system should include household load + EV charging at home + EV public charging
  const monthlyBillWithoutSystemHousehold = totalDailyLoad * 30 * ELECTRICITY_TARIFFS[country]
  const monthlyBillWithoutSystemEvHome = evHomeChargingKwh * 30 * ELECTRICITY_TARIFFS[country]
  // Public charging cost uses commercial fast charging rates
  const evPublicChargingRate = getElectricityRate(country)
  const monthlyBillWithoutSystemEvPublic = evPublicChargingKwh * 30 * evPublicChargingRate
  // Total EV power cost (home + public)
  const monthlyBillWithoutSystemEvTotal = monthlyBillWithoutSystemEvHome + monthlyBillWithoutSystemEvPublic
  // Total monthly bill without system = household + EV home charging + EV public charging
  const monthlyBillWithoutSystem = monthlyBillWithoutSystemHousehold + monthlyBillWithoutSystemEvTotal
  
  // EV charging and bill calculations will be done after bill variables are available

  // Calculate EV charging costs and savings
  
  // Cost of public charging (away from home) - using commercial fast charging rates (already defined above)
  const monthlyEvPublicChargingCost = evPublicChargingKwh * 30 * evPublicChargingRate
  
  // Cost if all home charging was done from grid (residential rate)
  const monthlyEvHomeChargingCostIfAllFromGrid = evHomeChargingKwh * 30 * ELECTRICITY_TARIFFS[country]
  
  // EV charging savings calculations will be done after monthlyEvHomeChargingCostFromGrid is declared

  // Calculate total energy used (household + EV home + EV public)
  const monthlyHomeEnergyUsed = totalDailyLoad * 30
  const monthlyEvEnergyUsed = evHomeChargingKwh * 30
  const monthlyEvPublicChargingEnergy = evPublicChargingKwh * 30
  const monthlyTotalEnergyUsed = monthlyHomeEnergyUsed + monthlyEvEnergyUsed + monthlyEvPublicChargingEnergy

  // System cost, payback, and 25-year calculations will be done after monthlySavings is available


  // CO₂ avoided
  const annualGridAvoided = (totalDailyLoad - gridNeeded) * 365
  const co2AvoidedPerYear = annualGridAvoided * CO2_EMISSIONS_FACTOR[country]

  // Equilibrium suggestion
  // Calculate grid-free percentage based on actual self-sufficiency
  const selfSufficiencyRatio = Math.max(0, Math.min(1, (totalDailyLoad - totalGridNeeded) / totalDailyLoad))
  const gridFreePercent = Math.round(selfSufficiencyRatio * 100)
  const equilibriumSuggestion = `Recommended: ${solarSizeKw} kW solar + ${batteries.filter(b => b.model && b.quantity > 0).length} batteries for your loads & EVs (${gridFreePercent}% grid-free)`

  // Battery charged from solar as percentage
  const batteryChargedFromSolarPercent = totalBatteryCapacity > 0 
    ? Math.round((batteryCharged / totalBatteryCapacity) * 100)
    : 0

  // EVs charged free at home as percentage
  // totalFreeEvCharging already calculated above = day solar + night battery
  const evsChargedFreeAtHomePercent = evHomeChargingKwh > 0
    ? Math.round((totalFreeEvCharging / evHomeChargingKwh) * 100)
    : 0

  // Calculate hourly energy flow for visualization
  // Country-specific solar generation curves based on latitude and typical irradiance patterns
  const getSolarGenerationHourly = (hour: number): number => {
    // Country-specific sunrise/sunset times (approximate averages)
    const solarHours = {
      SG: { sunrise: 7.0, sunset: 19.0 }, // Singapore: ~1.3°N
      MY: { sunrise: 7.0, sunset: 19.0 }, // Malaysia: ~4°N
      TH: { sunrise: 6.5, sunset: 18.5 }, // Thailand: ~15°N
      ID: { sunrise: 6.0, sunset: 18.0 }, // Indonesia: ~2°S-7°N (using equatorial average)
      VN: { sunrise: 6.0, sunset: 18.0 }, // Vietnam: ~14°N-23°N (using northern average)
      PH: { sunrise: 6.0, sunset: 18.0 }, // Philippines: ~13°N
    }

    const { sunrise, sunset } = solarHours[country] || solarHours.SG // Default to Singapore
    if (hour < sunrise || hour >= sunset) return 0 // No solar outside daylight hours

    // Adjust sigma based on latitude - higher latitudes have more concentrated irradiance
    const latitudeAdjustment = Math.abs(country === 'TH' ? 15 : country === 'VN' ? 16 : 4) // Rough latitude
    const baseSigma = 3.2
    const sigma = baseSigma - (latitudeAdjustment / 20) // Slightly narrower curve for equatorial regions

    // Bell curve centered at solar noon (average of sunrise/sunset)
    const solarNoon = (sunrise + sunset) / 2
    const peakHour = solarNoon

    const normalized = Math.exp(-Math.pow((hour - peakHour) / sigma, 2) / 2)

    // Scale to match daily total using actual daylight hours
    const daylightHours = sunset - sunrise
    const hourlyFactor = normalized / Array.from({ length: Math.floor(daylightHours) }, (_, i) => {
      const h = sunrise + i + 0.5 // Sample at half-hour intervals
      return Math.exp(-Math.pow((h - peakHour) / sigma, 2) / 2)
    }).reduce((a, b) => a + b, 0)

    return dailySolarGeneration * hourlyFactor
  }

  // Household load distribution: higher during day, lower at night
  const getHouseholdLoadHourly = (hour: number): number => {
    const isDaytime = hour >= 6 && hour < 18
    const baseLoad = isDaytime ? dayLoadKwh / 12 : nightLoadKwh / 12
    // Add some variation (morning/evening peaks)
    let multiplier = 1.0
    if (hour >= 7 && hour <= 9) multiplier = 1.2 // Morning peak
    else if (hour >= 18 && hour <= 20) multiplier = 1.3 // Evening peak
    else if (hour >= 22 || hour < 6) multiplier = 0.7 // Late night lower
    return baseLoad * multiplier
  }

  // EV charging speed limits (kW)
  const HOME_CHARGING_SPEED_KW = 7 // Typical home AC charging (7-11kW)
  const PUBLIC_CHARGING_SPEED_KW = 100 // Assumed DC fast charging (user specified 100kW)

  // EV charging distribution based on individual vehicle preferences
  const getEvChargingHourly = (hour: number): number => {
    if (evHomeChargingKwh === 0) return 0

    let totalHourlyCharging = 0

    // Calculate charging for each vehicle individually based on its charging time preference
    vehicles.forEach(vehicle => {
      if (!vehicle.model || vehicle.quantity === 0) return

      // Get this vehicle's individual charging time preference
      const vehicleChargingTime = vehicle.evChargingTime ?? effectiveChargingTime
      const vehicleHomeChargingKwh = (evHomeChargingKwh * vehicle.quantity) / vehicles.filter(v => v.model && v.quantity > 0).length

      // Determine if this hour is available for this vehicle's charging
      let isChargingHour = false
      let maxChargingKw = 0
      let availableHours = 0

      if (vehicleChargingTime === 'Day only') {
        // Day charging: 6 AM - 6 PM, assume public DC fast charging available
        if (hour >= 6 && hour < 18) {
          isChargingHour = true
          maxChargingKw = PUBLIC_CHARGING_SPEED_KW
          availableHours = 12
        }
      } else if (vehicleChargingTime === 'Night only') {
        // Night charging: 7 PM - 6 AM, home AC charging
        if (hour >= 19 || hour < 6) {
          isChargingHour = true
          maxChargingKw = HOME_CHARGING_SPEED_KW
          availableHours = 11 // 19:00 to 06:00 = 11 hours
        }
      } else {
        // Both: day (public) and night (home) charging
        if (hour >= 6 && hour < 18) {
          // Day: public charging
          isChargingHour = true
          maxChargingKw = PUBLIC_CHARGING_SPEED_KW
          availableHours = 12 // Day hours
        } else if (hour >= 19 || hour < 6) {
          // Night: home charging
          isChargingHour = true
          maxChargingKw = HOME_CHARGING_SPEED_KW
          availableHours = 11 // Night hours
        }
      }

      if (!isChargingHour) return

      // Calculate this vehicle's charging for this hour
      let vehicleHourlyEnergyLimit = 0

      if (vehicleChargingTime === 'Both') {
        // In "Both" mode, split energy between day and night
        if (hour >= 6 && hour < 18) {
          // Day portion: 50% of energy over available hours
          vehicleHourlyEnergyLimit = Math.min(maxChargingKw, (vehicleHomeChargingKwh * 0.5) / 12)
        } else {
          // Night portion: 50% of energy over available hours
          vehicleHourlyEnergyLimit = Math.min(maxChargingKw, (vehicleHomeChargingKwh * 0.5) / 11)
        }
      } else {
        // Single period charging
        vehicleHourlyEnergyLimit = Math.min(maxChargingKw, vehicleHomeChargingKwh / availableHours)
      }

      totalHourlyCharging += vehicleHourlyEnergyLimit
    })

    return totalHourlyCharging
  }

  // Simulate hourly energy flow
  const hourlyData: Array<{
    hour: number
    solar: number
    batteryCharge: number
    batteryDischarge: number
    batteryLevel: number
    gridSupply: number
    gridExport: number
    householdLoad: number
    evCharging: number
    evChargingFromSolar: number
    evChargingFromBattery: number
    evChargingFromGrid: number
  }> = []

  // Ensure totalBatteryCapacity is valid (non-negative)
  const safeBatteryCapacity = Math.max(0, totalBatteryCapacity || 0)
  
  // First pass: Run simulation to establish end-of-day battery state
  // This simulates what the battery level would be at the end of a typical day
  // Start with 20% battery level to simulate carry-over from previous day
  let preliminaryBatteryLevel = safeBatteryCapacity * 0.2
  for (let hour = 0; hour < 24; hour++) {
    const hourlySolar = getSolarGenerationHourly(hour)
    const hourlyHouseholdLoad = getHouseholdLoadHourly(hour)
    const hourlyEvCharging = getEvChargingHourly(hour)
    
    let energyAvailable = hourlySolar
    
    // Power household load
    const householdLoadRemaining = Math.max(0, hourlyHouseholdLoad - energyAvailable)
    energyAvailable = Math.max(0, energyAvailable - hourlyHouseholdLoad)
    
    // Charge battery FIRST (before EV charging)
    if (energyAvailable > 0 && preliminaryBatteryLevel < safeBatteryCapacity) {
      const batterySpaceAvailable = safeBatteryCapacity - preliminaryBatteryLevel
      const hourlyBatteryCharge = Math.min(energyAvailable, batterySpaceAvailable)
      preliminaryBatteryLevel = Math.min(safeBatteryCapacity, preliminaryBatteryLevel + hourlyBatteryCharge)
      energyAvailable -= hourlyBatteryCharge
    }
    
    // Charge EV from solar
    let evChargingFromSolar = 0
    if (energyAvailable > 0 && hourlyEvCharging > 0) {
      evChargingFromSolar = Math.min(energyAvailable, hourlyEvCharging)
      energyAvailable -= evChargingFromSolar
    }
    
    // Handle remaining loads with battery
    let remainingLoad = householdLoadRemaining
    let remainingEvCharging = hourlyEvCharging - evChargingFromSolar
    
    if (remainingLoad > 0 || remainingEvCharging > 0) {
      // Priority: household load first, then EV charging
      if (remainingLoad > 0 && preliminaryBatteryLevel > 0.001) {
        const householdFromBattery = Math.min(preliminaryBatteryLevel, remainingLoad)
        preliminaryBatteryLevel -= householdFromBattery
        remainingLoad -= householdFromBattery
      }

      if (remainingEvCharging > 0 && preliminaryBatteryLevel > 0.001) {
        const evFromBattery = Math.min(preliminaryBatteryLevel, remainingEvCharging)
        preliminaryBatteryLevel -= evFromBattery
        remainingEvCharging -= evFromBattery
      }

      preliminaryBatteryLevel = Math.max(0, preliminaryBatteryLevel)
    }
    
    preliminaryBatteryLevel = Math.max(0, Math.min(safeBatteryCapacity, preliminaryBatteryLevel))
  }
  
  // Use end-of-day battery level as starting point for visualization
  // This represents the battery state at the start of the day (carried over from previous day)
  let currentBatteryLevel = Math.max(0, Math.min(safeBatteryCapacity, preliminaryBatteryLevel))

  // Second pass: Run simulation for visualization with proper starting battery level
  for (let hour = 0; hour < 24; hour++) {
    const hourlySolar = getSolarGenerationHourly(hour)
    const hourlyHouseholdLoad = getHouseholdLoadHourly(hour)
    const hourlyEvCharging = getEvChargingHourly(hour)
    
    let hourlyBatteryCharge = 0
    let hourlyBatteryDischarge = 0
    let hourlyGridSupply = 0
    let hourlyGridExport = 0
    let hourlyEvChargingFromSolar = 0
    let hourlyEvChargingFromBattery = 0
    let hourlyEvChargingFromGrid = 0
    
    let energyAvailable = hourlySolar
    
    // Priority 1: Power household load
    const householdLoadRemaining = Math.max(0, hourlyHouseholdLoad - energyAvailable)
    energyAvailable = Math.max(0, energyAvailable - hourlyHouseholdLoad)

    // Priority 2: Charge battery (if solar available and battery not full)
    // CRITICAL: Battery charging must happen BEFORE EV charging to ensure battery gets charged
    if (energyAvailable > 0 && currentBatteryLevel < safeBatteryCapacity) {
      const batterySpaceAvailable = safeBatteryCapacity - currentBatteryLevel
      hourlyBatteryCharge = Math.min(energyAvailable, batterySpaceAvailable)
      currentBatteryLevel = Math.min(safeBatteryCapacity, currentBatteryLevel + hourlyBatteryCharge)
      energyAvailable -= hourlyBatteryCharge
    }

    // Ensure battery level never exceeds capacity (safety check)
    currentBatteryLevel = Math.min(safeBatteryCapacity, Math.max(0, currentBatteryLevel))

    // Priority 3: Charge EV from remaining solar
    if (energyAvailable > 0 && hourlyEvCharging > 0) {
      hourlyEvChargingFromSolar = Math.min(energyAvailable, hourlyEvCharging)
      energyAvailable -= hourlyEvChargingFromSolar
    }
    
    // Priority 4: Export excess solar
    if (energyAvailable > 0) {
      hourlyGridExport = energyAvailable
    }
    
    // Handle remaining loads that need grid/battery
    let remainingLoad = householdLoadRemaining
    let remainingEvCharging = hourlyEvCharging - hourlyEvChargingFromSolar
    
    // Use battery for night loads/EV charging (priority: household first, then EV)
    if (remainingLoad > 0 || remainingEvCharging > 0) {
      // Priority 1: Household load
      if (remainingLoad > 0 && currentBatteryLevel > 0.001) {
        const householdFromBattery = Math.min(currentBatteryLevel, remainingLoad)
        hourlyBatteryDischarge += householdFromBattery
        currentBatteryLevel -= householdFromBattery
        remainingLoad -= householdFromBattery
      }

      // Priority 2: EV charging from remaining battery capacity
      if (remainingEvCharging > 0 && currentBatteryLevel > 0.001) {
        const evFromBattery = Math.min(currentBatteryLevel, remainingEvCharging)
        hourlyBatteryDischarge += evFromBattery
        hourlyEvChargingFromBattery = evFromBattery
        currentBatteryLevel -= evFromBattery
        remainingEvCharging -= evFromBattery
      }

      // Ensure battery level stays valid
      currentBatteryLevel = Math.max(0, currentBatteryLevel)
    }
    
    // Ensure battery level never goes negative (safety check after all operations)
    currentBatteryLevel = Math.max(0, currentBatteryLevel)
    
    // Remaining loads come from grid
    hourlyGridSupply = remainingLoad + remainingEvCharging
    hourlyEvChargingFromGrid = remainingEvCharging
    
    // Balance check: Ensure generation always equals consumption
    // If there's a mismatch, grid must supply the difference
    const totalGenerationWithoutGrid = hourlySolar + hourlyBatteryDischarge
    const totalConsumption = hourlyHouseholdLoad + hourlyEvCharging + hourlyBatteryCharge
    const requiredGridSupply = Math.max(0, totalConsumption - totalGenerationWithoutGrid)
    
    // If calculated grid supply is less than required, use the required amount
    if (hourlyGridSupply < requiredGridSupply) {
      const gridSupplyDifference = requiredGridSupply - hourlyGridSupply
      hourlyGridSupply = requiredGridSupply
      // Adjust EV charging from grid proportionally if needed
      if (remainingEvCharging > 0) {
        hourlyEvChargingFromGrid = remainingEvCharging + gridSupplyDifference
      }
    }
    
    // Debug: Detailed breakdown for hours 12 (12:00 - solar) and 22 (22:00 - EV charging)
    if (hour === 12 || hour === 22) {
      const totalGeneration = hourlySolar + hourlyBatteryDischarge + hourlyGridSupply
      const totalConsumption = hourlyHouseholdLoad + hourlyEvCharging + hourlyBatteryCharge
      const batteryLevelBefore = currentBatteryLevel + hourlyBatteryDischarge + hourlyEvChargingFromBattery
      console.log('=== Hour 2 (02:00) Detailed Breakdown ===')
      console.log('INITIAL VALUES:')
      console.log(`  Solar: ${hourlySolar.toFixed(3)} kWh`)
      console.log(`  Household Load: ${hourlyHouseholdLoad.toFixed(3)} kWh`)
      console.log(`  EV Charging: ${hourlyEvCharging.toFixed(3)} kWh`)
      console.log(`  Battery Level (start of hour): ${batteryLevelBefore.toFixed(3)} kWh`)
      console.log('AFTER SOLAR ALLOCATION:')
      console.log(`  Household Load Remaining: ${householdLoadRemaining.toFixed(3)} kWh`)
      console.log(`  EV Charging From Solar: ${hourlyEvChargingFromSolar.toFixed(3)} kWh`)
      console.log(`  EV Charging Remaining (after solar): ${(hourlyEvCharging - hourlyEvChargingFromSolar).toFixed(3)} kWh`)
      console.log('AFTER BATTERY DISCHARGE:')
      console.log(`  Battery Discharge (Household): ${hourlyBatteryDischarge.toFixed(3)} kWh`)
      console.log(`  Battery Discharge (EV): ${hourlyEvChargingFromBattery.toFixed(3)} kWh`)
      console.log(`  Remaining Load (after battery): ${remainingLoad.toFixed(3)} kWh`)
      console.log(`  Remaining EV Charging (after battery): ${remainingEvCharging.toFixed(3)} kWh`)
      console.log(`  Battery Level After: ${currentBatteryLevel.toFixed(3)} kWh`)
      console.log('FINAL CALCULATION:')
      console.log(`  hourlyGridSupply = remainingLoad + remainingEvCharging = ${remainingLoad.toFixed(3)} + ${remainingEvCharging.toFixed(3)} = ${hourlyGridSupply.toFixed(3)} kWh`)
      console.log('GENERATION:')
      console.log(`  Solar: ${hourlySolar.toFixed(3)} kWh`)
      console.log(`  Battery Usage: ${hourlyBatteryDischarge.toFixed(3)} kWh`)
      console.log(`  Grid: ${hourlyGridSupply.toFixed(3)} kWh`)
      console.log(`  Total Generation: ${totalGeneration.toFixed(3)} kWh`)
      console.log('CONSUMPTION:')
      console.log(`  Household Load: ${hourlyHouseholdLoad.toFixed(3)} kWh`)
      console.log(`  EV Charging: ${hourlyEvCharging.toFixed(3)} kWh`)
      console.log(`  Battery Charge: ${hourlyBatteryCharge.toFixed(3)} kWh`)
      console.log(`  Total Consumption: ${totalConsumption.toFixed(3)} kWh`)
      console.log('BALANCE CHECK:')
      console.log(`  Generation = Consumption: ${Math.abs(totalGeneration - totalConsumption) < 0.01 ? '✓ MATCH' : '✗ MISMATCH'}`)
      console.log(`  Difference: ${(totalGeneration - totalConsumption).toFixed(3)} kWh`)
      console.log('=========================================')
    }
    
    // Final safety check: ensure battery level is within valid bounds before storing
    // Use multiple clamping operations to handle any edge cases
    let finalBatteryLevel = currentBatteryLevel
    finalBatteryLevel = Math.max(0, finalBatteryLevel) // First ensure non-negative
    finalBatteryLevel = Math.min(safeBatteryCapacity, finalBatteryLevel) // Then ensure not over capacity
    finalBatteryLevel = Math.max(0, finalBatteryLevel) // Final clamp to be absolutely sure
    
    // Round and clamp one more time to handle any floating point precision issues
    finalBatteryLevel = Math.max(0, Math.round(finalBatteryLevel * 100) / 100)
    
    // One more absolute safety check before storing
    if (finalBatteryLevel < 0) {
      console.warn(`Battery level negative at hour ${hour}, clamping to 0. Value was:`, finalBatteryLevel)
      finalBatteryLevel = 0
    }
    
    hourlyData.push({
      hour,
      solar: Math.round(hourlySolar * 100) / 100,
      batteryCharge: Math.round(hourlyBatteryCharge * 100) / 100,
      batteryDischarge: Math.round(hourlyBatteryDischarge * 100) / 100,
      batteryLevel: finalBatteryLevel,
      gridSupply: Math.round(hourlyGridSupply * 100) / 100,
      gridExport: Math.round(hourlyGridExport * 100) / 100,
      householdLoad: Math.round(hourlyHouseholdLoad * 100) / 100,
      evCharging: Math.round(hourlyEvCharging * 100) / 100,
      evChargingFromSolar: Math.round(hourlyEvChargingFromSolar * 100) / 100,
      evChargingFromBattery: Math.round(hourlyEvChargingFromBattery * 100) / 100,
      evChargingFromGrid: Math.round(hourlyEvChargingFromGrid * 100) / 100,
    })
    
    // Update currentBatteryLevel for next iteration (use clamped value)
    currentBatteryLevel = Math.max(0, finalBatteryLevel)
  }

  // Calculate monthly grid export using realistic hourly data
  const dailyGridExport = hourlyData.reduce((sum, hour) => sum + hour.gridExport, 0)
  const monthlyGridExport = dailyGridExport * 30

  // Export credit calculations (now that we have realistic monthlyGridExport)
  const exportRate = ELECTRICITY_TARIFFS[country] * EXPORT_RATE_MULTIPLIER[country][netMetering]
  const monthlyExportCreditValue = monthlyGridExport * exportRate

  // Calculate bill with system: grid usage cost minus export credit value
  const monthlyGridUsageCost = actualMonthlyGridUsage * ELECTRICITY_TARIFFS[country]
  const monthlyBillWithSystem = Math.max(0, monthlyGridUsageCost - monthlyExportCreditValue)

  // Net grid needed (for display purposes - represents kWh you effectively pay for after currency offset)
  const monthlyGridNeeded = monthlyBillWithSystem / ELECTRICITY_TARIFFS[country]
  // Daily equivalent for compatibility with existing code
  gridNeeded = monthlyGridNeeded / 30

  // Calculate EV charging grid usage (needed for breakdown calculation)
  const monthlyGridUsedForEvChargingHome = (evChargeFromGridDay + evChargeFromGrid) * 30

  // Actual cost of home charging from grid (only the portion that comes from grid)
  const monthlyEvHomeChargingCostFromGrid = monthlyGridUsedForEvChargingHome * ELECTRICITY_TARIFFS[country]

  // Savings from charging at home:
  // 1. Avoided public charging cost (for the portion charged at home)
  // 2. Free charging from solar/battery (savings vs grid rate)
  // 3. Lower residential rate vs public rate for grid portion
  const avoidedPublicChargingCost = evHomeChargingKwh * 30 * evPublicChargingRate
  const freeChargingSavings = totalFreeEvCharging * 30 * ELECTRICITY_TARIFFS[country] // Savings from free solar/battery
  const rateDifferenceSavings = monthlyEvHomeChargingCostFromGrid * (evPublicChargingRate / ELECTRICITY_TARIFFS[country] - 1) // Savings from lower residential rate
  const monthlyEvChargingSavings = avoidedPublicChargingCost - monthlyEvHomeChargingCostFromGrid + freeChargingSavings

  // Calculate breakdown for monthly bill with system
  // Household power cost with system = grid usage for household (after export credit offset)
  // The grid usage cost already accounts for export credits, so we need to calculate household portion
  const householdGridUsage = dayLoadFromGrid + nightLoadRemaining
  const householdGridUsageCost = householdGridUsage * 30 * ELECTRICITY_TARIFFS[country]
  // Apply export credit proportionally (simplified: assume export credit offsets proportionally)
  const exportCreditRatio = monthlyExportCreditValue > 0 && monthlyGridUsageCost > 0
    ? Math.min(1, monthlyExportCreditValue / monthlyGridUsageCost)
    : 0
  const monthlyBillWithSystemHousehold = Math.max(0, householdGridUsageCost * (1 - exportCreditRatio))

  // EV home charging cost with system = grid usage for EV charging (after export credit offset)
  const evHomeGridUsageCost = monthlyGridUsedForEvChargingHome * ELECTRICITY_TARIFFS[country]
  const monthlyBillWithSystemEvHome = Math.max(0, evHomeGridUsageCost * (1 - exportCreditRatio))

  // Public charging cost is the same with or without system
  const monthlyBillWithSystemEvPublic = monthlyBillWithoutSystemEvPublic

  // Total EV power cost with system
  const monthlyBillWithSystemEvTotal = monthlyBillWithSystemEvHome + monthlyBillWithSystemEvPublic

  // Total cost with system = home electricity bill + public charging (public charging is same with/without system)
  const monthlyTotalCostWithSystem = monthlyBillWithSystem + monthlyBillWithoutSystemEvPublic

  // Monthly savings = bill without system - total cost with system (including public charging)
  const monthlySavings = monthlyBillWithoutSystem - monthlyTotalCostWithSystem

  // Calculate EV charging costs and savings
  // Grid electricity used for EV charging (monthly) - already calculated above
  // Cost of public charging (away from home) - using commercial fast charging rates (already defined above)
  // This is the same with or without system
  const evPublicChargingCost = evPublicChargingKwh * 30 * evPublicChargingRate

  // System cost
  const batteryCost = batteries.reduce((sum, b) => {
    if (!b.model) return sum
    const price = b.model.priceLocalCurrency[country] || 0
    return sum + (price * b.quantity)
  }, 0)

  const totalSolarCost = includeSolarCost ? solarSizeKw * SOLAR_COST_PER_KW[country] : 0
  const baseSystemCost = batteryCost + totalSolarCost
  const inverterMaintenanceCost = baseSystemCost * INVERTER_MAINTENANCE_PERCENT
  const totalSystemCost = baseSystemCost + inverterMaintenanceCost

  // Payback calculation (accounting for tariff inflation and yearly opex)
  // Simplified: use average savings over payback period
  let paybackYears = Infinity
  const yearlyOpex = totalSystemCost * YEARLY_OPEX_PERCENT
  if (monthlySavings > 0) {
    let cumulativeSavings = 0
    let year = 0

    while (cumulativeSavings < totalSystemCost && year < 50) {
      year++
      // Apply tariff inflation to savings
      const inflatedMonthlySavings = monthlySavings * Math.pow(1 + TARIFF_INFLATION_RATE, year - 1) * 12
      cumulativeSavings += inflatedMonthlySavings - yearlyOpex
    }
    paybackYears = year <= 50 ? year : Infinity
  }

  // Calculate 25-year net gains/expenses
  // With system: cumulative savings - system cost - maintenance
  // Without system: cumulative electricity costs
  let netGainsAfter25Years = -totalSystemCost // Start with negative (cost of system)
  let netGainsAfter25YearsWithoutSystem = 0
  let totalElectricityBill25YearsWithSystem = 0
  let totalElectricityBill25YearsWithoutSystem = 0
  let totalCost25YearsWithSystem = totalSystemCost // Start with system cost
  let totalCost25YearsWithoutSystem = 0

  for (let year = 1; year <= 25; year++) {
    // Calculate inflated monthly bills for this year
    const inflationFactor = Math.pow(1 + TARIFF_INFLATION_RATE, year - 1)
    const inflatedMonthlyBillWithSystem = monthlyBillWithSystem * inflationFactor
    const inflatedMonthlyBillWithoutSystem = monthlyBillWithoutSystem * inflationFactor
    // EV public charging costs also inflate with tariff inflation
    const inflatedMonthlyEvPublicCharging = monthlyBillWithoutSystemEvPublic * inflationFactor

    // Accumulate total electricity bills over 25 years
    totalElectricityBill25YearsWithSystem += inflatedMonthlyBillWithSystem * 12
    totalElectricityBill25YearsWithoutSystem += inflatedMonthlyBillWithoutSystem * 12

    // Accumulate total costs (electricity + EV + system cost)
    totalCost25YearsWithSystem += (inflatedMonthlyBillWithSystem + inflatedMonthlyEvPublicCharging) * 12 + yearlyOpex
    totalCost25YearsWithoutSystem += (inflatedMonthlyBillWithoutSystem + inflatedMonthlyEvPublicCharging) * 12

    // With system: savings increase with tariff inflation, minus yearly opex
    const inflatedMonthlySavings = monthlySavings * inflationFactor
    netGainsAfter25Years += (inflatedMonthlySavings * 12) - yearlyOpex

    // Without system: electricity costs increase with tariff inflation
    netGainsAfter25YearsWithoutSystem -= inflatedMonthlyBillWithoutSystem * 12
  }

  // Zero-bill days calculation
  // Simple approach: Self-sufficiency percentage directly maps to zero-bill days percentage

  let zeroBillDaysPerYear = 0

  // Check if country has export credits
  const hasExportCredits = EXPORT_RATE_MULTIPLIER[country][netMetering] > 0

  if (monthlyBillWithSystem < 0.1) {
    // If monthly bill is essentially zero, the system is fully self-sufficient
    zeroBillDaysPerYear = 365
  } else if (!hasExportCredits) {
    // For countries WITHOUT export credits (e.g., Malaysia)
    // Approach: Self-sufficiency % = Zero-bill days %
    const gridIndependencePercent = monthlyBillWithSystem < 0.1 ? 100 :
      Math.max(0, (1 - monthlyBillWithSystem / monthlyBillWithoutSystem) * 100)
    zeroBillDaysPerYear = (gridIndependencePercent / 100) * 365
  } else {
    // For countries WITH export credits (e.g., Singapore)
    // Approach: Account for export credits in zero-bill calculation
    const effectiveBill = Math.max(0, monthlyBillWithSystem)
    const gridIndependencePercent = monthlyBillWithSystem < 0.1 ? 100 :
      Math.max(0, (1 - effectiveBill / monthlyBillWithoutSystem) * 100)
    zeroBillDaysPerYear = (gridIndependencePercent / 100) * 365
  }

  return {
    dailySolarGeneration: Math.round(dailySolarGeneration * 10) / 10,
    batteryChargedFromSolarPercent,
    evsChargedFreeAtHomePercent,
    gridElectricityNeededThisMonth: Math.round(monthlyGridNeeded * 10) / 10,
    actualGridUsageThisMonth: Math.round(actualMonthlyGridUsage * 10) / 10,
    monthlyGridExport: Math.round(monthlyGridExport * 10) / 10,
    monthlyExportCreditValue: Math.round(monthlyExportCreditValue * 10) / 10,
    monthlyBillWithoutSystem: Math.round(monthlyBillWithoutSystem * 10) / 10,
    monthlyGridUsageCost: Math.round(monthlyGridUsageCost * 10) / 10,
    monthlyBillWithSystem: Math.round(monthlyBillWithSystem * 10) / 10,
    monthlyTotalCostWithSystem: Math.round(monthlyTotalCostWithSystem * 10) / 10,
    monthlySavings: Math.round(monthlySavings * 10) / 10,
    fullSystemPaybackYears: paybackYears === Infinity ? Infinity : Math.round(paybackYears * 10) / 10,
    zeroBillDaysPerYear,
    co2AvoidedPerYear: Math.round(co2AvoidedPerYear),
    equilibriumSuggestion,
    solarCost: Math.round(totalSolarCost),
    batteryCost: Math.round(batteryCost),
    totalSystemCost: Math.round(totalSystemCost),
    netGainsAfter25Years: Math.round(netGainsAfter25Years),
    netGainsAfter25YearsWithoutSystem: Math.round(netGainsAfter25YearsWithoutSystem),
    totalElectricityBill25YearsWithSystem: Math.round(totalElectricityBill25YearsWithSystem),
    totalElectricityBill25YearsWithoutSystem: Math.round(totalElectricityBill25YearsWithoutSystem),
    totalCost25YearsWithSystem: Math.round(totalCost25YearsWithSystem),
    totalCost25YearsWithoutSystem: Math.round(totalCost25YearsWithoutSystem),
    monthlyGridUsedForEvCharging: Math.round(monthlyGridUsedForEvChargingHome * 10) / 10,
    monthlyGridUsedForEvChargingHome: Math.round(monthlyGridUsedForEvChargingHome * 10) / 10,
    monthlyEvPublicChargingEnergy: Math.round(monthlyEvPublicChargingEnergy * 10) / 10,
    monthlyEvPublicChargingCost: Math.round(monthlyEvPublicChargingCost * 10) / 10,
    monthlyEvChargingSavings: Math.round(monthlyEvChargingSavings * 10) / 10,
    monthlyTotalEnergyUsed: Math.round(monthlyTotalEnergyUsed * 10) / 10,
    monthlyHomeEnergyUsed: Math.round(monthlyHomeEnergyUsed * 10) / 10,
    monthlyEvEnergyUsed: Math.round(monthlyEvEnergyUsed * 10) / 10,
    monthlyBillWithoutSystemHousehold: Math.round(monthlyBillWithoutSystemHousehold * 10) / 10,
    monthlyBillWithoutSystemEvTotal: Math.round(monthlyBillWithoutSystemEvTotal * 10) / 10,
    monthlyBillWithoutSystemEvHome: Math.round(monthlyBillWithoutSystemEvHome * 10) / 10,
    monthlyBillWithoutSystemEvPublic: Math.round(monthlyBillWithoutSystemEvPublic * 10) / 10,
    monthlyBillWithSystemHousehold: Math.round(monthlyBillWithSystemHousehold * 10) / 10,
    monthlyBillWithSystemEvTotal: Math.round(monthlyBillWithSystemEvTotal * 10) / 10,
    monthlyBillWithSystemEvHome: Math.round(monthlyBillWithSystemEvHome * 10) / 10,
    monthlyBillWithSystemEvPublic: Math.round(monthlyBillWithSystemEvPublic * 10) / 10,
    energyFlow: {
      solarGeneration: Math.round(dailySolarGeneration * 10) / 10,
      batteryDischarge: Math.round((batteryDischarge + evChargeFromBattery) * 10) / 10,
      gridSupply: Math.round(totalGridNeeded * 10) / 10,
      daytimeLoad: Math.round(dayLoadKwh * 10) / 10,
      nighttimeLoad: Math.round(nightLoadKwh * 10) / 10,
      batteryCharging: Math.round(batteryCharged * 10) / 10,
      evCharging: Math.round(evHomeChargingKwh * 10) / 10,
      evChargingFromSolar: Math.round(evChargeFromSolar * 10) / 10,
      evChargingFromBattery: Math.round(evChargeFromBattery * 10) / 10,
      evChargingFromGrid: Math.round((evChargeFromGridDay + evChargeFromGrid) * 10) / 10,
      excessSolarExported: Math.round(hourlyData.reduce((sum, hour) => sum + hour.gridExport, 0) * 10) / 10,
      hourly: hourlyData,
    },
  }
}

/**
 * Find optimal solar + battery combination for best 25-year net savings
 */
export function findBestNetSavingsSystem(
  baseInputs: Omit<ZeroBillInputs, 'solarSizeKw' | 'batteries' | 'includeSolarCost'>,
  availableBatteries: BESS[],
  maxSolarKw: number = 30,
  maxBatteries: number = 4
): OptimalSystem | null {
  if (availableBatteries.length === 0) return null

  let bestSystem: OptimalSystem | null = null
  let bestNetSavings = -Infinity

  // Test different solar sizes (0 to maxSolarKw, step 2kW for performance)
  for (let solarKw = 0; solarKw <= maxSolarKw; solarKw += 2) {
    // Test different battery combinations
    const batteryCombinations: Array<Array<{ model: BESS | null; quantity: number }>> = [
      [{ model: null, quantity: 0 }], // No battery
    ]

    // Single battery options
    for (const battery of availableBatteries) {
      batteryCombinations.push([{ model: battery, quantity: 1 }])
    }

    // Multiple batteries (up to maxBatteries of same model)
    for (const battery of availableBatteries) {
      for (let qty = 2; qty <= maxBatteries; qty++) {
        batteryCombinations.push([{ model: battery, quantity: qty }])
      }
    }

    // Test each battery combination
    for (const batteryCombo of batteryCombinations) {
      const inputs: ZeroBillInputs = {
        ...baseInputs,
        solarSizeKw: solarKw,
        batteries: batteryCombo,
        includeSolarCost: true,
      }

      try {
        const result = calculateZeroBill(inputs)
        const netSavings = result.totalCost25YearsWithoutSystem - result.totalCost25YearsWithSystem

        if (netSavings > bestNetSavings) {
          bestNetSavings = netSavings
          bestSystem = {
            solarSizeKw: solarKw,
            batteries: batteryCombo,
            paybackYears: result.fullSystemPaybackYears,
            monthlySavings: result.monthlySavings,
            totalSystemCost: result.totalSystemCost,
            totalCost25YearsWithSystem: result.totalCost25YearsWithSystem,
            totalCost25YearsWithoutSystem: result.totalCost25YearsWithoutSystem,
            netSavings25Years: netSavings,
          }
        }
      } catch (error) {
        // Skip invalid combinations
        continue
      }
    }
  }

  return bestSystem
}

/**
 * Find optimal solar + battery combination for minimum payback time
 */
export function findOptimalSystem(
  baseInputs: Omit<ZeroBillInputs, 'solarSizeKw' | 'batteries' | 'includeSolarCost'>,
  availableBatteries: BESS[],
  maxSolarKw: number = 30,
  maxBatteries: number = 4
): OptimalSystem | null {
  let bestSystem: OptimalSystem | null = null
  let bestPayback = Infinity

  // Test different solar sizes (0 to maxSolarKw, step 2kW for performance)
  for (let solarKw = 0; solarKw <= maxSolarKw; solarKw += 2) {
    // Test different battery combinations
    // Try no battery, single battery (each model), and combinations up to maxBatteries
    const batteryCombinations: Array<Array<{ model: BESS | null; quantity: number }>> = [
      [{ model: null, quantity: 0 }], // No battery
    ]

    // Single battery options
    for (const battery of availableBatteries) {
      batteryCombinations.push([{ model: battery, quantity: 1 }])
    }

    // Multiple batteries (up to maxBatteries of same model)
    for (const battery of availableBatteries) {
      for (let qty = 2; qty <= maxBatteries; qty++) {
        batteryCombinations.push([{ model: battery, quantity: qty }])
      }
    }

    // Test each battery combination
    for (const batteryCombo of batteryCombinations) {
      const inputs: ZeroBillInputs = {
        ...baseInputs,
        solarSizeKw: solarKw,
        batteries: batteryCombo,
        includeSolarCost: true, // Always include cost for optimization
      }

      try {
        const result = calculateZeroBill(inputs)
        
        // Skip if payback is infinite or savings are negative
        if (result.fullSystemPaybackYears === Infinity || result.monthlySavings <= 0) {
          continue
        }

        // Find the best payback time
        if (result.fullSystemPaybackYears < bestPayback) {
          bestPayback = result.fullSystemPaybackYears
          bestSystem = {
            solarSizeKw: solarKw,
            batteries: batteryCombo,
            paybackYears: result.fullSystemPaybackYears,
            monthlySavings: result.monthlySavings,
            totalSystemCost: result.totalSystemCost,
          }
        }
      } catch (error) {
        // Skip invalid combinations
        continue
      }
    }
  }

  return bestSystem
}

/**
 * Find optimal off-grid system (zero grid dependency)
 * Calculates minimum solar + battery needed to cover all loads
 */
export function findOffGridSystem(
  baseInputs: Omit<ZeroBillInputs, 'solarSizeKw' | 'batteries' | 'includeSolarCost'>,
  availableBatteries: BESS[],
  maxSolarKw: number = 30,
  maxBatteries: number = 4
): OptimalSystem | null {

  // Calculate total daily energy needs
  const dayLoadKwh = typeof baseInputs.dayLoad === 'number' 
    ? baseInputs.dayLoad 
    : LOAD_PROFILES[baseInputs.dayLoad].day
  const nightLoadKwh = typeof baseInputs.nightLoad === 'number'
    ? baseInputs.nightLoad
    : LOAD_PROFILES[baseInputs.nightLoad].night

  // Calculate EV charging needs
  let totalEvDailyKwhNeeded = 0
  
  // Safety check: ensure vehicles array exists
  if (baseInputs.vehicles && Array.isArray(baseInputs.vehicles)) {
    baseInputs.vehicles.forEach(v => {
      if (!v.model || !v.model.batteryCapacityKwh || v.quantity === 0) return
      const rangeKm = v.model.rangeWltpKm ?? v.model.rangeKm ?? 
                      (v.model.efficiencyKwhPer100km && v.model.efficiencyKwhPer100km > 0 && v.model.batteryCapacityKwh
                        ? (v.model.batteryCapacityKwh / v.model.efficiencyKwhPer100km * 100) 
                        : null)
      if (!rangeKm || rangeKm <= 0) return
      
      // Safety check: ensure drivingDistanceKm is valid
      const drivingDistance = baseInputs.drivingDistanceKm || 0
      if (drivingDistance <= 0 || isNaN(drivingDistance)) return
      
      const kwhPerKm = v.model.batteryCapacityKwh / rangeKm
      if (isNaN(kwhPerKm) || !isFinite(kwhPerKm)) return
      
      const dailyKwhPerVehicle = drivingDistance * kwhPerKm
      if (isNaN(dailyKwhPerVehicle) || !isFinite(dailyKwhPerVehicle)) return
      
      totalEvDailyKwhNeeded += dailyKwhPerVehicle * v.quantity
    })
  }
  
  // Ensure totalEvDailyKwhNeeded is valid
  if (isNaN(totalEvDailyKwhNeeded) || !isFinite(totalEvDailyKwhNeeded)) {
    totalEvDailyKwhNeeded = 0
  }

  // Safety check: ensure evHomeChargingPercentage is valid
  const evHomeChargingPct = (baseInputs.evHomeChargingPercentage || 0) / 100
  let evHomeChargingKwh = totalEvDailyKwhNeeded * evHomeChargingPct
  
  // Ensure evHomeChargingKwh is valid
  if (isNaN(evHomeChargingKwh) || !isFinite(evHomeChargingKwh) || evHomeChargingKwh < 0) {
    // If calculation failed, set to 0 to prevent errors
    evHomeChargingKwh = 0
  }

  // Calculate EV charging distribution based on charging time preference
  let dayEvChargingKwh = 0
  let nightEvChargingKwh = 0

  // Ensure evHomeChargingKwh is valid before distribution
  if (isNaN(evHomeChargingKwh) || !isFinite(evHomeChargingKwh) || evHomeChargingKwh < 0) {
    evHomeChargingKwh = 0
  }

  if (baseInputs.evChargingTime === 'Day only') {
    dayEvChargingKwh = evHomeChargingKwh
    nightEvChargingKwh = 0
  } else if (baseInputs.evChargingTime === 'Night only') {
    dayEvChargingKwh = 0
    nightEvChargingKwh = evHomeChargingKwh
  } else { // 'Both'
    dayEvChargingKwh = evHomeChargingKwh * 0.5
    nightEvChargingKwh = evHomeChargingKwh * 0.5
  }
  
  // Ensure distribution values are valid
  if (isNaN(dayEvChargingKwh) || !isFinite(dayEvChargingKwh) || dayEvChargingKwh < 0) {
    dayEvChargingKwh = 0
  }
  if (isNaN(nightEvChargingKwh) || !isFinite(nightEvChargingKwh) || nightEvChargingKwh < 0) {
    nightEvChargingKwh = 0
  }

  // Calculate solar yield per kW
  const baseSolarYield = SOLAR_YIELD_PER_KW[baseInputs.country] || 4.0 // Default fallback
  const roofMultiplier = ROOF_QUALITY_MULTIPLIERS[baseInputs.roofQuality] || 1.0 // Default fallback
  let solarYieldPerKw = baseSolarYield * roofMultiplier
  
  // Safety check: ensure solar yield is valid and not zero
  if (isNaN(solarYieldPerKw) || !isFinite(solarYieldPerKw) || solarYieldPerKw <= 0) {
    solarYieldPerKw = 4.0 // Default fallback to prevent division by zero
  }

  // For off-grid, calculate solar and battery sizing based on individual vehicle charging preferences
  let daytimeLoadWithEv = dayLoadKwh || 0
  let nighttimeLoadWithEv = nightLoadKwh || 0

  // Distribute EV charging based on each vehicle's individual charging time preference
  baseInputs.vehicles.forEach(vehicle => {
    if (!vehicle.model || vehicle.quantity === 0) return

    const vehicleChargingTime = vehicle.evChargingTime ?? baseInputs.evChargingTime ?? 'Night only'
    const vehicleHomeChargingKwh = (evHomeChargingKwh || 0) * vehicle.quantity / baseInputs.vehicles.filter(v => v.model && v.quantity > 0).length

    if (vehicleChargingTime === 'Day only') {
      daytimeLoadWithEv += vehicleHomeChargingKwh
    } else if (vehicleChargingTime === 'Night only') {
      nighttimeLoadWithEv += vehicleHomeChargingKwh
    } else if (vehicleChargingTime === 'Both') {
      // Split this vehicle's charging between day and night
      daytimeLoadWithEv += vehicleHomeChargingKwh * 0.5
      nighttimeLoadWithEv += vehicleHomeChargingKwh * 0.5
    }
  })

  // Solar needs to cover daytime loads + charge battery for nighttime loads
  const totalDaytimeLoad = daytimeLoadWithEv
  const totalNighttimeLoad = nighttimeLoadWithEv

  // Ensure loads are valid
  if (isNaN(totalDaytimeLoad) || !isFinite(totalDaytimeLoad) || totalDaytimeLoad < 0 ||
      isNaN(totalNighttimeLoad) || !isFinite(totalNighttimeLoad) || totalNighttimeLoad < 0) {
    return null
  }

  // Solar must generate enough for daytime loads + battery charging for nighttime loads
  // Total daily energy needed: day load + night load (both served by solar, night via battery)
  const totalDailyEnergyNeeded = totalDaytimeLoad + totalNighttimeLoad
  const requiredSolarKw = Math.ceil((totalDailyEnergyNeeded * 1.15) / solarYieldPerKw) // 15% buffer for efficiency losses and cloudy days

  // Ensure requiredSolarKw is valid
  if (isNaN(requiredSolarKw) || !isFinite(requiredSolarKw) || requiredSolarKw < 0) {
    return null
  }
  
  const nighttimeLoad = totalNighttimeLoad
  
  // Battery must store enough energy for nighttime loads
  // Battery must store enough energy for nighttime loads
  // CRITICAL: Battery must handle PEAK hourly consumption (household + EV simultaneously)
  // Night hours: 19:00 to 06:00 = 11 hours
  const nightHours = 11
  
  // Calculate peak hourly consumption during nighttime
  // This is the MAXIMUM simultaneous consumption (household + EV at same hour)
  let peakNighttimeHourlyLoad = 0
  let nighttimeEvChargingTotal = 0

  // Calculate total EV charging that happens at night
  baseInputs.vehicles.forEach(vehicle => {
    if (!vehicle.model || vehicle.quantity === 0) return

    const vehicleChargingTime = vehicle.evChargingTime ?? baseInputs.evChargingTime ?? 'Night only'
    const vehicleHomeChargingKwh = (evHomeChargingKwh || 0) * vehicle.quantity / baseInputs.vehicles.filter(v => v.model && v.quantity > 0).length

    if (vehicleChargingTime === 'Night only') {
      nighttimeEvChargingTotal += vehicleHomeChargingKwh
    } else if (vehicleChargingTime === 'Both') {
      nighttimeEvChargingTotal += vehicleHomeChargingKwh * 0.5
    }
    // Day only vehicles don't contribute to nighttime charging
  })

  if (nighttimeEvChargingTotal > 0) {
    // Peak household load per hour (use maximum possible, not average)
    // Nighttime household can have peaks, so use 1.5x average for safety
    const avgNightHouseholdPerHour = (nightLoadKwh || 0) / nightHours
    const peakHouseholdPerHour = avgNightHouseholdPerHour * 1.5 // 50% peak factor

    // EV charging: can be up to 7kW per hour (home charging speed limit)
    // Use the actual maximum: either 7kW (if charging is concentrated) or average
    // For safety, assume it can reach 7kW at peak hours
    const maxEvChargingPerHour = Math.min(7, Math.max(nighttimeEvChargingTotal / nightHours, 5)) // At least 5kW or actual max

    // Peak hourly load = household peak + EV charging (BOTH happening simultaneously)
    peakNighttimeHourlyLoad = peakHouseholdPerHour + maxEvChargingPerHour
  } else {
    // No nighttime EV charging: just household nighttime load with peak factor
    const avgNightHouseholdPerHour = (nightLoadKwh || 0) / nightHours
    peakNighttimeHourlyLoad = avgNightHouseholdPerHour * 1.5
  }
  
  // Battery sizing for off-grid: more realistic approach
  // 1. Must cover total nighttime load (household + EV)
  // 2. Add buffer for peak demand (1-2 hours, not 3)
  // 3. Reasonable autonomy (1.5x for cloudy days, not 2.5x)

  const baseBatteryNeeded = nighttimeLoad
  // Peak buffer: 2 hours of peak consumption (more reasonable than 3)
  const peakHourBuffer = peakNighttimeHourlyLoad * 2
  // Total with reasonable autonomy multiplier (1.5x instead of 2.5x)
  let requiredBatteryKwh = Math.ceil((baseBatteryNeeded + peakHourBuffer) * 1.5)

  // Minimum safety: cover one full night + 2 hours peak
  const minimumBattery = nighttimeLoad + (peakNighttimeHourlyLoad * 2)
  requiredBatteryKwh = Math.max(requiredBatteryKwh, Math.ceil(minimumBattery))

  // Find cheapest single battery type that meets capacity requirement
  let bestBatteryCombo: Array<{ model: BESS | null; quantity: number }> = [{ model: null, quantity: 0 }]
  let bestBatteryCost = Infinity

  for (const battery of availableBatteries) {
    for (let qty = 1; qty <= maxBatteries; qty++) {
      const capacity = battery.usableCapacityKwh * (1 - BATTERY_DEGRADATION_RATE * 5) * qty
      if (capacity >= requiredBatteryKwh) {
        const cost = (battery.priceLocalCurrency[baseInputs.country] || 0) * qty
        if (cost < bestBatteryCost) {
          bestBatteryCost = cost
          bestBatteryCombo = [{ model: battery, quantity: qty }]
        }
      }
    }
  }

  // If no battery meets requirement, use largest available with required quantity
  if (bestBatteryCombo[0]?.model === null && availableBatteries.length > 0) {
    const largestBattery = availableBatteries.reduce((largest, b) =>
      (b.usableCapacityKwh > largest.usableCapacityKwh) ? b : largest
    )
    const qtyNeeded = Math.ceil(requiredBatteryKwh / (largestBattery.usableCapacityKwh * (1 - BATTERY_DEGRADATION_RATE * 5)))
    bestBatteryCombo = [{ model: largestBattery, quantity: Math.min(qtyNeeded, maxBatteries) }]
  }

  // Calculate system cost
  const solarCost = requiredSolarKw * SOLAR_COST_PER_KW[baseInputs.country]
  const batteryCost = bestBatteryCombo.reduce((sum, b) => {
    if (!b.model) return sum
    const price = b.model.priceLocalCurrency[baseInputs.country] || 0
    return sum + (price * b.quantity)
  }, 0)
  const baseSystemCost = batteryCost + solarCost
  const inverterMaintenanceCost = baseSystemCost * INVERTER_MAINTENANCE_PERCENT
  const totalSystemCost = baseSystemCost + inverterMaintenanceCost

  // Test the calculated system configuration
  const testInputs: ZeroBillInputs = {
    ...baseInputs,
    solarSizeKw: requiredSolarKw,
    batteries: bestBatteryCombo,
    includeSolarCost: true,
  }

  try {
    const result = calculateZeroBill(testInputs)

    // Check if it's truly off-grid (no significant grid usage)
    const hasGridImports = result.energyFlow.hourly.some(hour => hour.gridSupply > 0.5)

    if (!hasGridImports && result.gridElectricityNeededThisMonth <= 1.0) {
      // Recalculate cost with actual solar size used
      const actualSolarCost = requiredSolarKw * SOLAR_COST_PER_KW[baseInputs.country]
      const actualBatteryCost = bestBatteryCombo.reduce((sum, b) => {
        if (!b.model) return sum
        const price = b.model.priceLocalCurrency[baseInputs.country] || 0
        return sum + (price * b.quantity)
      }, 0)
      const actualBaseCost = actualBatteryCost + actualSolarCost
      const actualTotalCost = actualBaseCost + (actualBaseCost * INVERTER_MAINTENANCE_PERCENT)

      return {
        solarSizeKw: requiredSolarKw,
        batteries: bestBatteryCombo,
        paybackYears: result.fullSystemPaybackYears,
        monthlySavings: result.monthlySavings,
        totalSystemCost: actualTotalCost,
        gridElectricityNeeded: result.gridElectricityNeededThisMonth,
      }
    }
  } catch (error) {
    // Configuration failed
  }

  // No valid off-grid system found
  return null
}

/**
 * Find solar + battery combination for zero monthly bill
 */
export function findZeroBillSystem(
  baseInputs: Omit<ZeroBillInputs, 'solarSizeKw' | 'batteries' | 'includeSolarCost'>,
  availableBatteries: BESS[],
  maxSolarKw: number = 30,
  maxBatteries: number = 4
): OptimalSystem | null {
  if (availableBatteries.length === 0) return null

  let bestSystem: OptimalSystem | null = null
  let bestBill = Infinity

  // Start with a reasonable solar size estimate
  const estimatedLoad = (baseInputs.dayLoad + baseInputs.nightLoad)
  const estimatedSolarKw = Math.min(Math.ceil(estimatedLoad * 1.2 / 4.5), maxSolarKw) // Rough estimate

  // Try solar sizes around the estimate
  for (let solarKw = Math.max(0, estimatedSolarKw - 5); solarKw <= Math.min(maxSolarKw, estimatedSolarKw + 5); solarKw += 2) {
    // Test reasonable battery combinations
    const batteryCombinations: Array<Array<{ model: BESS | null; quantity: number }>> = [
      [{ model: null, quantity: 0 }], // No battery
    ]

    // Add a few reasonable battery options
    for (const battery of availableBatteries.slice(0, 3)) { // Test top 3 battery types
      batteryCombinations.push([{ model: battery, quantity: 1 }])
      if (maxBatteries >= 2) batteryCombinations.push([{ model: battery, quantity: 2 }])
    }

    // Test each battery combination
    for (const batteryCombo of batteryCombinations) {
      const inputs: ZeroBillInputs = {
        ...baseInputs,
        solarSizeKw: solarKw,
        batteries: batteryCombo,
        includeSolarCost: true,
      }

      try {
        const result = calculateZeroBill(inputs)
        
        // Check if country supports grid export credits
        const hasExportCredits = EXPORT_RATE_MULTIPLIER[baseInputs.country].net_billing > 0
        
        // For zero-bill:
        // - Countries WITHOUT export credits (e.g., Malaysia): must have no grid imports at any hour
        // - Countries WITH export credits: monthly bill must be zero (imports can be offset by exports)
        let isValidZeroBill = false
        
        if (!hasExportCredits) {
          // No export credits: must be truly off-grid (no significant grid imports)
          const hasGridImports = result.energyFlow.hourly.some(hour => hour.gridSupply > 0.5)
          isValidZeroBill = !hasGridImports && result.monthlyBillWithSystem <= 0.1
        } else {
          // Has export credits: monthly bill must be zero (net zero)
          isValidZeroBill = result.monthlyBillWithSystem <= 0.1
        }
        
        // Find the system that achieves true zero bill
        if (isValidZeroBill && (bestSystem === null || result.totalSystemCost < bestSystem.totalSystemCost)) {
          bestBill = result.monthlyBillWithSystem
          bestSystem = {
            solarSizeKw: solarKw,
            batteries: batteryCombo,
            paybackYears: result.fullSystemPaybackYears,
            monthlySavings: result.monthlySavings,
            totalSystemCost: result.totalSystemCost,
            gridElectricityNeeded: result.gridElectricityNeededThisMonth,
          }
        }
      } catch (error) {
        // Skip invalid combinations
        continue
      }
    }
  }

  return bestSystem
}
