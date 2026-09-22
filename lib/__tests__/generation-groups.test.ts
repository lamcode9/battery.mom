import { describe, expect, it } from 'vitest'
import {
  GLOBAL_ELECTRICITY_GENERATION,
  GLOBAL_RENEWABLE_GENERATION,
} from '@/data/energy-deployment-scoreboard'
import {
  groupBoundaries,
  visibleStackBands,
  withGroupRails,
} from '@/lib/utils/generation-groups'

const stackKeys = ['coal', 'naturalGas', 'oil', 'hydro', 'bioenergy', 'solarPv', 'wind', 'other', 'nuclear'] as const

function pointFor(year: number): Record<string, number> {
  const generation = GLOBAL_ELECTRICITY_GENERATION.find(item => item.year === year)
  const renewable = GLOBAL_RENEWABLE_GENERATION.find(item => item.year === year)
  if (!generation || !renewable) throw new Error(`Missing ${year}`)
  return {
    year,
    coal: generation.coal,
    naturalGas: generation.naturalGas,
    oil: generation.oil,
    hydro: renewable.hydro,
    bioenergy: renewable.bioenergy,
    solarPv: renewable.solarPv,
    wind: renewable.wind,
    other: renewable.other,
    nuclear: generation.nuclear,
  }
}

describe('generation group rails', () => {
  const point = pointFor(2025)
  const fossil = point.coal + point.naturalGas + point.oil
  const renewable = point.hydro + point.bioenergy + point.solarPv + point.wind + point.other

  it('keeps every source and places nuclear above renewable, above fossil', () => {
    const bands = visibleStackBands(point, stackKeys)
    expect(bands.map(band => band.id)).toEqual(['fossil', 'renewable', 'nuclear'])
    expect(bands[0].y0).toBe(0)
    expect(bands[0].y1).toBeCloseTo(fossil)
    expect(bands[1].y0).toBeCloseTo(fossil)
    expect(bands[1].y1).toBeCloseTo(fossil + renewable)
    expect(bands[2].y0).toBeCloseTo(fossil + renewable)
    expect(bands[2].y1).toBeCloseTo(fossil + renewable + point.nuclear)
    expect(renewable).toBeCloseTo(point.hydro + point.bioenergy + point.solarPv + point.wind + point.other)
  })

  it('draws hairlines only at the boundaries between groups', () => {
    const bands = visibleStackBands(point, stackKeys)
    expect(groupBoundaries(bands)).toEqual({
      fossilBoundary: bands[0].y1,
      renewableBoundary: bands[1].y1,
    })
  })

  it('does not invent a boundary when a neighbouring group is hidden', () => {
    const withoutNuclear = visibleStackBands(point, stackKeys.filter(key => key !== 'nuclear'))
    expect(groupBoundaries(withoutNuclear).renewableBoundary).toBeNull()
    expect(groupBoundaries(withoutNuclear).fossilBoundary).toBeCloseTo(fossil)

    const withoutFossil = visibleStackBands(
      point,
      stackKeys.filter(key => !['coal', 'naturalGas', 'oil'].includes(key)),
    )
    expect(groupBoundaries(withoutFossil).fossilBoundary).toBeNull()
    expect(groupBoundaries(withoutFossil).renewableBoundary).toBeCloseTo(renewable)

    const nuclearOnly = visibleStackBands(point, ['nuclear'])
    expect(groupBoundaries(nuclearOnly)).toEqual({
      fossilBoundary: null,
      renewableBoundary: null,
    })
  })

  it('moves the fossil hairline when a fossil source is hidden', () => {
    const withoutOil = visibleStackBands(point, stackKeys.filter(key => key !== 'oil'))
    expect(groupBoundaries(withoutOil).fossilBoundary).toBeCloseTo(point.coal + point.naturalGas)
  })

  it('attaches the same boundaries to every year without changing source values', () => {
    const points = [pointFor(2015), pointFor(2025)]
    const [first, last] = withGroupRails(points, stackKeys)
    expect(last.coal).toBe(point.coal)
    expect(last.nuclear).toBe(point.nuclear)
    expect(last.fossilBoundary).toBeCloseTo(fossil)
    expect(first.fossilBoundary).toBeCloseTo(first.coal + first.naturalGas + first.oil)
    expect(last.nuclearLabel).toBeGreaterThan(last.renewableLabel ?? 0)
    expect(last.renewableLabel).toBeGreaterThan(last.fossilLabel ?? 0)
  })
})
