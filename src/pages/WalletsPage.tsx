import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, BellOff, Check, ChevronDown, ChevronRight, Plus, Zap } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Seo } from '@/components/Seo'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { SortableHeader, type SortOrder } from '@/components/dashboard/SortableHeader'
import { FilterSelect, type FilterOption } from '@/components/dashboard/FilterSelect'
import { FirstSeenCell, PeakMultipleCell } from '@/components/dashboard/SightingCells'
import { LastUpdated, TablePagination } from '@/components/dashboard/TablePagination'
import { TokenAvatar } from '@/components/dashboard/TokenAvatar'
import { TokenTableSkeleton } from '@/components/dashboard/TokenTableSkeleton'
import { useCatchUpRefetch } from '@/hooks/useCatchUpRefetch'
import { TokenWatchlistButton } from '@/components/dashboard/TokenWatchlistButton'
import { VIEWED_ROW, ViewedTokenIcon } from '@/components/dashboard/ViewedTokenIcon'
import { SubscriptionBanner } from '@/components/billing/SubscriptionBanner'
import { useChainTokenWatchlist } from '@/hooks/useSolanaTokenWatchlist'
import { ChainSelector, type Chain } from '@/components/dashboard/ChainSelector'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'
import { chainLabel, isChainId, walletUrl } from '@/lib/chains'
import { useViewedTokens } from '@/lib/viewed-tokens'
import { TokenLinks } from '@/components/dashboard/TokenLinks'
import { useWatchlistStore } from '@/stores/watchlistStore'
import { useEarlySignalStore } from '@/stores/earlySignalStore'
import { playChime } from '@/lib/chime'
import { ScrollHint } from '@/components/dashboard/ScrollHint'
import { CustomFilterBuilder } from '@/components/dashboard/CustomFilterBuilder'
import { FIELD_BY_ID, type FilterRule } from '@/lib/custom-filters'
import { useSavedFiltersStore } from '@/stores/savedFiltersStore'
import { useAlertsStore } from '@/stores/alertsStore'
import { api, type SmartMoneyBuy, type SmartMoneySortKey, type SmartMoneyWallet } from '@/lib/api'
import { cn, formatCurrency, MARKET_CAP_COLUMN, truncateAddress } from '@/lib/utils'

const PAGE_SIZE = 20

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

function WalletLink({ address, chain }: { address: string; chain: Chain }) {
  return (
    <a
      href={walletUrl(chain, address)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="font-mono text-xs underline-offset-4 hover:text-whalemo-teal hover:underline"
    >
      {truncateAddress(address)}
    </a>
  )
}

/** A FOMO trader: avatar, name and handle, with the wallet address underneath. */
function TraderCell({
  address,
  chain,
  handle,
  displayName,
  avatarUrl,
}: {
  address: string
  chain: Chain
  handle: string | null
  displayName: string | null
  avatarUrl: string | null
}) {
  const label = displayName || handle
  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full bg-white/10 object-cover" loading="lazy" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
          {(label ?? '?').charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        {label ? (
          <div className="truncate text-sm font-medium">
            {label}
            {handle ? <span className="ml-1.5 text-xs font-normal text-whalemo-muted">@{handle}</span> : null}
          </div>
        ) : null}
        <div className="text-whalemo-muted">
          <WalletLink address={address} chain={chain} />
        </div>
      </div>
    </div>
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
          ? 'border-whalemo-teal/30 text-whalemo-teal'
          : 'border-white/10 text-whalemo-muted hover:border-whalemo-teal/30 hover:text-whalemo-teal'
      )}
    >
      {watched ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
    </button>
  )
}

function useWalletWatchlist(chain: Chain) {
  const watchlistWallets = useWatchlistStore((state) => state.wallets)
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watched = useMemo(
    () => new Set(watchlistWallets.filter((w) => w.chain === chain).map((w) => w.address)),
    [watchlistWallets, chain]
  )

  useEffect(() => {
    const watchlist = useWatchlistStore.getState()
    if (watchlist.chain !== chain) watchlist.setChain(chain)
    else watchlist.fetchIfNeeded()
  }, [chain])

  const add = async (address: string, name?: string | null) => {
    if (watched.has(address) || adding) return
    setAdding(address)
    setError(null)
    try {
      // The trader's name when known, otherwise just the short address.
      await useWatchlistStore.getState().addWallet(address, name || truncateAddress(address), chain)
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
  chain,
  watchlist,
}: {
  token: SmartMoneyBuy
  chain: Chain
  watchlist: ReturnType<typeof useWalletWatchlist>
}) {
  return (
    <div className="overflow-x-auto px-4 pb-5 pt-1 md:px-6">
      <table className="w-full max-w-3xl text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-whalemo-muted">
            <th className="py-2 pr-4">Trader</th>
            <th className="py-2 pr-4">Rank</th>
            <th className="py-2 pr-4">30d PnL</th>
            <th className="py-2 pr-4">Net bought</th>
            <th className="py-2 pr-4">Last buy</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {token.wallets.map((wallet) => (
            <tr key={wallet.address} className="border-t border-white/[0.06]">
              <td className="py-2 pr-4">
                <TraderCell
                  address={wallet.address}
                  chain={chain}
                  handle={wallet.handle}
                  displayName={wallet.displayName}
                  avatarUrl={wallet.avatarUrl}
                />
              </td>
              <td className="py-2 pr-4 tabular-nums text-whalemo-muted">{wallet.rank ? `#${wallet.rank}` : '—'}</td>
              <td className="py-2 pr-4 tabular-nums text-whalemo-green">
                {wallet.realizedPnl30d ? formatCurrency(wallet.realizedPnl30d, true) : '—'}
              </td>
              <td className="py-2 pr-4 tabular-nums">{formatCurrency(wallet.netBuyUsd, true)}</td>
              <td className="py-2 pr-4 text-whalemo-muted">{timeAgo(wallet.lastBuyAt)}</td>
              <td className="py-2">
                <WatchButton
                  address={wallet.address}
                  watched={watchlist.watched.has(wallet.address)}
                  adding={watchlist.adding === wallet.address}
                  onAdd={(address) => void watchlist.add(address, wallet.displayName || (wallet.handle ? `@${wallet.handle}` : null))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const MAX_MARKET_CAP_OPTIONS: FilterOption<number | null>[] = [
  { value: null, label: 'Any' },
  { value: 50_000, label: '$50K' },
  { value: 100_000, label: '$100K' },
  { value: 250_000, label: '$250K' },
  { value: 500_000, label: '$500K' },
  { value: 1_000_000, label: '$1M' },
  { value: 5_000_000, label: '$5M' },
  { value: 10_000_000, label: '$10M' },
]

const MIN_TRADERS_OPTIONS: FilterOption<number | null>[] = [
  { value: null, label: 'Any' },
  { value: 2, label: '2+' },
  { value: 3, label: '3+' },
  { value: 5, label: '5+' },
  { value: 10, label: '10+' },
]

interface BuyFilters {
  /** The early-signal preset. Combines with the other filters. */
  earlyOnly: boolean
  maxMarketCap: number | null
  minWalletCount: number | null
  /** The user's own rules from the custom filter builder. */
  rules: FilterRule[]
}

const FILTERS_KEY = 'nodex_wallet_buy_filters_v1'
const NO_FILTERS: BuyFilters = { earlyOnly: false, maxMarketCap: null, minWalletCount: null, rules: [] }

/** The last filters used, remembered in this browser. */
function loadFilters(): BuyFilters {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? 'null') as Partial<BuyFilters> | null
    return {
      earlyOnly: saved?.earlyOnly === true,
      maxMarketCap: typeof saved?.maxMarketCap === 'number' ? saved.maxMarketCap : null,
      minWalletCount: typeof saved?.minWalletCount === 'number' ? saved.minWalletCount : null,
      rules: Array.isArray(saved?.rules) ? saved.rules.filter((rule) => FIELD_BY_ID.has(rule?.field)) : [],
    }
  } catch {
    return NO_FILTERS
  }
}

function saveFilters(filters: BuyFilters) {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
  } catch {
    // Storage unavailable. Filters still apply for this visit.
  }
}

function BuysTable({
  chain,
  watchlist,
  onMeta,
}: {
  chain: Chain
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
  const isViewed = useViewedTokens()
  const [filters, setFilters] = useState<BuyFilters>(loadFilters)
  const filtered =
    filters.earlyOnly || filters.maxMarketCap !== null || filters.minWalletCount !== null || filters.rules.length > 0
  const savedFilters = useSavedFiltersStore((state) => state.list)
  const saveFilter = useSavedFiltersStore((state) => state.save)
  const removeFilter = useSavedFiltersStore((state) => state.remove)
  const alerts = useAlertsStore((state) => state.list)
  const alertsLoaded = useAlertsStore((state) => state.loaded)
  useEffect(() => {
    void useSavedFiltersStore.getState().load()
  }, [])
  const [earlyCount, setEarlyCount] = useState(0)
  const alertsEnabled = useEarlySignalStore((s) => s.alertsEnabled)
  const setAlertsEnabled = useEarlySignalStore((s) => s.setAlertsEnabled)
  const [params, setParams] = useSearchParams()
  const requestId = useRef(0)
  // Background catch-up refetches (useCatchUpRefetch) bump the tick and skip the loading state
  const [stamp, setStamp] = useState<{ lastUpdated: string | null; nextUpdate: string | null }>({ lastUpdated: null, nextUpdate: null })
  const [refreshTick, setRefreshTick] = useState(0)
  const silentRef = useRef(false)
  useCatchUpRefetch(stamp.lastUpdated, stamp.nextUpdate, () => {
    silentRef.current = true
    setRefreshTick((n) => n + 1)
  })

  const updateFilters = (next: BuyFilters) => {
    setFilters(next)
    saveFilters(next)
    setPage(1)
  }

  // An alert's "View" link opens the page with ?alert=<id>, showing what that alert matched.
  useEffect(() => {
    const id = params.get('alert')
    if (!id) return
    if (!alertsLoaded) {
      void useAlertsStore.getState().load()
      return
    }
    const alert = alerts.find((item) => item.id === id)
    if (alert) {
      const next = { ...NO_FILTERS, rules: alert.rules }
      setFilters(next)
      saveFilters(next)
      setPage(1)
    }
    setParams(
      (current) => {
        current.delete('alert')
        return current
      },
      { replace: true }
    )
  }, [params, setParams, alerts, alertsLoaded])

  // An alert's "View" link opens the page with ?preset=early.
  useEffect(() => {
    if (params.get('preset') !== 'early') return
    const next = { ...loadFilters(), earlyOnly: true }
    setFilters(next)
    saveFilters(next)
    setPage(1)
    setParams(
      (current) => {
        current.delete('preset')
        return current
      },
      { replace: true }
    )
  }, [params, setParams])

  useEffect(() => {
    const id = ++requestId.current
    const silent = silentRef.current
    silentRef.current = false
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    api.smartMoney
      .buys({
        chain,
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortOrder,
        maxMarketCap: filters.maxMarketCap,
        minWalletCount: filters.minWalletCount,
        preset: filters.earlyOnly ? 'early' : undefined,
        rules: filters.rules.length ? JSON.stringify(filters.rules) : undefined,
      })
      .then((result) => {
        if (id !== requestId.current) return
        setItems(result.items ?? [])
        setTotal(result.total ?? 0)
        setMessage(result.message ?? null)
        setEarlyCount(result.earlySignalCount ?? 0)
        onMeta({
          tracked: result.trackedWallets ?? 0,
          windowHours: result.windowHours ?? 72,
          lastUpdated: result.lastUpdated ?? null,
          nextUpdate: result.nextUpdate ?? null,
        })
        setStamp({ lastUpdated: result.lastUpdated ?? null, nextUpdate: result.nextUpdate ?? null })
      })
      .catch((err: unknown) => {
        if (id === requestId.current && !silent) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
  }, [chain, page, sortBy, sortOrder, filters, onMeta, refreshTick])

  const onSort = (column: string) => {
    const key = column as SmartMoneySortKey
    if (key === sortBy) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    else {
      setSortBy(key)
      setSortOrder('desc')
    }
    setPage(1)
  }
  const header = (label: string, column: SmartMoneySortKey, className?: string) => (
    <SortableHeader
      label={label}
      column={column}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      className={className}
    />
  )
  const plain = (label: string) => (
    <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-widest text-whalemo-muted">{label}</th>
  )

  const filterBar = (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => updateFilters({ ...filters, earlyOnly: !filters.earlyOnly })}
        aria-pressed={filters.earlyOnly}
        title="Under $100K market cap, 2+ top traders buying, 24h volume at least 10x market cap, and traders have sold under 30% of what they bought."
        className={cn(
          'flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
          filters.earlyOnly
            ? 'border-transparent bg-whalemo-accent text-whalemo-on-accent'
            : 'border-whalemo-line bg-whalemo-surface text-white hover:border-whalemo-teal/40'
        )}
      >
        <Zap className={cn('h-4 w-4', !filters.earlyOnly && 'text-whalemo-amber')} />
        Early signals
        <span
          className={cn(
            'min-w-5 rounded-sm px-1.5 text-center text-xs font-bold tabular-nums',
            filters.earlyOnly
              ? 'bg-[#ffffff]/20'
              : earlyCount > 0
                ? 'bg-whalemo-amber/15 text-whalemo-amber'
                : 'bg-whalemo-raised text-whalemo-muted'
          )}
        >
          {earlyCount}
        </span>
      </button>
      <FilterSelect
        label="Max mkt cap"
        value={filters.maxMarketCap}
        options={MAX_MARKET_CAP_OPTIONS}
        onChange={(maxMarketCap) => updateFilters({ ...filters, maxMarketCap })}
      />
      <FilterSelect
        label="Min top traders"
        value={filters.minWalletCount}
        options={MIN_TRADERS_OPTIONS}
        onChange={(minWalletCount) => updateFilters({ ...filters, minWalletCount })}
      />
      <CustomFilterBuilder
        rules={filters.rules}
        onApply={(rules) => updateFilters({ ...filters, rules })}
        saved={savedFilters}
        onSave={(name, rules) => void saveFilter(name, rules)}
        onDelete={(id) => void removeFilter(id)}
      />
      {filtered ? (
        <>
          {/* Hidden while loading, so it never flashes "0 tokens match" before results arrive. */}
          {!loading ? (
            <span className="px-2 text-sm text-whalemo-muted">
              {total} {total === 1 ? 'token matches' : 'tokens match'}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => updateFilters(NO_FILTERS)}
            className="rounded-md px-3 py-1.5 text-sm text-whalemo-muted transition-colors hover:bg-whalemo-raised hover:text-white"
          >
            Clear
          </button>
        </>
      ) : null}
      <button
        type="button"
        onClick={() => {
          const next = !alertsEnabled
          setAlertsEnabled(next)
          // Turning alerts on plays the chime once, so you know what to listen for.
          if (next) playChime()
        }}
        aria-pressed={alertsEnabled}
        title={
          alertsEnabled
            ? 'A chime and a toast when a new early signal appears, on any WhaleMo page left open. Click to mute.'
            : 'Alerts are off. Click to get a chime when a new early signal appears.'
        }
        className={cn(
          'ml-auto flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors',
          alertsEnabled
            ? 'border-whalemo-teal/40 text-whalemo-teal hover:bg-whalemo-teal/10'
            : 'border-whalemo-line text-whalemo-muted hover:text-white'
        )}
      >
        {alertsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        {alertsEnabled ? 'Alerts on' : 'Alerts off'}
      </button>
      {filters.earlyOnly ? (
        <p className="w-full pt-1 text-xs text-whalemo-muted">
          Under $100K · 2+ top traders · 24h volume ≥ 10× market cap · traders sold under 30% of what they bought. In
          a one-week backtest, 9% of these went 5× or more, against 2% of all tokens bought under $100K. A small sample,
          so treat it as a lead.
        </p>
      ) : null}
    </div>
  )

  if (loading && items.length === 0) {
    return (
      <>
        {filterBar}
        <TokenTableSkeleton />
      </>
    )
  }

  const emptyMessage = filters.earlyOnly
    ? "No early signals right now. With alerts on, you'll hear a chime when one appears."
    : filtered
    ? 'No tokens match these filters. Try a higher market cap or fewer traders.'
    : (message ?? 'None of the tracked wallets are net buying a liquid token right now.')

  return (
    <>
      {filterBar}
      {error ? <p className="mb-4 text-sm text-whalemo-red">{error}</p> : null}
      <GlassPanel variant="frosted" className="overflow-hidden">
        {/* Phones: one card per token with the numbers that matter. The full table needs a wide screen. */}
        <div className={cn('divide-y divide-white/[0.06] transition-opacity lg:hidden', loading && 'opacity-60')}>
          {items.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-whalemo-muted">{emptyMessage}</p>
          ) : null}
          {items.map((token) => {
            const isOpen = expanded === token.contract
            const viewed = isViewed(chain, token.contract)
            return (
              <div key={token.contract} className={cn(isOpen && 'bg-white/[0.03]', viewed && VIEWED_ROW)}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : token.contract)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setExpanded(isOpen ? null : token.contract)
                    }
                  }}
                  className="cursor-pointer px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <TokenAvatar imageUrl={token.imageUrl} symbol={token.symbol} fallbackClassName="bg-blue-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{token.name || token.symbol}</span>
                        {token.earlySignal ? (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-sm bg-whalemo-amber/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-whalemo-amber">
                            <Zap className="h-2.5 w-2.5" />
                            Early
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <TokenLinks chain={chain} contract={token.contract} symbol={token.symbol} imageUrl={token.imageUrl}>
                            {token.symbol} · {truncateAddress(token.contract)}
                        </TokenLinks>
                        {viewed ? <ViewedTokenIcon /> : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold leading-6 tabular-nums text-whalemo-teal">{token.walletCount}</div>
                      <div className="text-[11px] text-whalemo-muted">{token.walletCount === 1 ? 'trader' : 'traders'}</div>
                    </div>
                    <TokenWatchlistButton token={token} chain={chain} />
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-whalemo-raised px-3 py-2.5 text-sm tabular-nums">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-whalemo-muted">Mkt cap</dt>
                      <dd className="font-medium">{formatCurrency(token.marketCap, true)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-whalemo-muted">24h</dt>
                      <dd className={cn('font-medium', token.priceChange24h >= 0 ? 'text-whalemo-green' : 'text-whalemo-red')}>
                        {token.priceChange24h >= 0 ? '+' : ''}
                        {token.priceChange24h.toFixed(1)}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-whalemo-muted">Net bought</dt>
                      <dd className="font-medium">{formatCurrency(token.netBuyUsd, true)}</dd>
                    </div>
                  </dl>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-whalemo-muted">
                    <span>
                      Latest buy {timeAgo(token.lastBuyAt)} · {formatCurrency(token.liquidity, true)} liquidity
                    </span>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>
                {isOpen ? <BuyersDetail token={token} chain={chain} watchlist={watchlist} /> : null}
              </div>
            )
          })}
        </div>
        <div className={cn('hidden overflow-x-auto transition-opacity lg:block', loading && 'opacity-60')}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="w-8 px-4 py-4" />
                {plain('Token')}
                {header('Top traders buying', 'walletCount')}
                {header('Net bought', 'netBuyUsd')}
                {header('Market cap', 'marketCap', MARKET_CAP_COLUMN)}
                {header('24h', 'priceChange24h')}
                {header('First seen', 'firstSeenAt')}
                {header('Peak since', 'peakMultiple')}
                {plain('Liquidity')}
                {header('Latest buy', 'lastBuyAt')}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-whalemo-muted">
                    {emptyMessage}
                  </td>
                </tr>
              ) : null}
              {items.map((token) => {
                const isOpen = expanded === token.contract
                const viewed = isViewed(chain, token.contract)
                return (
                  <Fragment key={token.contract}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : token.contract)}
                      className={cn(
                        'group cursor-pointer border-b border-white/[0.06] transition-colors duration-200 hover:bg-white/[0.04]',
                        isOpen && 'bg-white/[0.03]',
                        viewed && VIEWED_ROW
                      )}
                    >
                      <td className="px-4 py-4 text-whalemo-muted">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <TokenAvatar imageUrl={token.imageUrl} symbol={token.symbol} fallbackClassName="bg-blue-500" />
                          <div className="min-w-0 max-w-[7.5rem] sm:max-w-[12rem]">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium" title={token.name || token.symbol}>
                                {token.name || token.symbol}
                              </span>
                              {token.earlySignal ? (
                                <span
                                  title="Meets the early-signal preset"
                                  className="inline-flex shrink-0 items-center gap-0.5 rounded-sm bg-whalemo-amber/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-whalemo-amber"
                                >
                                  <Zap className="h-2.5 w-2.5" />
                                  Early
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1">
                              <TokenLinks chain={chain} contract={token.contract} symbol={token.symbol} imageUrl={token.imageUrl}>
                                  {token.symbol} · {truncateAddress(token.contract)}
                              </TokenLinks>
                              {viewed ? <ViewedTokenIcon /> : null}
                            </div>
                          </div>
                          <TokenWatchlistButton token={token} chain={chain} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-semibold tabular-nums text-whalemo-teal">{token.walletCount}</span>
                          <span className="text-xs text-whalemo-muted">{token.walletCount === 1 ? 'trader' : 'traders'}</span>
                        </div>
                        <div
                          className="text-[11px] text-whalemo-muted"
                          title="Combined FOMO 30-day PnL of the traders buying"
                        >
                          {formatCurrency(token.buyerRealizedPnl30d, true)} buyer 30d PnL · {token.buyCount} buys
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm tabular-nums">
                        <div className="font-medium">{formatCurrency(token.netBuyUsd, true)}</div>
                        {token.sellUsd > 0 ? (
                          <div className="text-[11px] text-whalemo-muted">
                            {formatCurrency(token.buyUsd, true)} in · {formatCurrency(token.sellUsd, true)} out
                          </div>
                        ) : null}
                      </td>
                      <td className={cn('px-4 py-4 text-sm tabular-nums', MARKET_CAP_COLUMN)}>
                        {formatCurrency(token.marketCap, true)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-4 text-sm tabular-nums',
                          token.priceChange24h >= 0 ? 'text-whalemo-green' : 'text-whalemo-red'
                        )}
                      >
                        {token.priceChange24h >= 0 ? '+' : ''}
                        {token.priceChange24h.toFixed(1)}%
                      </td>
                      <FirstSeenCell token={token} />
                      <PeakMultipleCell token={token} />
                      <td className="px-4 py-4 text-sm tabular-nums text-whalemo-muted">
                        {formatCurrency(token.liquidity, true)}
                      </td>
                      <td className="px-4 py-4 text-sm text-whalemo-muted">{timeAgo(token.lastBuyAt)}</td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                        <td colSpan={10}>
                          <BuyersDetail token={token} chain={chain} watchlist={watchlist} />
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

function TrackedWalletsTable({
  chain,
  watchlist,
}: {
  chain: Chain
  watchlist: ReturnType<typeof useWalletWatchlist>
}) {
  const [wallets, setWallets] = useState<SmartMoneyWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.smartMoney
      .wallets(chain)
      .then((result) => setWallets(result.items ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [chain])

  if (loading) return <TokenTableSkeleton />
  const th = 'px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-widest text-whalemo-muted'

  return (
    <>
      {error ? <p className="mb-4 text-sm text-whalemo-red">{error}</p> : null}
      <ScrollHint />
      <GlassPanel variant="frosted" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className={th}>#</th>
                <th className={th}>Trader</th>
                <th className={th}>30d PnL</th>
                <th className={th}>Volume</th>
                <th className={th}>Trades</th>
                <th className={th}>Followers</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-whalemo-muted">
                    No FOMO traders are tracked on this chain yet.
                  </td>
                </tr>
              ) : null}
              {wallets.map((wallet) => (
                <tr key={wallet.address} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="px-4 py-3 text-sm text-whalemo-muted">{wallet.rank}</td>
                  <td className="px-4 py-3">
                    <TraderCell
                      address={wallet.address}
                      chain={chain}
                      handle={wallet.handle}
                      displayName={wallet.displayName}
                      avatarUrl={wallet.avatarUrl}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-whalemo-green">
                    {wallet.pnl30d ? formatCurrency(wallet.pnl30d, true) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-whalemo-muted">
                    {formatCurrency(wallet.volume30d, true)}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-whalemo-muted">{wallet.trades30d.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-whalemo-muted">{wallet.followers.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <WatchButton
                      address={wallet.address}
                      watched={watchlist.watched.has(wallet.address)}
                      adding={watchlist.adding === wallet.address}
                      onAdd={(address) => void watchlist.add(address, wallet.displayName || (wallet.handle ? `@${wallet.handle}` : null))}
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
  const [chain, setChain] = useState<Chain>(() => useDashboardPreferencesStore.getState().preferredChain)
  // Alert links carry the chain of the signal they announce.
  const [urlParams, setUrlParams] = useSearchParams()
  useEffect(() => {
    const requested = urlParams.get('chain')
    if (!isChainId(requested)) return
    setChain(requested)
    setTab('buys')
    setUrlParams(
      (current) => {
        current.delete('chain')
        return current
      },
      { replace: true }
    )
  }, [urlParams, setUrlParams])
  const watchlist = useWalletWatchlist(chain)
  useChainTokenWatchlist(chain)

  const tabs: Array<{ value: Tab; label: string }> = [
    { value: 'buys', label: 'Tokens being bought' },
    { value: 'wallets', label: meta.tracked ? `Tracked wallets (${meta.tracked})` : 'Tracked wallets' },
  ]

  return (
    <PageLayout>
      <Seo title="Smart Wallets" noindex />
      <Navbar variant="dashboard" />
      <main className="mx-auto flex w-full max-w-dashboard flex-1 flex-col px-4 pt-28 pb-16 md:px-8">
        <SubscriptionBanner />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-3xl font-bold md:text-4xl"
        >
          What Top Traders Are Buying
        </motion.h1>
        <p className="mb-8 max-w-3xl text-sm text-whalemo-muted">
          Tokens the top {meta.tracked || ''} FOMO traders are net buying on {chainLabel(chain)} over the last{' '}
          {formatWindow(meta.windowHours)}. Traders come from FOMO's leaderboards, refreshed monthly. The more of
          them in a token, the higher it ranks, and ties go to the traders with the bigger 30-day PnL.
        </p>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex w-fit gap-1 rounded-md border border-white/10 bg-white/[0.03] p-1">
            {tabs.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTab(option.value)}
                className={cn(
                  'rounded-sm px-4 py-1.5 text-xs font-medium transition-colors',
                  tab === option.value ? 'bg-whalemo-teal/20 text-whalemo-teal' : 'text-whalemo-muted hover:text-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <ChainSelector value={chain} onChange={setChain} />
        </div>

        {watchlist.error ? <p className="mb-4 text-sm text-whalemo-red">{watchlist.error}</p> : null}

        {tab === 'buys' ? (
          // Keyed by chain so paging, sorting and expanded rows reset when the chain changes.
          <BuysTable key={chain} chain={chain} watchlist={watchlist} onMeta={setMeta} />
        ) : (
          <TrackedWalletsTable key={chain} chain={chain} watchlist={watchlist} />
        )}
        <LastUpdated value={meta.lastUpdated} nextUpdate={meta.nextUpdate} />
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
