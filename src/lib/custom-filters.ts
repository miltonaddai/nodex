/**
 * Fields a user can build Smart Wallets filters on. The ids match the backend's
 * src/lib/custom-filters.ts, which does the filtering; this file only adds labels and units.
 */

export type FilterUnit = 'usd' | 'count' | 'pct' | 'multiple' | 'hours'

export interface FilterField {
  id: string
  label: string
  unit: FilterUnit
  /** One line on what the number means, shown under the field picker. */
  hint: string
}

export const FILTER_FIELDS: FilterField[] = [
  { id: 'walletCount', label: 'Top traders buying', unit: 'count', hint: 'How many tracked traders are net buyers.' },
  { id: 'marketCap', label: 'Market cap', unit: 'usd', hint: 'Current market cap.' },
  { id: 'liquidity', label: 'Liquidity', unit: 'usd', hint: 'USD in the main pool.' },
  { id: 'volume24h', label: '24h volume', unit: 'usd', hint: 'Trading volume over the last day.' },
  { id: 'volumeToMcap', label: '24h volume ÷ market cap', unit: 'multiple', hint: 'Above 1 means the whole cap traded hands today.' },
  { id: 'priceChange24h', label: '24h price change', unit: 'pct', hint: 'Negative values for drops, e.g. -20.' },
  { id: 'netBuyUsd', label: 'Net bought by traders', unit: 'usd', hint: 'What they bought minus what they sold.' },
  { id: 'buyUsd', label: 'Bought by traders', unit: 'usd', hint: 'Total buys by the tracked traders.' },
  { id: 'sellUsd', label: 'Sold by traders', unit: 'usd', hint: 'Total sells by the tracked traders.' },
  { id: 'soldPct', label: 'Traders sold (% of bought)', unit: 'pct', hint: 'Low means they are still holding.' },
  { id: 'buyCount', label: 'Number of buys', unit: 'count', hint: 'Buy transactions by the tracked traders.' },
  { id: 'buyerRealizedPnl30d', label: "Buyers' 30d PnL", unit: 'usd', hint: 'Combined 30-day profit of the traders buying.' },
  { id: 'lastBuyHours', label: 'Latest buy (hours ago)', unit: 'hours', hint: 'At most 6 means bought in the last 6 hours.' },
  { id: 'firstSeenHours', label: 'First seen (hours ago)', unit: 'hours', hint: 'How long WhaleMo has listed the token.' },
  { id: 'peakMultiple', label: 'Peak since first seen', unit: 'multiple', hint: 'Highest price since first seen, as a multiple.' },
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
  /** Alert when a token newly matches. Off for filters saved only in the browser. */
  alert?: boolean
  alertChains?: string[]
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
