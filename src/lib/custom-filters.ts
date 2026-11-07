/**
 * Fields a user can build Smart Wallets filters on. The ids match the backend's
 * src/lib/custom-filters.ts, which does the filtering; this file only adds labels and units.
 */

export type FilterUnit = 'usd' | 'count' | 'pct' | 'multiple' | 'hours'

export type FilterGroup = 'Traders' | 'Market' | 'Timing'

export interface FilterField {
  id: string
  label: string
  unit: FilterUnit
  group: FilterGroup
  /** One line on what the number means, shown in the field picker. */
  hint: string
  /** Common values, offered as one-click choices under the value box. */
  presets: number[]
}

export const FILTER_GROUPS: FilterGroup[] = ['Traders', 'Market', 'Timing']

export const FILTER_FIELDS: FilterField[] = [
  { id: 'walletCount', label: 'Top traders buying', unit: 'count', group: 'Traders', hint: 'How many tracked traders are net buyers.', presets: [2, 3, 5, 10] },
  { id: 'netBuyUsd', label: 'Net bought by traders', unit: 'usd', group: 'Traders', hint: 'What they bought minus what they sold.', presets: [1e3, 1e4, 5e4, 1e5] },
  { id: 'buyUsd', label: 'Bought by traders', unit: 'usd', group: 'Traders', hint: 'Total buys by the tracked traders.', presets: [1e3, 1e4, 5e4, 1e5] },
  { id: 'sellUsd', label: 'Sold by traders', unit: 'usd', group: 'Traders', hint: 'Total sells by the tracked traders.', presets: [1e3, 1e4, 5e4, 1e5] },
  { id: 'soldPct', label: 'Traders sold (% of bought)', unit: 'pct', group: 'Traders', hint: 'Low means they are still holding.', presets: [10, 30, 50] },
  { id: 'buyCount', label: 'Number of buys', unit: 'count', group: 'Traders', hint: 'Buy transactions by the tracked traders.', presets: [3, 5, 10, 20] },
  { id: 'buyerRealizedPnl30d', label: "Buyers' 30d PnL", unit: 'usd', group: 'Traders', hint: 'Combined 30-day profit of the traders buying.', presets: [1e5, 1e6, 5e6] },
  { id: 'marketCap', label: 'Market cap', unit: 'usd', group: 'Market', hint: 'Current market cap.', presets: [5e4, 1e5, 5e5, 1e6, 1e7] },
  { id: 'liquidity', label: 'Liquidity', unit: 'usd', group: 'Market', hint: 'USD in the main pool.', presets: [1e4, 5e4, 1e5, 5e5] },
  { id: 'volume24h', label: '24h volume', unit: 'usd', group: 'Market', hint: 'Trading volume over the last day.', presets: [1e5, 5e5, 1e6, 5e6] },
  { id: 'volumeToMcap', label: '24h volume ÷ market cap', unit: 'multiple', group: 'Market', hint: 'Above 1 means the whole cap traded hands today.', presets: [1, 3, 10] },
  { id: 'priceChange24h', label: '24h price change', unit: 'pct', group: 'Market', hint: 'Use a minus for drops, e.g. -20.', presets: [-20, 0, 20, 50, 100] },
  { id: 'peakMultiple', label: 'Peak since first seen', unit: 'multiple', group: 'Market', hint: 'Highest price since first seen, as a multiple.', presets: [1.5, 2, 5] },
  { id: 'lastBuyHours', label: 'Latest buy (hours ago)', unit: 'hours', group: 'Timing', hint: 'At most 6 means bought in the last 6 hours.', presets: [1, 6, 24] },
  { id: 'firstSeenHours', label: 'First seen (hours ago)', unit: 'hours', group: 'Timing', hint: 'How long WhaleMo has listed the token.', presets: [6, 24, 72] },
]

export const FIELD_BY_ID = new Map(FILTER_FIELDS.map((field) => [field.id, field]))

export interface FilterRule {
  field: string
  op: 'gte' | 'lte'
  value: number
}

export interface SavedFilter {
  id: string
  name: string
  rules: FilterRule[]
}

/** A background watch on the Smart Wallets data. Separate from saved filters, which shape the table. */
export interface Alert {
  id: string
  name: string
  rules: FilterRule[]
  chains: string[]
  enabled: boolean
  /** Also send to the user's linked Telegram chat. */
  telegram: boolean
}

const SUFFIX: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 }

/** Reads what a user typed: "100k", "1.5m", "$250,000", "-20", "3x". Null when it isn't a number. */
export function parseFilterValue(input: string): number | null {
  const match = input.trim().toLowerCase().replace(/[$,%\s]/g, '').replace(/x$/, '').match(/^(-?\d*\.?\d+)([kmb])?$/)
  if (!match) return null
  const value = Number(match[1]) * (match[2] ? SUFFIX[match[2]] : 1)
  return Number.isFinite(value) ? value : null
}

/** A value as the user would type it back: 100000 → "100K". */
export function formatFilterValue(value: number, unit: FilterUnit): string {
  if (unit === 'usd' || unit === 'count') {
    const abs = Math.abs(value)
    const short = (n: number, s: string) => `${Number(n.toFixed(2))}${s}`
    if (abs >= 1e9) return short(value / 1e9, 'B')
    if (abs >= 1e6) return short(value / 1e6, 'M')
    if (abs >= 1e3 && unit === 'usd') return short(value / 1e3, 'K')
  }
  return String(Number(value.toFixed(4)))
}

/** A value written out in full, so there is no doubt about its size: $1,000,000, 30%, 6 hours. */
export function formatFullValue(value: number, unit: FilterUnit): string {
  const number = value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  switch (unit) {
    case 'usd':
      return `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    case 'pct':
      return `${number}%`
    case 'multiple':
      return `${number}×`
    case 'hours':
      return `${number} ${value === 1 ? 'hour' : 'hours'}`
    default:
      return number
  }
}

/** "Market cap ≤ $1M", for chips and summaries. */
export function describeRule(rule: FilterRule): string {
  const field = FIELD_BY_ID.get(rule.field)
  if (!field) return ''
  const value = formatFilterValue(rule.value, field.unit)
  const shown =
    field.unit === 'usd' ? `$${value}` : field.unit === 'pct' ? `${value}%` : field.unit === 'multiple' ? `${value}×` : field.unit === 'hours' ? `${value}h` : value
  return `${field.label} ${rule.op === 'gte' ? '≥' : '≤'} ${shown}`
}

export function sameRules(a: FilterRule[], b: FilterRule[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

const SAVED_KEY = 'whalemo_saved_filters_v1'

export function loadSavedFilters(): SavedFilter[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as SavedFilter[]
    return Array.isArray(parsed) ? parsed.filter((f) => f && typeof f.name === 'string' && Array.isArray(f.rules)) : []
  } catch {
    return []
  }
}

export function storeSavedFilters(filters: SavedFilter[]) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(filters))
  } catch {
    // Storage unavailable. Saved filters last for this visit.
  }
}
