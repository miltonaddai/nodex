import { useWalletsStore } from '@/stores/walletsStore'
import { useTokensStore } from '@/stores/tokensStore'
import { useWatchlistStore } from '@/stores/watchlistStore'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'
import { useSavedFiltersStore } from '@/stores/savedFiltersStore'
import { useAlertsStore } from '@/stores/alertsStore'
import { useTelegramStore } from '@/stores/telegramStore'

export function resetDashboardStores() {
  useWalletsStore.getState().reset()
  useTokensStore.getState().reset()
  useWatchlistStore.getState().reset()
  useTokenWatchlistStore.getState().reset()
  useSavedFiltersStore.getState().reset()
  useAlertsStore.getState().reset()
  useTelegramStore.getState().reset()
}
