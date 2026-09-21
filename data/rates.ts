/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CENTRALIZED RATE DATA — battery.mom
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  🔑  SINGLE SOURCE OF TRUTH for all country-level rates, tariffs, costs,
 *      and economic constants used across the entire application.
 *
 *  ⚠️  UPDATE SCHEDULE:
 *      - Electricity tariffs:  Every quarter (Jan, Apr, Jul, Oct)
 *      - Petrol prices:        Monthly
 *      - Solar costs:          Every 6 months
 *      - Carbon/USD rates:     Every quarter
 *      - EV incentives:        On policy change
 *
 *  📋  HOW TO UPDATE:
 *      1. Update values in this file
 *      2. Update the `lastVerified` date in the DATA_PROVENANCE object
 *      3. Run `npm run dev` and verify calculators show new values
 *      4. All 20+ consuming components auto-update from here
 *
 *  📖  See data/DATA-MAINTENANCE.md for the full maintenance guide.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Country } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// TYPE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** String-indexable map that also auto-completes on Country keys */
type CountryMap<V> = Record<Country, V> & Record<string, V | undefined>

// ─────────────────────────────────────────────────────────────────────────────
// DATA PROVENANCE — Citations & Sources
// ─────────────────────────────────────────────────────────────────────────────

export interface DataSource {
  name: string
  url?: string
  retrievedDate: string        // ISO date when data was last pulled
  notes?: string
}

export interface ProvenanceEntry {
  description: string
  lastVerified: string         // ISO date of last human verification
  updateFrequency: string      // e.g. "quarterly", "monthly"
  sources: DataSource[]
}

/**
 * Complete provenance metadata for every rate category.
 * Displayed in component footers and the About page.
 */
export const DATA_PROVENANCE: Record<string, ProvenanceEntry> = {
  electricityResidential: {
    description: 'Residential electricity tariffs (local currency per kWh)',
    lastVerified: '2026-09-21',
    updateFrequency: 'Quarterly',
    sources: [
      { name: 'Suruhanjaya Tenaga / TNB RP4 Domestic General', url: 'https://myenergystats.st.gov.my/documents/d/guest/jadual-tarif-tnb-terkini', retrievedDate: '2026-09-21', notes: '27.03+4.55+12.85 sen/kWh for ≤1500 kWh; AFA and Energy Efficiency Incentive are consumption-dependent and not baked into this unit rate' },
      { name: 'Energy Market Authority (EMA) / SP Group, Singapore', url: 'https://www.ema.gov.sg/consumer-information/electricity/buying-electricity/buying-at-regulated-tariff', retrievedDate: '2026-09-21', notes: 'Q3 2026 household bill rate is 34.78 cents/kWh with 9% GST; EMA published 31.91 cents before GST, 1 Jul–30 Sep 2026' },
      { name: 'Kementerian ESDM / PLN, Indonesia', url: 'https://www.cnbcindonesia.com/news/20260901103232-4-763915/daftar-resmi-tarif-listrik-per-kwh-pelanggan-pln-per-1-september-2026', retrievedDate: '2026-09-21', notes: 'R-1/TR 1300–2200 VA Rp1,444.70/kWh, unchanged through Q3 2026' },
      { name: 'MEA / ERC residential Rate 1.2 + Ft Sep–Dec 2026', url: 'https://www.nationthailand.com/news/general/40070183', retrievedDate: '2026-09-21', notes: 'Energy bands from Sep 2026: ฿3.00 (1–200), ฿4.1584 (201–400), ฿4.3583 (401+). Ft 0.1623 THB/kWh Sep–Dec 2026. Site uses a 300 kWh/month Rate 1.2 all-in bill (energy+Ft+฿24.62 service+7% VAT) = ฿3.88/kWh' },
      { name: 'EVN Decision 1279/QD-BCT residential bands', url: 'https://en.evn.com.vn/d/en-US/news/RETAIL-ELECTRICITY-TARIFF-Decision-No-1279QD-BCT-dated-9-May-2025-of-Ministry-of-Industry-and-Trade-60-28-252', retrievedDate: '2026-09-21', notes: 'Official bands 1,984/2,050/2,380/2,998/3,350/3,460 VND/kWh excluding VAT. EVN: 101–200 kWh is the largest customer group. Site blend at 200 kWh = ₫2,199/kWh before VAT' },
      { name: 'Meralco, Philippines', url: 'https://company.meralco.com.ph/news-and-advisories/lower-rates-september-2026', retrievedDate: '2026-09-21', notes: 'Typical household overall rate ₱14.7424/kWh for September 2026' },
    ],
  },
  electricityCommercial: {
    description: 'Commercial/industrial electricity tariffs',
    lastVerified: '2026-09-21',
    updateFrequency: 'Quarterly',
    sources: [
      { name: 'TNB Non-Domestic Low Voltage General (RP4)', url: 'https://myenergystats.st.gov.my/documents/d/guest/jadual-tarif-tnb-terkini', retrievedDate: '2026-09-21', notes: '27.03+8.83+14.82 sen/kWh energy+capacity+network; MY updated. Other countries not independently re-sourced this pass.' },
      { name: 'EMA business tariff, Singapore', url: 'https://www.ema.gov.sg', retrievedDate: '2025-12-01' },
      { name: 'PLN B-2/B-3 tariff, Indonesia', url: 'https://web.pln.co.id', retrievedDate: '2025-12-01' },
      { name: 'MEA large general service, Thailand', url: 'https://www.mea.or.th', retrievedDate: '2025-12-01' },
      { name: 'EVN commercial, Vietnam', url: 'https://www.evn.com.vn', retrievedDate: '2025-12-01' },
      { name: 'Meralco commercial, Philippines', url: 'https://www.meralco.com.ph', retrievedDate: '2025-12-01' },
    ],
  },
  dcFastCharging: {
    description: 'Typical DC fast-charger rates (commercial EV charging)',
    lastVerified: '2025-12-01',
    updateFrequency: 'Quarterly',
    sources: [
      { name: 'ChargEV / TNB Electron, Malaysia', url: 'https://chargev.my', retrievedDate: '2025-12-01' },
      { name: 'SP Group / Shell Recharge, Singapore', url: 'https://www.spgroup.com.sg', retrievedDate: '2025-12-01' },
      { name: 'PLN / Hyundai charging, Indonesia', retrievedDate: '2025-12-01' },
      { name: 'EA Anywhere / PTT EV Station, Thailand', url: 'https://www.eaanywhere.com', retrievedDate: '2025-12-01' },
      { name: 'VinFast / EVES, Vietnam', retrievedDate: '2025-12-01' },
      { name: 'Meralco PowerGen, Philippines', retrievedDate: '2025-12-01' },
    ],
  },
  petrolPrice: {
    description: 'Mass-market petrol price per litre (local currency). Malaysia/Singapore/Thailand/Vietnam/Philippines use RON 95 (or Gasohol 95 / E10 RON 95); Indonesia uses Pertalite, the typical ICE fuel.',
    lastVerified: '2026-09-21',
    updateFrequency: 'Monthly',
    sources: [
      { name: 'Ministry of Finance Malaysia / BUDI95', url: 'https://www.mof.gov.my/portal/en/news/press-citations/ron97-unsubsidised-ron95-diesel-prices-up-35-sen-for-sept-17-23', retrievedDate: '2026-09-21', notes: 'Eligible citizens pay RM1.99/L; unsubsidised RON 95 was RM4.37 for 17–23 Sep 2026' },
      { name: 'AsiaOne pump-price roundup (Caltex/Esso/Shell/SPC/Sinopec)', url: 'https://www.asiaone.com/singapore/petrol-prices-diesel-sept-20-middle-east-war-spc', retrievedDate: '2026-09-21', notes: '95-octane S$3.49/L at Caltex, Esso, Shell and Sinopec as of 21 Sep 2026' },
      { name: 'Pertamina / CNBC Indonesia', url: 'https://www.cnbcindonesia.com/news/20260921071808-4-769383/resmi-harga-bbm-di-spbu-pertamina-bp-shell-berlaku-21-september-2026', retrievedDate: '2026-09-21', notes: 'Pertalite Rp10,000/L unchanged 21 Sep 2026; Pertamax Green 95 Rp19,150/L' },
      { name: 'PTT Station / PPTV', url: 'https://www.pptvhd36.com/wealth/economic/283756', retrievedDate: '2026-09-21', notes: 'Gasohol 95 ฿39.94/L effective 21 Sep 2026 05:00' },
      { name: 'Petrolimex', url: 'https://www.petrolimex.com.vn/ndi/thong-cao-bao-chi/petrolimex-dieu-chinh-gia-xang-dau-tu-15-gio-00-phut-ngay-17-9-2026.html', retrievedDate: '2026-09-21', notes: 'E10 RON 95-III Region 1 ₫25,630/L from 15:00 17 Sep 2026' },
      { name: 'DOE Philippines / Rappler', url: 'https://www.rappler.com/business/fuel-prices-adjustments-september-15-2026/', retrievedDate: '2026-09-21', notes: 'Metro Manila common RON95 ₱85.70 (8–14 Sep) plus ₱5.68 gasoline hike for 15–21 Sep' },
    ],
  },
  solarCost: {
    description: 'Rooftop solar PV installed cost per kWp (turnkey)',
    lastVerified: '2025-09-01',
    updateFrequency: 'Every 6 months',
    sources: [
      { name: 'SEDA Malaysia / installer quotes', url: 'https://www.seda.gov.my', retrievedDate: '2025-09-01' },
      { name: 'EMA Singapore / SolarQuote', retrievedDate: '2025-09-01' },
      { name: 'IRENA Renewable Cost Database, 2024', url: 'https://www.irena.org/costs', retrievedDate: '2025-09-01' },
      { name: 'BloombergNEF SEA Solar Tracker Q3 2025', retrievedDate: '2025-09-01' },
    ],
  },
  solarYield: {
    description: 'Expected solar energy yield per installed kWp (kWh/kWp/day)',
    lastVerified: '2025-09-01',
    updateFrequency: 'Annually',
    sources: [
      { name: 'Global Solar Atlas', url: 'https://globalsolaratlas.info', retrievedDate: '2025-09-01' },
      { name: 'PVsyst simulation averages for SEA capitals', retrievedDate: '2025-09-01' },
      { name: 'IRENA Statistics 2024', url: 'https://www.irena.org/Statistics', retrievedDate: '2025-09-01' },
    ],
  },
  co2Grid: {
    description: 'Grid electricity CO₂ emission factor (kg CO₂/kWh)',
    lastVerified: '2025-09-01',
    updateFrequency: 'Annually',
    sources: [
      { name: 'IEA Emission Factors 2024', url: 'https://www.iea.org/data-and-statistics', retrievedDate: '2025-09-01' },
      { name: 'ASEAN Centre for Energy (ACE) Outlook 2025', url: 'https://aseanenergy.org', retrievedDate: '2025-09-01' },
      { name: 'National grid operators annual reports (TNB, EMA, PLN, EGAT, EVN, NGCP)', retrievedDate: '2025-09-01' },
    ],
  },
  carbonCredit: {
    description: 'Voluntary carbon credit pricing (USD per tonne CO₂e)',
    lastVerified: '2025-10-01',
    updateFrequency: 'Quarterly',
    sources: [
      { name: 'Verra VCS Registry', url: 'https://verra.org', retrievedDate: '2025-10-01' },
      { name: 'Gold Standard Impact Registry', url: 'https://www.goldstandard.org', retrievedDate: '2025-10-01' },
      { name: 'AirCarbon Exchange (ACX) Singapore', url: 'https://www.aircarbon.co', retrievedDate: '2025-10-01' },
    ],
  },
  evIncentives: {
    description: 'Separable one-time EV cash incentives. Listed vehicle prices already reflect each market’s tax/duty/rebate environment, so cash add-ons are zero to avoid double-counting.',
    lastVerified: '2026-09-21',
    updateFrequency: 'On policy change',
    sources: [
      { name: 'MITI Malaysia CBU EV rules (1 Jul 2026)', retrievedDate: '2026-09-21', notes: 'Import-duty exemption no longer modelled as a cash rebate; duty/excise already in OTR prices' },
      { name: 'LTA Singapore – VES/ARF rebates', url: 'https://www.lta.gov.sg', retrievedDate: '2026-09-21', notes: 'VES/EEAI is netted into COE-inclusive advertised prices' },
      { name: 'Ministry of Industry Indonesia – LCEV policy', retrievedDate: '2026-09-21', notes: 'CBU/PPN cash subsidy expired Dec 2025' },
      { name: 'Board of Investment Thailand – EV 3.5 package', retrievedDate: '2026-09-21', notes: 'Subsidy is reflected in promotional OTR prices' },
      { name: 'MOIT Vietnam – registration-fee exemption', retrievedDate: '2026-09-21', notes: 'ICE-side cost, not modelled as an EV cash rebate' },
      { name: 'DTI Philippines – EVIDA IRR', retrievedDate: '2026-09-21', notes: '0% tariff is in the SRP; no cash rebate' },
    ],
  },
  vehicleSpecs: {
    description: 'EV specifications (range, battery, efficiency, price, etc.)',
    lastVerified: '2026-09-21',
    updateFrequency: 'Monthly (as new models launch)',
    sources: [
      { name: 'paultan.org citing Tesla Malaysia configurator (17 Jul 2026)', url: 'https://paultan.org/2026/07/17/tesla-malaysia-raises-prices-model-3-from-rm149k-model-y-from-rm198k-up-rm1400-to-rm3000/', retrievedDate: '2026-09-21' },
      { name: 'Tesla Singapore / HardwareZone Model 3 COE-inclusive list (18 May 2026)', url: 'https://www.hardwarezone.com.sg/lifestyle/cars/tesla-model-3-rear-wheel-drive-110-cat-a-singapore-price', retrievedDate: '2026-09-21', notes: 'Drive-away including COE: RWD 110 S$179,999; Premium RWD 110 S$199,999; Premium LR RWD S$219,999; Performance AWD S$256,232. COE moves with the quota.' },
      { name: 'SGCarMart Tesla Model Y authorised-dealer list via PaperValue (15 Aug 2026)', url: 'https://papervalue.sg/cars/tesla-model-y', retrievedDate: '2026-09-21', notes: 'Premium RWD 110 S$215,999 COE-inclusive. Other Model Y trims not rewritten without a matching sourced drive-away quote.' },
      { name: 'SGCarMart BYD Atto 3 60.5 kWh (20 May 2026)', url: 'https://www.sgcarmart.com/new-cars/info/21508/byd-atto-3-electric', retrievedDate: '2026-09-21', notes: 'COE-inclusive S$181,888 for the 60.5 kWh model. Standard Range left as manufacturer-from and marked unavailable rather than guessing a COE add-on.' },
      { name: 'PRO-NET / Proton e.MAS 7 SKD price list (20 Jan 2026)', url: 'https://emas.proton.com/pro-net-introduces-the-new-2026-proton-e-mas-7/', retrievedDate: '2026-09-21' },
      { name: 'BYD Sime Motors / paultan.org 2026 Atto 3 Ultra/Premium', url: 'https://paultan.org/2026/06/19/byd-atto-3-facelift-buyers-guide-ultra-vs-premium-which-2026-atto-3-should-you-buy-in-malaysia/', retrievedDate: '2026-09-21' },
      { name: 'Manufacturer websites and regional distributor price lists (remainder of catalogue)', retrievedDate: '2025-12-01' },
      { name: 'WLTP certification data (European type-approval database)', url: 'https://co2cars.apps.eea.europa.eu', retrievedDate: '2025-12-01' },
    ],
  },
  usdExchange: {
    description: 'USD exchange rates (local currency per 1 USD)',
    lastVerified: '2026-09-21',
    updateFrequency: 'Quarterly',
    sources: [
      { name: 'Hong Leong Bank midday currency outlook 21 Sep 2026', url: 'https://www.hlb.com.my/content/dam/hlb/my/docs/pdf/Global_Markets/currency-outlook/2026/21-09-2026.pdf', retrievedDate: '2026-09-21', notes: 'USD/MYR ~4.08; USD/SGD ~1.276' },
      { name: 'Bank Indonesia JISDOR', url: 'https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/default.aspx', retrievedDate: '2026-09-21', notes: 'USD/IDR reference ~17,813 on 21 Sep 2026' },
      { name: 'CNBC Indonesia FX roundup', url: 'https://www.cnbcindonesia.com/research/20260921093942-128-769450/mata-uang-asia-pesta-pora-rupiah-malah-gigit-jari', retrievedDate: '2026-09-21', notes: 'USD/THB 33.28; USD/PHP 62.767' },
      { name: 'State Bank of Vietnam central rate', retrievedDate: '2026-09-21', notes: 'USD/VND central 25,637 on 21 Sep 2026' },
    ],
  },
  bessProducts: {
    description: 'Home battery energy storage system (BESS) specifications and pricing',
    lastVerified: '2026-09-21',
    updateFrequency: 'Every 6 months',
    sources: [
      { name: 'Tesla Powerwall website', url: 'https://www.tesla.com/powerwall', retrievedDate: '2026-09-21', notes: 'Powerwall 3: 13.5 kWh, 97.5% round-trip efficiency, 11.5 kW continuous / 22 kW peak. SEA installed prices remain installer quotes, not Tesla list prices.' },
      { name: 'BYD Battery-Box product page', url: 'https://www.bydbatterybox.com', retrievedDate: '2025-09-01' },
      { name: 'sonnen product page', url: 'https://sonnen.com', retrievedDate: '2025-09-01' },
      { name: 'Regional installer / distributor quotes', retrievedDate: '2025-09-01' },
    ],
  },
}


// ─────────────────────────────────────────────────────────────────────────────
// 1. ELECTRICITY — RESIDENTIAL TARIFF (local currency per kWh)
// ─────────────────────────────────────────────────────────────────────────────

export const RESIDENTIAL_TARIFF: CountryMap<number> = {
  MY: 0.444,   // RM/kWh — TNB Domestic General ≤1500 kWh: 27.03 + 4.55 + 12.85 sen (RP4). Excludes AFA (+3.67 sen Sep 2026, waived ≤600 kWh) and Energy Efficiency Incentive.
  SG: 0.3478,  // SGD/kWh — EMA/SP Q3 2026 household bill rate with 9% GST (34.78¢). Before GST: 31.91¢, 1 Jul–30 Sep 2026.
  ID: 1445,    // IDR/kWh — PLN R-1/TR 1300–2200 VA, Q3 2026 (Rp1,444.70)
  TH: 3.88,    // THB/kWh — Rate 1.2 home at 300 kWh/month, all-in (energy + Ft 0.1623 Sep–Dec 2026 + ฿24.62 service + 7% VAT)
  VN: 2199,    // VND/kWh — EVN blend at 200 kWh/month (largest customer group is 101–200 kWh), Decision 1279/QD-BCT, excluding VAT
  PH: 14.74,   // PHP/kWh — Meralco typical household overall rate, Sep 2026 (₱14.7424)
}

/** What a typical reader pays, and the asterisk that belongs next to the number. */
export const RESIDENTIAL_TARIFF_NOTE: CountryMap<string> = {
  MY: 'TNB RP4 Domestic General ≤1500 kWh: 44.43 sen/kWh (27.03 + 4.55 + 12.85 sen). AFA (+3.67 sen/kWh in Sep 2026) is waived at ≤600 kWh; the Energy Efficiency Incentive is consumption-dependent and is not baked in.',
  SG: 'SP/EMA Q3 2026 household bill rate 34.78¢/kWh including 9% GST (1 Jul–30 Sep 2026). EMA publishes 31.91¢ before GST.',
  ID: 'PLN R-1/TR 1300–2200 VA Rp1,444.70/kWh, unchanged through Q3 2026.',
  TH: 'Typical Rate 1.2 home at 300 kWh/month: ฿3.88/kWh all-in (energy + Ft 0.1623 for Sep–Dec 2026 + ฿24.62 service charge + 7% VAT). Official energy bands from Sep 2026: ฿3.00 (1–200), ฿4.1584 (201–400), ฿4.3583 (401+).',
  VN: 'EVN says 101–200 kWh/month is the largest residential group. Blend at 200 kWh = ₫2,199/kWh before VAT (Decision 1279/QĐ-BCT). Official bands excluding VAT: ₫1,984 / 2,050 / 2,380 / 2,998 / 3,350 / 3,460. VAT is extra.',
  PH: 'Meralco typical household overall rate ₱14.7424/kWh for September 2026.',
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ELECTRICITY — COMMERCIAL TARIFF (local currency per kWh)
// ─────────────────────────────────────────────────────────────────────────────

export const COMMERCIAL_TARIFF: CountryMap<number> = {
  MY: 0.507,   // RM/kWh — TNB Non-Domestic LV General: 27.03 + 8.83 + 14.82 sen (RP4)
  SG: 0.245,   // SGD/kWh — EMA business contestable
  ID: 1445,    // IDR/kWh — PLN B-2 commercial
  TH: 5.33,    // THB/kWh — MEA large general service
  VN: 2870,    // VND/kWh — EVN business normal hours
  PH: 10.90,   // PHP/kWh — Meralco commercial
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ELECTRICITY — DC FAST CHARGING (local currency per kWh)
// ─────────────────────────────────────────────────────────────────────────────

export const DC_FAST_CHARGING_RATE: CountryMap<number> = {
  SG: 0.50,    // SGD/kWh — SP / Shell Recharge
  MY: 1.20,    // MYR/kWh — ChargEV / TNB Electron
  ID: 3500,    // IDR/kWh — PLN / Hyundai
  PH: 8.50,    // PHP/kWh — Meralco PowerGen
  TH: 6.50,    // THB/kWh — EA Anywhere / PTT
  VN: 3500,    // VND/kWh — VinFast / EVES
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ELECTRICITY — AC PUBLIC LEVEL 2 (local currency per kWh)
// ─────────────────────────────────────────────────────────────────────────────

export const AC_PUBLIC_RATE: CountryMap<number> = {
  SG: 0.40,    // SGD/kWh
  MY: 0.80,    // MYR/kWh
  ID: 2500,    // IDR/kWh
  PH: 6.00,    // PHP/kWh
  TH: 5.00,    // THB/kWh
  VN: 2800,    // VND/kWh
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ELECTRICITY — TIME-OF-USE RATES (commercial, local currency per kWh)
// ─────────────────────────────────────────────────────────────────────────────

export interface TOURate {
  offPeak: number
  mid: number
  peak: number
  peakHours: string   // e.g. "09:00-17:00"
}

export const TOU_RATES: CountryMap<TOURate> = {
  MY: { offPeak: 0.337, mid: 0.509,  peak: 0.612, peakHours: '08:00-22:00' },
  SG: { offPeak: 0.180, mid: 0.245,  peak: 0.320, peakHours: '08:00-23:00' },
  ID: { offPeak: 1200,  mid: 1445,   peak: 1800,  peakHours: '17:00-22:00' },
  TH: { offPeak: 2.63,  mid: 5.33,   peak: 6.20,  peakHours: '09:00-22:00' },
  VN: { offPeak: 1685,  mid: 2870,   peak: 3937,  peakHours: '09:30-11:30, 17:00-20:00' },
  PH: { offPeak: 8.50,  mid: 10.90,  peak: 13.20, peakHours: '08:00-21:00' },
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ELECTRICITY — DEMAND CHARGE (local currency per kW per month)
// ─────────────────────────────────────────────────────────────────────────────

export const DEMAND_CHARGE: CountryMap<number> = {
  MY: 45.10,   // RM/kW/month
  SG: 9.24,    // SGD/kW/month
  ID: 40000,   // IDR/kW/month
  TH: 220.00,  // THB/kW/month
  VN: 41900,   // VND/kW/month
  PH: 350.00,  // PHP/kW/month
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PETROL — RON 95 PRICE PER LITRE (local currency)
// ─────────────────────────────────────────────────────────────────────────────

export const PETROL_PRICE_PER_LITRE: CountryMap<number> = {
  MY: 1.99,    // RM — BUDI95 RON 95 for eligible citizens (300 L/month quota). Unsubsidised RON 95 was RM4.37 for 17–23 Sep 2026.
  SG: 3.49,    // SGD — major-brand 95-octane, 21 Sep 2026
  ID: 10000,   // IDR — Pertalite (typical ICE fuel), unchanged 21 Sep 2026
  TH: 39.94,   // THB — PTT Gasohol 95, 21 Sep 2026
  VN: 25630,   // VND — Petrolimex E10 RON 95-III Region 1, from 17 Sep 2026
  PH: 91.38,   // PHP — DOE Metro Manila common RON95 after the 15–21 Sep 2026 hike
}

export const PETROL_PRICE_NOTE: CountryMap<string> = {
  MY: 'Default is BUDI95 RM1.99/L for eligible Malaysian citizens. 15,000 km/year at 7.5 L/100 km is about 94 L/month — inside the 300 L/month quota. Unsubsidised RON95 was RM4.37/L for 17–23 Sep 2026 (companies, non-citizens, and usage above the quota).',
  SG: 'Major-brand 95-octane S$3.49/L as of 21 Sep 2026 (Caltex/Esso/Shell/Sinopec).',
  ID: 'Pertalite Rp10,000/L, the typical ICE fuel, unchanged 21 Sep 2026. Pertamax Green 95 was Rp19,150/L the same day.',
  TH: 'PTT Gasohol 95 ฿39.94/L from 05:00 on 21 Sep 2026.',
  VN: 'Petrolimex E10 RON 95-III Region 1 ₫25,630/L from 15:00 on 17 Sep 2026.',
  PH: 'DOE Metro Manila common RON95 ₱91.38/L for 15–21 Sep 2026.',
}

export const RATE_VERIFIED_ON = '21 September 2026'

// ─────────────────────────────────────────────────────────────────────────────
// 8. SOLAR — YIELD & COST
// ─────────────────────────────────────────────────────────────────────────────

/** kWh generated per installed kWp per day (annual average, Global Solar Atlas) */
export const SOLAR_YIELD_PER_KWP_DAY: CountryMap<number> = {
  MY: 4.6,     // Kuala Lumpur latitude
  SG: 4.2,     // Equatorial, high humidity
  ID: 4.8,     // Jakarta region
  TH: 4.5,     // Bangkok region
  VN: 4.0,     // Hanoi average (varies north-south)
  PH: 4.2,     // Metro Manila
}

/** Installed cost per kWp, turnkey, in local currency */
export const SOLAR_COST_PER_KWP: CountryMap<number> = {
  MY: 3200,    // RM/kWp — SEDA/installer quotes 2025
  SG: 1500,    // SGD/kWp
  ID: 14000000,// IDR/kWp
  TH: 35000,   // THB/kWp
  VN: 18000000,// VND/kWp
  PH: 55000,   // PHP/kWp
}

/** kWh from a 10 kW solar system per day (used in ComparisonTable for solar top-up calc) */
export const SOLAR_10KW_DAILY_YIELD: CountryMap<number> = {
  SG: 42,
  MY: 45,
  ID: 48,
  PH: 42,
  TH: 45,
  VN: 40,
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. CO₂ — GRID EMISSION FACTOR (kg CO₂ per kWh)
// ─────────────────────────────────────────────────────────────────────────────
// Source: IEA 2024 + national grid operator reports
// Note: Some scoreboard/ESG components previously used 0.585 for MY based on an
// older ASEAN Centre for Energy (ACE) figure. IEA 2024 reports 0.65 for MY grid.
// We standardize on IEA 2024 figures here.

export const CO2_GRID_FACTOR: CountryMap<number> = {
  MY: 0.65,
  SG: 0.45,
  ID: 0.70,
  TH: 0.55,
  VN: 0.60,
  PH: 0.68,
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. CARBON CREDIT PRICES (USD per tonne CO₂e)
// ─────────────────────────────────────────────────────────────────────────────

export const CARBON_CREDIT_PRICE_USD: Record<string, number> = {
  VCS: 12,             // Verra VCS average
  GoldStandard: 28,    // Gold Standard certified
  Article6_4: 45,      // Paris Article 6.4
  ACX: 8,              // AirCarbon Exchange spot
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. USD EXCHANGE RATES (local currency per 1 USD)
// ─────────────────────────────────────────────────────────────────────────────

export const USD_EXCHANGE_RATE: CountryMap<number> = {
  MY: 4.08,    // HLB midday 21 Sep 2026
  SG: 1.28,    // HLB USD/SGD ~1.276, 21 Sep 2026
  ID: 17800,   // BI JISDOR ~17,813, 21 Sep 2026
  TH: 33.28,   // USD/THB 21 Sep 2026
  VN: 25640,   // SBV central 25,637, 21 Sep 2026
  PH: 62.77,   // USD/PHP 21 Sep 2026
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. EV GOVERNMENT INCENTIVES (one-time, local currency)
// ─────────────────────────────────────────────────────────────────────────────

export const EV_INCENTIVE: CountryMap<number> = {
  MY: 0,           // Duty/excise already in OTR prices (MITI CBU rules from 1 Jul 2026)
  SG: 0,           // VES/EEAI already netted into COE-inclusive advertised prices
  ID: 0,           // CBU/PPN cash subsidy expired Dec 2025
  TH: 0,           // EV 3.5 subsidy is in the promotional OTR price
  VN: 0,           // Registration-fee exemption is an ICE-side cost, not an EV cash rebate
  PH: 0,           // EVIDA 0% tariff is in the SRP; no cash rebate
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. BESS — COMMERCIAL BATTERY COSTS
// ─────────────────────────────────────────────────────────────────────────────

/** Commercial-grade LFP BESS installed cost per kWh (local currency) */
export const BESS_COST_PER_KWH: CountryMap<number> = {
  MY: 2200,    // RM/kWh
  SG: 800,     // SGD/kWh
  ID: 6500000, // IDR/kWh
  TH: 18000,   // THB/kWh
  VN: 12000000,// VND/kWh
  PH: 35000,   // PHP/kWh
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. VEHICLE ECONOMICS — DEFAULT ASSUMPTIONS
// ─────────────────────────────────────────────────────────────────────────────

/** These are labelled clearly as assumptions in component footers */
export const EV_ECONOMICS = {
  maintenanceRatePerYear: 0.005,    // 0.5% of purchase price per year
  insuranceRatePerYear: 0.025,      // 2.5% of purchase price per year
  resaleValueAfter5Years: 0.50,     // 50% of purchase price retained
  depreciationRatePerYear: 0.12,    // 12% annual depreciation
  avgPetrolConsumption: 7.5,        // L/100km for ICE baseline
  batteryDegradationRate: 0.015,    // 1.5% per year
  tariffInflationRate: 0.03,        // 3% annual electricity inflation
} as const

/** ICE vehicle comparison defaults */
export const ICE_ECONOMICS = {
  depreciationRatePerYear: 0.10,
  maintenanceCostMultiplier: 2.0,   // ICE = 2x EV maintenance
  insurancePremiumMultiplier: 1.15, // ICE = 15% higher insurance
} as const


// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Generate a citation string for a given data category
// ─────────────────────────────────────────────────────────────────────────────

export function getCitationText(category: keyof typeof DATA_PROVENANCE): string {
  const entry = DATA_PROVENANCE[category]
  if (!entry) return ''
  const sourceNames = entry.sources.map(s => s.name).join('; ')
  return `${entry.description}. Sources: ${sourceNames}. Last verified: ${entry.lastVerified}. Updated ${entry.updateFrequency.toLowerCase()}.`
}

/**
 * Get a compact footer string for component citations.
 * Example: "Residential tariffs | Sources: TNB, EMA, PLN... | Verified Dec 2025"
 */
export function getCitationFooter(category: keyof typeof DATA_PROVENANCE): string {
  const entry = DATA_PROVENANCE[category]
  if (!entry) return ''
  const names = entry.sources.map(s => s.name.split(',')[0].split('(')[0].trim())
  const short = names.length > 3 ? names.slice(0, 3).join(', ') + ' et al.' : names.join(', ')
  const date = new Date(entry.lastVerified)
  const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `Sources: ${short} | Verified ${monthStr} | Updated ${entry.updateFrequency.toLowerCase()}`
}
