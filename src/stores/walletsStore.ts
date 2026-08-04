import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { WalletSortKey } from '@/components/dashboard/WalletTable'
import type { SortOrder } from '@/components/dashboard/SortableHeader'
import type { Chain } from '@/components/dashboard/ChainSelector'
import type { Period } from '@/components/dashboard/TimeframeFilter'
import { api, type WalletRow, type WalletTableFilters } from '@/lib/api'
import {
  DASHBOARD_PAGE_SIZE,
  createFetchGuard,
  isDashboardStale,
} from '@/stores/dashboard-types'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'

const fetchGuard = createFetchGuard()

function buildQueryKey(state: Pick<WalletsState, 'chain' | 'period' | 'page' | 'sortBy' | 'sortOrder' | 'filters'>) {
  return `${state.chain}|${state.period}|${state.page}|${state.sortBy}|${state.sortOrder}|${JSON.stringify(state.filters)}`
}

interface WalletsState {
  wallets: WalletRow[]
  loading: boolean
  error: string | null
  page: number
  pageSize: number
  total: number
  lastUpdated: string | null
  lastFetchedAt: number | null
  period: Period
  chain: Chain
  sortBy: WalletSortKey
  sortOrder: SortOrder
  filters: WalletTableFilters
  fetchedQueryKey: string | null
  fetchWallets: (force?: boolean) => Promise<void>
  fetchIfNeeded: () => void
  setPeriod: (period: Period) => void
  setChain: (chain: Chain) => void
  setPage: (page: number) => void
  setSort: (column: WalletSortKey) => void
  setFilters: (filters: WalletTableFilters) => void
  reset: () => void
}

const initialState = {
  wallets: [] as WalletRow[],
  loading: false,
  error: null as string | null,
  page: 1,
  pageSize: DASHBOARD_PAGE_SIZE,
  total: 0,
  lastUpdated: null as string | null,
  lastFetchedAt: null as number | null,
  period: '7D' as Period,
  chain: 'solana' as Chain,
  sortBy: 'qualifiedTokens' as WalletSortKey,
  sortOrder: 'desc' as SortOrder,
  filters: {} as WalletTableFilters,
  fetchedQueryKey: null as string | null,
}

export const useWalletsStore = create<WalletsState>((set, get) => ({
  ...initialState,

  fetchWallets: async (force = false) => {
    const state = get()
    const queryKey = buildQueryKey(state)
    if (!force && state.loading) return
    if (
      !force &&
      state.wallets.length > 0 &&
      state.fetchedQueryKey === queryKey &&
      !isDashboardStale(state.lastFetchedAt)
    ) {
      return
    }

    const generation = fetchGuard.next()
    set({ loading: true, error: null })

    try {
      const { chain, period, page, pageSize, sortBy, sortOrder, filters } = get()
      const result = await api.wallets.top({ chain, period, page, pageSize, sortBy, sortOrder, ...filters })

      if (fetchGuard.isStale(generation)) return

      set({
        wallets: result.items ?? [],
        total: result.total ?? result.items?.length ?? 0,
        lastUpdated: result.lastUpdated ?? null,
        lastFetchedAt: Date.now(),
        fetchedQueryKey: buildQueryKey(get()),
        loading: false,
        error: null,
      })
    } catch (err) {
      if (fetchGuard.isStale(generation)) return
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load wallets',
      })
    }
  },

  fetchIfNeeded: () => {
    const { lastFetchedAt, wallets, fetchWallets } = get()
    if (wallets.length === 0 || isDashboardStale(lastFetchedAt)) {
      void fetchWallets()
    }
  },

  setPeriod: (period) => {
    useDashboardPreferencesStore.getState().setWalletsPeriod(period)
    set({ period, page: 1 })
    void get().fetchWallets(true)
  },

  setChain: (chain) => {
    useDashboardPreferencesStore.getState().setPreferredChain(chain)
    set({ chain, page: 1 })
    void get().fetchWallets(true)
  },

  setPage: (page) => {
    set({ page })
    void get().fetchWallets(true)
  },

  setSort: (column) => {
    const { sortBy, sortOrder } = get()
    if (sortBy === column) {
      set({ sortOrder: sortOrder === 'desc' ? 'asc' : 'desc', page: 1 })
    } else {
      set({ sortBy: column, sortOrder: 'desc', page: 1 })
    }
    void get().fetchWallets(true)
  },

  setFilters: (filters) => {
    set({ filters, page: 1 })
    void get().fetchWallets(true)
  },

  reset: () => set(initialState),
}))

export function useWalletsDashboard() {
  return useWalletsStore(
    useShallow((s) => ({
      wallets: s.wallets,
      loading: s.loading,
      error: s.error,
      page: s.page,
      pageSize: s.pageSize,
      total: s.total,
      lastUpdated: s.lastUpdated,
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
