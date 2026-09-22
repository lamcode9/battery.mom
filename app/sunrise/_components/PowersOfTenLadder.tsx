'use client'

import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { useSectionProgress, usePrefersReducedMotion, lerp } from '../_lib/useScroll'

/* ---------------------------------------------------------------------- */
/*  Data                                                                   */
/* ---------------------------------------------------------------------- */

type WattsSpec =
  | { kind: 'single'; coefficient?: string; exponent: number }
  | { kind: 'range'; fromExponent: number; toExponent: number }

type Rung = {
  id: number
  watts: WattsSpec
  title: string
  body: string
  /** Small inset line with a brand-green dot (rung 2's Jakarta callout). */
  inset?: string
  /** Small italic caption under the body (rung 7's "thought experiment"). */
  tag?: string
  /** Position on the K-meter, per Sagan's Kardashev formula K = (log10 W − 6) / 10. */
  kValue: number
}

const RUNGS: readonly Rung[] = [
  {
    id: 1,
    watts: { kind: 'single', exponent: 2 },
    title: 'A human body',
    body: 'Roughly 100 watts of heat. The original hearth.',
    kValue: -0.4,
  },
  {
    id: 2,
    watts: { kind: 'range', fromExponent: 3, toExponent: 4 },
    title: 'A household',
    body: "A kettle at full boil draws ~2,000 W. Every home is a small power plant's customer.",
    inset: 'A Jakarta rooftop fits ~2–4 kW of solar.',
    kValue: -0.25,
  },
  {
    id: 3,
    watts: { kind: 'single', exponent: 6 },
    title: 'A neighborhood',
    body: 'One megawatt: a utility-scale solar inverter, or about the draw of a large hotel.',
    kValue: 0,
  },
  {
    id: 4,
    watts: { kind: 'single', exponent: 9 },
    title: 'A gigafactory',
    body: 'One gigawatt: a large power station, or a battery plant turning out cells around the clock.',
    kValue: 0.3,
  },
  {
    id: 5,
    watts: { kind: 'single', exponent: 12 },
    title: 'A civilization',
    body: 'Humanity runs on roughly 19–20 terawatts, all uses combined. On the Kardashev scale: K ≈ 0.73.',
    kValue: 0.73,
  },
  {
    id: 6,
    watts: { kind: 'single', exponent: 16 },
    title: 'Kardashev I',
    body: "All the sunlight civilization could harness on Earth, roughly 500× today's use.",
    kValue: 1,
  },
  {
    id: 7,
    watts: { kind: 'single', coefficient: '3.8', exponent: 26 },
    title: 'Kardashev II, the whole sun',
    body: 'About 20 trillion times today. A Dyson swarm is a thought experiment, not a forecast. It is the ceiling physics offers.',
    tag: 'thought experiment',
    kValue: 2,
  },
] as const

const YOU_ARE_HERE_K = 0.73

/* ---------------------------------------------------------------------- */
/*  Scroll → rung mapping                                                  */
/* ---------------------------------------------------------------------- */

const ZONE_START = 0.05
const ZONE_END = 0.95
const RUNG_SPAN = (ZONE_END - ZONE_START) / RUNGS.length
/** Fraction of a rung's own span spent crossfading into the next rung. */
const TRANSITION = 0.35

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

function smoothstep(t: number): number {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

type RungState = {
  index: number
  nextIndex: number
  /** 0 = fully settled on `index`, 1 = fully settled on `nextIndex`. */
  mix: number
  /** Continuous 0..RUNGS.length climb position — drives the disc's global zoom. */
  climb: number
}

function computeRungState(progress: number): RungState {
  const p = clamp01(progress)
  const lastIndex = RUNGS.length - 1

  if (p <= ZONE_START) return { index: 0, nextIndex: 0, mix: 0, climb: 0 }
  if (p >= ZONE_END) {
    return { index: lastIndex, nextIndex: lastIndex, mix: 0, climb: RUNGS.length }
  }

  const climb = (p - ZONE_START) / RUNG_SPAN
  const index = Math.min(lastIndex, Math.floor(climb))
  const local = climb - index

  if (index < lastIndex && local > 1 - TRANSITION) {
    const raw = (local - (1 - TRANSITION)) / TRANSITION
    return { index, nextIndex: index + 1, mix: smoothstep(raw), climb }
  }
  return { index, nextIndex: index, mix: 0, climb }
}

/* ---------------------------------------------------------------------- */
/*  Watts rendering (real text, exponents as <sup>)                        */
/* ---------------------------------------------------------------------- */

function WattsValue({ watts }: { watts: WattsSpec }): ReactNode {
  if (watts.kind === 'range') {
    return (
      <>
        10<sup>{watts.fromExponent}</sup>–10<sup>{watts.toExponent}</sup> W
      </>
    )
  }
  return (
    <>
      {watts.coefficient ? `${watts.coefficient}×` : null}
      10<sup>{watts.exponent}</sup> W
    </>
  )
}

/* ---------------------------------------------------------------------- */
/*  Component                                                              */
/* ---------------------------------------------------------------------- */

export default function PowersOfTenLadder({ className }: { className?: string }) {
  const { ref, progress } = useSectionProgress<HTMLDivElement>()
  const reducedMotion = usePrefersReducedMotion()

  const state = useMemo(() => computeRungState(progress), [progress])
  // Reduced motion: hard-switch — no in-between mix values.
  const mix = reducedMotion ? Math.round(state.mix) : state.mix
  const crossfading = state.index !== state.nextIndex && mix > 0 && mix < 1

  const current = RUNGS[state.index]
  const upcoming = RUNGS[state.nextIndex]

  const zoom = reducedMotion
    ? state.index / (RUNGS.length - 1)
    : smoothstep(state.climb / RUNGS.length)
  const discScale = reducedMotion ? 1 : lerp(0.55, 1.35, zoom)

  const ringLift = reducedMotion ? 0 : mix
  const ringOpacityBase = reducedMotion ? 0.14 : lerp(0.22, 0, ringLift)

  const rise = reducedMotion ? 0 : 10
  const fromStyle: CSSProperties = {
    opacity: 1 - mix,
    transform: `translateY(${-mix * rise}px)`,
  }
  const toStyle: CSSProperties = {
    opacity: mix,
    transform: `translateY(${(1 - mix) * rise}px)`,
  }

  const kInterp = lerp(current.kValue, upcoming.kValue, mix)
  const kClamped = Math.min(2, Math.max(0, kInterp))
  const markerPct = (kClamped / 2) * 100
  const youAreHerePct = (YOU_ARE_HERE_K / 2) * 100

  return (
    <div ref={ref} className={`relative h-[500vh] ${className ?? ''}`}>
      <section
        aria-label="Powers of ten: an energy ladder from a human body to the Sun"
        className="sticky top-0 flex h-screen w-full flex-col items-center justify-between overflow-hidden px-5 py-10 sm:px-8 sm:py-16"
      >
        {/* Decorative glowing disc + zoom rings */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 400 400"
            className="h-[60vh] max-h-[420px] w-[60vh] max-w-[420px] sm:h-[70vh] sm:max-h-[520px] sm:w-[70vh] sm:max-w-[520px]"
          >
            <defs>
              <radialGradient id="powers-of-ten-disc" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E0A33C" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#E0A33C" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#E0A33C" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g style={{ transform: `scale(${discScale})`, transformOrigin: '200px 200px' }}>
              {[
                { radius: 100, spread: 1.7, opacity: 1 },
                { radius: 130, spread: 2.05, opacity: 0.65 },
                { radius: 160, spread: 2.4, opacity: 0.4 },
              ].map((ring) => (
                <circle
                  key={ring.radius}
                  cx={200}
                  cy={200}
                  r={ring.radius}
                  fill="none"
                  stroke="#FBF7EE"
                  strokeWidth={1}
                  style={{
                    opacity: ringOpacityBase * ring.opacity,
                    transform: `scale(${reducedMotion ? 1 : lerp(1, ring.spread, ringLift)})`,
                    transformOrigin: '200px 200px',
                  }}
                />
              ))}
              <circle cx={200} cy={200} r={72} fill="url(#powers-of-ten-disc)" />
            </g>
          </svg>
        </div>

        {/* Wattage — huge, crossfading, tabular numerals */}
        <div className="relative z-10 grid pt-4 text-center font-display tabular-nums text-paper sm:pt-8">
          <div
            style={fromStyle}
            className="col-start-1 row-start-1 text-5xl leading-none sm:text-7xl"
          >
            <WattsValue watts={current.watts} />
          </div>
          {crossfading ? (
            <div
              style={toStyle}
              className="col-start-1 row-start-1 text-5xl leading-none sm:text-7xl"
            >
              <WattsValue watts={upcoming.watts} />
            </div>
          ) : null}
        </div>

        <div className="flex-1" aria-hidden="true" />

        {/* Rung title + body — crossfading */}
        <div className="relative z-10 grid w-full max-w-xs text-center sm:max-w-lg">
          <div style={fromStyle} className="col-start-1 row-start-1 flex flex-col items-center gap-3">
            <RungMeta rung={current} />
          </div>
          {crossfading ? (
            <div style={toStyle} className="col-start-1 row-start-1 flex flex-col items-center gap-3">
              <RungMeta rung={upcoming} />
            </div>
          ) : null}
        </div>

        {/* K-meter */}
        <div className="relative z-10 mb-2 w-full max-w-xs sm:max-w-md">
          <div className="relative h-6">
            <span
              className="absolute -top-1 -translate-x-1/2 whitespace-nowrap font-display text-[10px] italic text-brand-300 sm:text-xs"
              style={{ left: `${youAreHerePct}%` }}
            >
              you are here, K 0.73
            </span>
          </div>
          <div className="relative h-1 rounded-pill border border-paper/20 bg-paper/10">
            <span
              aria-hidden="true"
              className="absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-paper/40"
              style={{ left: '50%' }}
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400 ring-2 ring-brand-400/30"
              style={{ left: `${youAreHerePct}%` }}
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_8px_rgba(224,163,60,0.8)]"
              style={{ left: `${markerPct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] tracking-wide text-paper-300/70 sm:text-xs">
            <span>K0</span>
            <span>K1</span>
            <span>K2</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function RungMeta({ rung }: { rung: Rung }): ReactNode {
  return (
    <>
      <h3 className="font-display text-xs italic text-gold sm:text-sm">{rung.title}</h3>
      <p className="max-w-xs text-sm leading-relaxed text-paper-300 sm:max-w-md sm:text-base">{rung.body}</p>
      {rung.inset ? (
        <div className="flex items-center gap-2 text-xs text-paper-300/80 sm:text-sm">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          <span>{rung.inset}</span>
        </div>
      ) : null}
      {rung.tag ? (
        <span className="font-display text-sm italic text-gold/80">{rung.tag}</span>
      ) : null}
    </>
  )
}
