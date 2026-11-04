import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const chains = [
  { id: 'solana', label: 'Solana', color: 'from-purple-500 to-cyan-400', enabled: true },
  { id: 'robinhood', label: 'Robinhood Chain', color: 'from-green-500 to-emerald-400', enabled: true },
  { id: 'bsc', label: 'BNB Chain', color: 'from-yellow-400 to-amber-500', enabled: true },
] as const

export type Chain = (typeof chains)[number]['id']
/** A chain, or every chain at once (the watchlist page). */
export type ChainFilter = Chain | 'all'

const allChains = { id: 'all', label: 'All chains', color: 'from-purple-500 via-emerald-400 to-amber-400', enabled: true } as const

interface ChainSelectorProps<T extends ChainFilter> {
  value: T
  onChange: (chain: T) => void
  /** Adds an "All chains" option. Only valid where `T` includes 'all'. */
  includeAll?: boolean
}

export function ChainSelector<T extends ChainFilter = Chain>({ value, onChange, includeAll = false }: ChainSelectorProps<T>) {
  const options = includeAll ? [allChains, ...chains] : chains
  const current = options.find((c) => c.id === value) ?? options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-md glass-panel text-sm font-medium transition-all duration-300 hover:border-whalemo-teal/30 outline-none">
        <span className={cn('w-5 h-5 rounded-full bg-gradient-to-br', current.color)} />
        {current.label}
        <ChevronDown className="w-4 h-4 text-whalemo-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-whalemo-surface border-white/10">
        {options.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            disabled={!chain.enabled}
            onClick={() => chain.enabled && onChange(chain.id as T)}
            className={cn(
              'flex items-center gap-2 cursor-pointer focus:bg-whalemo-teal/10 focus:text-whalemo-teal',
              !chain.enabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className={cn('w-4 h-4 rounded-full bg-gradient-to-br', chain.color)} />
            <span>{chain.label}</span>
            {!chain.enabled ? <span className="ml-auto text-[11px] uppercase text-whalemo-muted">Soon</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
