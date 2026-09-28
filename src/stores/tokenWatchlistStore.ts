import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Chain } from '@/components/dashboard/ChainSelector'
import { api, type WatchlistToken } from '@/lib/api'
import { isDashboardStale, createFetchGuard } from '@/stores/dashboard-types'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'

const fetchGuard = createFetchGuard()

interface TokenWatchlistState {
  tokens: WatchlistToken[]
  loading: boolean
  error: string | null
  chain: Chain
  lastFetchedAt: number | null
  fetchedChain: Chain | null
  fetchTokens: (force?: boolean) => Promise<void>
  fetchIfNeeded: () => void
  setChain: (chain: Chain) => void
  addToken: (token: { contract: string; name: string; symbol: string; chain: string }) => Promise<void>
  removeToken: (id: string) => Promise<void>
  isTracked: (contract: string) => boolean
  reset: () => void
}

const initialState = {
  tokens: [] as WatchlistToken[],
  loading: false,
  error: null as string | null,
  chain: 'solana' as Chain,
  lastFetchedAt: null as number | null,
  fetchedChain: null as Chain | null,
}

export const useTokenWatchlistStore = create<TokenWatchlistState>((set, get) => ({
  ...initialState,

  fetchTokens: async (force = false) => {
    const state = get()
    if (!force && state.loading) return
    if (
      !force &&
      state.tokens.length > 0 &&
      state.fetchedChain === state.chain &&
      !isDashboardStale(state.lastFetchedAt)
    ) {
      return
    }

    const generation = fetchGuard.next()
    set({ loading: true, error: null })

    try {
      const { chain } = get()
      const tokens = await api.watchlist.tokens.list(chain)

      if (fetchGuard.isStale(generation)) return

      set({
        tokens,
        lastFetchedAt: Date.now(),
        fetchedChain: get().chain,
        loading: false,
        error: null,
      })
    } catch (err) {
      if (fetchGuard.isStale(generation)) return
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load token watchlist',
      })
    }
  },

  fetchIfNeeded: () => {
    const { lastFetchedAt, fetchedChain, chain, fetchTokens } = get()
    // Unlike the wallet list an empty token watchlist is a legitimate resting state, so only
    // refetch when it has actually gone stale or belongs to another chain — otherwise every
    // visit re-hits the API.
    if (lastFetchedAt === null || fetchedChain !== chain || isDashboardStale(lastFetchedAt)) {
      void fetchTokens()
    }
  },

  setChain: (chain) => {
    useDashboardPreferencesStore.getState().setPreferredChain(chain)
    set({ chain, tokens: [], lastFetchedAt: null })
    void get().fetchTokens(true)
  },

  addToken: async (input) => {
    const token = await api.watchlist.tokens.add(input)
    set((state) => ({
      // The backend upserts, so adding a token that is already tracked returns the existing
      // row — replace it in place rather than appending a duplicate.
      tokens: state.tokens.some((t) => t.id === token.id)
        ? state.tokens.map((t) => (t.id === token.id ? token : t))
        : [...state.tokens, token],
      lastFetchedAt: Date.now(),
    }))
  },

  removeToken: async (id) => {
    await api.watchlist.tokens.remove(id, get().chain)
    set((state) => ({
      tokens: state.tokens.filter((token) => token.id !== id),
      lastFetchedAt: Date.now(),
    }))
  },

  isTracked: (contract) => get().tokens.some((token) => token.contract === contract),

  reset: () => set(initialState),
}))

export function useTokenWatchlistDashboard() {
  return useTokenWatchlistStore(
    useShallow((s) => ({
      tokens: s.tokens,
      loading: s.loading,
      error: s.error,
      chain: s.chain,
      setChain: s.setChain,
      addToken: s.addToken,
      removeToken: s.removeToken,
    }))
  )
}
