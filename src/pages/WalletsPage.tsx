import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { SortableHeader, type SortOrder } from '@/components/dashboard/SortableHeader'
import { LastUpdated, TablePagination } from '@/components/dashboard/TablePagination'
import { TokenAvatar } from '@/components/dashboard/TokenAvatar'
import { TokenTableSkeleton } from '@/components/dashboard/TokenTableSkeleton'
import { SubscriptionBanner } from '@/components/billing/SubscriptionBanner'
import { useWatchlistStore } from '@/stores/watchlistStore'
import { api, type SmartMoneyBuy, type SmartMoneySortKey, type SmartMoneyWallet } from '@/lib/api'
import { cn, formatCurrency, truncateAddress } from '@/lib/utils'

const PAGE_SIZE = 20
const CHAIN = 'solana'

type Tab = 'buys' | 'wallets'

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return '—'
  const minutes = Math.max(0, Math.floor((Date.now() - ms) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatWindow(hours: number): string {
  if (hours >= 48 && hours % 24 === 0) return `${hours / 24} days`
  return `${hours} hours`
}

function WalletLink({ address }: { address: string }) {
  return (
    <a
      href={`https://solscan.io/account/${encodeURIComponent(address)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="font-mono text-xs underline-offset-4 hover:text-nodex-teal hover:underline"
    >
      {truncateAddress(address)}
    </a>
  )
}

function WatchButton({
  address,
  watched,
  adding,
  onAdd,
}: {
  address: string
  watched: boolean
  adding: boolean
  onAdd: (address: string) => void
}) {
  return (
    <button
      type="button"
      disabled={watched || adding}
      onClick={(event) => {
        event.stopPropagation()
        onAdd(address)
      }}
      title={watched ? 'In your watchlist' : 'Add wallet to watchlist'}
      aria-label={watched ? 'In your watchlist' : 'Add wallet to watchlist'}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
        watched
          ? 'border-nodex-teal/30 text-nodex-teal'
          : 'border-white/10 text-nodex-muted hover:border-nodex-teal/30 hover:text-nodex-teal'
      )}
    >
      {watched ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
    </button>
  )
}

function useWalletWatchlist() {
  const watchlistWallets = useWatchlistStore((state) => state.wallets)
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watched = useMemo(
    () => new Set(watchlistWallets.filter((w) => w.chain === CHAIN).map((w) => w.address)),
    [watchlistWallets]
  )

  useEffect(() => {
    const watchlist = useWatchlistStore.getState()
    if (watchlist.chain !== CHAIN) watchlist.setChain(CHAIN)
    else watchlist.fetchIfNeeded()
  }, [])

  const add = async (address: string) => {
    if (watched.has(address) || adding) return
    setAdding(address)
    setError(null)
    try {
      await useWatchlistStore.getState().addWallet(address, `Top wallet ${truncateAddress(address)}`, CHAIN)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add wallet')
    } finally {
      setAdding(null)
    }
  }

  return { watched, adding, error, add }
}

function BuyersDetail({
  token,
  watchlist,
}: {
  token: SmartMoneyBuy
  watchlist: ReturnType<typeof useWalletWatchlist>
}) {
  return (
    <div className="px-6 pb-5 pt-1">
      <table className="w-full max-w-3xl text-sm">
        <thead>
          <tr className="text-left text-[10px] font-semibold uppercase tracking-widest text-nodex-muted">
            <th className="py-2 pr-4">Wallet</th>
            <th className="py-2 pr-4">30d rank</th>
            <th className="py-2 pr-4">30d realized profit</th>
            <th className="py-2 pr-4">Net bought</th>
            <th className="py-2 pr-4">Last buy</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {token.wallets.map((wallet) => (
            <tr key={wallet.address} className="border-t border-white/[0.06]">
              <td className="py-2 pr-4">
                <WalletLink address={wallet.address} />
              </td>
              <td className="py-2 pr-4 tabular-nums text-nodex-muted">{wallet.rank ? `#${wallet.rank}` : '—'}</td>
              <td className="py-2 pr-4 tabular-nums text-nodex-green">
                {wallet.realizedPnl30d !== null ? formatCurrency(wallet.realizedPnl30d, true) : '—'}
              </td>
              <td className="py-2 pr-4 tabular-nums">{formatCurrency(wallet.netBuyUsd, true)}</td>
              <td className="py-2 pr-4 text-nodex-muted">{timeAgo(wallet.lastBuyAt)}</td>
              <td className="py-2">
                <WatchButton
                  address={wallet.address}
                  watched={watchlist.watched.has(wallet.address)}
                  adding={watchlist.adding === wallet.address}
                  onAdd={(address) => void watchlist.add(address)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BuysTable({
  watchlist,
  onMeta,
}: {
  watchlist: ReturnType<typeof useWalletWatchlist>
  onMeta: (meta: { tracked: number; windowHours: number; lastUpdated: string | null; nextUpdate: string | null }) => void
}) {
  const [items, setItems] = useState<SmartMoneyBuy[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SmartMoneySortKey>('walletCount')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    api.smartMoney
      .buys({ chain: CHAIN, page, pageSize: PAGE_SIZE, sortBy, sortOrder })
      .then((result) => {
        if (id !== requestId.current) return
        setItems(result.items ?? [])
        setTotal(result.total ?? 0)
        setMessage(result.message ?? null)
        onMeta({
          tracked: result.trackedWallets ?? 0,
          windowHours: result.windowHours ?? 72,
          lastUpdated: result.lastUpdated ?? null,
          nextUpdate: result.nextUpdate ?? null,
        })
      })
      .catch((err: unknown) => {
        if (id === requestId.current) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
  }, [page, sortBy, sortOrder, onMeta])

  const onSort = (column: string) => {
    const key = column as SmartMoneySortKey
    if (key === sortBy) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    else {
      setSortBy(key)
      setSortOrder('desc')
    }
    setPage(1)
  }
  const header = (label: string, column: SmartMoneySortKey) => (
    <SortableHeader label={label} column={column} sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
  )
  const plain = (label: string) => (
    <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-nodex-muted">{label}</th>
  )

  if (loading && items.length === 0) return <TokenTableSkeleton />

  return (
    <>
      {error ? <p className="mb-4 text-sm text-nodex-red">{error}</p> : null}
      <GlassPanel variant="frosted" className="overflow-hidden">
        <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="w-8 px-4 py-4" />
                {plain('Token')}
                {header('Top wallets buying', 'walletCount')}
                {header('Net bought', 'netBuyUsd')}
                {header('Market cap', 'marketCap')}
                {header('24h', 'priceChange24h')}
                {plain('Liquidity')}
                {header('Latest buy', 'lastBuyAt')}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-nodex-muted">
                    {message ?? 'None of the tracked wallets are net buying a liquid token right now.'}
                  </td>
                </tr>
              ) : null}
              {items.map((token) => {
                const isOpen = expanded === token.contract
                return (
                  <Fragment key={token.contract}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : token.contract)}
                      className={cn(
                        'cursor-pointer border-b border-white/[0.06] transition-colors duration-200 hover:bg-white/[0.04]',
                        isOpen && 'bg-white/[0.03]'
                      )}
                    >
                      <td className="px-4 py-4 text-nodex-muted">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <TokenAvatar imageUrl={token.imageUrl} symbol={token.symbol} fallbackClassName="bg-blue-500" />
                          <div>
                            <div className="text-sm font-medium">{token.name || token.symbol}</div>
                            <a
                              href={`https://dexscreener.com/solana/${encodeURIComponent(token.contract)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="text-xs text-nodex-muted underline-offset-4 hover:text-nodex-teal hover:underline"
                            >
                              {token.symbol} · {truncateAddress(token.contract)}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-semibold tabular-nums text-nodex-teal">{token.walletCount}</span>
                          <span className="text-xs text-nodex-muted">{token.walletCount === 1 ? 'wallet' : 'wallets'}</span>
                        </div>
                        <div
                          className="text-[10px] text-nodex-muted"
                          title="Combined 30-day realized profit of the wallets buying"
                        >
                          {formatCurrency(token.buyerRealizedPnl30d, true)} buyer profit · {token.buyCount} buys
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm tabular-nums">
                        <div className="font-medium">{formatCurrency(token.netBuyUsd, true)}</div>
                        {token.sellUsd > 0 ? (
                          <div className="text-[10px] text-nodex-muted">
                            {formatCurrency(token.buyUsd, true)} in · {formatCurrency(token.sellUsd, true)} out
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-sm tabular-nums">{formatCurrency(token.marketCap, true)}</td>
                      <td
                        className={cn(
                          'px-4 py-4 text-sm tabular-nums',
                          token.priceChange24h >= 0 ? 'text-nodex-green' : 'text-nodex-red'
                        )}
                      >
                        {token.priceChange24h >= 0 ? '+' : ''}
                        {token.priceChange24h.toFixed(1)}%
                      </td>
                      <td className="px-4 py-4 text-sm tabular-nums text-nodex-muted">
                        {formatCurrency(token.liquidity, true)}
                      </td>
                      <td className="px-4 py-4 text-sm text-nodex-muted">{timeAgo(token.lastBuyAt)}</td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                        <td colSpan={8}>
                          <BuyersDetail token={token} watchlist={watchlist} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <TablePagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} disabled={loading} />
      </GlassPanel>
    </>
  )
}

function TrackedWalletsTable({ watchlist }: { watchlist: ReturnType<typeof useWalletWatchlist> }) {
  const [wallets, setWallets] = useState<SmartMoneyWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.smartMoney
      .wallets(CHAIN)
      .then((result) => setWallets(result.items ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <TokenTableSkeleton />
  const th = 'px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-nodex-muted'

  return (
    <>
      {error ? <p className="mb-4 text-sm text-nodex-red">{error}</p> : null}
      <GlassPanel variant="frosted" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className={th}>#</th>
                <th className={th}>Wallet</th>
                <th className={th}>30d realized profit</th>
                <th className={th}>30d total PnL</th>
                <th className={th}>30d volume</th>
                <th className={th}>30d trades</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-nodex-muted">
                    The wallet list is built on the next data update.
                  </td>
                </tr>
              ) : null}
              {wallets.map((wallet) => (
                <tr key={wallet.address} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="px-4 py-3 text-sm text-nodex-muted">{wallet.rank}</td>
                  <td className="px-4 py-3">
                    <WalletLink address={wallet.address} />
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-nodex-green">
                    {formatCurrency(wallet.realizedPnl30d, true)}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums">{formatCurrency(wallet.pnl30d, true)}</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-nodex-muted">
                    {formatCurrency(wallet.volume30d, true)}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-nodex-muted">{wallet.trades30d.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <WatchButton
                      address={wallet.address}
                      watched={watchlist.watched.has(wallet.address)}
                      adding={watchlist.adding === wallet.address}
                      onAdd={(address) => void watchlist.add(address)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </>
  )
}

export function WalletsPage() {
  const [tab, setTab] = useState<Tab>('buys')
  const [meta, setMeta] = useState<{
    tracked: number
    windowHours: number
    lastUpdated: string | null
    nextUpdate: string | null
  }>({ tracked: 0, windowHours: 72, lastUpdated: null, nextUpdate: null })
  const watchlist = useWalletWatchlist()

  const tabs: Array<{ value: Tab; label: string }> = [
    { value: 'buys', label: 'Tokens being bought' },
    { value: 'wallets', label: meta.tracked ? `Tracked wallets (${meta.tracked})` : 'Tracked wallets' },
  ]

  return (
    <PageLayout>
      <Navbar variant="dashboard" />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-28 pb-16 md:px-8">
        <SubscriptionBanner />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-3xl font-bold md:text-4xl"
        >
          What Top Wallets Are Buying
        </motion.h1>
        <p className="mb-8 max-w-3xl text-sm text-nodex-muted">
          Tokens the {meta.tracked || 'top'} most profitable Solana wallets of the last 30 days are net buying over the
          last {formatWindow(meta.windowHours)}. Only live wallets whose profit is real and already taken are
          followed. The more of them in a token, the higher it ranks, and ties go to the more profitable buyers.
        </p>

        <div className="mb-6 flex w-fit gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {tabs.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTab(option.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                tab === option.value ? 'bg-nodex-teal/20 text-nodex-teal' : 'text-nodex-muted hover:text-white'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {watchlist.error ? <p className="mb-4 text-sm text-nodex-red">{watchlist.error}</p> : null}

        {tab === 'buys' ? (
          <BuysTable watchlist={watchlist} onMeta={setMeta} />
        ) : (
          <TrackedWalletsTable watchlist={watchlist} />
        )}
        <LastUpdated value={meta.lastUpdated} nextUpdate={meta.nextUpdate} />
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
