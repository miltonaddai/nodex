import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { ChainFilter } from '@/components/dashboard/ChainSelector'
import { api, type WatchlistWallet } from '@/lib/api'
import { isDashboardStale, createFetchGuard } from '@/stores/dashboard-types'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'

const fetchGuard = createFetchGuard()

interface WatchlistState {
  wallets: WatchlistWallet[]
  loading: boolean
  error: string | null
  chain: ChainFilter
  lastFetchedAt: number | null
  fetchedChain: ChainFilter | null
  fetchWatchlist: (force?: boolean) => Promise<void>
  fetchIfNeeded: () => void
  setChain: (chain: ChainFilter) => void
  addWallet: (address: string, name: string, chain: string) => Promise<void>
  renameWallet: (id: string, name: string) => Promise<void>
  removeWallet: (id: string) => Promise<void>
  reset: () => void
}

const initialState = {
  wallets: [] as WatchlistWallet[],
  loading: false,
  error: null as string | null,
  chain: 'solana' as ChainFilter,
  lastFetchedAt: null as number | null,
  fetchedChain: null as ChainFilter | null,
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
    const { lastFetchedAt, fetchedChain, chain, fetchWatchlist } = get()
    // An empty persisted watchlist is a valid loaded state. Use the fetch timestamp so
    // revisiting the page does not repeatedly request the same empty list.
    if (lastFetchedAt === null || fetchedChain !== chain || isDashboardStale(lastFetchedAt)) {
      void fetchWatchlist()
    }
  },

  setChain: (chain) => {
    // 'all' is the watchlist page's own filter; the page saves it separately.
    if (chain !== 'all') useDashboardPreferencesStore.getState().setPreferredChain(chain)
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
    const wallet = get().wallets.find((w) => w.id === id)
    const updated = await api.watchlist.rename(id, trimmedName, wallet?.chain ?? get().chain)
    set((state) => ({
      wallets: state.wallets.map((wallet) =>
        wallet.id === id ? { ...wallet, name: updated.name } : wallet
      ),
      lastFetchedAt: Date.now(),
    }))
  },

  removeWallet: async (id) => {
    const wallet = get().wallets.find((w) => w.id === id)
    await api.watchlist.remove(id, wallet?.chain ?? get().chain)
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
