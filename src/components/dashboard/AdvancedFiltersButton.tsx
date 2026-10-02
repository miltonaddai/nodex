import { useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface NumericFilterField<TKey extends string> {
  key: TKey
  label: string
  min?: number
  max?: number
  step?: number | 'any'
  placeholder?: string
}

interface AdvancedFiltersButtonProps<TFilters extends object> {
  fields: readonly NumericFilterField<Extract<keyof TFilters, string>>[]
  filters: TFilters
  onApply: (filters: TFilters) => void
}

export function AdvancedFiltersButton<TFilters extends object>({
  fields,
  filters,
  onApply,
}: AdvancedFiltersButtonProps<TFilters>) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    const values = filters as Record<string, number | undefined>
    setDraft(
      Object.fromEntries(
        fields.map(({ key }) => [key, values[key] === undefined ? '' : String(values[key])])
      )
    )
  }, [fields, filters])

  const activeCount = useMemo(
    () => Object.values(filters as Record<string, number | undefined>).filter((value) => value !== undefined).length,
    [filters]
  )

  const apply = () => {
    const next: Record<string, number | undefined> = {}
    for (const { key } of fields) {
      const raw = draft[key]?.trim()
      if (!raw) continue
      const value = Number(raw)
      if (Number.isFinite(value)) next[key] = value
    }
    onApply(next as TFilters)
    setOpen(false)
  }

  const clear = () => {
    setDraft(Object.fromEntries(fields.map(({ key }) => [key, ''])))
    onApply({} as TFilters)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="dark"
          size="sm"
          className="rounded-full normal-case tracking-normal"
          aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters'}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-nodex-accent px-1.5 text-[11px] font-bold text-nodex-on-accent">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="max-h-[min(70vh,620px)] w-[min(calc(100vw-2rem),36rem)] overflow-y-auto border-nodex-line bg-nodex-surface p-4 text-white"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            apply()
          }}
        >
          <div className="mb-4">
            <p className="text-sm font-semibold text-white">Advanced filters</p>
            <p className="mt-1 text-xs text-nodex-muted">Set any combination of column limits.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-nodex-muted">
                  {field.label}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={field.min}
                  max={field.max}
                  step={field.step ?? 'any'}
                  value={draft[field.key] ?? ''}
                  placeholder={field.placeholder ?? 'Any'}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  className="glass-input h-10 w-full rounded-lg px-3 text-sm text-white placeholder:text-nodex-muted/50"
                />
              </label>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Clear
            </Button>
            <Button type="submit" size="sm">
              Apply filters
            </Button>
          </div>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
