import type { Metadata } from 'next'
import ScoreboardClient from '../page-client'
import { NextSteps } from '@/components/ui/NextSteps'

export const metadata: Metadata = {
  title: 'EV adoption scoreboard, battery.mom',
  description:
    'Country-by-country electric-vehicle adoption rankings across Southeast Asia, with charging density, solar context, policy support, and EV sales growth.',
  openGraph: {
    title: 'EV adoption scoreboard, battery.mom',
    description:
      'Compare electric-vehicle adoption, charging infrastructure, solar context, and policy readiness across six Southeast Asian countries.',
    url: 'https://battery.mom/scoreboard/ev',
    siteName: 'battery.mom',
    type: 'website',
  },
}

export default function EvAdoptionScoreboardPage() {
  return (
    <>
      <ScoreboardClient />
      <NextSteps route="/scoreboard/ev" />
    </>
  )
}
