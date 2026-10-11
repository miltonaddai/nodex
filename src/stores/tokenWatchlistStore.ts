import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { ChainFilter } from '@/components/dashboard/ChainSelector'
import { api, type WatchlistToken } from '@/lib/api'
import { isDashboardStale, createFetchGuard } from '@/stores/dashboard-types'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'

const fetchGuard = createFetchGuard()

interface TokenWatchlistState {
  tokens: WatchlistToken[]
  loading: boolean
  error: string | null
  chain: ChainFilter
  lastFetchedAt: number | null
  fetchedChain: ChainFilter | null
  fetchTokens: (force?: boolean) => Promise<void>
  fetchIfNeeded: () => void
  setChain: (chain: ChainFilter) => void
  addToken: (token: { contract: string; name: string; symbol: string; chain: string }) => Promise<void>
  removeToken: (id: string) => Promise<void>
  isTracked: (contract: string) => boolean
  reset: () => void
}

const initialState = {
  tokens: [] as WatchlistToken[],
  loading: false,
  error: null as string | null,
  chain: 'solana' as ChainFilter,
  lastFetchedAt: null as number | null,
  fetchedChain: null as ChainFilter | null,
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
    // 'all' is the watchlist page's own filter; the page saves it separately.
    if (chain !== 'all') useDashboardPreferencesStore.getState().setPreferredChain(chain)
    set({ chain, tokens: [], lastFetchedAt: null })
    void get().fetchTokens(true)
  },

  addToken: async (input) => {
    if (get().tokens.some((t) => t.contract === input.contract)) return
    // Show the token as tracked straight away, then swap in the saved row (or roll back).
    const pendingId = `pending:${input.contract}`
    set((state) => ({ tokens: [...state.tokens, { ...input, id: pendingId } as WatchlistToken] }))
    try {
      const token = await api.watchlist.tokens.add(input)
      set((state) => ({
        // The backend upserts, so adding a token that is already tracked returns the existing
        // row — replace it in place rather than appending a duplicate.
        tokens: state.tokens
          .filter((t) => t.id !== pendingId)
          .filter((t) => t.id !== token.id)
          .concat(token),
        // The add response carries no metrics, so the watchlist page refetches them.
        lastFetchedAt: null,
      }))
    } catch (err) {
      set((state) => ({ tokens: state.tokens.filter((t) => t.id !== pendingId) }))
      throw err
    }
  },

  removeToken: async (id) => {
    if (id.startsWith('pending:')) return // Still saving; it has no server id yet.
    const token = get().tokens.find((t) => t.id === id)
    await api.watchlist.tokens.remove(id, token?.chain ?? get().chain)
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
