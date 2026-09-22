import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact, battery.mom',
  description: 'Write to battery.mom about a correction, a data request, or feedback.',
  alternates: { canonical: '/contact' },
}

import ContactFormClient from './page-client'

export default function ContactPage() {
  return <ContactFormClient />
}
