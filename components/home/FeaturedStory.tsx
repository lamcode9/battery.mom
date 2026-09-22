import { Button, Container, Eyebrow, Section } from '@/components/ui'
import BigFigure from '@/components/home/BigFigure'
import {
  ENERGY_DEPLOYMENT_SNAPSHOT,
  GLOBAL_BATTERY_POWER_ADDITIONS,
} from '@/data/energy-deployment-scoreboard'

// Same figures the story page leads with, computed from the dataset so they never drift.
const battery2020 = GLOBAL_BATTERY_POWER_ADDITIONS[0].utilityScaleGw
const battery2025 = GLOBAL_BATTERY_POWER_ADDITIONS[GLOBAL_BATTERY_POWER_ADDITIONS.length - 1].utilityScaleGw
const batteryMultiple = Math.round(battery2025 / battery2020)
const snap = ENERGY_DEPLOYMENT_SNAPSHOT

/** Homepage centerpiece: the front door into the flagship narrative. */
export default function FeaturedStory() {
  return (
    <Section tone="paper" size="md" className="border-b border-ink/10">
      <Container width="wide">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div>
            <Eyebrow>Featured · The state of the energy transition</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Where battery power stands.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
              Solar and wind became the cheapest electricity on record. Storage is now the constraint, and
              annual additions have jumped. The figures below are the public record.
            </p>
            <div className="mt-8">
              <Button href="/state-of-battery-power" variant="ink">
                Read the full story →
              </Button>
            </div>
          </div>
          {/* The proof beat: the film's big-number grammar, in daylight (storyboard §04 T2). */}
          <div className="grid grid-cols-1 gap-6 border-t border-ink/10 pt-8 sm:grid-cols-3 sm:gap-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <BigFigure value={`${batteryMultiple}×`} label="Grid battery growth, 2020–2025" />
            <BigFigure value="885" label="GWh of storage online, 2025" />
            <BigFigure value={`${snap.lowCarbonSharePct}%`} label="Electricity now low-carbon" />
          </div>
        </div>
      </Container>
    </Section>
  )
}
