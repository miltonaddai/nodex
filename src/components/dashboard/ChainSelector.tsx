import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/** Logos live in public/chains. Solana's mark has no background, so it sits on a black disc. */
const chains = [
  { id: 'solana', label: 'Solana', logo: '/chains/solana.png', backdrop: 'bg-[#0b0b0b] p-[3px]', enabled: true },
  { id: 'robinhood', label: 'Robinhood Chain', logo: '/chains/robinhood.svg', backdrop: '', enabled: true },
  { id: 'bsc', label: 'BNB Chain', logo: '/chains/bsc.png', backdrop: '', enabled: true },
] as const

export type Chain = (typeof chains)[number]['id']
/** A chain, or every chain at once (the watchlist page). */
export type ChainFilter = Chain | 'all'

const allChains = { id: 'all', label: 'All chains', enabled: true } as const

type Option = (typeof chains)[number] | typeof allChains

export function ChainLogo({ chain, className }: { chain: Option; className?: string }) {
  if (chain.id === 'all') {
    // The three chain logos, overlapping.
    return (
      <span className="flex -space-x-1.5">
        {chains.map((item) => (
          <ChainLogo key={item.id} chain={item} className={cn('ring-2 ring-whalemo-surface', className)} />
        ))}
      </span>
    )
  }
  return (
    <img
      src={chain.logo}
      alt=""
      width={20}
      height={20}
      className={cn('shrink-0 rounded-full object-contain ring-1 ring-whalemo-line', chain.backdrop, className)}
    />
  )
}

interface ChainSelectorProps<T extends ChainFilter> {
  value: T
  onChange: (chain: T) => void
  /** Adds an "All chains" option. Only valid where `T` includes 'all'. */
  includeAll?: boolean
}

export function ChainSelector<T extends ChainFilter = Chain>({ value, onChange, includeAll = false }: ChainSelectorProps<T>) {
  const options: readonly Option[] = includeAll ? [allChains, ...chains] : chains
  const current = options.find((c) => c.id === value) ?? options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-md glass-panel text-sm font-medium transition-all duration-300 hover:border-whalemo-teal/30 outline-none">
        <ChainLogo chain={current} className="h-5 w-5" />
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
            <ChainLogo chain={chain} className="h-5 w-5" />
            <span>{chain.label}</span>
            {!chain.enabled ? <span className="ml-auto text-[11px] uppercase text-whalemo-muted">Soon</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
