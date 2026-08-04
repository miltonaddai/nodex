import { useWalletsStore } from '@/stores/walletsStore'
import { useTokensStore } from '@/stores/tokensStore'
import { useWatchlistStore } from '@/stores/watchlistStore'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'

export function resetDashboardStores() {
  useWalletsStore.getState().reset()
  useTokensStore.getState().reset()
  useWatchlistStore.getState().reset()
  useTokenWatchlistStore.getState().reset()
}
