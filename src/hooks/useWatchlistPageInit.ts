import { useEffect } from 'react'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'
import { useWatchlistStore } from '@/stores/watchlistStore'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'

/** Point both watchlist stores at the page's saved chain filter and load data on first mount. */
export function useWatchlistPageInit() {
  useEffect(() => {
    const { watchlistChain } = useDashboardPreferencesStore.getState()
    // Other pages point the token store at their own chain. Drop a list loaded for another
    // chain so it is not shown under this filter while the right one loads.
    const wallets = useWatchlistStore.getState()
    useWatchlistStore.setState(
      wallets.fetchedChain === watchlistChain ? { chain: watchlistChain } : { chain: watchlistChain, wallets: [] }
    )
    useWatchlistStore.getState().fetchIfNeeded()
    const tokens = useTokenWatchlistStore.getState()
    useTokenWatchlistStore.setState(
      tokens.fetchedChain === watchlistChain ? { chain: watchlistChain } : { chain: watchlistChain, tokens: [] }
    )
    useTokenWatchlistStore.getState().fetchIfNeeded()
  }, [])
}
