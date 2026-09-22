/**
 * Quiet same-hue grain for the fossil bands of the world generation stack.
 * Coal, gas, and oil keep their current hues. A repeating speck tile sits in
 * the fill so the fossil group reads without a divider, plot label, or wash.
 * Hydro, bioenergy, solar, wind, other renewables, and nuclear stay flat.
 */

export const FOSSIL_GRAIN_KEYS = ['coal', 'naturalGas', 'oil'] as const

export type FossilGrainKey = (typeof FOSSIL_GRAIN_KEYS)[number]

const SPECK_TILE = 8

function darkerSameHue(hex: string): string {
  const raw = hex.replace('#', '')
  const channel = (start: number) =>
    Math.round(parseInt(raw.slice(start, start + 2), 16) * 0.55)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(0)}${channel(2)}${channel(4)}`
}

export function isFossilGrainKey(key: string): key is FossilGrainKey {
  return (FOSSIL_GRAIN_KEYS as readonly string[]).includes(key)
}

export function generationStackFill(key: string): string {
  return isFossilGrainKey(key) ? `url(#generation-grain-${key})` : `url(#generation-${key})`
}

export function GenerationFossilGrainDefs({
  colors,
}: {
  colors: Record<FossilGrainKey, string>
}) {
  return (
    <>
      {FOSSIL_GRAIN_KEYS.map(key => (
        <pattern
          key={key}
          id={`generation-grain-${key}`}
          patternUnits="userSpaceOnUse"
          width={SPECK_TILE}
          height={SPECK_TILE}
          viewBox={`0 0 ${SPECK_TILE} ${SPECK_TILE}`}
        >
          <rect width={SPECK_TILE} height={SPECK_TILE} fill={colors[key]} fillOpacity={0.8} />
          <circle cx="1.35" cy="1.7" r="1.05" fill="#ffffff" fillOpacity="0.58" />
          <circle cx="5.15" cy="5.25" r="0.78" fill={darkerSameHue(colors[key])} fillOpacity="0.5" />
          <circle cx="6.5" cy="2.2" r="0.5" fill="#ffffff" fillOpacity="0.36" />
        </pattern>
      ))}
    </>
  )
}
