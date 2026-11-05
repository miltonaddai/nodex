import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, Bookmark, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react'
import {
  describeRule,
  FIELD_BY_ID,
  FILTER_FIELDS,
  formatFilterValue,
  parseFilterValue,
  sameRules,
  type FilterRule,
  type FilterUnit,
  type SavedFilter,
} from '@/lib/custom-filters'
import { cn } from '@/lib/utils'

const MAX_RULES = 8

interface DraftRule {
  key: number
  field: string
  op: 'gte' | 'lte'
  text: string
}

const UNIT_PREFIX: Partial<Record<FilterUnit, string>> = { usd: '$' }
const UNIT_SUFFIX: Partial<Record<FilterUnit, string>> = { pct: '%', multiple: '×', hours: 'h' }
const PLACEHOLDER: Record<FilterUnit, string> = { usd: '100k', count: '3', pct: '30', multiple: '2', hours: '24' }

let nextKey = 1
const toDraft = (rule: FilterRule): DraftRule => ({
  key: nextKey++,
  field: rule.field,
  op: rule.op,
  text: formatFilterValue(rule.value, FIELD_BY_ID.get(rule.field)?.unit ?? 'count'),
})
const emptyDraft = (): DraftRule => ({ key: nextKey++, field: 'walletCount', op: 'gte', text: '' })

const chip =
  'flex items-center gap-2 border px-4 py-2 text-sm transition-colors'

/**
 * The "Custom filter" button for the Smart Wallets filter bar, and the panel it opens: rules of
 * "field at least / at most value" that a token must all meet, which can be named and saved.
 * Saved filters show as chips beside the button, so they work like the built-in quick filters.
 * Renders flex items for the bar; the panel takes a full row below it.
 */
export function CustomFilterBuilder({
  rules,
  onApply,
  saved,
  onSave,
  onDelete,
  onToggleAlert,
}: {
  rules: FilterRule[]
  onApply: (rules: FilterRule[]) => void
  saved: SavedFilter[]
  onSave: (name: string, rules: FilterRule[], alert: boolean) => void
  onDelete: (id: string) => void
  onToggleAlert: (filter: SavedFilter) => void
}) {
  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState<DraftRule[]>([])
  const [name, setName] = useState('')
  const [alertOnSave, setAlertOnSave] = useState(false)

  const openPanel = () => {
    setDrafts(rules.length ? rules.map(toDraft) : [emptyDraft()])
    setName('')
    setAlertOnSave(false)
    setOpen(true)
  }

  const parsed = drafts.map((draft) => ({ draft, value: parseFilterValue(draft.text) }))
  const invalid = parsed.some(({ draft, value }) => draft.text.trim() !== '' && value === null)
  // Rows left blank are ignored rather than blocking the rest.
  const draftRules: FilterRule[] = parsed
    .filter(({ value }) => value !== null)
    .map(({ draft, value }) => ({ field: draft.field, op: draft.op, value: value as number }))

  const update = (key: number, patch: Partial<DraftRule>) =>
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)))

  const apply = (next: FilterRule[]) => {
    onApply(next)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-expanded={open}
        className={cn(
          chip,
          rules.length || open
            ? 'border-whalemo-teal/50 bg-whalemo-teal/10 text-whalemo-teal'
            : 'border-whalemo-line bg-whalemo-surface text-white hover:border-whalemo-teal/40'
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Custom filter
        {rules.length ? (
          <span className="min-w-5 bg-whalemo-accent px-1.5 text-center text-xs font-bold text-whalemo-on-accent">
            {rules.length}
          </span>
        ) : null}
      </button>

      {saved.map((filter) => {
        const active = rules.length > 0 && sameRules(filter.rules, rules)
        return (
          <span key={filter.id} className="group relative flex">
            <button
              type="button"
              onClick={() => onApply(active ? [] : filter.rules)}
              aria-pressed={active}
              title={filter.rules.map(describeRule).join(' · ')}
              className={cn(
                chip,
                'pr-14',
                active
                  ? 'border-transparent bg-whalemo-accent text-whalemo-on-accent'
                  : 'border-whalemo-line bg-whalemo-surface text-white hover:border-whalemo-teal/40'
              )}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {filter.name}
            </button>
            <button
              type="button"
              onClick={() => onToggleAlert(filter)}
              aria-pressed={Boolean(filter.alert)}
              aria-label={filter.alert ? `Turn off alerts for ${filter.name}` : `Alert me when new tokens match ${filter.name}`}
              title={filter.alert ? 'Alert on: you hear a chime when new tokens match' : 'Alert me when new tokens match'}
              className={cn(
                'absolute top-1/2 right-7 -translate-y-1/2 p-0.5 transition-opacity hover:opacity-100',
                active ? 'text-whalemo-on-accent' : filter.alert ? 'text-whalemo-teal' : 'text-whalemo-muted opacity-60'
              )}
            >
              {filter.alert ? <Bell className="h-3.5 w-3.5 fill-current" /> : <BellOff className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onDelete(filter.id)}
              aria-label={`Delete saved filter ${filter.name}`}
              title="Delete saved filter"
              className={cn(
                'absolute top-1/2 right-2 -translate-y-1/2 p-0.5 opacity-60 transition-opacity hover:opacity-100',
                active ? 'text-whalemo-on-accent' : 'text-whalemo-muted'
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )
      })}

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="order-last basis-full border border-whalemo-line bg-whalemo-surface"
          >
            <div className="flex items-start justify-between gap-4 border-b border-whalemo-line px-4 py-3 sm:px-5">
              <div>
                <div className="text-sm font-semibold">Custom filter</div>
                <div className="text-xs text-whalemo-muted">Show tokens that match all of these conditions.</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close custom filter" className="p-1 text-whalemo-muted hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4 sm:px-5">
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
                      <label
                        className={cn(
                          'glass-input flex h-10 min-w-0 flex-1 items-center gap-1 px-3 text-sm',
                          bad && 'border-whalemo-red'
                        )}
                      >
                        {UNIT_PREFIX[field.unit] ? <span className="text-whalemo-muted">{UNIT_PREFIX[field.unit]}</span> : null}
                        <input
                          value={draft.text}
                          onChange={(event) => update(draft.key, { text: event.target.value })}
                          onKeyDown={(event) => event.key === 'Enter' && !invalid && apply(draftRules)}
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
                        onClick={() => setDrafts((current) => current.filter((item) => item.key !== draft.key))}
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
                  onClick={() => setDrafts((current) => [...current, emptyDraft()])}
                  className="flex items-center gap-1.5 text-sm font-medium text-whalemo-teal hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Add condition
                </button>
              ) : null}
              {invalid ? <p className="text-xs text-whalemo-red">Enter numbers, e.g. 3, 30, 100k or 1.5m.</p> : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-whalemo-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!name.trim() || !draftRules.length || invalid) return
                  onSave(name.trim(), draftRules, alertOnSave)
                  apply(draftRules)
                }}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name this filter to save it"
                  maxLength={32}
                  className="glass-input h-10 min-w-0 flex-1 px-3 text-sm sm:w-56"
                />
                <button
                  type="submit"
                  disabled={!name.trim() || !draftRules.length || invalid}
                  className="flex h-10 items-center gap-1.5 border border-whalemo-line px-3 text-sm font-medium transition-colors hover:border-whalemo-teal/50 disabled:opacity-40"
                >
                  <Bookmark className="h-4 w-4" />
                  Save
                </button>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-whalemo-muted select-none">
                  <input
                    type="checkbox"
                    checked={alertOnSave}
                    onChange={(event) => setAlertOnSave(event.target.checked)}
                    className="h-4 w-4 accent-[var(--color-whalemo-accent)]"
                  />
                  <Bell className="h-3.5 w-3.5" />
                  Alert me on new matches
                </label>
              </form>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => apply([])}
                  className="h-10 flex-1 border border-whalemo-line px-4 text-sm text-whalemo-muted transition-colors hover:text-white sm:flex-none"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => apply(draftRules)}
                  disabled={invalid}
                  className="h-10 flex-1 bg-whalemo-accent px-5 text-sm font-semibold text-whalemo-on-accent transition-all hover:brightness-110 disabled:opacity-50 sm:flex-none"
                >
                  Apply filter
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
