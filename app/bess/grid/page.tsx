import type { Metadata } from 'next'
import GridBESSClient from './page-client'
import { NextSteps } from '@/components/ui/NextSteps'

export const metadata: Metadata = {
  title: 'Grid-scale BESS calculator, battery.mom',
  description:
    'Calculate LCOE/LCOS for utility-scale battery projects, compare technologies, and track Southeast Asian grid storage developments and policies.',
  keywords: 'grid BESS, LCOE calculator, LCOS calculator, utility storage, battery technologies, Southeast Asia policies',
  openGraph: {
    title: 'Grid-scale BESS calculator, battery.mom',
    description: 'LCOE/LCOS calculator and technology comparison for utility-scale battery storage projects.',
    type: 'website',
  },
}

export default function BESSGridPage() {
  return (
    <>
      <GridBESSClient />
      <NextSteps route="/bess/grid" />
    </>
  )
}

