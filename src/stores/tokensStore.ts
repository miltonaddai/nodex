import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { TokenSortKey } from '@/components/dashboard/TokenTable'
import type { SortOrder } from '@/components/dashboard/SortableHeader'
import type { Chain } from '@/components/dashboard/ChainSelector'
import type { Period } from '@/components/dashboard/TimeframeFilter'
import { api, type TokenRow, type TokenTableFilters } from '@/lib/api'
import {
  DASHBOARD_PAGE_SIZE,
  createFetchGuard,
  isDashboardStale,
} from '@/stores/dashboard-types'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'

const fetchGuard = createFetchGuard()

function buildQueryKey(state: Pick<TokensState, 'chain' | 'period' | 'page' | 'sortBy' | 'sortOrder' | 'filters'>) {
  return `${state.chain}|${state.period}|${state.page}|${state.sortBy}|${state.sortOrder}|${JSON.stringify(state.filters)}`
}

interface TokensState {
  tokens: TokenRow[]
  loading: boolean
  error: string | null
  page: number
  pageSize: number
  total: number
  lastUpdated: string | null
  nextUpdate: string | null
  changeColumnLabel: string
  lastFetchedAt: number | null
  period: Period
  chain: Chain
  sortBy: TokenSortKey
  sortOrder: SortOrder
  filters: TokenTableFilters
  fetchedQueryKey: string | null
  fetchTokens: (force?: boolean) => Promise<void>
  fetchIfNeeded: () => void
  setPeriod: (period: Period) => void
  setChain: (chain: Chain) => void
  setPage: (page: number) => void
  setSort: (column: TokenSortKey) => void
  setFilters: (filters: TokenTableFilters) => void
  reset: () => void
}

const initialState = {
  tokens: [] as TokenRow[],
  loading: false,
  error: null as string | null,
  page: 1,
  pageSize: DASHBOARD_PAGE_SIZE,
  total: 0,
  lastUpdated: null as string | null,
  nextUpdate: null as string | null,
  changeColumnLabel: '7D Change',
  lastFetchedAt: null as number | null,
  period: '7D' as Period,
  chain: 'solana' as Chain,
  sortBy: 'churn' as TokenSortKey,
  sortOrder: 'desc' as SortOrder,
  filters: {} as TokenTableFilters,
  fetchedQueryKey: null as string | null,
}

export const useTokensStore = create<TokensState>((set, get) => ({
  ...initialState,

  fetchTokens: async (force = false) => {
    const state = get()
    const queryKey = buildQueryKey(state)
    if (!force && state.loading) return
    if (
      !force &&
      state.tokens.length > 0 &&
      state.fetchedQueryKey === queryKey &&
      !isDashboardStale(state.lastFetchedAt)
    ) {
      return
    }

    const generation = fetchGuard.next()
    set({ loading: true, error: null })

    try {
      const { chain, period, page, pageSize, sortBy, sortOrder, filters } = get()
      const result = await api.tokens.top({ chain, period, page, pageSize, sortBy, sortOrder, ...filters })

      if (fetchGuard.isStale(generation)) return

      set({
        tokens: result.items ?? [],
        total: result.total ?? result.items?.length ?? 0,
        lastUpdated: result.lastUpdated ?? null,
        nextUpdate: result.nextUpdate ?? null,
        changeColumnLabel: result.changeColumnLabel ?? get().changeColumnLabel,
        lastFetchedAt: Date.now(),
        fetchedQueryKey: buildQueryKey(get()),
        loading: false,
        error: null,
      })
    } catch (err) {
      if (fetchGuard.isStale(generation)) return
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load tokens',
      })
    }
  },

  fetchIfNeeded: () => {
    const { lastFetchedAt, tokens, fetchTokens } = get()
    if (tokens.length === 0 || isDashboardStale(lastFetchedAt)) {
      void fetchTokens()
    }
  },

  setPeriod: (period) => {
    useDashboardPreferencesStore.getState().setTokensPeriod(period)
    set({ period, page: 1 })
    void get().fetchTokens(true)
  },

  setChain: (chain) => {
    useDashboardPreferencesStore.getState().setPreferredChain(chain)
    set({ chain, page: 1 })
    void get().fetchTokens(true)
  },

  setPage: (page) => {
    set({ page })
    void get().fetchTokens(true)
  },

  setSort: (column) => {
    const { sortBy, sortOrder } = get()
    if (sortBy === column) {
      set({ sortOrder: sortOrder === 'desc' ? 'asc' : 'desc', page: 1 })
    } else {
      set({ sortBy: column, sortOrder: 'desc', page: 1 })
    }
    void get().fetchTokens(true)
  },

  setFilters: (filters) => {
    set({ filters, page: 1 })
    void get().fetchTokens(true)
  },

  reset: () => set(initialState),
}))

export function useTokensDashboard() {
  return useTokensStore(
    useShallow((s) => ({
      tokens: s.tokens,
      loading: s.loading,
      error: s.error,
      page: s.page,
      pageSize: s.pageSize,
      total: s.total,
      lastUpdated: s.lastUpdated,
      nextUpdate: s.nextUpdate,
      changeColumnLabel: s.changeColumnLabel,
      period: s.period,
      chain: s.chain,
      sortBy: s.sortBy,
      sortOrder: s.sortOrder,
      filters: s.filters,
      setPeriod: s.setPeriod,
      setChain: s.setChain,
      setPage: s.setPage,
      setSort: s.setSort,
      setFilters: s.setFilters,
    }))
  )
}
