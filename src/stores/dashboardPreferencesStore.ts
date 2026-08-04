import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Chain } from '@/components/dashboard/ChainSelector'
import type { Period } from '@/components/dashboard/TimeframeFilter'

/** Shared dashboard UI preferences persisted across sessions. */
interface DashboardPreferencesState {
  preferredChain: Chain
  walletsPeriod: Period
  tokensPeriod: Period
  setPreferredChain: (chain: Chain) => void
  setWalletsPeriod: (period: Period) => void
  setTokensPeriod: (period: Period) => void
}

export const useDashboardPreferencesStore = create<DashboardPreferencesState>()(
  persist(
    (set) => ({
      preferredChain: 'solana',
      walletsPeriod: '7D',
      tokensPeriod: '7D',
      setPreferredChain: (preferredChain) => set({ preferredChain }),
      setWalletsPeriod: (walletsPeriod) => set({ walletsPeriod }),
      setTokensPeriod: (tokensPeriod) => set({ tokensPeriod }),
    }),
    { name: 'nodex-dashboard-prefs' }
  )
)
