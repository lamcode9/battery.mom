// The site's connective spine. Every page on battery.mom does one of three jobs —
// it helps you TRACK the transition, DECIDE your move, or READ the context — and
// every page ends by pointing to the logical next page. This file is the single
// place those forward links are defined, so the journey stays coherent instead of
// being re-invented in twenty page files.
//
// `DESTINATIONS` is the catalogue of places a visitor can be sent. `JOURNEY` maps
// each page to the 2–3 destinations that make sense after it. The <NextSteps>
// component reads both. Changing how the site connects = editing this file.

export type Kind = 'track' | 'decide' | 'read'

export type Destination = {
  href: string
  label: string
  blurb: string
  kind: Kind
}

/** What each job means, surfaced as the small kicker on every next-step card. */
export const KIND_LABEL: Record<Kind, string> = {
  track: 'Track',
  decide: 'Decide',
  read: 'Read',
}

/** The catalogue of forward destinations, keyed by a short id. */
export const DESTINATIONS = {
  story: {
    href: '/state-of-battery-power',
    label: 'The story',
    blurb: 'How batteries, solar, and EVs scaled, in one read.',
    kind: 'read',
  },
  energyBoard: {
    href: '/scoreboard/energy',
    label: 'Global deployment',
    blurb: 'Live battery build-out worldwide, in GW and GWh, updated from public data.',
    kind: 'track',
  },
  evBoard: {
    href: '/scoreboard/ev',
    label: 'EV adoption',
    blurb: 'How fast each Southeast Asian country is switching to electric.',
    kind: 'track',
  },
  bessBoard: {
    href: '/scoreboard/bess',
    label: 'Storage adoption',
    blurb: 'Where stationary storage is scaling first: home, commercial, and grid.',
    kind: 'track',
  },
  evCompare: {
    href: '/ev',
    label: 'Compare EVs',
    blurb: 'Rank electric cars on real range, charging time, and price in your country.',
    kind: 'decide',
  },
  evVsIce: {
    href: '/calculators/ev-vs-ice',
    label: 'EV vs Petrol',
    blurb: 'Five- and ten-year cost of ownership against an equivalent petrol car.',
    kind: 'decide',
  },
  charging: {
    href: '/calculators/ev-charging-cost',
    label: 'Charging cost',
    blurb: 'What it really costs to charge, at home or in public, on local rates.',
    kind: 'decide',
  },
  solarPayback: {
    href: '/calculators/solar-payback',
    label: 'Solar payback',
    blurb: 'How long rooftop solar takes to pay for itself at your tariff and yield.',
    kind: 'decide',
  },
  bessHome: {
    href: '/bess/home',
    label: 'Home battery',
    blurb: 'Size solar and storage to cut your home electricity bill, including to zero.',
    kind: 'decide',
  },
  bessShared: {
    href: '/bess/shared-residential',
    label: 'Shared residential',
    blurb: 'One battery across a condo or apartment block: per-unit savings and ROI.',
    kind: 'decide',
  },
  bessCommercial: {
    href: '/bess/commercial',
    label: 'Commercial Storage',
    blurb: 'Peak shaving, demand-charge savings, and revenue stacking for businesses.',
    kind: 'decide',
  },
  bessGrid: {
    href: '/bess/grid',
    label: 'Grid and industrial',
    blurb: 'LCOS economics and policy for utility-scale storage across the region.',
    kind: 'decide',
  },
  caseStudies: {
    href: '/bess/case-studies',
    label: 'Case studies',
    blurb: 'Real homes and businesses: what they paid, what they saved, what they learned.',
    kind: 'read',
  },
  insights: {
    href: '/insights',
    label: 'Insights',
    blurb: 'Data-driven explainers and market snapshots on the energy transition.',
    kind: 'read',
  },
  bessHub: {
    href: '/bess',
    label: 'Battery and solar',
    blurb: 'Size storage at every scale, from a single rooftop to a national grid.',
    kind: 'decide',
  },
} satisfies Record<string, Destination>

export type DestinationId = keyof typeof DESTINATIONS

// For each page (keyed by route), the ordered next steps a visitor should see.
// First entry is the primary continuation; the rest are useful side-paths.
export const JOURNEY: Record<string, DestinationId[]> = {
  // ── Big Picture ──────────────────────────────────────────
  '/scoreboard/energy': ['story', 'bessBoard', 'bessHome'],
  '/scoreboard/ev': ['evCompare', 'evVsIce', 'energyBoard'],
  '/scoreboard/bess': ['bessHome', 'bessCommercial', 'energyBoard'],

  // ── EVs ──────────────────────────────────────────────────
  '/ev': ['evVsIce', 'charging', 'evBoard'],
  '/calculators/ev-vs-ice': ['evCompare', 'charging', 'evBoard'],
  '/calculators/ev-charging-cost': ['evCompare', 'evVsIce', 'solarPayback'],

  // ── Battery & Solar ──────────────────────────────────────
  '/bess': ['bessHome', 'caseStudies', 'bessBoard'],
  '/bess/home': ['solarPayback', 'caseStudies', 'bessBoard'],
  '/bess/shared-residential': ['bessHome', 'bessCommercial', 'caseStudies'],
  '/bess/commercial': ['bessGrid', 'caseStudies', 'solarPayback'],
  '/bess/grid': ['energyBoard', 'bessCommercial', 'caseStudies'],
  '/bess/case-studies': ['bessHome', 'bessCommercial', 'bessBoard'],
  '/calculators/solar-payback': ['bessHome', 'caseStudies', 'energyBoard'],

  // ── Read / meta ──────────────────────────────────────────
  '/insights': ['story', 'evCompare', 'bessHome'],
  '/about': ['story', 'energyBoard', 'evCompare'],
}

/** Resolve a page's next steps to full destination objects. Empty if unmapped. */
export function nextStepsFor(route: string): Destination[] {
  const ids = JOURNEY[route]
  if (!ids) return []
  return ids.map((id) => DESTINATIONS[id])
}
