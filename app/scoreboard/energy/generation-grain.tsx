import { useId } from 'react'

/**
 * Same-hue grain for coal, gas, and oil on the world generation stack.
 * Fractal noise is collapsed to one luminance, mixed lightly into the fill,
 * then clipped to that shape. Separate red, green, and blue noise reads as
 * confetti. A filter rectangle larger than the shape paints the plot.
 * Hydro, bioenergy, solar, wind, other renewables, and nuclear stay flat.
 */

export const FOSSIL_GRAIN_KEYS = ['coal', 'naturalGas', 'oil'] as const

export type FossilGrainKey = (typeof FOSSIL_GRAIN_KEYS)[number]

const FOSSIL_GRAIN_FILTER = 'url(#generation-fossil-grain)'

function FossilGrainFilter({ id, frequency }: { id: string; frequency: number }) {
  return (
    <filter
      id={id}
      filterUnits="objectBoundingBox"
      primitiveUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="1"
      height="1"
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
        values="0.33 0.33 0.33 0 -0.5  0.33 0.33 0.33 0 -0.5  0.33 0.33 0.33 0 -0.5  0 0 0 1 0"
        result="centered"
      />
      <feComposite in="SourceGraphic" in2="centered" operator="arithmetic" k1="0" k2="1" k3="0.42" k4="0" result="modulated" />
      <feComposite in="modulated" in2="SourceGraphic" operator="in" />
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
  return <FossilGrainFilter id="generation-fossil-grain" frequency={0.4} />
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
    <span className="inline-flex h-2.5 w-2.5 shrink-0 overflow-hidden rounded-full" aria-hidden="true">
      <svg width="10" height="10" viewBox="0 0 10 10" className="block h-2.5 w-2.5">
        <FossilGrainFilter id={filterId} frequency={0.4} />
        <rect width="10" height="10" fill={color} filter={`url(#${filterId})`} />
      </svg>
    </span>
  )
}
