/**
 * Quiet same-hue grain for the fossil bands of the world generation stack.
 * Coal, gas, and oil keep their current hues. A fine fractal noise, in chart
 * pixels, sits in the fill so the fossil group reads without a divider, plot
 * label, wash, or a repeating speck grid.
 * Hydro, bioenergy, solar, wind, other renewables, and nuclear stay flat.
 */

export const FOSSIL_GRAIN_KEYS = ['coal', 'naturalGas', 'oil'] as const

export type FossilGrainKey = (typeof FOSSIL_GRAIN_KEYS)[number]

const FOSSIL_GRAIN_FILTER = 'url(#generation-fossil-grain)'

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
  return (
    <filter
      id="generation-fossil-grain"
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="1600"
      height="480"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.55"
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
      <feComposite in="SourceGraphic" in2="centered" operator="arithmetic" k1="0" k2="1" k3="0.2" k4="0" result="modulated" />
      <feComposite in="modulated" in2="SourceGraphic" operator="in" />
    </filter>
  )
}
