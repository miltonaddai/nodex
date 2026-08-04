import type { SortOrder } from '@/components/dashboard/SortableHeader'
import type { Chain } from '@/components/dashboard/ChainSelector'
import type { Period } from '@/components/dashboard/TimeframeFilter'

/** Match backend Redis cache TTL — refetch after this unless forced. */
export const DASHBOARD_STALE_MS = 5 * 60 * 1000

export const DASHBOARD_PAGE_SIZE = 10

export interface DashboardQueryState {
  chain: Chain
  period: Period
  page: number
  pageSize: number
  sortOrder: SortOrder
}

export function isDashboardStale(lastFetchedAt: number | null): boolean {
  if (!lastFetchedAt) return true
  return Date.now() - lastFetchedAt > DASHBOARD_STALE_MS
}

let fetchGeneration = 0

/** Returns a generation token; callers abort when it no longer matches. */
export function nextFetchGeneration(): number {
  fetchGeneration += 1
  return fetchGeneration
}

export function isFetchStale(generation: number): boolean {
  return generation !== fetchGeneration
}

export function createFetchGuard() {
  let generation = 0
  return {
    next: () => {
      generation += 1
      return generation
    },
    isStale: (token: number) => token !== generation,
  }
}
