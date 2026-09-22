'use client'

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Tooltip } from 'recharts'
import { cn } from '@/components/ui/cn'
import {
  buildChartTooltipItems,
  type ChartTooltipFormatter,
  type ChartTooltipItem,
  type ChartTooltipLabelFormatter,
  type ChartTooltipPayloadItem,
} from '@/lib/utils/chart-tooltip'

export type {
  ChartTooltipFormatter,
  ChartTooltipItem,
  ChartTooltipLabelFormatter,
  ChartTooltipPayloadItem,
}

/** Visual shell from the state-of-battery-power charts. */
const PANEL_CLASS =
  'rounded-lg border border-ink/10 bg-paper-100 px-3 py-2 shadow-raised max-w-[min(18rem,calc(100vw-1.5rem))]'

export function ChartTooltipRow({
  name,
  value,
  color,
}: {
  name: ReactNode
  value: ReactNode
  color?: string
}) {
  return (
    <p className="flex items-center gap-2 text-xs text-ink-600">
      {color ? (
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
      ) : null}
      <span>{name}</span>
      <span className="ml-auto pl-3 font-semibold text-ink tabular-nums">{value}</span>
    </p>
  )
}

export function ChartTooltipSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="mt-2 first:mt-0">
      <p className="mb-1 text-xs font-semibold text-ink">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

export function ChartTooltipPanel({
  label,
  items,
  total,
  children,
  className,
}: {
  label?: ReactNode
  items?: Array<Pick<ChartTooltipItem, 'name' | 'value' | 'color'>>
  total?: ReactNode
  children?: ReactNode
  className?: string
}) {
  if ((!items || items.length === 0) && !children) return null

  const hasHeading = (label != null && label !== '') || total != null

  return (
    <div role="tooltip" className={cn(PANEL_CLASS, className)}>
      {hasHeading ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label != null && label !== '' ? (
            <p className="text-xs font-semibold text-ink">{label}</p>
          ) : (
            <span />
          )}
          {total != null ? (
            <p className="text-xs font-semibold text-ink tabular-nums">{total}</p>
          ) : null}
        </div>
      ) : null}
      {items && items.length > 0 ? (
        <div className="space-y-1">
          {items.map((item, i) => (
            <ChartTooltipRow
              key={`${item.name}-${i}`}
              name={item.name}
              value={item.value}
              color={item.color}
            />
          ))}
        </div>
      ) : null}
      {children}
    </div>
  )
}

/** Recharts `<Tooltip content={...} />` adapter. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  unit,
  reverse = false,
  showTotal = false,
  totalFormatter,
}: {
  active?: boolean
  payload?: ChartTooltipPayloadItem[]
  label?: string | number
  formatter?: ChartTooltipFormatter
  labelFormatter?: ChartTooltipLabelFormatter
  unit?: string
  reverse?: boolean
  showTotal?: boolean
  totalFormatter?: (total: number) => ReactNode
}) {
  if (!active) return null
  const items = buildChartTooltipItems(payload, { formatter, unit, reverse })
  if (!items.length) return null

  const heading =
    labelFormatter && label != null ? labelFormatter(label, payload ?? []) : label
  const total =
    showTotal && items.length > 1
      ? totalFormatter
        ? totalFormatter(items.reduce((sum, item) => sum + item.numericValue, 0))
        : items
            .reduce((sum, item) => sum + item.numericValue, 0)
            .toLocaleString(undefined, { maximumFractionDigits: 1 })
      : undefined

  return <ChartTooltipPanel label={heading} items={items} total={total} />
}

export const CHART_HOVER_WRAPPER_STYLE: CSSProperties = {
  zIndex: 40,
  outline: 'none',
  pointerEvents: 'none',
}

type RechartsTooltipProps = ComponentProps<typeof Tooltip>

type ChartHoverTooltipProps = Omit<RechartsTooltipProps, 'content' | 'formatter' | 'labelFormatter'> & {
  unit?: string
  reverse?: boolean
  showTotal?: boolean
  totalFormatter?: (total: number) => ReactNode
  content?: RechartsTooltipProps['content']
  formatter?: ChartTooltipFormatter
  labelFormatter?: ChartTooltipLabelFormatter
}

/**
 * Drop-in replacement for Recharts `<Tooltip />`.
 * Same hover card as the state-of-battery-power charts: paper panel, one tooltip, no clip.
 */
export function ChartHoverTooltip({
  unit,
  reverse,
  showTotal,
  totalFormatter,
  formatter,
  labelFormatter,
  content,
  wrapperStyle,
  isAnimationActive = false,
  allowEscapeViewBox = { x: true, y: true },
  ...rest
}: ChartHoverTooltipProps) {
  return (
    <Tooltip
      {...rest}
      isAnimationActive={isAnimationActive}
      allowEscapeViewBox={allowEscapeViewBox}
      wrapperStyle={{ ...CHART_HOVER_WRAPPER_STYLE, ...wrapperStyle }}
      content={
        content ??
        (props => (
          <ChartTooltip
            active={props.active}
            payload={props.payload as ChartTooltipPayloadItem[] | undefined}
            label={props.label as string | number | undefined}
            formatter={formatter}
            labelFormatter={labelFormatter}
            unit={unit}
            reverse={reverse}
            showTotal={showTotal}
            totalFormatter={totalFormatter}
          />
        ))
      }
    />
  )
}

/** Portal a chart tooltip next to a hovered/focused hit target (heatmaps, share bars). */
export function AnchoredChartTooltip({
  anchor,
  label,
  items,
}: {
  anchor: DOMRect
  label?: ReactNode
  items: Array<Pick<ChartTooltipItem, 'name' | 'value' | 'color'>>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: anchor.top, left: anchor.left })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const width = el.offsetWidth
    const height = el.offsetHeight
    const gap = 8
    let top = anchor.top - height - gap
    if (top < 8) top = anchor.bottom + gap
    let left = anchor.left + anchor.width / 2 - width / 2
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
    setPos({ top, left })
  }, [anchor])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={ref}
      className="pointer-events-none fixed z-50"
      style={{ top: pos.top, left: pos.left }}
    >
      <ChartTooltipPanel label={label} items={items} />
    </div>,
    document.body,
  )
}

export default ChartHoverTooltip
