'use client'

type GenerationGroupId = 'fossil' | 'renewable' | 'nuclear'

const GROUP_ORDER: GenerationGroupId[] = ['fossil', 'renewable', 'nuclear']

const GROUP_LABEL: Record<GenerationGroupId, string> = {
  fossil: 'Fossil',
  renewable: 'Renewable',
  nuclear: 'Nuclear',
}

const GROUP_KEYS: Record<GenerationGroupId, readonly string[]> = {
  fossil: ['coal', 'naturalGas', 'oil'],
  renewable: ['hydro', 'bioenergy', 'solarPv', 'wind', 'other'],
  nuclear: ['nuclear'],
}

type LegendEntry = {
  key: string
  label: string
  color: string
  value: number
  share?: number
  active: boolean
}

function groupForKey(key: string): GenerationGroupId | null {
  for (const id of GROUP_ORDER) {
    if (GROUP_KEYS[id].includes(key)) return id
  }
  return null
}

const CARD_GRID = 'grid grid-cols-3 gap-2 md:grid-cols-5'

export function GenerationYearDetail({
  entries,
  formatTwh,
  onToggle,
  onShowAll,
}: {
  entries: LegendEntry[]
  formatTwh: (value: number) => string
  onToggle: (key: string) => void
  onShowAll: () => void
}) {
  const groups = GROUP_ORDER.map(id => ({
    id,
    label: GROUP_LABEL[id],
    items: entries.filter(entry => groupForKey(entry.key) === id),
  })).filter(group => group.items.length > 0)

  const hasHidden = entries.some(entry => !entry.active)

  return (
    <div className="mt-5" data-generation-year>
      {hasHidden && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onShowAll}
            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-600 shadow-card transition hover:text-brand-700"
          >
            Show all
          </button>
        </div>
      )}
      <div className="space-y-3">
        {groups.map(group => (
          <section key={group.id} aria-labelledby={`generation-group-${group.id}`}>
            <h3
              id={`generation-group-${group.id}`}
              className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500"
            >
              {group.label}
            </h3>
            <ul className={CARD_GRID}>
              {group.items.map(entry => (
                <li key={entry.key} className="min-w-0">
                  <button
                    type="button"
                    aria-pressed={entry.active}
                    onClick={() => onToggle(entry.key)}
                    className={`h-full w-full min-w-0 rounded-lg p-2.5 text-left transition sm:p-3 ${
                      entry.active
                        ? 'bg-white shadow-card'
                        : 'bg-white/45 opacity-50 hover:opacity-80'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs font-bold leading-tight text-ink-700">{entry.label}</span>
                    </span>
                    <span className="mt-2 block text-xs font-black tabular-nums leading-tight text-ink sm:text-sm">
                      {formatTwh(entry.value)}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-medium tabular-nums text-ink-500">
                      {(entry.share ?? 0).toFixed(1)}% share
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
