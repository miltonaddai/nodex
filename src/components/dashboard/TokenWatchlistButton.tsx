import { useState } from 'react'
import { Check, LoaderCircle, Plus } from 'lucide-react'
import { type TokenRow } from '@/lib/api'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'
import { cn } from '@/lib/utils'

/**
 * Add-to-watchlist control shown beside a token when its table row is hovered.
 *
 * Reads the token watchlist store directly rather than taking props, so the tokens table stays
 * presentational and does not have to thread watchlist state through every row.
 */
export function TokenWatchlistButton({ token, chain }: { token: TokenRow; chain: string }) {
  const tracked = useTokenWatchlistStore((s) => s.tokens.find((t) => t.contract === token.contract))
  const addToken = useTokenWatchlistStore((s) => s.addToken)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addToWatchlist = async () => {
    if (tracked) return
    setBusy(true)
    setError(null)
    try {
      await addToken({
        contract: token.contract,
        name: token.name,
        symbol: token.symbol,
        chain,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update watchlist')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={busy || Boolean(tracked)}
      onClick={() => void addToWatchlist()}
      title={error ?? (tracked ? 'Already in watchlist' : 'Add to watchlist')}
      aria-label={tracked ? `${token.symbol} is in your watchlist` : `Add ${token.symbol} to watchlist`}
      className={cn(
        'ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all',
        error
          ? 'text-nodex-red opacity-100'
          : tracked
            ? 'text-nodex-teal opacity-100'
            : 'text-nodex-muted opacity-0 hover:border-nodex-teal/40 hover:text-nodex-teal group-hover:opacity-100 focus:opacity-100',
        busy && 'opacity-100'
      )}
    >
      {busy ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : tracked ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Plus className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
