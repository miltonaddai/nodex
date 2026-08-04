import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { TimeframeFilter } from '@/components/dashboard/TimeframeFilter'
import { ChainSelector } from '@/components/dashboard/ChainSelector'
import { WalletTable } from '@/components/dashboard/WalletTable'
import {
  AdvancedFiltersButton,
  type NumericFilterField,
} from '@/components/dashboard/AdvancedFiltersButton'
import { LastUpdated } from '@/components/dashboard/TablePagination'
import { SubscriptionBanner } from '@/components/billing/SubscriptionBanner'
import { useWalletsPageInit } from '@/hooks/useWalletsPageInit'
import { useWalletsDashboard } from '@/stores/walletsStore'
import { useWatchlistStore } from '@/stores/watchlistStore'
import { truncateAddress } from '@/lib/utils'
import type { WalletRow, WalletTableFilters } from '@/lib/api'

const WALLET_FILTER_FIELDS = [
  { key: 'minBalance', label: 'Minimum balance', min: 0 },
  { key: 'maxBalance', label: 'Maximum balance', min: 0 },
  { key: 'minTotalProfit', label: 'Minimum total profit' },
  { key: 'maxTotalProfit', label: 'Maximum total profit' },
  { key: 'minWinRate', label: 'Minimum win rate (%)', min: 0, max: 100 },
  { key: 'maxWinRate', label: 'Maximum win rate (%)', min: 0, max: 100 },
  { key: 'minTrades', label: 'Minimum trades', min: 0, step: 1 },
  { key: 'maxTrades', label: 'Maximum trades', min: 0, step: 1 },
  { key: 'minTokensHeld', label: 'Minimum tokens held', min: 0, step: 1 },
  { key: 'maxTokensHeld', label: 'Maximum tokens held', min: 0, step: 1 },
  { key: 'minVolume', label: 'Minimum volume', min: 0 },
  { key: 'maxVolume', label: 'Maximum volume', min: 0 },
  { key: 'minQualifiedTokens', label: 'Minimum listed tokens', min: 0, step: 1 },
  { key: 'maxQualifiedTokens', label: 'Maximum listed tokens', min: 0, step: 1 },
  { key: 'minQualifiedWins', label: 'Minimum listed wins', min: 0, step: 1 },
  { key: 'maxQualifiedWins', label: 'Maximum listed wins', min: 0, step: 1 },
  { key: 'minQualifiedProfit', label: 'Minimum listed profit' },
  { key: 'maxQualifiedProfit', label: 'Maximum listed profit' },
  { key: 'activeWithinDays', label: 'Active within days', min: 0, step: 1 },
] satisfies readonly NumericFilterField<keyof WalletTableFilters>[]

export function WalletsPage() {
  useWalletsPageInit()
  const navigate = useNavigate()
  const [addingAddress, setAddingAddress] = useState<string | null>(null)
  const [watchlistActionError, setWatchlistActionError] = useState<string | null>(null)
  const watchlistWallets = useWatchlistStore((state) => state.wallets)

  const {
    wallets,
    loading,
    error,
    page,
    pageSize,
    total,
    lastUpdated,
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
  } = useWalletsDashboard()
  const watchedAddresses = useMemo(
    () => new Set(watchlistWallets.filter((wallet) => wallet.chain === chain).map((wallet) => wallet.address)),
    [watchlistWallets, chain]
  )

  useEffect(() => {
    const watchlist = useWatchlistStore.getState()
    if (watchlist.chain !== chain) watchlist.setChain(chain)
    else watchlist.fetchIfNeeded()
  }, [chain])

  async function addToWatchlist(wallet: WalletRow) {
    if (watchedAddresses.has(wallet.address) || addingAddress) return
    setAddingAddress(wallet.address)
    setWatchlistActionError(null)
    try {
      await useWatchlistStore
        .getState()
        .addWallet(wallet.address, `Wallet ${truncateAddress(wallet.address)}`, chain)
    } catch (error) {
      setWatchlistActionError(error instanceof Error ? error.message : 'Failed to add wallet')
    } finally {
      setAddingAddress(null)
    }
  }

  return (
    <PageLayout>
      <Navbar variant="dashboard" />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-28 pb-16 md:px-8">
        <SubscriptionBanner />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-8"
        >
          Top Profitable Wallets
        </motion.h1>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <TimeframeFilter value={period} onChange={setPeriod} />
            <AdvancedFiltersButton
              fields={WALLET_FILTER_FIELDS}
              filters={filters}
              onApply={setFilters}
            />
          </div>
          <ChainSelector value={chain} onChange={setChain} />
        </div>

        {error || watchlistActionError ? (
          <p className="mb-4 text-sm text-nodex-red">{error ?? watchlistActionError}</p>
        ) : null}

        <WalletTable
          wallets={wallets}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={setSort}
          onPageChange={setPage}
          watchedAddresses={watchedAddresses}
          addingAddress={addingAddress}
          onAddToWatchlist={(wallet) => void addToWatchlist(wallet)}
          onRowClick={(wallet) =>
            navigate(`/wallets/${wallet.address}?chain=${chain}&period=${period}`)
          }
        />
        <LastUpdated value={lastUpdated} />
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
