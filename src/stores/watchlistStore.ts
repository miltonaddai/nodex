import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Chain } from '@/components/dashboard/ChainSelector'
import { api, type WatchlistWallet } from '@/lib/api'
import { isDashboardStale, createFetchGuard } from '@/stores/dashboard-types'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'

const fetchGuard = createFetchGuard()

interface WatchlistState {
  wallets: WatchlistWallet[]
  loading: boolean
  error: string | null
  chain: Chain
  lastFetchedAt: number | null
  fetchedChain: Chain | null
  fetchWatchlist: (force?: boolean) => Promise<void>
  fetchIfNeeded: () => void
  setChain: (chain: Chain) => void
  addWallet: (address: string, name: string, chain: string) => Promise<void>
  renameWallet: (id: string, name: string) => Promise<void>
  removeWallet: (id: string) => Promise<void>
  reset: () => void
}

const initialState = {
  wallets: [] as WatchlistWallet[],
  loading: false,
  error: null as string | null,
  chain: 'solana' as Chain,
  lastFetchedAt: null as number | null,
  fetchedChain: null as Chain | null,
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  ...initialState,

  fetchWatchlist: async (force = false) => {
    const state = get()
    if (!force && state.loading) return
    if (
      !force &&
      state.wallets.length > 0 &&
      state.fetchedChain === state.chain &&
      !isDashboardStale(state.lastFetchedAt)
    ) {
      return
    }

    const generation = fetchGuard.next()
    set({ loading: true, error: null })

    try {
      const { chain } = get()
      const wallets = await api.watchlist.list(chain)

      if (fetchGuard.isStale(generation)) return

      set({
        wallets,
        lastFetchedAt: Date.now(),
        fetchedChain: get().chain,
        loading: false,
        error: null,
      })
    } catch (err) {
      if (fetchGuard.isStale(generation)) return
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load watchlist',
      })
    }
  },

  fetchIfNeeded: () => {
    const { lastFetchedAt, fetchWatchlist } = get()
    // An empty persisted watchlist is a valid loaded state. Use the fetch timestamp so
    // revisiting the page does not repeatedly request the same empty list.
    if (lastFetchedAt === null || isDashboardStale(lastFetchedAt)) {
      void fetchWatchlist()
    }
  },

  setChain: (chain) => {
    useDashboardPreferencesStore.getState().setPreferredChain(chain)
    set({ chain, wallets: [], lastFetchedAt: null })
    void get().fetchWatchlist(true)
  },

  addWallet: async (address, name, chain) => {
    const wallet = await api.watchlist.add(address, name, chain)
    set((state) => ({
      wallets: [...state.wallets, wallet],
      lastFetchedAt: Date.now(),
    }))
    await get().fetchWatchlist(true)
  },

  renameWallet: async (id, name) => {
    const trimmedName = name.trim()
    if (!trimmedName) throw new Error('Wallet name is required')
    const updated = await api.watchlist.rename(id, trimmedName, get().chain)
    set((state) => ({
      wallets: state.wallets.map((wallet) =>
        wallet.id === id ? { ...wallet, name: updated.name } : wallet
      ),
      lastFetchedAt: Date.now(),
    }))
  },

  removeWallet: async (id) => {
    await api.watchlist.remove(id, get().chain)
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== id),
      lastFetchedAt: Date.now(),
    }))
  },

  reset: () => set(initialState),
}))

export function useWatchlistDashboard() {
  return useWatchlistStore(
    useShallow((s) => ({
      wallets: s.wallets,
      loading: s.loading,
      error: s.error,
      chain: s.chain,
      setChain: s.setChain,
      addWallet: s.addWallet,
      renameWallet: s.renameWallet,
      removeWallet: s.removeWallet,
    }))
  )
}
