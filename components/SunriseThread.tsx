import Link from 'next/link'

interface SunriseThreadProps {
  className?: string
  /** 'dark' for ink/dark surfaces — paper-toned text, gold-light hover. */
  tone?: 'dark'
}

/**
 * One-line standing link that threads data pages back to The long sunrise
 * story. Footnote-voiced: italic serif, quiet until hovered.
 */
export default function SunriseThread({ className = '', tone }: SunriseThreadProps) {
  const dark = tone === 'dark'
  return (
    <p className={`font-display text-sm italic ${dark ? 'text-paper-300/60' : 'text-ink-400'} ${className}`}>
      <Link href="/sunrise" className={`transition ${dark ? 'hover:text-gold-light' : 'hover:text-gold'}`}>
        Part of The long sunrise, the whole argument, from the first fire &rarr;
      </Link>
    </p>
  )
}
