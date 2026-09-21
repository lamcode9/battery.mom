export default function EvAdoptionSea2024Content() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-emerald-600">
      <p className="lead text-lg text-gray-600">
        2024 was a breakout year for electric vehicles in Southeast Asia. BEV sales across the
        region&apos;s six largest markets grew roughly 55% year-over-year, led by Thailand and
        driven by Chinese automakers. Here&apos;s what the numbers say — and what they mean for 2025.
      </p>

      <h2>The headline numbers</h2>
      <div className="not-prose grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
        {[
          { label: 'Total BEV sales in SEA (2024)', value: '~290,000', note: '+55% YoY' },
          { label: 'Thailand BEV share of new sales', value: '11.2%', note: '#1 in region' },
          { label: 'Malaysia YoY BEV growth', value: '+120%', note: 'Fastest growing' },
          { label: 'Indonesia total EVs on road', value: '45,000', note: 'Mostly 2-wheelers excl.' },
          { label: 'Singapore chargers/million people', value: '915', note: '#1 density' },
          { label: 'Vietnam domestic brand share', value: '~65%', note: 'VinFast dominance' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-500">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5">{stat.note}</div>
          </div>
        ))}
      </div>

      <h2>Country by country</h2>

      <h3>Thailand — the regional leader</h3>
      <p>
        Thailand cemented its position as Southeast Asia&apos;s EV capital in 2024. BEV registrations
        reached approximately 68,000 units, bringing cumulative on-road EVs past 128,000. The
        government&apos;s EV 3.5 subsidy programme — offering ฿70,000–150,000 per vehicle depending on
        battery size — was the single biggest driver. BYD dominated with the Atto 3 and Dolphin, while
        Tesla gained ground after opening Bangkok service centres.
      </p>
      <p>
        Thailand also announced 2030 targets for 30% EV penetration and positioned itself as ASEAN&apos;s
        EV manufacturing hub, with BYD, Great Wall Motor, and CATL building factories in the Eastern
        Economic Corridor.
      </p>

      <h3>Singapore — highest density, smallest market</h3>
      <p>
        Singapore hit an 8.5% BEV share of new car registrations in 2024, up from ~6% in 2023. The
        Certificate of Entitlement (COE) system means car prices are astronomical regardless, which
        actually helps EVs — the price gap versus ICE is relatively smaller. The Vehicle Emissions
        Scheme (VES) rebate of up to S$25,000 sweetens the deal.
      </p>
      <p>
        With 5,400 public charger points for a population of 5.9 million, Singapore has the best
        charging density in the region at 915 chargers per million people. The bottleneck is now
        private parking — most Singaporeans live in HDB flats where installing home chargers requires
        building management approval.
      </p>

      <h3>Malaysia — the surprise growth story</h3>
      <p>
        Malaysia was 2024&apos;s biggest EV surprise. BEV sales more than doubled (+120% YoY), driven by:
      </p>
      <ul>
        <li>Zero import duty and excise tax on EVs (extended through 2027)</li>
        <li>Road tax exemptions for BEVs</li>
        <li>Tesla&apos;s official entry with Model Y and Model 3 deliveries</li>
        <li>BYD, Mercedes, and BMW expanding EV lineup availability</li>
      </ul>
      <p>
        Total EVs on Malaysian roads hit ~38,000 by year-end. The charging network grew to 3,200+
        points, with TNB, Petronas (Gentari), and JomCharge leading deployment. The government&apos;s
        MADANI incentives and net metering policies also encouraged solar-EV combos.
      </p>

      <h3>Indonesia — volume potential, slow start</h3>
      <p>
        Indonesia has the region&apos;s largest car market by volume but only a 1.4% BEV share. The
        Wuling Air ev dominated the affordable end, while Hyundai&apos;s Ioniq 5 (locally assembled in
        Cikarang) led the premium segment. The Rp80 million purchase subsidy was impactful but limited
        in allocations.
        <em className="block text-sm text-gray-500 mt-2">
          The Rp80 million figure is the 2024 programme described in this year-in-review. It is not the live 2026 instrument — see the scoreboard for the PPN DTP status as of 21 September 2026.
        </em>
      </p>
      <p>
        Indonesia&apos;s bigger story is on the supply side: it controls ~50% of global nickel reserves
        and is building a complete EV supply chain from mining to battery cells to vehicle assembly.
        CATL, LG Energy Solution, and Hyundai all have Indonesian battery factories in development.
      </p>

      <h3>Vietnam — the VinFast show</h3>
      <p>
        Vietnam&apos;s EV market is effectively a one-brand market. VinFast sold approximately 85% of all
        BEVs in the country, with the VF e34 and VF 5 as volume models. Total BEV penetration reached
        3.1%, impressive for a market where motorbikes still dominate personal transport.
      </p>
      <p>
        The government&apos;s 50% registration fee reduction and luxury tax exemption through 2027
        underpin demand. VinFast also operates 3,000+ charging stations — more than all other operators
        combined — giving it a near-monopoly on infrastructure.
      </p>

      <h3>Philippines — early days, big ambitions</h3>
      <p>
        The Philippines had the lowest BEV penetration at 0.6%, but sales growth of +110% YoY
        shows momentum. The EVIDA Act (signed 2022, implementing rules released 2023) exempts EVs
        from tariffs and provides registration priority. BYD&apos;s Dolphin became the first sub-₱1M BEV,
        opening the market to a wider audience.
      </p>
      <p>
        Charging infrastructure remains the biggest barrier — just 800 public points for 117 million
        people. The grid itself is also a constraint: the Philippines has the highest electricity cost
        in ASEAN at ₱12.30/kWh residential, which narrows the fuel-cost savings advantage of EVs.
        <em className="block text-sm text-gray-500 mt-2">
          ₱12.30/kWh is the 2024 year-in-review snapshot used in this article (published February 2025). The live scoreboard and calculators now use Meralco’s typical household overall rate of ₱14.74/kWh as of September 2026.
        </em>
      </p>

      <h2>Key trends across the region</h2>

      <h3>1. Chinese brands are winning</h3>
      <p>
        BYD, Wuling (SGMW), MG (SAIC), and Great Wall collectively held over 50% of the BEV market
        across Southeast Asia in 2024. Their price-performance ratio is unmatched — the BYD Dolphin
        offers WLTP ranges above 400 km for prices that compete with mid-size ICE sedans.
      </p>

      <h3>2. Charging is a solved problem in cities, unsolved elsewhere</h3>
      <p>
        Bangkok, Singapore, and KL now have adequate fast-charging coverage. But intercity routes
        and secondary cities remain underserved. Most EV owners still rely on home charging — which
        works for landed homes but creates barriers for apartment dwellers.
      </p>

      <h3>3. The solar-EV connection is growing</h3>
      <p>
        In Malaysia and Thailand, we&apos;re seeing a pattern: households install rooftop solar, then
        add an EV to maximise savings. The cost of home-charged electricity from solar
        (effectively RM0/kWh for marginal generation) makes EV running costs almost negligible.
      </p>

      <h2>What to watch in 2025</h2>
      <ul>
        <li>
          <strong>Thailand&apos;s EV factory ramp:</strong> BYD, GWM, and Changan factories come online,
          making Thailand a regional export hub and potentially lowering prices 10–15%
        </li>
        <li>
          <strong>Malaysia&apos;s policy continuity:</strong> Tax exemptions confirmed through 2027;
          watch for progress on a national EV policy framework
        </li>
        <li>
          <strong>Indonesia&apos;s subsidy renewal:</strong> The 2024 purchase subsidy programme is being
          evaluated for extension — critical for maintaining momentum
        </li>
        <li>
          <strong>V2H/V2G rollout:</strong> Vehicle-to-home and vehicle-to-grid technology is being
          piloted in Singapore and Thailand, potentially turning EVs into mobile batteries
        </li>
        <li>
          <strong>Sodium-ion batteries:</strong> BYD and CATL are expected to introduce Na-ion packs
          for ultra-affordable models under $15,000, which could unlock mass adoption in ID, VN, and PH
        </li>
      </ul>

      <h2>The bottom line</h2>
      <p>
        Southeast Asia&apos;s EV transition is no longer &quot;coming&quot; — it&apos;s here, and it&apos;s
        accelerating. The region added more EVs in 2024 than in all previous years combined. With
        factories being built, incentives locked in, and Chinese manufacturers pricing aggressively,
        the question has shifted from &quot;will SEA go electric?&quot; to &quot;how fast?&quot;
      </p>

      <div className="not-prose mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <p className="text-sm text-emerald-800">
          <strong>See the data:</strong> Check the{' '}
          <a href="/scoreboard" className="text-emerald-700 underline font-medium">Adoption Scoreboard</a>{' '}
          for live country-by-country rankings, or{' '}
          <a href="/ev" className="text-emerald-700 underline font-medium">compare EVs available in your market</a>.
        </p>
      </div>
    </article>
  )
}
