import { motion } from 'framer-motion'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { TimeframeFilter } from '@/components/dashboard/TimeframeFilter'
import { ChainSelector } from '@/components/dashboard/ChainSelector'
import { TokenTable } from '@/components/dashboard/TokenTable'
import {
  AdvancedFiltersButton,
  type NumericFilterField,
} from '@/components/dashboard/AdvancedFiltersButton'
import { LastUpdated } from '@/components/dashboard/TablePagination'
import { SubscriptionBanner } from '@/components/billing/SubscriptionBanner'
import { useTokensPageInit } from '@/hooks/useTokensPageInit'
import { useTokensDashboard, useTokensStore } from '@/stores/tokensStore'
import { useCatchUpRefetch } from '@/hooks/useCatchUpRefetch'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'
import type { TokenTableFilters } from '@/lib/api'

const TOKEN_FILTER_FIELDS = [
  { key: 'minChurn', label: 'Minimum trader churn', min: 0 },
  { key: 'maxChurn', label: 'Maximum trader churn', min: 0 },
  { key: 'minPrice', label: 'Minimum price', min: 0 },
  { key: 'maxPrice', label: 'Maximum price', min: 0 },
  { key: 'minMarketCap', label: 'Minimum market cap', min: 0 },
  { key: 'maxMarketCap', label: 'Maximum market cap', min: 0 },
  { key: 'minChangePct', label: 'Minimum change (%)' },
  { key: 'maxChangePct', label: 'Maximum change (%)' },
  { key: 'minVolume', label: 'Minimum volume', min: 0 },
  { key: 'maxVolume', label: 'Maximum volume', min: 0 },
  { key: 'minLiquidity', label: 'Minimum liquidity', min: 0 },
  { key: 'maxLiquidity', label: 'Maximum liquidity', min: 0 },
  { key: 'minAgeDays', label: 'Minimum age (days)', min: 0, step: 1 },
  { key: 'maxAgeDays', label: 'Maximum age (days)', min: 0, step: 1 },
  { key: 'minHolders', label: 'Minimum holders', min: 0, step: 1 },
  { key: 'maxHolders', label: 'Maximum holders', min: 0, step: 1 },
] satisfies readonly NumericFilterField<keyof TokenTableFilters>[]

export function TokensPage() {
  useTokensPageInit()

  const {
    tokens,
    loading,
    error,
    page,
    pageSize,
    total,
    lastUpdated,
    nextUpdate,
    changeColumnLabel,
    period,
    chain,
    sortBy,
    sortOrder,
    filters,
    setPeriod,
    setChain,
    setPage,
    setSort,
    setFilters,
  } = useTokensDashboard()
  // The API may answer with a snapshot from before the latest worker run; pick up the new one quietly
  useCatchUpRefetch(lastUpdated, nextUpdate, () => void useTokensStore.getState().fetchTokens(true, true))

  // Keep the tracked-token set on the same chain as the table, so each row's add control
  // reflects reality after a chain switch.
  const handleChainChange = (next: typeof chain) => {
    setChain(next)
    useTokenWatchlistStore.getState().setChain(next)
  }

  return (
    <PageLayout>
      <Navbar variant="dashboard" />
      <main className="mx-auto flex w-full max-w-dashboard flex-1 flex-col px-4 pt-28 pb-16 md:px-8">
        <SubscriptionBanner />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-8"
        >
          Top Tokens by Market Cap
        </motion.h1>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <TimeframeFilter value={period} onChange={setPeriod} />
            <AdvancedFiltersButton
              fields={TOKEN_FILTER_FIELDS}
              filters={filters}
              onApply={setFilters}
            />
          </div>
          <ChainSelector value={chain} onChange={handleChainChange} />
        </div>

        {error ? <p className="mb-4 text-sm text-nodex-red">{error}</p> : null}

        <TokenTable
          tokens={tokens}
          chain={chain}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          sortBy={sortBy}
          sortOrder={sortOrder}
          changeColumnLabel={changeColumnLabel}
          onSort={setSort}
          onPageChange={setPage}
        />
        <LastUpdated value={lastUpdated} nextUpdate={nextUpdate} />
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
