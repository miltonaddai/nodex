import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Trash2, X } from 'lucide-react'
import { type WatchlistToken } from '@/lib/api'
import { cn, formatCurrency, truncateAddress } from '@/lib/utils'

const AVATAR_COLORS = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
]

interface TokenCardProps {
  token: WatchlistToken
  index: number
  onRemove: (id: string) => Promise<void>
}

export function TokenCard({ token, index, onRemove }: TokenCardProps) {
  const [error, setError] = useState<string | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [removing, setRemoving] = useState(false)

  // The token is still on the watchlist, we just have no analytics to show for it. Tokens age
  // out of the recent-token window the tokens table ranks on, so this is expected over time.
  const noData = token.analyticsUnavailable === true

  const removeToken = async () => {
    setRemoving(true)
    setError(null)
    try {
      await onRemove(token.id)
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Failed to remove token')
      setRemoving(false)
      setConfirmingRemove(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white',
              AVATAR_COLORS[index % AVATAR_COLORS.length]
            )}
          >
            {token.symbol[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{token.symbol}</div>
            <div className="truncate text-xs text-nodex-muted">
              {token.name} · {truncateAddress(token.contract)}
            </div>
            {error ? <div className="mt-1 text-[10px] text-nodex-red">{error}</div> : null}
          </div>
        </div>
        {confirmingRemove ? (
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-[10px] uppercase tracking-widest text-nodex-muted">Remove?</span>
            <button
              type="button"
              disabled={removing}
              onClick={() => void removeToken()}
              aria-label={`Confirm removing ${token.symbol}`}
              className="rounded p-1 text-nodex-red hover:bg-white/10 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={removing}
              onClick={() => setConfirmingRemove(false)}
              aria-label="Cancel removing token"
              className="rounded p-1 text-nodex-muted hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setError(null)
                setConfirmingRemove(true)
              }}
              aria-label={`Remove ${token.symbol} from watchlist`}
              className="rounded p-1 text-nodex-muted opacity-0 transition-opacity hover:bg-white/10 hover:text-nodex-red focus:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <div className="text-[10px] tracking-widest uppercase text-nodex-muted mb-1">Price</div>
          <div className={cn('text-lg font-bold', noData && 'text-nodex-muted')}>
            {noData ? '—' : `$${token.price.toFixed(token.price < 0.01 ? 5 : 2)}`}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-widest uppercase text-nodex-muted mb-1">
            24H Change
          </div>
          <div
            className={cn(
              'text-lg font-bold',
              noData
                ? 'text-nodex-muted'
                : token.changePct >= 0
                  ? 'text-nodex-green'
                  : 'text-nodex-red'
            )}
          >
            {noData ? '—' : `${token.changePct >= 0 ? '+' : ''}${token.changePct.toFixed(1)}%`}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-widest uppercase text-nodex-muted mb-1">Mkt Cap</div>
          <div className={cn('text-lg font-bold', noData && 'text-nodex-muted')}>
            {noData ? '—' : formatCurrency(token.marketCap, true)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-nodex-muted">
        <span>
          {noData
            ? 'No analytics data yet'
            : token.ageDays !== undefined
              ? `${token.ageDays}d old · churn ${token.churn.toFixed(2)}`
              : `Churn ${token.churn.toFixed(2)}`}
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5">
          <span
            className={cn('w-1.5 h-1.5 rounded-full', noData ? 'bg-nodex-muted' : 'bg-nodex-green')}
          />
          {token.chain === 'solana' ? 'Solana' : 'Robinhood Chain'}
        </span>
      </div>
    </motion.div>
  )
}
