'use client'

import { useEffect, useState } from 'react'
import {
  GENERATION_GROUP_LABEL,
  GENERATION_GROUP_ORDER,
  type GenerationGroupId,
  type GroupRailPoint,
  generationGroupForKey,
} from '@/lib/utils/generation-groups'

type LegendEntry = {
  key: string
  label: string
  color: string
  value: number
  share?: number
  active: boolean
}

type AxisScale = ((value: number) => number) & { bandwidth?: () => number }

export type RailChartProps = {
  offset?: { left: number; top: number; width: number; height: number }
  xAxisMap?: Record<string, { scale?: AxisScale }>
  yAxisMap?: Record<string, { scale?: AxisScale }>
  railData?: Array<GroupRailPoint & { year: number }>
  showLabels?: boolean
}

const GROUP_TRACKS = 'lg:grid-cols-[minmax(0,3fr)_minmax(0,5fr)_minmax(0,2fr)]'

export function useGroupRailLabels(): boolean {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const onChange = () => setShow(query.matches)
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return show
}

/**
 * Quiet group names in the right margin, level with the latest year's bands.
 * The hairlines are separate chart series so they follow the stack.
 */
export function GenerationGroupRail({
  offset,
  yAxisMap,
  railData,
  showLabels = false,
}: RailChartProps) {
  if (!showLabels || !offset || !yAxisMap || !railData?.length) return null

  const yAxis = Object.values(yAxisMap)[0]
  if (!yAxis?.scale) return null

  const scaleY = yAxis.scale
  const last = railData[railData.length - 1]
  const plotRight = offset.left + offset.width
  const plotTop = offset.top
  const plotBottom = offset.top + offset.height
  const labelX = plotRight + 10

  const labels = (
    [
      ['fossil', last.fossilLabel],
      ['renewable', last.renewableLabel],
      ['nuclear', last.nuclearLabel],
    ] as const
  )
    .filter((item): item is readonly [GenerationGroupId, number] => item[1] != null)
    .map(([id, value]) => ({
      id,
      label: GENERATION_GROUP_LABEL[id],
      y: scaleY(value),
    }))
    .filter(item => item.y > plotTop + 7 && item.y < plotBottom - 7)

  const placed: typeof labels = []
  for (const label of labels) {
    if (placed.some(item => Math.abs(item.y - label.y) < 14)) continue
    placed.push(label)
  }

  return (
    <g aria-hidden="true" pointerEvents="none">
      {placed.map(label => (
        <text
          key={label.id}
          x={labelX}
          y={label.y}
          fill="#5E675C"
          fontSize={11}
          fontWeight={600}
          fontFamily="Inter, system-ui, sans-serif"
          dominantBaseline="middle"
        >
          {label.label}
        </text>
      ))}
    </g>
  )
}

export function GenerationYearDetail({
  year,
  entries,
  total,
  formatTwh,
  onToggle,
  onShowAll,
}: {
  year: number
  entries: LegendEntry[]
  total: number
  formatTwh: (value: number) => string
  onToggle: (key: string) => void
  onShowAll: () => void
}) {
  const groups = GENERATION_GROUP_ORDER.map(id => {
    const items = entries.filter(entry => generationGroupForKey(entry.key) === id)
    const groupTotal = items.reduce((sum, item) => sum + item.value, 0)
    const share = total ? (groupTotal / total) * 100 : 0
    return {
      id,
      label: GENERATION_GROUP_LABEL[id],
      items,
      total: groupTotal,
      share,
    }
  }).filter(group => group.items.length > 0)

  const hasHidden = entries.some(entry => !entry.active)

  return (
    <div className="mb-5 space-y-3" data-generation-year>
      <div className="rounded-xl bg-ink px-4 py-4 text-white">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-300">Selected year</div>
          <div className="text-3xl font-black tabular-nums leading-none">{year}</div>
        </div>
        <div className={`mt-4 grid grid-cols-3 gap-3 ${GROUP_TRACKS}`}>
          {groups.map(group => (
            <div key={group.id} className="min-w-0">
              <div className="truncate text-xs font-semibold text-ink-300">{group.label}</div>
              <div className="mt-1 text-lg font-black tabular-nums leading-none sm:text-2xl">
                {group.share.toFixed(1)}%
              </div>
              <div className="mt-1 truncate text-[11px] font-semibold tabular-nums text-ink-300 sm:text-xs">
                {formatTwh(group.total)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">Generation sources</div>
        {hasHidden && (
          <button
            type="button"
            onClick={onShowAll}
            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-600 shadow-card transition hover:text-brand-700"
          >
            Show all
          </button>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-3 px-4 ${GROUP_TRACKS}`}>
        {groups.map(group => (
          <section key={group.id} aria-labelledby={`generation-group-${group.id}`} className="min-w-0">
            <h3
              id={`generation-group-${group.id}`}
              className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500 lg:sr-only"
            >
              {group.label}
            </h3>
            <div className="rounded-xl bg-paper-200/70 p-1.5">
              <ul className="grid gap-1">
                {group.items.map(entry => (
                  <li key={entry.key}>
                    <button
                      type="button"
                      aria-pressed={entry.active}
                      onClick={() => onToggle(entry.key)}
                      className={`grid w-full grid-cols-[minmax(0,1fr)_auto_3.25rem] items-center gap-x-2 rounded-lg px-2.5 py-2 text-left transition ${
                        entry.active
                          ? 'bg-white shadow-card'
                          : 'bg-white/45 opacity-50 hover:opacity-80'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs font-bold leading-tight text-ink-700">{entry.label}</span>
                      </span>
                      <span className="whitespace-nowrap text-xs font-black tabular-nums text-ink sm:text-sm">
                        {formatTwh(entry.value)}
                      </span>
                      <span className="text-right text-[11px] font-semibold tabular-nums text-ink-500">
                        {(entry.share ?? 0).toFixed(1)}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
