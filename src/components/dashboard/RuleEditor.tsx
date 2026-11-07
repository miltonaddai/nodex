import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FIELD_BY_ID,
  FILTER_FIELDS,
  FILTER_GROUPS,
  formatFullValue,
  parseFilterValue,
  type FilterField,
  type FilterRule,
  type FilterUnit,
} from '@/lib/custom-filters'
import { cn } from '@/lib/utils'

/**
 * The condition editor shared by the table's custom filter and alerts: rows of "field at least /
 * at most value". Money values are a number plus a K / M / B unit, with the full amount written
 * out underneath, so "100 K" and "2 M" can't be mixed up. Common values are one click away.
 */

export const MAX_RULES = 8

export interface DraftRule {
  key: number
  field: string
  op: 'gte' | 'lte'
  /** What's in the number box. For money fields it's the amount before the unit. */
  text: string
  /** For money fields, the unit the number is in: 1e3 (K), 1e6 (M) or 1e9 (B). Otherwise 1. */
  scale: number
}

const SCALES = [
  { value: 1e3, label: 'K', word: 'thousand' },
  { value: 1e6, label: 'M', word: 'million' },
  { value: 1e9, label: 'B', word: 'billion' },
]

const UNIT_SUFFIX: Partial<Record<FilterUnit, string>> = { pct: '%', multiple: '×', hours: 'h' }
const PLACEHOLDER: Record<FilterUnit, string> = { usd: '100', count: '3', pct: '30', multiple: '2', hours: '24' }

const fieldOf = (id: string): FilterField => FIELD_BY_ID.get(id) ?? FILTER_FIELDS[0]

/** The unit that reads most naturally for an amount: 1,500,000 → M. Below a million, K. */
function scaleFor(value: number): number {
  const abs = Math.abs(value)
  return abs >= 1e9 ? 1e9 : abs >= 1e6 ? 1e6 : 1e3
}

const trim = (n: number) => String(Number(n.toFixed(4)))

/** A number box value and unit for an amount in dollars. */
function splitUsd(value: number): { text: string; scale: number } {
  const scale = scaleFor(value)
  return { text: trim(value / scale), scale }
}

let nextKey = 1

export const newDraft = (): DraftRule => ({ key: nextKey++, field: 'walletCount', op: 'gte', text: '', scale: 1 })

export function draftsFrom(rules: FilterRule[]): DraftRule[] {
  if (rules.length === 0) return [newDraft()]
  return rules.map((rule) => {
    const usd = fieldOf(rule.field).unit === 'usd'
    return { key: nextKey++, field: rule.field, op: rule.op, ...(usd ? splitUsd(rule.value) : { text: trim(rule.value), scale: 1 }) }
  })
}

/** The rule's value in plain units, or null when the box is empty or unreadable. */
function valueOf(draft: DraftRule): number | null {
  if (draft.text.trim() === '') return null
  const parsed = parseFilterValue(draft.text)
  if (parsed === null) return null
  return fieldOf(draft.field).unit === 'usd' ? parsed * draft.scale : parsed
}

/** The rules the drafts make, skipping blank rows, and whether any row holds something unreadable. */
export function readDrafts(drafts: DraftRule[]): { rules: FilterRule[]; invalid: boolean } {
  return {
    invalid: drafts.some((draft) => draft.text.trim() !== '' && valueOf(draft) === null),
    rules: drafts
      .map((draft) => ({ draft, value: valueOf(draft) }))
      .filter(({ value }) => value !== null)
      .map(({ draft, value }) => ({ field: draft.field, op: draft.op, value: value as number })),
  }
}

/** The field picker: grouped, with each field's meaning under its name. */
function FieldPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const current = fieldOf(value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Field"
        className="glass-input flex h-10 w-full items-center justify-between gap-2 px-3 text-left text-sm outline-none focus-visible:border-whalemo-teal/60"
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-whalemo-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[22rem] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[17rem] overflow-y-auto border-whalemo-line bg-whalemo-surface"
      >
        {FILTER_GROUPS.map((group, index) => (
          <div key={group}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>{group}</DropdownMenuLabel>
            {FILTER_FIELDS.filter((field) => field.group === group).map((field) => (
              <DropdownMenuItem
                key={field.id}
                onSelect={() => onChange(field.id)}
                className="cursor-pointer items-start gap-3 focus:bg-whalemo-teal/10"
              >
                <span className="min-w-0 flex-1">
                  <span className={cn('block', field.id === value && 'font-semibold text-whalemo-teal')}>{field.label}</span>
                  <span className="block text-[11px] leading-4 text-whalemo-muted">{field.hint}</span>
                </span>
                {field.id === value ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-whalemo-teal" /> : null}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A preset written short, for its chip: $100K, 30%, 6h, 2×. */
function presetLabel(value: number, unit: FilterUnit): string {
  if (unit === 'usd') {
    const scale = scaleFor(value)
    return `$${trim(value / scale)}${SCALES.find((s) => s.value === scale)!.label}`
  }
  if (unit === 'pct') return `${value}%`
  if (unit === 'hours') return `${value}h`
  if (unit === 'multiple') return `${value}×`
  return String(value)
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

  const changeField = (draft: DraftRule, id: string) => {
    const field = fieldOf(id)
    // Money fields start in the unit their presets use (K for most, M for PnL).
    const scale = field.unit === 'usd' ? (fieldOf(draft.field).unit === 'usd' ? draft.scale : scaleFor(field.presets[0] ?? 1e3)) : 1
    update(draft.key, { field: id, scale })
  }

  const changeText = (draft: DraftRule, text: string) => {
    // Typing a full amount ("100k", "$2,500,000") into a money box is turned into number + unit.
    if (fieldOf(draft.field).unit === 'usd' && /[kmb$,]/i.test(text)) {
      const full = parseFilterValue(text)
      if (full !== null) {
        update(draft.key, splitUsd(full))
        return
      }
    }
    update(draft.key, { text })
  }

  const applyPreset = (draft: DraftRule, preset: number) =>
    update(draft.key, fieldOf(draft.field).unit === 'usd' ? splitUsd(preset) : { text: trim(preset) })

  return (
    <div className="space-y-4">
      {drafts.map((draft, index) => {
        const field = fieldOf(draft.field)
        const usd = field.unit === 'usd'
        const value = valueOf(draft)
        const bad = draft.text.trim() !== '' && value === null
        return (
          <div key={draft.key} className="border-b border-whalemo-line pb-4 last:border-b-0 last:pb-0">
            <div className="grid gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_minmax(0,15rem)_auto] sm:items-center">
              <span className="hidden text-xs font-semibold uppercase tracking-wider text-whalemo-muted sm:block">
                {index === 0 ? 'Where' : 'And'}
              </span>
              <FieldPicker value={draft.field} onChange={(id) => changeField(draft, id)} />
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
                <div className={cn('glass-input flex h-10 min-w-0 flex-1 items-center', bad && 'border-whalemo-red')}>
                  {usd ? <span className="pl-3 text-whalemo-muted">$</span> : null}
                  <input
                    value={draft.text}
                    onChange={(event) => changeText(draft, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && onSubmit) {
                        event.preventDefault()
                        onSubmit()
                      }
                    }}
                    placeholder={PLACEHOLDER[field.unit]}
                    inputMode="decimal"
                    aria-label={usd ? `Amount in ${SCALES.find((s) => s.value === draft.scale)?.word ?? 'thousands'}` : 'Value'}
                    aria-invalid={bad}
                    className="w-full min-w-0 bg-transparent px-2 outline-none placeholder:text-whalemo-muted/60"
                  />
                  {usd ? (
                    <div className="flex h-full shrink-0 border-l border-whalemo-line" role="group" aria-label="Unit">
                      {SCALES.map((scale) => (
                        <button
                          key={scale.label}
                          type="button"
                          onClick={() => update(draft.key, { scale: scale.value })}
                          aria-pressed={draft.scale === scale.value}
                          title={`${scale.word}s`}
                          className={cn(
                            'w-8 text-xs font-semibold transition-colors',
                            draft.scale === scale.value ? 'bg-whalemo-accent text-whalemo-on-accent' : 'text-whalemo-muted hover:text-white'
                          )}
                        >
                          {scale.label}
                        </button>
                      ))}
                    </div>
                  ) : UNIT_SUFFIX[field.unit] ? (
                    <span className="pr-3 text-whalemo-muted">{UNIT_SUFFIX[field.unit]}</span>
                  ) : null}
                </div>
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

            {/* The condition in words, with the full amount, and one-click common values. */}
            <div className="mt-2 flex flex-col gap-2 sm:ml-[3rem] sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-xs" aria-live="polite">
                {value !== null ? (
                  <span className="text-whalemo-muted">
                    {field.label} {draft.op === 'gte' ? 'at least' : 'at most'}{' '}
                    <span className="font-semibold text-whalemo-teal">{formatFullValue(value, field.unit)}</span>
                  </span>
                ) : bad ? (
                  <span className="text-whalemo-red">Enter a number{usd ? ', e.g. 100 with K selected for $100,000' : ''}.</span>
                ) : (
                  <span className="text-whalemo-muted">{field.hint}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {field.presets.map((preset) => {
                  const active = value === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyPreset(draft, preset)}
                      aria-pressed={active}
                      className={cn(
                        'border px-2 py-0.5 text-[11px] tabular-nums transition-colors',
                        active
                          ? 'border-whalemo-teal/60 bg-whalemo-teal/10 text-whalemo-teal'
                          : 'border-whalemo-line text-whalemo-muted hover:border-whalemo-teal/40 hover:text-white'
                      )}
                    >
                      {presetLabel(preset, field.unit)}
                    </button>
                  )
                })}
              </div>
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
    </div>
  )
}
