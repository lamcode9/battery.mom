import { useId } from 'react'

/**
 * Quiet same-hue grain for the fossil bands of the world generation stack.
 * Coal, gas, and oil keep their current hues. Fractal noise, blended as an
 * overlay in chart pixels, sits in the fill so the fossil group reads without
 * a divider, plot label, wash, or a repeating speck grid. Hover dots for those
 * three sources use that noise inside the dot. The dot filter writes the noise
 * into the color, then clips the result to the circle. The band filter's
 * constant gray only varies alpha, so on a solid dot it paints a halo around
 * the swatch instead of grain in the fill.
 * Hydro, bioenergy, solar, wind, other renewables, and nuclear stay flat.
 */

export const FOSSIL_GRAIN_KEYS = ['coal', 'naturalGas', 'oil'] as const

export type FossilGrainKey = (typeof FOSSIL_GRAIN_KEYS)[number]

const FOSSIL_GRAIN_FILTER = 'url(#generation-fossil-grain)'

function FossilGrainFilter({
  id,
  width,
  height,
  frequency,
}: {
  id: string
  width: number
  height: number
  frequency: number
}) {
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      x="0"
      y="0"
      width={width}
      height={height}
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency={frequency}
        numOctaves="1"
        seed="4"
        stitchTiles="stitch"
        result="noise"
      />
      <feColorMatrix
        in="noise"
        type="matrix"
        values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  1.6 0 0 0 -0.62"
        result="grain"
      />
      <feBlend in="SourceGraphic" in2="grain" mode="overlay" />
    </filter>
  )
}

function FossilDotGrainFilter({ id }: { id: string }) {
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="10"
      height="10"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.22"
        numOctaves="1"
        seed="4"
        stitchTiles="stitch"
        result="noise"
      />
      <feColorMatrix
        in="noise"
        type="matrix"
        values="1.4 0 0 0 -0.2  0 1.4 0 0 -0.2  0 0 1.4 0 -0.2  0 0 0 0 1"
        result="gray"
      />
      <feBlend in="SourceGraphic" in2="gray" mode="overlay" result="blended" />
      <feComposite in="blended" in2="SourceGraphic" operator="in" />
    </filter>
  )
}

export function isFossilGrainKey(key: string): key is FossilGrainKey {
  return (FOSSIL_GRAIN_KEYS as readonly string[]).includes(key)
}

export function generationStackFill(key: string, color: string): string {
  return isFossilGrainKey(key) ? color : `url(#generation-${key})`
}

export function generationStackFilter(key: string): string | undefined {
  return isFossilGrainKey(key) ? FOSSIL_GRAIN_FILTER : undefined
}

export function GenerationFossilGrainDefs() {
  return <FossilGrainFilter id="generation-fossil-grain" width={1600} height={480} frequency={0.22} />
}

export function GenerationSourceSwatch({
  color,
  textured,
}: {
  color: string
  textured: boolean
}) {
  const filterId = `generation-fossil-dot-${useId().replace(/:/g, '')}`

  if (!textured) {
    return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
  }

  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className="h-2.5 w-2.5 shrink-0 overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <FossilDotGrainFilter id={filterId} />
      <circle cx="5" cy="5" r="5" fill={color} filter={`url(#${filterId})`} />
    </svg>
  )
}
