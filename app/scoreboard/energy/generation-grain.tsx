import { useId } from 'react'

/**
 * Same-hue grain for coal, gas, and oil on the world generation stack.
 * The noise is written into the fill color and clipped to that shape.
 * A user-space filter rectangle, or a blend that keeps the noise alpha,
 * paints static across the plot and a halo around the tooltip dots.
 * Hydro, bioenergy, solar, wind, other renewables, and nuclear stay flat.
 */

export const FOSSIL_GRAIN_KEYS = ['coal', 'naturalGas', 'oil'] as const

export type FossilGrainKey = (typeof FOSSIL_GRAIN_KEYS)[number]

const FOSSIL_GRAIN_FILTER = 'url(#generation-fossil-grain)'

function FossilGrainFilter({ id }: { id: string }) {
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
        baseFrequency="0.065"
        numOctaves="1"
        seed="4"
        stitchTiles="stitch"
        result="noise"
      />
      <feColorMatrix
        in="noise"
        type="matrix"
        values="0.8 0 0 0 0.1  0 0.8 0 0 0.1  0 0 0.8 0 0.1  0 0 0 0 1"
        result="gray"
      />
      <feBlend in="SourceGraphic" in2="gray" mode="overlay" result="blended" />
      <feComposite in="blended" in2="SourceGraphic" operator="in" />
    </filter>
  )
}

function FossilDotGrainFilter({ id }: { id: string }) {
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
        baseFrequency="0.45"
        numOctaves="1"
        seed="4"
        stitchTiles="stitch"
        result="noise"
      />
      <feColorMatrix
        in="noise"
        type="matrix"
        values="0.7 0 0 0 0.15  0 0.7 0 0 0.15  0 0 0.7 0 0.15  0 0 0 0 1"
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
  return <FossilGrainFilter id="generation-fossil-grain" />
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
        <FossilDotGrainFilter id={filterId} />
        <rect width="10" height="10" fill={color} filter={`url(#${filterId})`} />
      </svg>
    </span>
  )
}
