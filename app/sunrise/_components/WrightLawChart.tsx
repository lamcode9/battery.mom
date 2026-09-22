'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useInView, usePrefersReducedMotion } from '../_lib/useScroll'

/**
 * The Wright's Law time machine.
 *
 * A hand-rolled semi-log chart: linear year on x, log price on y, two
 * series (solar $/W, battery $/kWh). Only verified anchor points are
 * plotted as data. The line between anchors is a log-linear interpolation
 * of the series' own two anchors — on a semi-log axis that interpolation
 * is, mathematically, a straight segment, so that's exactly what gets
 * drawn. It is labeled everywhere as a "fit," never as measured data.
 *
 * Layout: geometry lives in the SVG (viewBox-scaled); every piece of text
 * is either an HTML overlay or a flow element in fixed CSS px so labels
 * never shrink below legibility. The plot area only ever contains
 * gridlines, the two fit lines, anchor dots + value labels, the
 * materials-floor band, and the scrub line; the legend and learning rates
 * always live above/below the chart, and the 2026 annotation and floor
 * label collapse from in-plot callouts to below-chart captions on narrow
 * containers (tracked with a ResizeObserver so it follows the container,
 * not the viewport).
 */

// ---------------------------------------------------------------------------
// Data — verified anchors only. Do not add intermediate "data" points here.
// ---------------------------------------------------------------------------

interface Anchor {
  year: number
  price: number
  label: string
  /** Which side of the dot the floating label extends toward. */
  align: 'left' | 'center' | 'right'
}

const SOLAR_ANCHORS: readonly [Anchor, Anchor] = [
  { year: 1977, price: 76, label: '$76/W · 1977', align: 'left' },
  { year: 2025, price: 0.09, label: '$0.09/W · 2025', align: 'right' },
]

// December, expressed as a fraction of the year for correct x-placement.
const DEC_2025 = 2025 + 11 / 12

const BATTERY_ANCHORS: readonly [Anchor, Anchor] = [
  { year: 2010, price: 1183, label: '$1,183/kWh · 2010', align: 'center' },
  { year: DEC_2025, price: 108, label: '$108/kWh · Dec 2025', align: 'right' },
]

const SOLAR_LEARNING_RATE = '~20.2% per doubling'
const BATTERY_LEARNING_RATE = '~18–19% per doubling'

const REBOUND_ANNOTATION =
  'early 2026: module prices rebounded about 30% as China consolidated capacity. Learning curves bend. They do not break on one policy shock.'

const FLOOR_LABEL = 'materials floor. Cells cannot be cheaper than what they are made of'

const MATERIALS_FLOOR = { low: 35, high: 40 }

const ERA_LINES: ReadonlyArray<{ from: number; to: number; line: string }> = [
  { from: 1977, to: 1989, line: 'Solar was for satellites and calculators.' },
  { from: 1990, to: 2004, line: 'A rooftop system cost as much as the roof.' },
  { from: 2005, to: 2014, line: 'Subsidies did the heavy lifting, and it worked.' },
  { from: 2015, to: 2021, line: 'Cheapest electricity ever built, in the sunny half of the world.' },
  { from: 2022, to: 2026, line: "The constraint isn't the panel anymore. It's everything around it." },
]

// ---------------------------------------------------------------------------
// Pure math — scales and fit
// ---------------------------------------------------------------------------

const X_MIN = 1975
const X_MAX = 2030
const Y_MIN = 0.05
const Y_MAX = 2000

const SLIDER_MIN = 1977
const SLIDER_MAX = 2026

const VB_W = 800
const VB_H = 440
// Left gutter sized so "$100"-length tick labels still fit in real pixels
// when the 800-unit viewBox is squeezed into a 375px-wide container
// (68/800 × 375 ≈ 32px of gutter for a ~28px label).
const PLOT = { left: 68, right: 772, top: 22, bottom: 396 }

/** Below this container width, in-plot callouts move under the chart. */
const COMPACT_MAX_WIDTH = 640

const X_TICKS = [1975, 1985, 1995, 2005, 2015, 2025] as const
const Y_TICKS = [0.1, 1, 10, 100, 1000] as const

/** Linear year -> viewBox x. */
function yearToX(year: number): number {
  const t = (year - X_MIN) / (X_MAX - X_MIN)
  return PLOT.left + t * (PLOT.right - PLOT.left)
}

/** Log price -> viewBox y (higher price renders nearer the top). */
function priceToY(price: number): number {
  const clamped = Math.min(Y_MAX, Math.max(Y_MIN, price))
  const t = (Math.log(clamped) - Math.log(Y_MIN)) / (Math.log(Y_MAX) - Math.log(Y_MIN))
  return PLOT.bottom - t * (PLOT.bottom - PLOT.top)
}

/** viewBox px -> percentage of the chart box, for HTML overlay positioning. */
function pctX(x: number): number {
  return (x / VB_W) * 100
}
function pctY(y: number): number {
  return (y / VB_H) * 100
}

/**
 * Log-linear fit between a series' two anchors, evaluated at `year`.
 * On a semi-log chart this is exactly the straight segment joining the
 * anchors; past the last anchor it continues the same slope (a naive
 * projection — deliberately so, since the whole point of the 2026
 * annotation is that reality diverged from it). Returns null before the
 * series' first anchor, where extrapolating backward would be inventing
 * a number for a product that didn't exist yet at scale.
 */
function fittedPriceAtYear(anchors: readonly [Anchor, Anchor], year: number): number | null {
  const [a, b] = anchors
  if (year < a.year) return null
  const slope = (Math.log(b.price) - Math.log(a.price)) / (b.year - a.year)
  return a.price * Math.exp(slope * (year - a.year))
}

function eraLine(year: number): string {
  const match = ERA_LINES.find((era) => year >= era.from && year <= era.to)
  return match ? match.line : ERA_LINES[ERA_LINES.length - 1].line
}

function formatSolarPrice(value: number): string {
  return value >= 10 ? `$${value.toFixed(1)}` : `$${value.toFixed(2)}`
}

function formatBatteryPrice(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

/** Compact form shortens the widest tick labels so they fit the narrow gutter. */
function formatYTick(value: number, compact: boolean): string {
  if (compact && value >= 1000) return `$${value / 1000}k`
  if (value >= 1) return `$${value.toLocaleString('en-US')}`
  return compact ? `$${value}` : `$${value.toFixed(2)}`
}

/** CSS transform placing an anchor label beside its dot without ever clipping. */
function anchorLabelTransform(align: Anchor['align']): string {
  switch (align) {
    case 'left':
      return 'translate(8px, -130%)' // grows rightward from the dot
    case 'right':
      return 'translate(calc(-100% - 8px), -130%)' // grows leftward from the dot
    case 'center':
      return 'translate(-50%, -130%)'
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WrightLawChart({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLElement>(0.2)
  const reducedMotion = usePrefersReducedMotion()
  const [year, setYear] = useState(2025)
  const [compact, setCompact] = useState(false)
  const clipId = useId()

  // Compact mode is about the component's own width (it may sit in a
  // column), so a ResizeObserver on the figure beats a viewport media query.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setCompact(entry.contentRect.width < COMPACT_MAX_WIDTH)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  const revealed = reducedMotion || inView

  const solarFit = fittedPriceAtYear(SOLAR_ANCHORS, year)
  const batteryFit = fittedPriceAtYear(BATTERY_ANCHORS, year)

  const scrubX = useMemo(() => yearToX(year), [year])

  const solarLine = useMemo(
    () => ({
      x1: yearToX(SOLAR_ANCHORS[0].year),
      y1: priceToY(SOLAR_ANCHORS[0].price),
      x2: yearToX(SOLAR_ANCHORS[1].year),
      y2: priceToY(SOLAR_ANCHORS[1].price),
    }),
    []
  )
  const batteryLine = useMemo(
    () => ({
      x1: yearToX(BATTERY_ANCHORS[0].year),
      y1: priceToY(BATTERY_ANCHORS[0].price),
      x2: yearToX(BATTERY_ANCHORS[1].year),
      y2: priceToY(BATTERY_ANCHORS[1].price),
    }),
    []
  )

  const floorTop = priceToY(MATERIALS_FLOOR.high)
  const floorBottom = priceToY(MATERIALS_FLOOR.low)

  // 2026 solar rebound annotation. Wide containers: a leader line from the
  // 2025 anchor to a text box near the top-right of the plot. Compact: a
  // gold dagger at the 2026 end of the solar fit + a caption below the chart.
  const rebound = useMemo(() => {
    const solar2026 = fittedPriceAtYear(SOLAR_ANCHORS, 2026) ?? SOLAR_ANCHORS[1].price
    return {
      from: { x: yearToX(2025), y: priceToY(0.09) },
      to: { x: yearToX(2028.5), y: priceToY(1.4) },
      marker: { x: yearToX(2026), y: priceToY(solar2026) },
    }
  }, [])

  return (
    <figure ref={ref} className={`not-italic ${className ?? ''}`}>
      <figcaption className="sr-only">
        Semi-log chart, 1975 to 2030, comparing solar module price in US dollars per watt
        (gold) and lithium-ion battery pack price in US dollars per kilowatt-hour (green) on a
        logarithmic price axis. Verified anchors: solar module price was $76 per watt in 1977
        and about $0.09 per watt in 2025 ({SOLAR_LEARNING_RATE} of cumulative capacity). Battery
        pack price was $1,183 per kilowatt-hour in 2010 and $108 per kilowatt-hour in December
        2025 ({BATTERY_LEARNING_RATE}); within that December 2025 figure, cells were about $74,
        stationary-storage systems about $70, and the cheapest LFP cells about $50 per
        kilowatt-hour. Dashed lines between anchors are a log-linear learning-curve fit, not
        additional measured data. In early 2026 module prices rebounded roughly 30% as China
        consolidated manufacturing capacity. A translucent band near $35 to $40 per
        kilowatt-hour marks an approximate materials floor for battery cells, not a data point.
        An interactive slider scrubs through the year to read the fitted price for each series
        and a short description of that era.
      </figcaption>

      {/* Readout — plain text, separated from the plot by a hairline */}
      <div className="mb-4 border-b border-paper/15 pb-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-display text-4xl leading-none tabular-nums text-paper sm:text-5xl">
            {Math.round(year)}
          </span>
          <span className="text-sm text-paper-300 sm:text-base">{eraLine(year)}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-sans text-xs sm:text-sm">
          <span className="text-gold-light">
            solar fit: ~{solarFit !== null ? `${formatSolarPrice(solarFit)}/W` : '—'}
          </span>
          <span className="text-paper-300/40">·</span>
          <span className="text-brand-300">
            battery fit:{' '}
            {batteryFit !== null ? `~${formatBatteryPrice(batteryFit)}/kWh` : 'not yet at commercial scale'}
          </span>
        </div>
      </div>

      {/* Legend — its own wrapping flow row above the chart, never over the plot */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-paper-300">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-gold" />
          $/W (solar module)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-brand-400" />
          $/kWh (battery pack)
        </span>
        <span className="flex items-center gap-1.5 text-paper-300/70">
          <span className="inline-block h-0 w-[14px] border-t border-dashed border-paper-300/60" />
          learning-curve fit
        </span>
      </div>

      {/* Chart */}
      <div className="relative w-full select-none">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="block h-auto w-full"
          role="img"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={PLOT.left}
                y={PLOT.top}
                width={revealed ? PLOT.right - PLOT.left : 0}
                height={PLOT.bottom - PLOT.top}
                style={reducedMotion ? undefined : { transition: 'width 1.2s ease-out' }}
              />
            </clipPath>
          </defs>

          {/* Gridlines */}
          {Y_TICKS.map((tick) => (
            <line
              key={`gy-${tick}`}
              x1={PLOT.left}
              x2={PLOT.right}
              y1={priceToY(tick)}
              y2={priceToY(tick)}
              stroke="#E9E1CF"
              strokeOpacity={0.08}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {X_TICKS.map((tick) => (
            <line
              key={`gx-${tick}`}
              x1={yearToX(tick)}
              x2={yearToX(tick)}
              y1={PLOT.top}
              y2={PLOT.bottom}
              stroke="#E9E1CF"
              strokeOpacity={0.08}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Materials floor band — a conceptual zone, not a datum */}
          <rect
            x={PLOT.left}
            y={floorTop}
            width={PLOT.right - PLOT.left}
            height={Math.max(2, floorBottom - floorTop)}
            fill="#23C088"
            fillOpacity={0.1}
          />
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={floorTop}
            y2={floorTop}
            stroke="#23C088"
            strokeOpacity={0.35}
            strokeDasharray="4 3"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={floorBottom}
            y2={floorBottom}
            stroke="#23C088"
            strokeOpacity={0.35}
            strokeDasharray="4 3"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />

          {/* Learning-curve fits, straight in semi-log space, revealed via an animated clip */}
          <g clipPath={`url(#${clipId})`}>
            <line
              x1={solarLine.x1}
              y1={solarLine.y1}
              x2={solarLine.x2}
              y2={solarLine.y2}
              stroke="#E0A33C"
              strokeWidth={1.5}
              strokeDasharray="7 5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={batteryLine.x1}
              y1={batteryLine.y1}
              x2={batteryLine.x2}
              y2={batteryLine.y2}
              stroke="#23C088"
              strokeWidth={1.5}
              strokeDasharray="7 5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* 2026 rebound leader line — wide containers only; compact uses a dagger + caption */}
          {!compact && (
            <line
              x1={rebound.from.x}
              y1={rebound.from.y}
              x2={rebound.to.x}
              y2={rebound.to.y}
              stroke="#E0A33C"
              strokeOpacity={0.6}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Scrub line */}
          <line
            x1={scrubX}
            x2={scrubX}
            y1={PLOT.top}
            y2={PLOT.bottom}
            stroke="#E0A33C"
            strokeWidth={1}
            strokeOpacity={0.85}
            vectorEffect="non-scaling-stroke"
          />

          {/* Axis baseline */}
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={PLOT.bottom}
            y2={PLOT.bottom}
            stroke="#E9E1CF"
            strokeOpacity={0.2}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* HTML overlay: axis labels, anchor dots + labels, and (wide only) in-plot
            callouts. Fixed pixel font sizes so nothing shrinks below legibility. */}
        <div className="pointer-events-none absolute inset-0">
          {/* Y-axis tick labels — right-aligned into the left gutter */}
          {Y_TICKS.map((tick) => (
            <div
              key={`yl-${tick}`}
              className="absolute -translate-x-full -translate-y-1/2 whitespace-nowrap pr-1 text-[10px] text-paper-300/70"
              style={{ left: `${pctX(PLOT.left)}%`, top: `${pctY(priceToY(tick))}%` }}
            >
              {formatYTick(tick, compact)}
            </div>
          ))}

          {/* X-axis tick labels */}
          {X_TICKS.map((tick) => (
            <div
              key={`xl-${tick}`}
              className="absolute -translate-x-1/2 whitespace-nowrap pt-1 text-[10px] text-paper-300/70"
              style={{ left: `${pctX(yearToX(tick))}%`, top: `${pctY(PLOT.bottom)}%` }}
            >
              {tick}
            </div>
          ))}

          {/* Materials floor label — wide containers only; compact gets a caption below */}
          {!compact && (
            <div
              className="absolute w-[170px] font-display text-xs italic leading-tight text-brand-300/80"
              style={{
                left: `${pctX(PLOT.left) + 0.5}%`,
                top: `${pctY(floorBottom) + 1}%`,
              }}
            >
              {FLOOR_LABEL}
            </div>
          )}

          {/* Anchor dots + labels */}
          {[...SOLAR_ANCHORS, ...BATTERY_ANCHORS].map((anchor, i) => {
            const x = pctX(yearToX(anchor.year))
            const y = pctY(priceToY(anchor.price))
            const isSolar = i < 2
            const color = isSolar ? 'bg-gold' : 'bg-brand-400'
            const textColor = isSolar ? 'text-gold-light' : 'text-brand-300'
            return (
              <div key={anchor.label}>
                <div
                  className={`absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full ${color} ring-1 ring-ink-900/60`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
                <div
                  className={`absolute whitespace-nowrap text-[10px] font-medium ${textColor} ${
                    anchor.align === 'right' ? 'text-right' : ''
                  }`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: anchorLabelTransform(anchor.align),
                  }}
                >
                  {anchor.label}
                </div>
              </div>
            )
          })}

          {/* 2026 rebound annotation — wide: in-plot text box; compact: dagger marker only */}
          {!compact ? (
            <div
              className="absolute w-[170px] text-right font-display text-xs italic leading-snug text-gold-light"
              style={{
                left: `${pctX(rebound.to.x)}%`,
                top: `${pctY(rebound.to.y)}%`,
                transform: 'translate(-100%, -100%)',
              }}
            >
              {REBOUND_ANNOTATION}
            </div>
          ) : (
            <div
              className="absolute text-[11px] font-medium text-gold-light"
              style={{
                left: `${pctX(rebound.marker.x)}%`,
                top: `${pctY(rebound.marker.y)}%`,
                transform: 'translate(-50%, -115%)',
              }}
            >
              †
            </div>
          )}
        </div>
      </div>

      {/* Captions below the chart — learning rates always live here; compact
          mode also moves the in-plot callouts down so the plot stays clean */}
      <div className="mt-3 space-y-1 font-sans text-[10px] leading-snug text-paper-300/50 sm:text-[11px]">
        <p>
          Learning rates: {SOLAR_LEARNING_RATE} (solar) · {BATTERY_LEARNING_RATE} (battery)
        </p>
        {compact && (
          <p className="font-display text-xs italic text-gold-light/90">† {REBOUND_ANNOTATION}</p>
        )}
        {compact && (
          <p className="font-display text-xs italic text-brand-300/80">
            <span className="mr-1.5 inline-block h-[6px] w-[10px] rounded-[2px] bg-brand-400/25 align-middle" />
            {FLOOR_LABEL}
          </p>
        )}
      </div>

      {/* Scrubber */}
      <input
        type="range"
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={1}
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        aria-label="scrub through the price history"
        className="mt-4 h-11 w-full cursor-pointer appearance-none bg-transparent
          [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-paper-300/20
          [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-paper-300/20
          [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-sm
          [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gold [&::-moz-range-thumb]:shadow-sm"
      />
    </figure>
  )
}
