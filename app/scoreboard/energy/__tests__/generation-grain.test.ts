import { describe, expect, it } from 'vitest'
import { generationStackFill, isFossilGrainKey } from '../generation-grain'

const FLAT_KEYS = ['hydro', 'bioenergy', 'solarPv', 'wind', 'other', 'nuclear']

describe('generation stack fossil grain', () => {
  it('textures only coal, natural gas, and oil', () => {
    expect(generationStackFill('coal')).toBe('url(#generation-grain-coal)')
    expect(generationStackFill('naturalGas')).toBe('url(#generation-grain-naturalGas)')
    expect(generationStackFill('oil')).toBe('url(#generation-grain-oil)')

    for (const key of FLAT_KEYS) {
      expect(isFossilGrainKey(key)).toBe(false)
      expect(generationStackFill(key)).toBe(`url(#generation-${key})`)
    }
  })
})
