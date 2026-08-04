import { useEffect } from 'react'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'
import { useTokensStore } from '@/stores/tokensStore'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'

/** Hydrate tokens store from persisted prefs and load data on first mount. */
export function useTokensPageInit() {
  useEffect(() => {
    const prefs = useDashboardPreferencesStore.getState()
    useTokensStore.setState({
      period: prefs.tokensPeriod,
      chain: prefs.preferredChain,
    })
    useTokensStore.getState().fetchIfNeeded()
    // The row add controls need the tracked set loaded, otherwise every token renders as untracked
    // until the user visits the watchlist page.
    useTokenWatchlistStore.setState({ chain: prefs.preferredChain })
    useTokenWatchlistStore.getState().fetchIfNeeded()
  }, [])
}
