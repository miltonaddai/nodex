import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, SlidersHorizontal, X } from 'lucide-react'
import { RuleEditor, draftsFrom, readDrafts, type DraftRule } from '@/components/dashboard/RuleEditor'
import { describeRule, sameRules, type FilterRule, type SavedFilter } from '@/lib/custom-filters'
import { cn } from '@/lib/utils'

const chip = 'flex items-center gap-2 border px-4 py-2 text-sm transition-colors'

/**
 * The "Custom filter" button for the Smart Wallets filter bar, and the panel it opens: conditions
 * a token must all meet, which can be named and saved. Saved filters show as chips beside the
 * button, so they work like the built-in quick filters. This only shapes the table; alerts that
 * watch in the background are set up separately on the Alerts page.
 * Renders flex items for the bar; the panel takes a full row below it.
 */
export function CustomFilterBuilder({
  rules,
  onApply,
  saved,
  onSave,
  onDelete,
}: {
  rules: FilterRule[]
  onApply: (rules: FilterRule[]) => void
  saved: SavedFilter[]
  onSave: (name: string, rules: FilterRule[]) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState<DraftRule[]>([])
  const [name, setName] = useState('')
  const { rules: draftRules, invalid } = readDrafts(drafts)

  const openPanel = () => {
    setDrafts(draftsFrom(rules))
    setName('')
    setOpen(true)
  }

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
                'pr-8',
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

            <div className="px-4 py-4 sm:px-5">
              <RuleEditor drafts={drafts} onChange={setDrafts} onSubmit={() => !invalid && apply(draftRules)} />
            </div>

            <div className="flex flex-col gap-3 border-t border-whalemo-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!name.trim() || !draftRules.length || invalid) return
                  onSave(name.trim(), draftRules)
                  apply(draftRules)
                }}
                className="flex gap-2"
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
