/**
 * Battery.mom chart theme — one voice for every chart on the site.
 *
 * The film's title-graphics language applied to data (docs/
 * one-cinematic-work-storyboard.html §05): ink/paper neutrals, ONE emerald
 * for the key series, gold reserved for the moment the chart exists to show.
 * Retires the legacy ev.* blues/cyans. Colors only — no chart logic here.
 */

export const CHART = {
  /** The key series — the thing being tracked (EV, solar, storage, savings). */
  primary: '#0E9F6E',
  primaryLight: '#5DD9A6',
  /** The counterfactual / comparison series (ICE, petrol, grid, baseline). */
  comparison: '#454E44',
  comparisonLight: '#828B80',
  /** The highlight — the single datum the chart argues for. Use sparingly. */
  highlight: '#E0A33C',
  highlightLight: '#F4D18A',
  /** Costs, losses, declines — muted terracotta, never alarm red. */
  negative: '#C0564A',

  ink: '#11150F',
  paper: '#FBF7EE',
  /** Hairline gridlines on paper surfaces. */
  grid: 'rgba(17, 21, 15, 0.08)',
  /** Axis tick text. */
  axis: '#828B80',
  axisFontSize: 12,
} as const

/** Categorical order for multi-series charts (pies, stacked bars). */
export const CHART_SERIES = [
  CHART.primary,
  CHART.highlight,
  CHART.comparison,
  CHART.primaryLight,
  CHART.negative,
  CHART.comparisonLight,
] as const
