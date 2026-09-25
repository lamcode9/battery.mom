import Link from 'next/link'

const siteName = 'battery.mom'

// Grouped by the same topic pillars as the header nav, so the site presents one
// mental model everywhere. Each column mirrors a primary nav pillar; "Site" holds
// the editorial + meta routes.
type FooterLink = { href: string; label: string; external?: boolean }
type FooterGroup = { heading: string; links: FooterLink[] }

const footerGroups: FooterGroup[] = [
  {
    heading: 'Big picture',
    links: [
      { href: '/sunrise', label: 'The long sunrise' },
      { href: '/state-of-battery-power', label: 'The story' },
      { href: '/scoreboard/energy', label: 'Global deployment' },
      { href: '/scoreboard/ev', label: 'EV adoption' },
      { href: '/scoreboard/bess', label: 'Storage adoption' },
    ],
  },
  {
    heading: 'EVs',
    links: [
      { href: '/ev', label: 'Compare EVs' },
      { href: '/calculators/ev-vs-ice', label: 'EV vs Petrol' },
      { href: '/calculators/ev-charging-cost', label: 'Charging cost' },
    ],
  },
  {
    heading: 'Battery and solar',
    links: [
      { href: '/bess/home', label: 'Home battery' },
      { href: '/bess/shared-residential', label: 'Shared residential' },
      { href: '/bess/commercial', label: 'Commercial' },
      { href: '/bess/grid', label: 'Grid and industrial' },
      { href: '/calculators/solar-payback', label: 'Solar payback' },
      { href: '/bess/case-studies', label: 'Scenarios' },
    ],
  },
  {
    heading: 'Site',
    links: [
      { href: '/insights', label: 'Insights' },
      { href: '/about', label: 'About' },
      { href: '/contributors', label: 'Sources' },
      { href: '/suggest-correction', label: 'Suggest a correction' },
      { href: '/contact', label: 'Contact' },
      { href: '/feed.xml', label: 'RSS', external: true },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-paper text-ink-500">
      <div className="container mx-auto max-w-[1200px] px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="grid gap-8 md:grid-cols-[1.2fr_2.8fr] md:gap-12">
            <div className="max-w-sm">
              <Link href="/" className="text-base font-bold text-ink transition-colors hover:text-brand-700">
                {siteName}
              </Link>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Battery, solar, and energy adoption data. No ads, no sponsors, no affiliate pressure.
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4" aria-label="Footer">
              {footerGroups.map((group) => (
                <div key={group.heading}>
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    {group.heading}
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        {link.external ? (
                          <a href={link.href} className="text-ink-600 transition-colors hover:text-brand-700">
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className="text-ink-600 transition-colors hover:text-brand-700">
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <p className="max-w-4xl text-xs leading-5 text-ink-400">
            This living database is manually checked against primary sources where available. Residential tariffs, petrol prices, and USD rates were last verified 21 September 2026. Singapore electricity is the GST-inclusive household bill rate (34.78¢); Malaysia petrol is BUDI95 RM1.99 (unsubsidised RON95 was RM4.37 that week). Prices, incentives, specifications, and deployment figures may change; always confirm with official sources.
          </p>

          <div className="flex flex-col gap-2 border-t border-ink/5 pt-4 text-xs text-ink-400 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <p>Independent data on batteries, solar, and EVs.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
