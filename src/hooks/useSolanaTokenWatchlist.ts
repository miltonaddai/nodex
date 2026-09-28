import { useEffect } from 'react'
import type { Chain } from '@/components/dashboard/ChainSelector'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'

/**
 * Loads the token watchlist for one chain, so add buttons on pages with their own chain choice
 * (insiders, smart money) know which tokens are already tracked.
 */
export function useChainTokenWatchlist(chain: Chain) {
  useEffect(() => {
    useTokenWatchlistStore.setState({ chain })
    useTokenWatchlistStore.getState().fetchIfNeeded()
  }, [chain])
}

export function useSolanaTokenWatchlist() {
  useChainTokenWatchlist('solana')
}
