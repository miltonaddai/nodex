import { useState } from 'react'
import { Check, LoaderCircle, Plus } from 'lucide-react'
import { type TokenRow } from '@/lib/api'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'
import { cn } from '@/lib/utils'

/**
 * Add-to-watchlist control shown beside a token when its table row is hovered. The row needs
 * the `group` class for the hover reveal.
 *
 * Reads the token watchlist store directly rather than taking props, so the tokens table stays
 * presentational and does not have to thread watchlist state through every row.
 */
export function TokenWatchlistButton({
  token,
  chain,
}: {
  token: Pick<TokenRow, 'contract' | 'name' | 'symbol'>
  chain: string
}) {
  const tracked = useTokenWatchlistStore((s) => s.tokens.find((t) => t.contract === token.contract))
  const addToken = useTokenWatchlistStore((s) => s.addToken)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addToWatchlist = async () => {
    if (tracked) return
    setBusy(true)
    setError(null)
    try {
      // The API requires both labels. Tokens seen only in swap data can be missing one.
      const fallback = token.contract.slice(0, 6)
      await addToken({
        contract: token.contract,
        name: token.name || token.symbol || fallback,
        symbol: token.symbol || token.name || fallback,
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
      onClick={(event) => {
        // Rows on some pages expand on click, which should not happen when adding.
        event.stopPropagation()
        void addToWatchlist()
      }}
      title={error ?? (tracked ? 'Already in watchlist' : 'Add to watchlist')}
      aria-label={tracked ? `${token.symbol} is in your watchlist` : `Add ${token.symbol} to watchlist`}
      className={cn(
        'ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 transition-all',
        error
          ? 'text-whalemo-red opacity-100'
          : tracked
            ? 'text-whalemo-teal opacity-100'
            : 'text-whalemo-muted opacity-0 hover:border-whalemo-teal/40 hover:text-whalemo-teal group-hover:opacity-100 focus:opacity-100',
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
