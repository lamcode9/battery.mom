export type GenerationGroupId = 'fossil' | 'renewable' | 'nuclear'

export const GENERATION_GROUP_ORDER: GenerationGroupId[] = ['fossil', 'renewable', 'nuclear']

export const GENERATION_GROUP_LABEL: Record<GenerationGroupId, string> = {
  fossil: 'Fossil',
  renewable: 'Renewable',
  nuclear: 'Nuclear',
}

export const GENERATION_GROUP_KEYS: Record<GenerationGroupId, readonly string[]> = {
  fossil: ['coal', 'naturalGas', 'oil'],
  renewable: ['hydro', 'bioenergy', 'solarPv', 'wind', 'other'],
  nuclear: ['nuclear'],
}

export type StackBand = {
  id: GenerationGroupId
  label: string
  y0: number
  y1: number
}

export type GroupRailPoint = {
  fossilBoundary: number | null
  renewableBoundary: number | null
  fossilLabel: number | null
  renewableLabel: number | null
  nuclearLabel: number | null
}

export function generationGroupForKey(key: string): GenerationGroupId | null {
  for (const id of GENERATION_GROUP_ORDER) {
    if (GENERATION_GROUP_KEYS[id].includes(key)) return id
  }
  return null
}

function sumKeys(point: Record<string, number>, keys: readonly string[]): number {
  return keys.reduce((sum, key) => sum + (Number(point[key]) || 0), 0)
}

/**
 * Visible stack order is fossil, then renewable, then nuclear.
 * A band is omitted when every source in that group is hidden or zero.
 */
export function visibleStackBands(
  point: Record<string, number>,
  visibleKeys: readonly string[],
): StackBand[] {
  const visible = new Set(visibleKeys)
  let cursor = 0
  const bands: StackBand[] = []

  for (const id of GENERATION_GROUP_ORDER) {
    const keys = GENERATION_GROUP_KEYS[id].filter(key => visible.has(key))
    if (!keys.length) continue
    const height = sumKeys(point, keys)
    if (height <= 0) continue
    bands.push({
      id,
      label: GENERATION_GROUP_LABEL[id],
      y0: cursor,
      y1: cursor + height,
    })
    cursor += height
  }

  return bands
}

/** Hairline y values where a group meets the group above it. The top band has no line. */
export function groupBoundaries(bands: StackBand[]): Pick<GroupRailPoint, 'fossilBoundary' | 'renewableBoundary'> {
  const topId = bands[bands.length - 1]?.id
  const fossil = bands.find(band => band.id === 'fossil')
  const renewable = bands.find(band => band.id === 'renewable')

  return {
    fossilBoundary: fossil && fossil.id !== topId ? fossil.y1 : null,
    renewableBoundary: renewable && renewable.id !== topId ? renewable.y1 : null,
  }
}

export function withGroupRails<T extends Record<string, number>>(
  points: T[],
  visibleKeys: readonly string[],
): Array<T & GroupRailPoint> {
  return points.map(point => {
    const bands = visibleStackBands(point, visibleKeys)
    const boundaries = groupBoundaries(bands)
    const mid = (id: GenerationGroupId) => {
      const band = bands.find(item => item.id === id)
      return band ? (band.y0 + band.y1) / 2 : null
    }

    return {
      ...point,
      fossilBoundary: boundaries.fossilBoundary,
      renewableBoundary: boundaries.renewableBoundary,
      fossilLabel: mid('fossil'),
      renewableLabel: mid('renewable'),
      nuclearLabel: mid('nuclear'),
    }
  })
}
