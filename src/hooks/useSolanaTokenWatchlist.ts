import { useEffect } from 'react'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'

/**
 * Loads the Solana token watchlist, so add buttons on Solana-only pages (insiders, smart money)
 * know which tokens are already tracked.
 */
export function useSolanaTokenWatchlist() {
  useEffect(() => {
    useTokenWatchlistStore.setState({ chain: 'solana' })
    useTokenWatchlistStore.getState().fetchIfNeeded()
  }, [])
}
