'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Cross-nav for the Big Picture tracking surfaces — the narrative plus the
 * three deployment boards. Labels mirror the header's "Big Picture" set exactly
 * so a visitor never sees the same destination under two different names. Active
 * state is a filled pill (not a border) to keep one bordered surface per level.
 *
 * Replaces the old per-page "Scoreboard home / EV adoption / BESS adoption /
 * Global battery deployment" pill rows, which used stale labels and pointed at
 * the retired `/scoreboard` hub.
 */
const links = [
  { href: '/state-of-battery-power', label: 'Big picture' },
  { href: '/scoreboard/energy', label: 'Global deployment' },
  { href: '/scoreboard/ev', label: 'EV adoption' },
  { href: '/scoreboard/bess', label: 'Storage adoption' },
]

export function BigPictureNav({ className = '' }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={`flex flex-wrap gap-2 text-sm ${className}`} aria-label="Big Picture views">
      {links.map((link) => {
        const active = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'rounded-full bg-ink px-3.5 py-1.5 font-semibold text-paper shadow-sm'
                : 'rounded-full bg-paper-200 px-3.5 py-1.5 font-semibold text-ink-600 transition hover:bg-paper-100 hover:text-ink'
            }
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
