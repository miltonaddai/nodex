import { Plus, Trash2 } from 'lucide-react'
import {
  FIELD_BY_ID,
  FILTER_FIELDS,
  formatFilterValue,
  parseFilterValue,
  type FilterRule,
  type FilterUnit,
} from '@/lib/custom-filters'
import { cn } from '@/lib/utils'

/**
 * The condition editor shared by the table's custom filter and alerts: rows of "field at least /
 * at most value". Values are kept as typed text until read, so "100k" or "1.5m" can be entered.
 */

export const MAX_RULES = 8

export interface DraftRule {
  key: number
  field: string
  op: 'gte' | 'lte'
  text: string
}

const UNIT_PREFIX: Partial<Record<FilterUnit, string>> = { usd: '$' }
const UNIT_SUFFIX: Partial<Record<FilterUnit, string>> = { pct: '%', multiple: '×', hours: 'h' }
const PLACEHOLDER: Record<FilterUnit, string> = { usd: '100k', count: '3', pct: '30', multiple: '2', hours: '24' }

let nextKey = 1

export const newDraft = (): DraftRule => ({ key: nextKey++, field: 'walletCount', op: 'gte', text: '' })

export function draftsFrom(rules: FilterRule[]): DraftRule[] {
  if (rules.length === 0) return [newDraft()]
  return rules.map((rule) => ({
    key: nextKey++,
    field: rule.field,
    op: rule.op,
    text: formatFilterValue(rule.value, FIELD_BY_ID.get(rule.field)?.unit ?? 'count'),
  }))
}

/** The rules the drafts make, skipping blank rows, and whether any row holds something unreadable. */
export function readDrafts(drafts: DraftRule[]): { rules: FilterRule[]; invalid: boolean } {
  const parsed = drafts.map((draft) => ({ draft, value: parseFilterValue(draft.text) }))
  return {
    invalid: parsed.some(({ draft, value }) => draft.text.trim() !== '' && value === null),
    rules: parsed
      .filter(({ value }) => value !== null)
      .map(({ draft, value }) => ({ field: draft.field, op: draft.op, value: value as number })),
  }
}

export function RuleEditor({
  drafts,
  onChange,
  onSubmit,
}: {
  drafts: DraftRule[]
  onChange: (drafts: DraftRule[]) => void
  /** Called on Enter in a value box. */
  onSubmit?: () => void
}) {
  const update = (key: number, patch: Partial<DraftRule>) =>
    onChange(drafts.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)))
  const { invalid } = readDrafts(drafts)

  return (
    <div className="space-y-3">
      {drafts.map((draft, index) => {
        const field = FIELD_BY_ID.get(draft.field) ?? FILTER_FIELDS[0]
        const bad = draft.text.trim() !== '' && parseFilterValue(draft.text) === null
        return (
          <div key={draft.key} className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_10rem_auto] sm:items-start">
            <span className="hidden pt-2.5 text-xs font-semibold uppercase tracking-wider text-whalemo-muted sm:block sm:w-10">
              {index === 0 ? 'Where' : 'And'}
            </span>
            <div>
              <select
                value={draft.field}
                onChange={(event) => update(draft.key, { field: event.target.value })}
                aria-label="Field"
                className="glass-input h-10 w-full px-3 text-sm"
              >
                {FILTER_FIELDS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-whalemo-muted">{field.hint}</p>
            </div>
            <div className="flex gap-2 sm:contents">
              <div className="flex h-10 border border-whalemo-line" role="group" aria-label="Comparison">
                {(['gte', 'lte'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => update(draft.key, { op })}
                    aria-pressed={draft.op === op}
                    className={cn(
                      'px-3 text-sm whitespace-nowrap transition-colors',
                      draft.op === op ? 'bg-whalemo-accent text-whalemo-on-accent' : 'text-whalemo-muted hover:text-white'
                    )}
                  >
                    {op === 'gte' ? '≥ at least' : '≤ at most'}
                  </button>
                ))}
              </div>
              <label className={cn('glass-input flex h-10 min-w-0 flex-1 items-center gap-1 px-3 text-sm', bad && 'border-whalemo-red')}>
                {UNIT_PREFIX[field.unit] ? <span className="text-whalemo-muted">{UNIT_PREFIX[field.unit]}</span> : null}
                <input
                  value={draft.text}
                  onChange={(event) => update(draft.key, { text: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && onSubmit) {
                      event.preventDefault()
                      onSubmit()
                    }
                  }}
                  placeholder={PLACEHOLDER[field.unit]}
                  inputMode="decimal"
                  aria-label="Value"
                  aria-invalid={bad}
                  className="w-full min-w-0 bg-transparent outline-none placeholder:text-whalemo-muted/60"
                />
                {UNIT_SUFFIX[field.unit] ? <span className="text-whalemo-muted">{UNIT_SUFFIX[field.unit]}</span> : null}
              </label>
              <button
                type="button"
                onClick={() => onChange(drafts.filter((item) => item.key !== draft.key))}
                aria-label="Remove condition"
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-whalemo-line text-whalemo-muted transition-colors hover:border-whalemo-red/50 hover:text-whalemo-red"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}

      {drafts.length < MAX_RULES ? (
        <button
          type="button"
          onClick={() => onChange([...drafts, newDraft()])}
          className="flex items-center gap-1.5 text-sm font-medium text-whalemo-teal hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add condition
        </button>
      ) : null}
      {invalid ? <p className="text-xs text-whalemo-red">Enter numbers, e.g. 3, 30, 100k or 1.5m.</p> : null}
    </div>
  )
}
