'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import SunriseSky from './_components/SunriseSky'
import SceneStage, { type StageScene } from './_components/SceneStage'
import BatteryHUD from './_components/BatteryHUD'
import PowersOfTenLadder from './_components/PowersOfTenLadder'
import WrightLawChart from './_components/WrightLawChart'
import FlywheelDiagram from './_components/FlywheelDiagram'
import WorkBoard from './_components/WorkBoard'
import PredictionsLedger from './_components/PredictionsLedger'
import {
  ActHeader,
  BigNumbers,
  CurvesHeldBroke,
  EmberHold,
  EnergyServants,
  GiantLine,
  Prose,
  ReceiptsWall,
  Reveal,
  SeaInset,
  SpeculationWatermark,
} from './_components/narrative'
import {
  ACT_1, ACT_1_CEL, ACT_1_COPY,
  ACT_2, ACT_2_CEL, ACT_2_COPY,
  INTERLUDE, INTERLUDE_CEL, INTERLUDE_COPY,
  ACT_3, ACT_3_CEL, ACT_3_STORAGE_CEL, ACT_3_COPY,
  ACT_4, ACT_4_CEL, ACT_4_ORBIT_CEL, ACT_4_COPY,
  CODA, CODA_CEL, CODA_COPY,
  ACT_5, ACT_5_CEL, ACT_5_COPY,
} from '@/content/sunrise/script'

/**
 * The long sunrise — one continuous scroll from true black to the site's
 * paper daylight, played as a film (docs/one-cinematic-work-storyboard.html):
 * the fixed <SunriseSky> canvas is the score, and <SceneStage> plays each
 * act's loop full-bleed behind the words, cutting on the act anchors. The
 * hero is the only scene with no footage, by design; after `morning-end`
 * the film develops into the paper site.
 */
/**
 * The sky canvas's dawn keyframes live at canonical story positions
 * (fire 0.02 … paper 1.0), but where each act lands in the document depends
 * on viewport-driven layout. Measure the act anchors and remap document
 * scroll → story progress piecewise-linearly so dawn always breaks on cue.
 */
const STORY_STOPS: [id: string, storyP: number][] = [
  ['fire', 0.02],
  ['combustion', 0.14],
  ['false-dawn', 0.3],
  ['sun-direct', 0.44],
  ['compounding', 0.58],
  ['swarm', 0.68],
  ['coda-end', 0.78],
  ['the-work', 0.88],
]

/**
 * The reel: nine shots, eight cuts. Adjacent scenes share an anchor and
 * crossfade through the score. The swarm alone hands the frame back early
 * (outBias) so "Then, morning." plays on the canvas dawn — the turn back
 * toward the sun.
 */
const SCENES: StageScene[] = [
  { cel: ACT_1_CEL, start: 'fire', end: 'combustion' },
  { cel: ACT_2_CEL, start: 'combustion', end: 'false-dawn' },
  { cel: INTERLUDE_CEL, start: 'false-dawn', end: 'sun-direct' },
  { cel: ACT_3_CEL, start: 'sun-direct', end: 'storage' },
  { cel: ACT_3_STORAGE_CEL, start: 'storage', end: 'compounding' },
  { cel: ACT_4_CEL, start: 'compounding', end: 'orbit' },
  { cel: ACT_4_ORBIT_CEL, start: 'orbit', end: 'swarm' },
  { cel: CODA_CEL, start: 'swarm', end: 'morning', outBias: 0.55 },
  { cel: ACT_5_CEL, start: 'morning', end: 'morning-end', tone: 'light' },
]

function useStoryRemap(): (f: number) => number {
  const [pairs, setPairs] = useState<[number, number][]>([[0, 0], [1, 1]])

  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      const measured: [number, number][] = [[0, 0]]
      for (const [id, storyP] of STORY_STOPS) {
        const el = document.getElementById(id)
        if (!el) continue
        const f = (el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4) / max
        measured.push([Math.min(1, Math.max(0, f)), storyP])
      }
      measured.push([1, 1])
      // Guard monotonicity so the interpolation below stays well-defined.
      for (let i = 1; i < measured.length; i++) {
        if (measured[i][0] <= measured[i - 1][0]) measured[i][0] = measured[i - 1][0] + 0.001
      }
      setPairs(measured)
    }
    measure()
    // Re-measure once fonts settle (they shift layout) and on resize.
    document.fonts?.ready.then(measure).catch(() => {})
    window.addEventListener('resize', measure, { passive: true })
    return () => window.removeEventListener('resize', measure)
  }, [])

  return useCallback(
    (f: number) => {
      let i = 1
      while (i < pairs.length - 1 && f > pairs[i][0]) i++
      const [f0, p0] = pairs[i - 1]
      const [f1, p1] = pairs[i]
      const t = f1 > f0 ? Math.min(1, Math.max(0, (f - f0) / (f1 - f0))) : 0
      return p0 + (p1 - p0) * t
    },
    [pairs]
  )
}

/**
 * A handoff: the story passes the reader to a tool at the exact beat where
 * the claim lands (storyboard §03) — never a card dump.
 */
function Handoff({ href, tone = 'dark', children }: { href: string; tone?: 'dark' | 'light'; children: string }) {
  const cls =
    tone === 'dark'
      ? 'text-gold/90 hover:text-gold-light'
      : 'text-brand-700 hover:text-brand-600'
  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      <Link href={href} className={`group inline-flex items-baseline gap-2 font-display text-base italic transition ${cls}`}>
        {children}
        <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </div>
  )
}

export default function SunriseClient() {
  const remap = useStoryRemap()
  return (
    <main className="relative bg-ink-900">
      <SunriseSky remap={remap} />
      <SceneStage scenes={SCENES} />
      {/* Everything below sits above the score (z-0) and the stage (z-[1]). */}
      <div className="relative z-10">
      <BatteryHUD />

      {/* Minimal chrome: wordmark that survives dark and light phases */}
      <Link
        href="/"
        className="fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-40 text-sm font-semibold tracking-tight text-white mix-blend-difference"
      >
        battery.mom
      </Link>

      {/* ── Hero ── */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="sunrise-hero-in font-display text-base italic text-paper-300/70" style={{ animationDelay: '0.2s' }}>
          battery.mom presents
        </p>
        <h1
          className="sunrise-hero-in mt-6 font-display text-6xl font-medium leading-[0.98] tracking-tight text-paper sm:text-8xl md:text-[7.5rem]"
          style={{ animationDelay: '0.6s' }}
        >
          The long sunrise
        </h1>
        <p className="sunrise-hero-in mt-8 max-w-xl text-base leading-relaxed text-paper-300 sm:text-lg" style={{ animationDelay: '1.3s' }}>
          From the first fire to cheap solar. Half a million years, and the century that changes it.
          Every number sourced. Every prediction dated.
        </p>
        <div className="sunrise-hero-in mt-16 flex flex-col items-center gap-3 text-paper-300/50" style={{ animationDelay: '2.2s' }} aria-hidden>
          <span className="font-display text-xs italic">scroll</span>
          <span className="block h-10 w-px bg-gradient-to-b from-paper-300/50 to-transparent" />
        </div>
      </section>

      {/* ── Act I · Fire — the spark catches into the first shot ── */}
      <section className="space-y-14 py-28 sm:space-y-16 sm:py-36" aria-labelledby="fire">
        <ActHeader act={ACT_1} id="fire" />
        <Prose lead>{ACT_1_COPY.open}</Prose>
        {ACT_1_COPY.body.map((p) => (
          <Prose key={p.slice(0, 24)}>{p}</Prose>
        ))}
        <div data-stage-dim>
          <BigNumbers items={ACT_1_COPY.numbers} />
        </div>
        <EmberHold caption={ACT_1_COPY.ember} />
        <SeaInset>{ACT_1_COPY.sea}</SeaInset>
      </section>

      {/* ── Act II · Combustion — smoke match-cuts into mill smoke ── */}
      <section className="space-y-14 py-28 sm:space-y-16 sm:py-36" aria-labelledby="combustion">
        <ActHeader act={ACT_2} id="combustion" />
        <Prose lead>{ACT_2_COPY.open}</Prose>
        {ACT_2_COPY.body.map((p) => (
          <Prose key={p.slice(0, 24)}>{p}</Prose>
        ))}
        <div data-stage-dim>
          <BigNumbers items={ACT_2_COPY.numbers} />
          <EnergyServants caption={ACT_2_COPY.servants} />
        </div>
        <SeaInset>{ACT_2_COPY.sea}</SeaInset>
      </section>

      {/* ── Interlude · The False Dawn — the lights gutter out ── */}
      <section className="space-y-14 py-28 sm:space-y-16 sm:py-36" aria-labelledby="false-dawn">
        <ActHeader act={INTERLUDE} id="false-dawn" />
        <Prose lead>{INTERLUDE_COPY.open}</Prose>
        <Prose>{INTERLUDE_COPY.body[0]}</Prose>
        <Prose>{INTERLUDE_COPY.body[1]}</Prose>
        <Prose>{INTERLUDE_COPY.body[2]}</Prose>
        <div data-stage-dim>
          <CurvesHeldBroke note={INTERLUDE_COPY.curvesNote} />
        </div>
      </section>

      {/* ── Act III · The Sun, Direct — the switch flips back ── */}
      <section className="space-y-14 py-28 sm:space-y-16 sm:py-36" aria-labelledby="sun-direct">
        <ActHeader act={ACT_3} id="sun-direct" />
        <Prose lead>{ACT_3_COPY.open}</Prose>
        <Prose>{ACT_3_COPY.body[0]}</Prose>
        <div data-stage-dim="0.45">
          <GiantLine>{ACT_3_COPY.pull}</GiantLine>
        </div>
        <Prose>{ACT_3_COPY.body[1]}</Prose>
        <Prose>{ACT_3_COPY.body[2]}</Prose>
        {/* The storage beat — the shot changes with the copy: noon watt → megablock. */}
        <div id="storage">
          <Prose>{ACT_3_COPY.body[3]}</Prose>
        </div>
        <div data-stage-dim>
          <BigNumbers items={ACT_3_COPY.numbers} />
        </div>
        <Handoff href="/scoreboard/energy">See solar and storage grow, year by year</Handoff>
        <div data-stage-dim className="mx-auto max-w-5xl px-6">
          {/* Ruled scrim band (no glass): keeps axis text readable over the
              bright horizon without boxing the chart in a card. */}
          <div className="border-y border-paper/15 bg-ink-900/70 px-4 py-6 sm:px-8 sm:py-8">
            <WrightLawChart />
          </div>
        </div>
        <SeaInset>{ACT_3_COPY.sea}</SeaInset>
        <Handoff href="/state-of-battery-power">See how much is installed today, in the data</Handoff>
      </section>

      {/* ── Act IV · The Compounding Century — the camera leaves the ground ── */}
      <section className="space-y-14 py-28 sm:space-y-16 sm:py-36" aria-labelledby="compounding">
        <ActHeader act={ACT_4} id="compounding" />
        <Prose lead>{ACT_4_COPY.open}</Prose>
        <div data-stage-dim className="mx-auto max-w-3xl px-6">
          <FlywheelDiagram className="mx-auto" />
        </div>
        <Prose>{ACT_4_COPY.body[0]}</Prose>
        <Prose>{ACT_4_COPY.body[1]}</Prose>
        {/* Eyeline match: at "the loop has already left the ground", cut to orbit. */}
        <div id="orbit">
          <Prose>{ACT_4_COPY.body[2]}</Prose>
        </div>
        <Prose>{ACT_4_COPY.body[3]}</Prose>
        <div data-stage-dim>
          <BigNumbers items={ACT_4_COPY.numbers} />
        </div>
        <ReceiptsWall items={ACT_4_COPY.receipts} note={ACT_4_COPY.receiptsNote} />
      </section>

      {/* ── Coda · The Swarm ── */}
      <section className="space-y-14 py-28 sm:space-y-16 sm:py-36" aria-labelledby="swarm">
        <ActHeader act={CODA} id="swarm" />
        <SpeculationWatermark />
        <Prose lead>{CODA_COPY.open}</Prose>
        {CODA_COPY.body.map((p) => (
          <Prose key={p.slice(0, 24)}>{p}</Prose>
        ))}
        <div data-stage-dim>
          <PowersOfTenLadder />
        </div>
        <div id="coda-end" data-stage-dim="0.45">
          <GiantLine tone="gold" className="text-center">
            <span className="italic">{CODA_COPY.line}</span>
          </GiantLine>
        </div>
      </section>

      {/* ── Act V · The Work — daylight is the paper site ── */}
      <section className="space-y-14 pb-0 pt-28 sm:space-y-16 sm:pt-36" aria-labelledby="the-work">
        <div id="morning">
          <GiantLine tone="ink">Then, morning.</GiantLine>
        </div>
        <ActHeader act={ACT_5} id="the-work" tone="light" />

        <Reveal className="mx-auto w-full max-w-6xl px-6">
          <p className="max-w-2xl text-lg leading-relaxed text-ink-700 sm:text-xl">
            {ACT_5_COPY.morning}
          </p>
        </Reveal>

        <div id="morning-end" aria-hidden />

        <div className="mx-auto w-full max-w-6xl px-6">
          <WorkBoard />
        </div>

        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid max-w-3xl grid-cols-1 gap-3 sm:max-w-none sm:grid-cols-3 sm:gap-4">
            {ACT_5_COPY.cards.map((c) => (
              <Reveal key={c.href}>
                <Link
                  href={c.href}
                  className="block border border-ink-900/10 bg-paper-100 px-5 py-4 transition hover:border-ink-900/20"
                >
                  <div className="font-display text-lg font-medium text-ink">{c.title}</div>
                  <div className="mt-1 text-sm text-ink-500">{c.sub}</div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl px-6">
          <h3 className="text-base font-medium text-ink">Predictions</h3>
          <div className="mt-2">
            <PredictionsLedger intro={ACT_5_COPY.trustIntro} />
          </div>
        </div>

        <Reveal className="mx-auto max-w-2xl px-6 pb-20 sm:pb-24">
          <p className="max-w-xl font-display text-xl leading-snug text-ink sm:text-2xl">
            {ACT_5_COPY.closing}
          </p>
        </Reveal>

        <Footer />
      </section>
      </div>
    </main>
  )
}
