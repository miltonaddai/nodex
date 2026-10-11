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

interface ChainSelectorProps {
  value: Chain
  onChange: (chain: Chain) => void
}

export function ChainSelector({ value, onChange }: ChainSelectorProps) {
  const current = chains.find((c) => c.id === value) ?? chains[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-medium transition-all duration-300 hover:border-nodex-teal/30 outline-none">
        <span className={cn('w-5 h-5 rounded-full bg-gradient-to-br', current.color)} />
        {current.label}
        <ChevronDown className="w-4 h-4 text-nodex-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-nodex-surface border-white/10">
        {chains.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            disabled={!chain.enabled}
            onClick={() => chain.enabled && onChange(chain.id)}
            className={cn(
              'flex items-center gap-2 cursor-pointer focus:bg-nodex-teal/10 focus:text-nodex-teal',
              !chain.enabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className={cn('w-4 h-4 rounded-full bg-gradient-to-br', chain.color)} />
            <span>{chain.label}</span>
            {!chain.enabled ? <span className="ml-auto text-[11px] uppercase text-nodex-muted">Soon</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
