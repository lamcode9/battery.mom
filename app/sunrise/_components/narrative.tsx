'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ramp, useInView, useSectionProgress, usePrefersReducedMotion } from '../_lib/useScroll'
import type { ActMeta, BigNumberItem } from '@/content/sunrise/script'

/**
 * Narrative primitives for /sunrise — v2 editorial system.
 *
 * The design language is the site's own newsprint identity inverted for the
 * dark phases: hairline rules, big Newsreader figures, italic serif labels,
 * footnote-voiced sources. Deliberately absent: tracked-uppercase eyebrows,
 * stat cards, pill badges, glass panels, staggered reveal delays.
 *
 * v4: the words live IN the shot. Text-flow elements share one left-anchored
 * reading column inside a max-w-6xl frame — the SceneStage scrim darkens that
 * side and the footage's subject holds the right two-thirds. Wide data
 * figures (charts, ladder, giants) stay centered; they play in reading light.
 */

/** The film's reading column: a left-anchored measure inside the 6xl frame. */
const COL_FRAME = 'mx-auto w-full max-w-6xl px-6'

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.2)
  const reduced = usePrefersReducedMotion()
  const shown = inView || reduced
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

/**
 * A giant-type moment whose entrance is scrubbed by scroll position rather
 * than fired once — the reader's hand drives it in.
 */
export function GiantLine({
  children,
  tone = 'paper',
  className = '',
}: {
  children: ReactNode
  tone?: 'paper' | 'gold' | 'ink'
  className?: string
}) {
  const { ref, progress } = useSectionProgress<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const t = reduced ? 1 : Math.min(1, Math.max(0, (progress - 0.12) / 0.26))
  const toneCls = { paper: 'text-paper', gold: 'text-gold', ink: 'text-ink' }[tone]
  return (
    <div ref={ref} className={`mx-auto max-w-4xl px-6 ${className}`}>
      <p
        className={`font-display text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl md:text-7xl ${toneCls}`}
        style={{ opacity: 0.08 + t * 0.92, transform: `translateY(${(1 - t) * 28}px)` }}
      >
        {children}
      </p>
    </div>
  )
}

/**
 * Act opener as a scrubbed title card — the reader's hand drives the
 * choreography in sequence: the rule draws itself, the era slides in along
 * it, the numeral and title rise from behind a baseline mask, and the
 * hearth line settles last. No fire-once fades.
 */
export function ActHeader({ act, id, tone = 'dark' }: { act: ActMeta; id: string; tone?: 'dark' | 'light' }) {
  const { ref, progress } = useSectionProgress<HTMLElement>()
  const reduced = usePrefersReducedMotion()
  const ease = (x: number) => 1 - Math.pow(1 - x, 3)
  const t = reduced ? 1 : ramp(progress, 0.12, 0.5)
  const rule = ease(ramp(t, 0, 0.4))
  const era = ease(ramp(t, 0.08, 0.45))
  const numeral = ease(ramp(t, 0.18, 0.62))
  const title = ease(ramp(t, 0.28, 0.8))
  const hearth = ease(ramp(t, 0.62, 1))
  const c =
    tone === 'dark'
      ? { era: 'text-paper-300/80', title: 'text-paper', hearth: 'text-paper-300/70', hearthWord: 'text-gold/80', rule: 'bg-gold/50' }
      : { era: 'text-ink-500', title: 'text-ink', hearth: 'text-ink-500', hearthWord: 'text-gold', rule: 'bg-gold/60' }
  return (
    <header ref={ref} id={id} className={`${COL_FRAME} max-w-6xl scroll-mt-24`}>
      <div className="flex max-w-2xl items-center gap-4">
        <span aria-hidden className={`h-px w-12 origin-left ${c.rule}`} style={{ transform: `scaleX(${rule})` }} />
        <span
          className={`font-display text-sm italic ${c.era}`}
          style={{ opacity: era, transform: `translateX(${(1 - era) * -12}px)` }}
        >
          {act.era}
        </span>
      </div>
      <div className="mt-5 flex max-w-2xl items-start gap-5">
        {act.numeral && (
          /* shrink-0: overflow-hidden zeroes the automatic min-size, letting
             flex crush the mask below the glyphs' width (III → II). */
          <span aria-hidden className="shrink-0 overflow-hidden">
            <span
              className="block font-display text-5xl leading-none text-gold sm:text-6xl"
              style={{ transform: `translateY(${(1 - numeral) * 110}%)` }}
            >
              {act.numeral}
            </span>
          </span>
        )}
        {/* pb/-mb pair keeps the baseline mask from clipping descenders. */}
        <div className="-mb-2 overflow-hidden">
          <h2
            className={`pb-2 font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl ${c.title}`}
            style={{ transform: `translateY(${(1 - title) * 104}%)`, opacity: 0.2 + title * 0.8 }}
          >
            {act.title}
          </h2>
        </div>
      </div>
      <p
        className={`mt-4 max-w-2xl font-display text-sm italic ${c.hearth}`}
        style={{ opacity: hearth, transform: `translateY(${(1 - hearth) * 8}px)` }}
      >
        <span className={c.hearthWord}>the hearth,</span> {act.hearth}
      </p>
    </header>
  )
}

export function Prose({ children, lead = false }: { children: ReactNode; lead?: boolean }) {
  return (
    <Reveal className={COL_FRAME}>
      <p
        className={
          lead
            ? 'max-w-2xl font-display text-2xl leading-snug text-paper sm:text-3xl'
            : 'max-w-xl text-base leading-relaxed text-paper-300 sm:text-lg'
        }
      >
        {children}
      </p>
    </Reveal>
  )
}

/**
 * The verified figures, set as an editorial ledger: hairline rules, huge
 * Newsreader numerals, italic labels with the source run in as a footnote.
 * One voice for every figure — the numbers are the color.
 */
export function BigNumbers({ items }: { items: BigNumberItem[] }) {
  return (
    <div className={COL_FRAME}>
      {items.map((n) => (
        <Reveal key={n.label} className="max-w-xl">
          <div className="border-t border-paper/15 py-6 sm:py-8">
            <div className="font-display text-5xl font-medium tabular-nums tracking-tight text-paper sm:text-6xl md:text-7xl">
              {n.value}
            </div>
            <p className="mt-2 font-display text-base italic text-paper-300 sm:text-lg">
              {n.label}
              {n.sub && <span className="text-paper-300/60">, {n.sub}</span>}
            </p>
          </div>
        </Reveal>
      ))}
      <div className="max-w-xl border-t border-paper/15" aria-hidden />
    </div>
  )
}

/** “Closer to home” — the Southeast Asia sub-anchor, as a ruled margin note. */
export function SeaInset({ children }: { children: ReactNode }) {
  return (
    <Reveal className={COL_FRAME}>
      <aside className="max-w-xl border-l-2 border-brand-400/70 pl-5 sm:pl-6">
        <p className="text-base leading-relaxed text-paper-300 sm:text-lg">
          <span className="font-display italic text-brand-300">Closer to home. </span>
          {children}
        </p>
      </aside>
    </Reveal>
  )
}

/** Act I felt beat: press and hold to keep the ember alive. */
export function EmberHold({ caption }: { caption: string }) {
  const [held, setHeld] = useState(false)
  const [heat, setHeat] = useState(0) // 0..1
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => {
      setHeat((h) => Math.min(1, Math.max(0, h + (held ? 0.06 : -0.04))))
    }, 50)
    return () => window.clearInterval(id)
  }, [held, reduced])

  const glow = reduced ? 0.8 : 0.15 + heat * 0.85
  return (
    <Reveal className={COL_FRAME}>
      <figure className="flex max-w-xl flex-col items-center py-4 text-center">
        <button
          type="button"
          aria-label="Hold to keep the ember alive"
          onPointerDown={() => setHeld(true)}
          onPointerUp={() => setHeld(false)}
          onPointerLeave={() => setHeld(false)}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setHeld(true) }}
          onKeyUp={() => setHeld(false)}
          className="relative h-24 w-24 touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full transition-transform duration-200"
            style={{
              background: `radial-gradient(circle, rgba(244,209,138,${glow}) 0%, rgba(224,163,60,${glow * 0.7}) 30%, rgba(122,59,16,${glow * 0.35}) 60%, transparent 75%)`,
              transform: `scale(${0.8 + glow * 0.5})`,
            }}
          />
          <span aria-hidden className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `rgba(255,214,140,${0.35 + glow * 0.65})` }} />
        </button>
        <figcaption className="mt-4 max-w-sm font-display text-sm italic text-paper-300/80">
          {reduced ? caption : <>Hold the ember. Let go, and it dies. {caption}</>}
        </figcaption>
      </figure>
    </Reveal>
  )
}

/** Act II felt beat: the ~25 “energy servants” assemble as you watch. */
export function EnergyServants({ caption }: { caption: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4)
  const reduced = usePrefersReducedMotion()
  const [count, setCount] = useState(0)
  const total = 25

  useEffect(() => {
    if (!inView) return
    if (reduced) { setCount(total); return }
    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setCount(n)
      if (n >= total) window.clearInterval(id)
    }, 90)
    return () => window.clearInterval(id)
  }, [inView, reduced])

  return (
    <div ref={ref} className={COL_FRAME}>
      <figure className="max-w-xl border-y border-paper/15 py-6 sm:py-8">
        <div className="flex flex-wrap gap-2" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-4 w-2.5 rounded-sm transition-all duration-300 ${i < count ? 'bg-gold/80' : 'bg-paper/10'}`}
              style={{ transitionDelay: reduced ? undefined : `${i * 20}ms`, clipPath: 'polygon(50% 0, 100% 30%, 80% 30%, 80% 100%, 20% 100%, 20% 30%, 0 30%)' }}
            />
          ))}
        </div>
        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-5xl tabular-nums text-paper sm:text-6xl">{count}</span>
          <span className="font-display text-base italic text-paper-300">people's worth of power, working for you right now</span>
        </div>
        <figcaption className="mt-3 text-sm leading-relaxed text-paper-300/80">{caption}</figcaption>
      </figure>
    </div>
  )
}

/**
 * Interlude schematic: cost over time for things that got cheaper vs things that failed.
 * Y = cost (high at top). X = as more was built / time. Stylized — shapes teach the shape,
 * not exact data; rates live in the legend.
 */
export function CurvesHeldBroke({ note }: { note: string }) {
  // Distinct strokes so three lines never read as one green blob / one red blob.
  const held = [
    {
      label: 'Solar panels',
      detail: '~20% cheaper each time output doubled',
      // steep, smooth fall — high → low
      d: 'M28,22 C70,28 110,70 178,98',
      stroke: '#5DD9A6',
      width: 2.25,
    },
    {
      label: 'Batteries',
      detail: '~18–19% cheaper per doubling',
      d: 'M28,34 C72,42 118,78 178,104',
      stroke: '#8BE0C0',
      width: 2,
      dash: '5 3.5',
    },
    {
      label: 'LED lights',
      detail: 'same pattern, factory-made and repeated',
      d: 'M28,48 C76,58 124,88 178,110',
      stroke: '#C8F0DC',
      width: 1.75,
      dash: '2 3',
    },
  ]
  const broke = [
    {
      label: 'Nuclear plants',
      detail: 'cost rose ~3× as more were built',
      // low → high (the wrong way)
      d: 'M28,100 C70,92 120,48 178,22',
      stroke: '#E07A6E',
      width: 2.25,
    },
    {
      label: 'Space launch',
      detail: 'price froze ~40 years (1970–2010)',
      // flat
      d: 'M28,62 L178,60',
      stroke: '#C0564A',
      width: 2,
      dash: '5 3.5',
    },
    {
      label: 'Concorde',
      detail: 'the "future of flight", now a museum',
      // flat, then collapses to zero
      d: 'M28,48 L120,48 C140,48 155,70 178,112',
      stroke: '#F0A89E',
      width: 1.75,
      dash: '2 3',
    },
  ]

  const panels = [
    {
      title: 'Cost kept falling',
      subtitle: 'Made in factories, over and over',
      series: held,
      aria: 'Schematic. Solar, batteries, and LEDs got cheaper as more were built',
    },
    {
      title: 'Promises that failed',
      subtitle: 'One-offs, frozen prices, dead ends',
      series: broke,
      aria: 'Schematic: nuclear costs rising, launch cost flat, Concorde collapsing to zero',
    },
  ] as const

  return (
    <Reveal className="mx-auto max-w-4xl px-6">
      <figure className="border-y border-paper/15 py-6 sm:py-8">
        <div className="mb-5 max-w-xl">
          <p className="font-display text-lg italic text-paper sm:text-xl">
            Same chart, two outcomes
          </p>
          <p className="mt-1 text-sm leading-relaxed text-paper-300/80 sm:text-base">
            Vertical axis is cost, high at the top, cheap at the bottom. Horizontal is time, as more was built. Not to scale; the shape is the lesson.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-paper/15">
          {panels.map((panel, i) => (
            <div key={panel.title} className={i === 0 ? 'sm:pr-8' : 'sm:pl-8'}>
              <div className="font-display text-base italic text-paper">{panel.title}</div>
              <div className="mt-0.5 text-xs text-paper-300/70 sm:text-sm">{panel.subtitle}</div>

              <svg
                viewBox="0 0 200 140"
                className="mt-4 w-full"
                role="img"
                aria-label={panel.aria}
              >
                {/* Plot frame */}
                <line x1="24" y1="16" x2="24" y2="118" stroke="#E9E1CF" strokeOpacity="0.22" />
                <line x1="24" y1="118" x2="186" y2="118" stroke="#E9E1CF" strokeOpacity="0.22" />
                {/* Soft mid guide */}
                <line
                  x1="24"
                  y1="67"
                  x2="186"
                  y2="67"
                  stroke="#E9E1CF"
                  strokeOpacity="0.08"
                  strokeDasharray="3 4"
                />

                {/* Axis words — the thing the old chart never said out loud */}
                <text
                  x="10"
                  y="70"
                  fill="#E9E1CF"
                  fillOpacity="0.45"
                  fontSize="8"
                  fontStyle="italic"
                  textAnchor="middle"
                  transform="rotate(-90 10 70)"
                >
                  cost
                </text>
                <text x="28" y="14" fill="#E9E1CF" fillOpacity="0.4" fontSize="7">
                  high
                </text>
                <text x="28" y="116" fill="#E9E1CF" fillOpacity="0.4" fontSize="7">
                  low
                </text>
                <text
                  x="105"
                  y="132"
                  fill="#E9E1CF"
                  fillOpacity="0.45"
                  fontSize="8"
                  fontStyle="italic"
                  textAnchor="middle"
                >
                  as more was built →
                </text>

                {panel.series.map((s) => (
                  <path
                    key={s.label}
                    d={s.d}
                    fill="none"
                    stroke={s.stroke}
                    strokeWidth={s.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={'dash' in s ? s.dash : undefined}
                    opacity={0.95}
                  />
                ))}
              </svg>

              <ul className="mt-3 space-y-2">
                {panel.series.map((s) => (
                  <li key={s.label} className="flex items-start gap-2.5 text-sm text-paper-200">
                    <span
                      aria-hidden
                      className="mt-2 inline-block h-0.5 w-5 shrink-0 rounded-full"
                      style={{
                        background: s.stroke,
                        opacity: 0.95,
                        // dashed preview for dashed series
                        backgroundImage:
                          'dash' in s
                            ? `repeating-linear-gradient(90deg, ${s.stroke} 0 4px, transparent 4px 7px)`
                            : undefined,
                        backgroundColor: 'dash' in s ? 'transparent' : s.stroke,
                      }}
                    />
                    <span>
                      <span className="font-medium text-paper">{s.label}</span>
                      <span className="text-paper-300/75">, {s.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <figcaption className="mt-5 font-display text-xs italic leading-relaxed text-paper-300/55">
          Sketch, not a precise plot. {note}
        </figcaption>
      </figure>
    </Reveal>
  )
}

/** Act IV: the receipts — a wire feed of dated events, not concept art. */
export function ReceiptsWall({ items, note }: { items: { date: string; event: string }[]; note: string }) {
  return (
    <div className={COL_FRAME}>
      <ol className="max-w-xl border-t border-paper/15">
        {items.map((r) => (
          <Reveal key={r.event}>
            <li className="flex gap-4 border-b border-paper/15 py-4 sm:gap-6">
              <span className="w-24 shrink-0 pt-1 font-mono text-xs text-gold/90 sm:w-28">{r.date}</span>
              <span className="text-base leading-relaxed text-paper-100 sm:text-lg">{r.event}</span>
            </li>
          </Reveal>
        ))}
      </ol>
      <Reveal>
        <p className="mt-4 font-display text-sm italic text-paper-300/70">{note}</p>
      </Reveal>
    </div>
  )
}

/** Coda watermark — speculation, clearly labeled, in the footnote voice. */
export function SpeculationWatermark() {
  return (
    <div className={COL_FRAME}>
      <p className="font-display text-sm italic text-gold/80">Informed speculation, undated by design.</p>
    </div>
  )
}
