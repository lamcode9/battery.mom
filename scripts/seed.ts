import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample vehicle data for seeding
// In production, this would fetch from APIs or scrape from sources
const sampleVehicles = [
  {
    country: 'SG' as const,
    name: 'Tesla Model 3',
    modelTrim: 'Long Range AWD',
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
    batteryWeightKg: 480,
    curbWeightKg: 1847,
    batteryWeightPercentage: 26.0,
    powerRatingKw: 283,
    powerRatingExplanation: 'Power rating (kW) is like the engine\'s muscle – higher means quicker acceleration, but efficiency matters more for daily drives. Think 283kW as very zippy, great for highway merging and spirited driving.',
    efficiencyKwhPer100km: 13.5,
    rangeKm: 602,
    manufacturerCostUsd: 38000,
    batteryManufacturer: 'Panasonic',
    batteryTechnology: 'NMC' as const,
    chargingTimeDc0To80Min: 30,
    chargingCapabilities: 'Up to 250kW DC, 11kW AC',
    basePriceLocalCurrency: 75000,
    optionPrices: [
      { name: 'Full Self-Driving', price: 12000 },
      { name: 'Premium Interior', price: 5000 },
    ],
    onTheRoadPriceLocalCurrency: 95000,
    rebates: [
      {
        name: 'EV Early Adoption Incentive',
        amount: 20000,
        description: 'Singapore government rebate for early EV adopters',
      },
    ],
    isAvailable: true,
  },
  {
    country: 'SG' as const,
    name: 'BYD Atto 3',
    modelTrim: 'Extended Range',
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800',
    batteryWeightKg: 450,
    curbWeightKg: 1750,
    batteryWeightPercentage: 25.7,
    powerRatingKw: 150,
    powerRatingExplanation: 'Power rating (kW) is like the engine\'s muscle – higher means quicker acceleration, but efficiency matters more for daily drives. Think 150kW as zippy city commuting with good highway performance.',
    efficiencyKwhPer100km: 14.2,
    rangeKm: 480,
    manufacturerCostUsd: 25000,
    batteryManufacturer: 'BYD',
    batteryTechnology: 'LFP' as const,
    chargingTimeDc0To80Min: 35,
    chargingCapabilities: 'Up to 88kW DC, 7kW AC',
    basePriceLocalCurrency: 180000,
    optionPrices: [],
    onTheRoadPriceLocalCurrency: 200000,
    rebates: [
      {
        name: 'EV Early Adoption Incentive',
        amount: 20000,
        description: 'Singapore government rebate for early EV adopters',
      },
    ],
    isAvailable: true,
  },
  {
    country: 'MY' as const,
    name: 'Tesla Model 3',
    modelTrim: 'Standard Range Plus',
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
    batteryWeightKg: 420,
    curbWeightKg: 1745,
    batteryWeightPercentage: 24.1,
    powerRatingKw: 202,
    powerRatingExplanation: 'Power rating (kW) is like the engine\'s muscle – higher means quicker acceleration, but efficiency matters more for daily drives. Think 202kW as zippy city commuting with good highway performance.',
    efficiencyKwhPer100km: 13.8,
    rangeKm: 448,
    manufacturerCostUsd: 35000,
    batteryManufacturer: 'CATL',
    batteryTechnology: 'LFP' as const,
    chargingTimeDc0To80Min: 32,
    chargingCapabilities: 'Up to 170kW DC, 11kW AC',
    basePriceLocalCurrency: 189000,
    optionPrices: [
      { name: 'Full Self-Driving', price: 50000 },
    ],
    onTheRoadPriceLocalCurrency: 240000,
    rebates: [
      {
        name: 'VEP Exemption',
        amount: 5000,
        description: 'Malaysia VEP exemption for EVs',
      },
    ],
    isAvailable: true,
  },
  {
    country: 'MY' as const,
    name: 'BYD Atto 3',
    modelTrim: 'Extended Range',
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800',
    batteryWeightKg: 450,
    curbWeightKg: 1750,
    batteryWeightPercentage: 25.7,
    powerRatingKw: 150,
    powerRatingExplanation: 'Power rating (kW) is like the engine\'s muscle – higher means quicker acceleration, but efficiency matters more for daily drives. Think 150kW as zippy city commuting with good highway performance.',
    efficiencyKwhPer100km: 14.2,
    rangeKm: 480,
    manufacturerCostUsd: 25000,
    batteryManufacturer: 'BYD',
    batteryTechnology: 'LFP' as const,
    chargingTimeDc0To80Min: 35,
    chargingCapabilities: 'Up to 88kW DC, 7kW AC',
    basePriceLocalCurrency: 150000,
    optionPrices: [],
    onTheRoadPriceLocalCurrency: 165000,
    rebates: [
      {
        name: 'VEP Exemption',
        amount: 5000,
        description: 'Malaysia VEP exemption for EVs',
      },
    ],
    isAvailable: true,
  },
  {
    country: 'SG' as const,
    name: 'Hyundai IONIQ 5',
    modelTrim: 'Long Range 2WD',
    imageUrl: 'https://images.unsplash.com/photo-1606664515526-82c40b908d5c?w=800',
    batteryWeightKg: 500,
    curbWeightKg: 1950,
    batteryWeightPercentage: 25.6,
    powerRatingKw: 160,
    powerRatingExplanation: 'Power rating (kW) is like the engine\'s muscle – higher means quicker acceleration, but efficiency matters more for daily drives. Think 160kW as zippy city commuting with good highway performance.',
    efficiencyKwhPer100km: 16.0,
    rangeKm: 507,
    manufacturerCostUsd: 32000,
    batteryManufacturer: 'SK Innovation',
    batteryTechnology: 'NMC' as const,
    chargingTimeDc0To80Min: 18,
    chargingCapabilities: 'Up to 350kW DC, 11kW AC',
    basePriceLocalCurrency: 180000,
    optionPrices: [
      { name: 'Premium Package', price: 15000 },
    ],
    onTheRoadPriceLocalCurrency: 210000,
    rebates: [
      {
        name: 'EV Early Adoption Incentive',
        amount: 20000,
        description: 'Singapore government rebate for early EV adopters',
      },
    ],
    isAvailable: true,
  },
]

async function main() {
  console.log('Starting seed...')

  for (const vehicle of sampleVehicles) {
    const batteryWeightPercentage = (vehicle.batteryWeightKg / vehicle.curbWeightKg) * 100

    await prisma.vehicle.upsert({
      where: {
        id: `${vehicle.name.toLowerCase().replace(/\s+/g, '-')}-${vehicle.modelTrim.toLowerCase().replace(/\s+/g, '-')}-${vehicle.country.toLowerCase()}`,
      },
      update: {
        ...vehicle,
        batteryWeightPercentage,
      },
      create: {
        id: `${vehicle.name.toLowerCase().replace(/\s+/g, '-')}-${vehicle.modelTrim.toLowerCase().replace(/\s+/g, '-')}-${vehicle.country.toLowerCase()}`,
        ...vehicle,
        batteryWeightPercentage,
      },
    })
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

