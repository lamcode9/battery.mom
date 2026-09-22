export default function LfpVsNmcContent() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-emerald-600">
      <p className="lead text-lg text-gray-600">
        If you&apos;re shopping for an EV or a home battery in Southeast Asia, you&apos;ll encounter two
        acronyms over and over: <strong>LFP</strong> (lithium iron phosphate) and{' '}
        <strong>NMC</strong> (nickel manganese cobalt). Both are lithium-ion batteries, but they differ
        in ways that matter a lot when temperatures routinely hit 35°C.
      </p>

      <h2>The basics</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 pr-4 font-semibold text-gray-700">Property</th>
              <th className="text-left py-2 pr-4 font-semibold text-gray-700">LFP</th>
              <th className="text-left py-2 font-semibold text-gray-700">NMC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2 pr-4 text-gray-600">Chemistry</td>
              <td className="py-2 pr-4">LiFePO₄</td>
              <td className="py-2">LiNiₓMnₓCoₓO₂</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">Energy density</td>
              <td className="py-2 pr-4">Lower (~160 Wh/kg)</td>
              <td className="py-2">Higher (~230 Wh/kg)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">Cycle life</td>
              <td className="py-2 pr-4">3,000–6,000+ cycles</td>
              <td className="py-2">1,500–2,500 cycles</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">Thermal stability</td>
              <td className="py-2 pr-4 text-emerald-700 font-medium">Excellent</td>
              <td className="py-2 text-amber-700 font-medium">Moderate</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">Fire risk</td>
              <td className="py-2 pr-4">Very low</td>
              <td className="py-2">Higher (requires active thermal management)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">Cost per kWh</td>
              <td className="py-2 pr-4 text-emerald-700 font-medium">~$60–80</td>
              <td className="py-2">~$100–130</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">Cobalt content</td>
              <td className="py-2 pr-4">None</td>
              <td className="py-2">Significant</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Why tropical heat matters</h2>
      <p>
        Battery degradation accelerates with temperature. NMC cells begin to degrade faster above 30°C,
        which is most days in most of Southeast Asia. LFP cells tolerate heat
        better. Their cathode structure is more thermally stable, and they don&apos;t experience the same
        rate of capacity fade at elevated temperatures.
      </p>
      <p>
        This is why you see many EV manufacturers switching their Southeast Asian models to LFP packs:
      </p>
      <ul>
        <li><strong>Tesla Model 3 Standard Range.</strong> LFP (CATL) in all markets including SEA</li>
        <li><strong>BYD Atto 3, Dolphin, Seal.</strong> BYD&apos;s Blade Battery (LFP)</li>
        <li><strong>Wuling Air ev.</strong> LFP pack for the Indonesia market</li>
      </ul>
      <p>
        For home batteries, both the <strong>BYD BatteryBox</strong> and most <strong>Huawei LUNA</strong>{' '}
        systems sold in SEA use LFP cells. The Tesla Powerwall 3 is also LFP.
      </p>

      <h2>When NMC still makes sense</h2>
      <p>
        NMC isn&apos;t going away. Its higher energy density means more range per kilogram, which matters
        for premium EVs where weight and space are tightly optimised:
      </p>
      <ul>
        <li><strong>Hyundai Ioniq 5 / Kia EV6.</strong> NMC packs (SK On) for the 72.6 kWh option</li>
        <li><strong>Mercedes EQS.</strong> NMC, for maximum range</li>
        <li>Long-range/performance variants where buyers accept the premium</li>
      </ul>
      <p>
        These vehicles compensate with sophisticated liquid cooling systems, but the thermal management
        system adds cost and complexity, and it works harder in tropical temperatures.
      </p>

      <h2>What this means for home battery shoppers</h2>
      <p>
        For a stationary home battery in Southeast Asia, LFP is almost always the better choice:
      </p>
      <ol>
        <li><strong>Longer life.</strong> 6,000+ cycles means 15–20 years at one cycle per day</li>
        <li><strong>Heat tolerance.</strong> No air conditioning needed for the battery room or garage</li>
        <li><strong>Safety.</strong> Thermal runaway risk is near zero, which matters for a device inside a home</li>
        <li><strong>Cost.</strong> A lower price per kWh shortens solar payback</li>
      </ol>

      <h2>The bottom line</h2>
      <p>
        In a tropical climate, LFP&apos;s advantages in thermal stability, cycle life, safety, and cost
        outweigh NMC&apos;s edge in energy density for most buyers. If you&apos;re buying an EV for daily
        commuting or a home battery for solar storage, look for LFP first. NMC is a reasonable choice
        only when you need maximum range and are comfortable with the premium.
      </p>

      <div className="not-prose mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <p className="text-sm text-emerald-800">
          <strong>Try it:</strong> Compare LFP and NMC home batteries using our{' '}
          <a href="/bess/home" className="text-emerald-700 underline font-medium">Zero-Bill Calculator</a>,
          or browse <a href="/ev" className="text-emerald-700 underline font-medium">EVs by battery chemistry</a>.
        </p>
      </div>
    </article>
  )
}
