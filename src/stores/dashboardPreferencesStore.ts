import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Chain, ChainFilter } from '@/components/dashboard/ChainSelector'
import type { Period } from '@/components/dashboard/TimeframeFilter'

/** Shared dashboard UI preferences persisted across sessions. */
interface DashboardPreferencesState {
  preferredChain: Chain
  /** The watchlist page's own chain filter, which can be every chain at once. */
  watchlistChain: ChainFilter
  walletsPeriod: Period
  tokensPeriod: Period
  setPreferredChain: (chain: Chain) => void
  setWatchlistChain: (chain: ChainFilter) => void
  setWalletsPeriod: (period: Period) => void
  setTokensPeriod: (period: Period) => void
}

export const useDashboardPreferencesStore = create<DashboardPreferencesState>()(
  persist(
    (set) => ({
      preferredChain: 'solana',
      watchlistChain: 'all',
      walletsPeriod: '7D',
      tokensPeriod: '7D',
      setPreferredChain: (preferredChain) => set({ preferredChain }),
      setWatchlistChain: (watchlistChain) => set({ watchlistChain }),
      setWalletsPeriod: (walletsPeriod) => set({ walletsPeriod }),
      setTokensPeriod: (tokensPeriod) => set({ tokensPeriod }),
    }),
    { name: 'nodex-dashboard-prefs' }
  )
)
