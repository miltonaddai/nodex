import { useEffect } from 'react'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'
import { useWatchlistStore } from '@/stores/watchlistStore'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'

/** Hydrate both watchlist stores from persisted prefs and load data on first mount. */
export function useWatchlistPageInit() {
  useEffect(() => {
    const prefs = useDashboardPreferencesStore.getState()
    useWatchlistStore.setState({ chain: prefs.preferredChain })
    useWatchlistStore.getState().fetchIfNeeded()
    useTokenWatchlistStore.setState({ chain: prefs.preferredChain })
    useTokenWatchlistStore.getState().fetchIfNeeded()
  }, [])
}
