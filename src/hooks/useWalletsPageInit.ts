import { useEffect } from 'react'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'
import { useWalletsStore } from '@/stores/walletsStore'

/** Hydrate wallets store from persisted prefs and load data on first mount. */
export function useWalletsPageInit() {
  useEffect(() => {
    const prefs = useDashboardPreferencesStore.getState()
    useWalletsStore.setState({
      period: prefs.walletsPeriod,
      chain: prefs.preferredChain,
    })
    useWalletsStore.getState().fetchIfNeeded()
  }, [])
}
