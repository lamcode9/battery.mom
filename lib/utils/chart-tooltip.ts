import type { ReactNode } from 'react'

/** One Recharts payload row, typed without `any`. */
export type ChartTooltipPayloadItem = {
  dataKey?: string | number
  name?: string | number
  value?: number | string | Array<number | string>
  color?: string
  fill?: string
  payload?: Record<string, unknown>
}

export type ChartTooltipItem = {
  key: string
  name: string
  value: ReactNode
  numericValue: number
  color?: string
}

export type ChartTooltipFormatter = (
  value: number,
  name: string,
  item: ChartTooltipPayloadItem,
  index?: number,
  payload?: ChartTooltipPayloadItem[],
) => ReactNode | [ReactNode, string]

export type ChartTooltipLabelFormatter = (
  label: string | number,
  payload: ChartTooltipPayloadItem[],
) => ReactNode

export function numericTooltipValue(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return null
}

export function defaultTooltipNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

/**
 * Turn a Recharts tooltip payload into the shared row model.
 * Empty formatter names (a Recharts default-tooltip trick) keep the series name.
 */
export function buildChartTooltipItems(
  payload: ChartTooltipPayloadItem[] | undefined,
  options: {
    formatter?: ChartTooltipFormatter
    unit?: string
    reverse?: boolean
  } = {},
): ChartTooltipItem[] {
  if (!payload?.length) return []

  const rows = options.reverse ? [...payload].reverse() : payload
  const items: ChartTooltipItem[] = []

  rows.forEach((item, index) => {
    const numeric = numericTooltipValue(item.value)
    if (numeric === null) return

    const fallbackName = String(item.name ?? item.dataKey ?? '')
    const formatted = options.formatter?.(numeric, fallbackName, item, index, payload)

    let name = fallbackName
    let value: ReactNode
    if (Array.isArray(formatted)) {
      value = formatted[0]
      if (formatted[1]) name = String(formatted[1])
    } else if (formatted != null) {
      value = formatted
    } else {
      const formattedNumber = defaultTooltipNumber(numeric)
      value = options.unit ? `${formattedNumber} ${options.unit}` : formattedNumber
    }

    items.push({
      key: String(item.dataKey ?? (name || index)),
      name: name || fallbackName || 'Value',
      value,
      numericValue: numeric,
      color: item.color || item.fill,
    })
  })

  return items
}
