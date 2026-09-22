import { describe, it, expect } from 'vitest'
import {
  buildChartTooltipItems,
  defaultTooltipNumber,
  numericTooltipValue,
} from '@/lib/utils/chart-tooltip'

describe('numericTooltipValue', () => {
  it('reads finite numbers and numeric strings', () => {
    expect(numericTooltipValue(12.5)).toBe(12.5)
    expect(numericTooltipValue(['8'])).toBe(8)
    expect(numericTooltipValue('3.2')).toBe(3.2)
  })

  it('rejects empty and non-numeric values', () => {
    expect(numericTooltipValue(undefined)).toBeNull()
    expect(numericTooltipValue(NaN)).toBeNull()
    expect(numericTooltipValue('')).toBeNull()
    expect(numericTooltipValue('n/a')).toBeNull()
  })
})

describe('buildChartTooltipItems', () => {
  const payload = [
    { dataKey: 'coal', name: 'Coal', value: 100, color: '#111' },
    { dataKey: 'solar', name: 'Solar PV', value: 40, color: '#0E9F6E' },
  ]

  it('builds rows with series names and default number formatting', () => {
    const items = buildChartTooltipItems(payload)
    expect(items.map(item => item.name)).toEqual(['Coal', 'Solar PV'])
    expect(items[0].value).toBe(defaultTooltipNumber(100))
    expect(items[1].color).toBe('#0E9F6E')
  })

  it('reverses stacked series so the top mark is first', () => {
    const items = buildChartTooltipItems(payload, { reverse: true })
    expect(items.map(item => item.name)).toEqual(['Solar PV', 'Coal'])
  })

  it('appends a unit when no formatter is given', () => {
    const items = buildChartTooltipItems(payload.slice(0, 1), { unit: 'TWh' })
    expect(items[0].value).toBe(`${defaultTooltipNumber(100)} TWh`)
  })

  it('keeps the series name when a formatter returns an empty name', () => {
    const items = buildChartTooltipItems(payload.slice(0, 1), {
      formatter: value => [`${value} km`, ''],
    })
    expect(items[0].name).toBe('Coal')
    expect(items[0].value).toBe('100 km')
  })

  it('uses a formatter tuple name when it is non-empty', () => {
    const items = buildChartTooltipItems(payload.slice(0, 1), {
      formatter: value => [`${value} t`, 'CO₂ avoided'],
    })
    expect(items[0].name).toBe('CO₂ avoided')
  })
})
