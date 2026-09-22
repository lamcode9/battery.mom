'use client'

/**
 * Transparent methodology disclosure for the EV comparison page.
 * Explains how every badge, score, and ranking is calculated.
 */
export default function EVMethodologyFooter() {
  return (
    <section className="mt-12 mb-8 border-t border-ink/10 pt-8">
      <details className="group max-w-4xl">
        <summary className="cursor-pointer text-sm font-semibold text-ink-700 hover:text-brand-700 transition-colors flex items-center gap-2 select-none">
          <svg className="w-4 h-4 text-ink-400 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          How we rank and score EVs. Methodology and data sources
        </summary>

        <div className="mt-4 pl-6 space-y-6 text-sm text-ink-600 leading-relaxed">
          {/* Principles */}
          <div>
            <h4 className="font-semibold text-ink-800 mb-1">Principles</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>No editorial opinions.</strong> All rankings are computed from verifiable manufacturer specs.</li>
              <li><strong>No brand preferences.</strong> Every vehicle in the database is treated equally.</li>
              <li><strong>Country-scoped.</strong> Comparisons happen within the same country to ensure price and availability are meaningful.</li>
              <li><strong>BEVs only.</strong> Only pure battery electric vehicles are listed. PHEVs, series hybrids, and range extenders are excluded.</li>
            </ul>
          </div>

          {/* Quick picks */}
          <div>
            <h4 className="font-semibold text-ink-800 mb-1">Quick picks (hero cards)</h4>
            <p className="mb-2">Each card shows the single best vehicle in one measurable dimension:</p>
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="text-left py-1 pr-3 text-ink-700">Category</th>
                  <th className="text-left py-1 pr-3 text-ink-700">Metric</th>
                  <th className="text-left py-1 text-ink-700">Direction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                <tr><td className="py-1 pr-3">Best Range</td><td className="pr-3">WLTP range (km)</td><td>Higher = better</td></tr>
                <tr><td className="py-1 pr-3">Best Value</td><td className="pr-3">Base price ÷ range</td><td>Lower = better</td></tr>
                <tr><td className="py-1 pr-3">Most Efficient</td><td className="pr-3">kWh per 100 km</td><td>Lower = better</td></tr>
                <tr><td className="py-1 pr-3">Fastest Charge</td><td className="pr-3">DC 0→80% time (min)</td><td>Lower = better</td></tr>
                <tr><td className="py-1 pr-3">Most Affordable</td><td className="pr-3">Base price (local currency)</td><td>Lower = better</td></tr>
              </tbody>
            </table>
          </div>

          {/* Winner Badges */}
          <div>
            <h4 className="font-semibold text-ink-800 mb-1">Winner badges (comparison table)</h4>
            <p className="mb-2">Badges are awarded to the leader in each category <em>among the vehicles currently being compared</em>. If two vehicles tie, both receive the badge.</p>
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="text-left py-1 pr-3 text-ink-700">Badge</th>
                  <th className="text-left py-1 text-ink-700">Metric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                <tr><td className="py-1 pr-3">🛣️ Best Range</td><td>Highest WLTP range (km)</td></tr>
                <tr><td className="py-1 pr-3">⚡ Most Efficient</td><td>Lowest kWh/100 km</td></tr>
                <tr><td className="py-1 pr-3">💰 Best Value</td><td>Lowest base price ÷ range</td></tr>
                <tr><td className="py-1 pr-3">🔋 Biggest Battery</td><td>Highest usable battery capacity (kWh)</td></tr>
                <tr><td className="py-1 pr-3">⚡ Fastest Charge</td><td>Shortest DC 0→80% time (min)</td></tr>
                <tr><td className="py-1 pr-3">💪 Most Powerful</td><td>Highest motor output (kW)</td></tr>
                <tr><td className="py-1 pr-3">🏎️ Quickest</td><td>Fastest 0-100 km/h (sec, manufacturer-stated)</td></tr>
                <tr><td className="py-1 pr-3">🏷️ Most Affordable</td><td>Lowest base price (local currency)</td></tr>
              </tbody>
            </table>
          </div>

          {/* battery.mom Score */}
          <div>
            <h4 className="font-semibold text-ink-800 mb-1">battery.mom Score (0–100)</h4>
            <p className="mb-2">
              A weighted composite that ranks each vehicle relative to the best in its country.
              A score of 100 means the vehicle leads every dimension; 50 means it is halfway to the leader in every category.
            </p>
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="border-b border-ink/10">
                  <th className="text-left py-1 pr-3 text-ink-700">Dimension</th>
                  <th className="text-left py-1 pr-3 text-ink-700">Weight</th>
                  <th className="text-left py-1 text-ink-700">Calculation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                <tr><td className="py-1 pr-3">Range</td><td className="pr-3">25%</td><td>vehicle range ÷ max range in set × 100</td></tr>
                <tr><td className="py-1 pr-3">Efficiency</td><td className="pr-3">25%</td><td>best efficiency ÷ vehicle efficiency × 100</td></tr>
                <tr><td className="py-1 pr-3">Value</td><td className="pr-3">20%</td><td>best price-per-km ÷ vehicle price-per-km × 100</td></tr>
                <tr><td className="py-1 pr-3">Charging</td><td className="pr-3">15%</td><td>best DC time ÷ vehicle DC time × 100</td></tr>
                <tr><td className="py-1 pr-3">Battery</td><td className="pr-3">15%</td><td>vehicle kWh ÷ max kWh in set × 100</td></tr>
              </tbody>
            </table>
          </div>

          {/* Data sources */}
          <div>
            <h4 className="font-semibold text-ink-800 mb-1">Data sources</h4>
            <p>
              Specifications are sourced from official manufacturer sites, national transport authority registries, and
              verified dealer listings for each Southeast Asian market. Prices are base prices in local currency as
              listed by authorized dealers, excluding on-the-road costs unless stated. Data is refreshed periodically;
              the &quot;last updated&quot; timestamp on each vehicle reflects its most recent verification.
            </p>
          </div>

          <p className="text-xs text-ink-400 pt-2 border-t border-ink/5">
            Found an error? <a href="/suggest-correction" className="text-brand-600 hover:underline">Suggest a correction</a>.
          </p>
        </div>
      </details>
    </section>
  )
}
