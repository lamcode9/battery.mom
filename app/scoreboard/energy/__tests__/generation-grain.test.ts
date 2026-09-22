import { describe, expect, it } from 'vitest'
import { generationStackFill, generationStackFilter, isFossilGrainKey } from '../generation-grain'

const FLAT_KEYS = ['hydro', 'bioenergy', 'solarPv', 'wind', 'other', 'nuclear']

describe('generation stack fossil grain', () => {
  it('textures only coal, natural gas, and oil', () => {
    for (const key of ['coal', 'naturalGas', 'oil']) {
      expect(isFossilGrainKey(key)).toBe(true)
      expect(generationStackFill(key, '#374151')).toBe('#374151')
      expect(generationStackFilter(key)).toBe('url(#generation-fossil-grain)')
    }

    for (const key of FLAT_KEYS) {
      expect(isFossilGrainKey(key)).toBe(false)
      expect(generationStackFill(key, '#10b981')).toBe(`url(#generation-${key})`)
      expect(generationStackFilter(key)).toBeUndefined()
    }
  })
})
