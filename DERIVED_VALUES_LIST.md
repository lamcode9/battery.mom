# Derived/Estimated Values (Not Based on Actual Facts)

This document lists all values in the system that are **derived, estimated, inferred, or use default/fallback values** rather than being pulled from actual API data or verified sources.

---

## PRICING VALUES

**1. Base Price (Default Fallback)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:145`
- **Value**: 
  - Singapore (SG): **150,000** (default)
  - Malaysia (MY): **120,000** (default)
- **When Used**: When `input.basePrice` is not provided
- **Source**: Hardcoded default, not from API or scraping

**2. On-The-Road (OTR) Price (Calculated)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:146`
- **Value**: 
  - Singapore: `basePrice * 1.25` (25% markup)
  - Malaysia: `basePrice * 1.12` (12% markup)
- **When Used**: When `input.otrPrice` is not provided
- **Source**: Estimated markup percentage, not actual OTR prices

**3. Manufacturer Cost (Estimated)**
- **Location**: `lib/data-fetchers/ev-api.ts:285-288`
- **Formula**: `batteryCapacityKwh * 120 + 20000`
- **Default**: **30,000 USD** if battery capacity is unknown
- **Assumptions**: 
  - $120 per kWh for battery
  - $20,000 base vehicle cost
- **Source**: Industry estimates, not actual manufacturer costs

---

## WEIGHT VALUES

**4. Battery Weight (Estimated)**
- **Location**: `lib/data-fetchers/ev-api.ts:294-296`
- **Formula**: `batteryCapacityKwh * 6.5` (kg per kWh)
- **Default**: **400 kg** if battery capacity is unknown
- **Assumption**: ~6-7 kg per kWh ratio
- **Source**: Industry average, not actual battery weight

**5. Curb Weight (Estimated)**
- **Location**: `lib/data-fetchers/ev-api.ts:302-308`
- **Formula**: `1200 + batteryWeightKg + (powerKw / 2)`
- **Assumptions**:
  - 1200 kg base vehicle weight
  - Motor weight = powerKw / 2
- **Alternative**: If gross weight from API exists, subtracts **200 kg** (estimated passenger/cargo weight)
- **Source**: Estimated formula, not actual curb weight

**6. Battery Weight Percentage (Calculated)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:139`
- **Formula**: `(batteryWeightKg / curbWeightKg) * 100`
- **Source**: Calculated from estimated values above

---

## RANGE VALUES

**7. Range (Default Fallback)**
- **Location**: `lib/data-fetchers/ev-api.ts:211`
- **Value**: **420 km** (default)
- **When Used**: When API doesn't provide range and can't be computed from battery/efficiency
- **Source**: Arbitrary default value

**8. EPA Range (Estimated)**
- **Location**: `lib/data-fetchers/ev-api.ts:216` and `vehicle-transformer.ts:165`
- **Formula**: `rangeKm * 0.75` (assumes 75% of WLTP)
- **Assumption**: EPA range is typically 25% lower than WLTP
- **Source**: Industry rule-of-thumb, not actual EPA testing

**9. WLTP Range (Assumed)**
- **Location**: `lib/data-fetchers/ev-api.ts:215`
- **Assumption**: API Ninjas range is assumed to be WLTP (not verified)
- **Source**: Assumption, not confirmed

---

## EFFICIENCY VALUES

**10. Efficiency (Default Fallback)**
- **Location**: `lib/data-fetchers/ev-api.ts:255`
- **Value**: **17 kWh/100km** (default)
- **When Used**: When efficiency cannot be calculated from API data
- **Source**: Arbitrary default value

**11. Efficiency (Calculated Fallback)**
- **Location**: `lib/data-fetchers/ev-api.ts:196`
- **Formula**: `(batteryCapacityKwh / 400) * 100` if range is unknown
- **Assumption**: Uses 400 km as default range
- **Source**: Calculated estimate, not actual efficiency

---

## POWER & PERFORMANCE VALUES

**12. Power Rating (Default Fallback)**
- **Location**: `lib/data-fetchers/ev-api.ts:218`
- **Value**: **150 kW** (default)
- **When Used**: When API doesn't provide total_power
- **Source**: Arbitrary default value

**13. Acceleration 0-100 km/h (Estimated)**
- **Location**: `lib/utils.ts:62-72`
- **Formula**: Based on power-to-weight ratio estimation:
  - ≥200 kW/ton: 3.0s
  - ≥150 kW/ton: 4.0s
  - ≥100 kW/ton: 5.5s
  - ≥70 kW/ton: 7.0s
  - ≥50 kW/ton: 9.0s
  - <50 kW/ton: 11.0s
- **When Used**: When API doesn't provide acceleration data
- **Source**: Estimated formula based on power-to-weight ratio, not actual testing

---

## CHARGING VALUES

**14. Charging Power (Default Fallback)**
- **Location**: `lib/data-fetchers/ev-api.ts:223`
- **Value**: **120 kW** (default)
- **When Used**: When API doesn't provide charge_power_10p_80p or charge_power_max
- **Source**: Arbitrary default value

**15. DC Fast Charge Time 0-80% (Calculated)**
- **Location**: `lib/data-fetchers/ev-api.ts:225-228`
- **Formula**: `((batteryCapacityKwh * 0.7) / chargingPowerKw) * 60` minutes
- **Assumptions**:
  - Charges 70% of battery (0-80%)
  - Uses estimated charging power if not provided
- **Source**: Calculated estimate, not actual charging test data

**16. Charging Time (Default Fallback)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:169`
- **Value**: **30 minutes** (default)
- **When Used**: When `input.chargingTimeDc0To80Min` is not provided
- **Source**: Arbitrary default value

**17. Charging Capabilities (Default)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:172`
- **Value**: **"Up to 150kW DC, 11kW AC"** (default)
- **When Used**: When charging time is not provided
- **Source**: Generic default, not actual vehicle specs

**18. Charging Capabilities (Calculated)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:171`
- **Formula**: `Up to ${chargingTimeDc0To80Min * 10}kW DC, 11kW AC`
- **Assumption**: Charging power = charging time * 10 (rough estimate)
- **Source**: Estimated calculation, not actual charging specs

---

## BATTERY TECHNOLOGY VALUES

**19. Battery Technology (Inferred)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:42-64`
- **Logic**: 
  - Tesla Model 3 Standard: LFP
  - Other Tesla: NMC
  - BYD: LFP
  - Hyundai/Kia: NMC
  - Default: NMC
- **Source**: Inferred from manufacturer name, not actual battery specs

**20. Battery Manufacturer (Inferred)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:70-86`
- **Logic**:
  - Tesla: "Panasonic/CATL"
  - BYD: "BYD"
  - Hyundai/Ioniq: "SK Innovation"
  - Kia: "LG Chem"
  - Default: "Unknown"
- **Source**: Inferred from manufacturer name, not actual supplier data

---

## REBATES & INCENTIVES

**21. Singapore EV Early Adoption Incentive (Calculated)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:112`
- **Formula**: `Math.min(20000, basePrice * 0.1)` (10% or max 20k)
- **Source**: Generic rebate calculation, not actual government rebate amounts

**22. Malaysia VEP Exemption (Fixed)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:121`
- **Value**: **5,000 MYR** (fixed)
- **Source**: Generic value, not actual VEP exemption amount

---

## ELECTRICITY RATES

**23. Singapore Electricity Rate**
- **Location**: `lib/utils.ts:27`
- **Value**: **0.32 SGD per kWh**
- **Source**: Average fast-charger price (estimated), not actual utility rates

**24. Malaysia Electricity Rate**
- **Location**: `lib/utils.ts:28`
- **Value**: **0.55 MYR per kWh**
- **Source**: Average DC charging price (estimated), not actual utility rates

---

## OTHER VALUES

**25. Model Trim (Default)**
- **Location**: `lib/data-fetchers/ev-api.ts:244-247`
- **Value**: **"Base"** (default)
- **When Used**: When API doesn't provide year_start or it's "No Data"
- **Source**: Generic default, not actual trim level

**26. Image URL (Default)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:155`
- **Value**: **Unsplash placeholder image**
- **When Used**: When `input.imageUrl` is not provided
- **Source**: Generic stock image, not actual vehicle image

**27. Battery Weight to kWh Ratio**
- **Location**: `lib/utils.ts:25`
- **Value**: **6.5 kg per kWh**
- **Source**: Industry average estimate, not actual ratio for each vehicle

**28. Power Rating Explanation (Generated)**
- **Location**: `lib/data-fetchers/vehicle-transformer.ts:92-102`
- **Source**: Auto-generated descriptive text based on power rating, not actual vehicle description

---

## SUMMARY

**Total Derived/Estimated Values: 28**

### Categories:
- **Pricing**: 3 values (base price, OTR price, manufacturer cost)
- **Weight**: 3 values (battery weight, curb weight, battery weight %)
- **Range**: 3 values (default range, EPA range, WLTP assumption)
- **Efficiency**: 2 values (default efficiency, calculated fallback)
- **Power/Performance**: 2 values (default power, estimated acceleration)
- **Charging**: 5 values (default power, calculated time, default time, default capabilities, calculated capabilities)
- **Battery Tech**: 2 values (inferred technology, inferred manufacturer)
- **Rebates**: 2 values (SG rebate calculation, MY VEP exemption)
- **Electricity Rates**: 2 values (SG rate, MY rate)
- **Other**: 4 values (model trim, image URL, battery ratio, power explanation)

---

## RECOMMENDATIONS

To improve data accuracy, consider:
1. **Enable pricing scraper** for real base prices from SGCarMart/Carlist.my
2. **Add actual battery specs** from manufacturer websites
3. **Use verified EPA/WLTP ranges** from official sources
4. **Get real charging specs** from manufacturer data sheets
5. **Verify rebate amounts** from government sources
6. **Use actual electricity rates** from utility providers
7. **Get real vehicle images** from manufacturer or dealer sites

