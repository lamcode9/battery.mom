export default function ZeroBillMalaysiaContent() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-emerald-600">
      <p className="lead text-lg text-gray-600">
        A 13.5 kWh home battery, the size of a Tesla Powerwall or BYD BatteryBox Premium, costs
        around RM25,000–35,000 installed in Malaysia. Paired with rooftop solar, can it actually
        eliminate your electricity bill? We ran the numbers.
      </p>

      <h2>The setup we modelled</h2>
      <ul>
        <li><strong>Location:</strong> Klang Valley, Malaysia</li>
        <li><strong>Solar system:</strong> 8 kWp rooftop PV (roughly 30–35 m² of panels)</li>
        <li><strong>Battery:</strong> 13.5 kWh usable capacity, LFP chemistry</li>
        <li><strong>Household load:</strong> 900 kWh/month (typical for a 2,000 sq ft home with 2 AC units)</li>
        <li><strong>Solar yield:</strong> 4.6 kWh/kWp/day (conservative average for Peninsular Malaysia)</li>
        <li>
          <strong>Electricity tariff:</strong> RM0.474/kWh (TNB progressive tariff, 601+ kWh band).
          <em className="block text-sm text-gray-500 mt-1 not-italic">
            Dated snapshot from February 2025. The live calculators now use TNB RP4 Domestic General 44.43 sen/kWh (RM0.444) as of 21 September 2026; AFA and the Energy Efficiency Incentive are consumption-dependent and are not rewritten into this article.
          </em>
        </li>
      </ul>

      <h2>Daily energy flow</h2>
      <p>An 8 kWp system in the Klang Valley generates approximately:</p>
      <div className="not-prose bg-gray-50 rounded-xl p-5 my-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">36.8 kWh/day</div>
          <div className="text-sm text-gray-500 mt-1">8 kWp × 4.6 kWh/kWp/day</div>
        </div>
      </div>
      <p>
        Your household uses about <strong>30 kWh/day</strong> (900 kWh ÷ 30). But not all solar
        generation aligns with consumption. Typically:
      </p>
      <ul>
        <li>~40% of solar is consumed directly during the day (12 kWh)</li>
        <li>~60% is either exported or stored (22 kWh)</li>
      </ul>

      <h2>With battery: the maths</h2>
      <p>
        The 13.5 kWh battery captures excess daytime solar and discharges at night. With good
        load management:
      </p>
      <div className="not-prose overflow-x-auto my-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 pr-4 font-semibold text-gray-700">Energy source</th>
              <th className="text-right py-2 font-semibold text-gray-700">Daily kWh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2 pr-4 text-gray-600">Direct solar consumption (daytime)</td>
              <td className="text-right py-2 font-medium">12.0</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">Battery discharge (evening/night)</td>
              <td className="text-right py-2 font-medium">13.5</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">Grid export (excess solar)</td>
              <td className="text-right py-2 font-medium text-emerald-700">8.5</td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2 pr-4 text-gray-900">Total self-consumed</td>
              <td className="text-right py-2 text-gray-900">25.5</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">Remaining grid import</td>
              <td className="text-right py-2 font-medium text-red-600">4.5</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Self-consumption rate: <strong>~85%</strong>. You still pull about 4.5 kWh/day from the grid,
        mainly in the early morning before solar starts and during heavy loads (multiple ACs +
        cooking) that exceed the battery&apos;s discharge rate.
      </p>

      <h2>Can you actually hit zero?</h2>
      <p>
        <strong>Not with 13.5 kWh alone.</strong> Here is why:
      </p>
      <ul>
        <li>
          <strong>Morning gap:</strong> 6–8 AM has no solar and the battery may be partially drained
          from overnight AC use
        </li>
        <li>
          <strong>Rainy days:</strong> Malaysia gets 2–4 hours of rain daily on average. Solar yield
          drops 40–70% on heavy overcast days, and the battery runs out early
        </li>
        <li>
          <strong>Peak loads:</strong> Running 2+ AC units, an oven, and a water heater simultaneously
          can exceed the battery&apos;s 5 kW discharge rate
        </li>
      </ul>

      <h3>Monthly bill with 13.5 kWh battery</h3>
      <div className="not-prose bg-gray-50 rounded-xl p-5 my-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500">Without solar+battery</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">RM427</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">With solar only</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">RM201</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">With solar + 13.5 kWh</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">RM64</div>
          </div>
        </div>
      </div>
      <p>
        That RM64 a month is the residual grid import (about 135 kWh) plus the minimum connection
        charge. The bill is 85% lower. It is not zero.
      </p>

      <h2>What it takes to reach a zero bill</h2>
      <p>To eliminate that last RM64:</p>
      <ol>
        <li>
          <strong>Upsize to 20–27 kWh.</strong> A second battery or a larger unit covers the morning
          gap and rainy-day buffer
        </li>
        <li>
          <strong>Net metering (NEM).</strong> Malaysia&apos;s NEM Rakyat programme credits exported
          solar at the displaced tariff rate, which can offset your residual import
        </li>
        <li>
          <strong>Load shifting.</strong> Run the dishwasher, washing machine, and water heater during
          peak solar hours (10 AM–3 PM)
        </li>
      </ol>
      <p>
        With NEM + 13.5 kWh + smart load shifting, a true zero bill is achievable for households
        under 1,000 kWh/month.
      </p>

      <h2>Payback period</h2>
      <div className="not-prose overflow-x-auto my-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 pr-4 font-semibold text-gray-700">Component</th>
              <th className="text-right py-2 pr-4 font-semibold text-gray-700">Cost</th>
              <th className="text-right py-2 font-semibold text-gray-700">Annual savings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2 pr-4 text-gray-600">8 kWp solar panels</td>
              <td className="text-right py-2 pr-4">RM25,600</td>
              <td className="text-right py-2">RM2,712</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-600">13.5 kWh LFP battery</td>
              <td className="text-right py-2 pr-4">RM30,000</td>
              <td className="text-right py-2">RM1,644</td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2 pr-4">Total</td>
              <td className="text-right py-2 pr-4">RM55,600</td>
              <td className="text-right py-2">RM4,356/yr</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Simple payback: <strong>~12.8 years</strong>. With 3% annual tariff inflation, the real
        payback is closer to <strong>10–11 years</strong>. Given that LFP batteries last 15–20 years,
        you get 5–10 years of essentially free electricity.
      </p>

      <h2>The verdict</h2>
      <p>
        A 13.5 kWh battery can cut your Malaysian electricity bill by ~85%, bringing a RM427 bill
        down to ~RM64. A true zero bill requires either a larger battery (20+ kWh), active NEM
        participation, or load shifting. Doing all three gets closer.
      </p>
      <p>
        At these prices the battery pays back if you stay in the house for 10 or more years and the
        electricity bill is RM300 or more a month. A true zero bill is a separate question.
      </p>

      <div className="not-prose mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <p className="text-sm text-emerald-800">
          <strong>Model it yourself:</strong> Plug your actual usage into the{' '}
          <a href="/bess/home" className="text-emerald-700 underline font-medium">Zero-Bill Calculator</a>{' '}
          to see payback and savings on Malaysian tariffs and the BESS products in the dataset.
        </p>
      </div>
    </article>
  )
}
