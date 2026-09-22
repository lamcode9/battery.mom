import type { Metadata } from 'next'
import EnergyDeploymentScoreboardPage from './page-client'
import { NextSteps } from '@/components/ui/NextSteps'

export const metadata: Metadata = {
  title: 'Battery deployment scoreboard, battery.mom',
  description:
    'Track global stationary battery storage deployment in GWh and compare it with coal, gas, oil, renewables, hydro, wind, solar, and nuclear electricity trends.',
  openGraph: {
    title: 'Battery deployment scoreboard, battery.mom',
    description:
      'A global scoreboard for battery storage deployment, regional electricity mix, and the shift from fossil generation to renewables.',
    url: 'https://battery.mom/scoreboard/energy',
    siteName: 'battery.mom',
    type: 'website',
  },
}

export default function EnergyScoreboardPage() {
  return (
    <>
      <EnergyDeploymentScoreboardPage />
      <NextSteps route="/scoreboard/energy" />
    </>
  )
}
