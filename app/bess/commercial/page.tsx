import type { Metadata } from 'next'
import CommercialBESSClient from './page-client'
import { NextSteps } from '@/components/ui/NextSteps'

export const metadata: Metadata = {
  title: 'Commercial BESS calculator, battery.mom',
  description:
    'Calculate peak shaving, demand charge reduction, and revenue stacking for commercial battery energy storage systems. Compare products and use cases across Southeast Asia.',
  keywords: 'commercial BESS, peak shaving calculator, demand charge reduction, energy storage, battery systems, Southeast Asia',
  openGraph: {
    title: 'Commercial BESS calculator, battery.mom',
    description: 'Size commercial battery systems for peak shaving and demand charge reduction across Southeast Asia.',
    type: 'website',
  },
}

export default function BESSCommercialPage() {
  return (
    <>
      <CommercialBESSClient />
      <NextSteps route="/bess/commercial" />
    </>
  )
}

