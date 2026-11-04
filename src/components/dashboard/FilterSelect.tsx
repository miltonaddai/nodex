import { Check, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface FilterOption<T> {
  value: T
  label: string
}

/** A pill dropdown for one table filter. The first option is the "no filter" choice. */
export function FilterSelect<T extends string | number | null>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: FilterOption<T>[]
  onChange: (value: T) => void
}) {
  const current = options.find((option) => option.value === value) ?? options[0]
  const active = current.value !== options[0].value

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 rounded-md border px-4 py-2 text-sm outline-none transition-colors',
          active
            ? 'border-whalemo-teal/50 bg-whalemo-teal/10 text-whalemo-teal'
            : 'border-whalemo-line bg-whalemo-surface text-white hover:border-whalemo-teal/40'
        )}
      >
        <span className={cn(!active && 'text-whalemo-muted')}>{label}</span>
        <span className="font-semibold">{current.label}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[10rem] border-whalemo-line bg-whalemo-surface">
        {options.map((option) => (
          <DropdownMenuItem
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            className="flex cursor-pointer items-center justify-between gap-6 focus:bg-whalemo-teal/10 focus:text-whalemo-teal"
          >
            {option.label}
            {option.value === current.value ? <Check className="h-3.5 w-3.5 text-whalemo-teal" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
