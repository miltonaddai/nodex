import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortOrder = 'asc' | 'desc'

interface SortableHeaderProps {
  label: string
  column: string
  sortBy: string
  sortOrder: SortOrder
  onSort: (column: string) => void
  className?: string
}

export function SortableHeader({ label, column, sortBy, sortOrder, onSort, className }: SortableHeaderProps) {
  const active = sortBy === column

  return (
    <th className={cn('px-4 py-4 text-left', className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase transition-colors',
          active ? 'text-nodex-teal' : 'text-nodex-muted hover:text-white'
        )}
      >
        {label}
        {active ? (
          sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : null}
      </button>
    </th>
  )
}
