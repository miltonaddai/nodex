import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { SortableHeader, type SortOrder } from '@/components/dashboard/SortableHeader'
import { FirstSeenCell, PeakMultipleCell } from '@/components/dashboard/SightingCells'
import { LastUpdated, TablePagination } from '@/components/dashboard/TablePagination'
import { TokenAvatar } from '@/components/dashboard/TokenAvatar'
import { TokenTableSkeleton } from '@/components/dashboard/TokenTableSkeleton'
import { TokenWatchlistButton } from '@/components/dashboard/TokenWatchlistButton'
import { VIEWED_ROW, ViewedTokenIcon } from '@/components/dashboard/ViewedTokenIcon'
import { SubscriptionBanner } from '@/components/billing/SubscriptionBanner'
import { useSolanaTokenWatchlist } from '@/hooks/useSolanaTokenWatchlist'
import {
  api,
  type InsiderPlay,
  type InsiderPricePattern,
  type InsiderSortKey,
  type InsiderStatus,
} from '@/lib/api'
import { cn, formatCurrency, MARKET_CAP_COLUMN, truncateAddress } from '@/lib/utils'
import { tokenUrl, walletUrl } from '@/lib/chains'
import { markTokenViewed, useViewedTokens } from '@/lib/viewed-tokens'

const PAGE_SIZE = 20

const STATUS_FILTERS: Array<{ value: InsiderStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'holding', label: 'Still holding' },
  { value: 'distributing', label: 'Distributing' },
  { value: 'exited', label: 'Exited' },
]

const PATTERN_FILTERS: Array<{ value: InsiderPricePattern | ''; label: string }> = [
  { value: '', label: 'Any shape' },
  { value: 'reclaiming', label: 'Reclaiming' },
  { value: 'retracing', label: 'Retracing' },
  { value: 'new_highs', label: 'New highs' },
]

const STATUS_STYLE: Record<InsiderStatus, { label: string; className: string; hint: string }> = {
  holding: {
    label: 'Holding',
    className: 'border-nodex-teal/30 bg-nodex-teal/10 text-nodex-teal',
    hint: 'Insider wallets still hold at least half of their launch position.',
  },
  distributing: {
    label: 'Distributing',
    className: 'border-nodex-amber/30 bg-nodex-amber/10 text-nodex-amber',
    hint: 'Insider wallets have sold part of their launch position.',
  },
  exited: {
    label: 'Exited',
    className: 'border-white/10 bg-white/[0.04] text-nodex-muted',
    hint: 'Insider wallets hold under 20% of their launch position.',
  },
  unknown: {
    label: 'Unknown',
    className: 'border-white/10 bg-white/[0.04] text-nodex-muted',
    hint: 'Insider wallets kept no tokens past the launch window.',
  },
}

const PATTERN_STYLE: Record<InsiderPricePattern, { label: string; className: string; hint: string }> = {
  reclaiming: {
    label: 'Reclaiming',
    className: 'text-nodex-green',
    hint: 'Fell at least 50% from the launch high, then doubled off the low.',
  },
  retracing: {
    label: 'Retracing',
    className: 'text-nodex-red',
    hint: 'Trading below half of the launch high.',
  },
  new_highs: {
    label: 'Above launch high',
    className: 'text-nodex-teal',
    hint: 'Trading above the launch-window high without a deep retrace first.',
  },
  ranging: {
    label: 'Ranging',
    className: 'text-nodex-muted',
    hint: 'Between half the launch high and the launch high.',
  },
  unknown: {
    label: 'Too early',
    className: 'text-nodex-muted',
    hint: 'Under 6 hours of price history, so the launch high is not settled yet.',
  },
}

function formatAge(launchedAt: string): string {
  const ms = Date.parse(/Z$/.test(launchedAt) ? launchedAt : `${launchedAt.replace(' ', 'T')}Z`)
  if (!Number.isFinite(ms)) return '—'
  const hours = Math.max(0, Math.floor((Date.now() - ms) / 3_600_000))
  if (hours < 1) return '<1h'
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function formatPct(value: number): string {
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)}%`
}

function scoreClass(score: number): string {
  if (score >= 60) return 'text-nodex-red'
  if (score >= 35) return 'text-nodex-amber'
  return 'text-nodex-muted'
}

function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T | ''; label: string }>
  value: T | ''
  onChange: (value: T | '') => void
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            value === option.value ? 'bg-nodex-teal/20 text-nodex-teal' : 'text-nodex-muted hover:text-white'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function InsiderDetails({ play }: { play: InsiderPlay }) {
  return (
    <div className="grid gap-6 px-6 pb-6 pt-2 md:grid-cols-2">
      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-nodex-muted">Launch evidence</h3>
        {play.evidence.length === 0 ? (
          <p className="text-sm text-nodex-muted">No individual findings recorded.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {play.evidence.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-nodex-accent" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-nodex-muted">
          {play.launchBuyers.toLocaleString()} wallets bought in the first 2 minutes. Launch high{' '}
          {formatCurrency(play.launchHighMc, true)}, low since then {formatCurrency(play.postLaunchLowMc, true)}, high
          so far {formatCurrency(play.athMc, true)}.
        </p>
      </div>
      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-nodex-muted">
          Insider wallets ({play.insiderWallets.length})
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {play.insiderWallets.slice(0, 16).map((wallet) => (
            <a
              key={wallet}
              href={walletUrl('solana', wallet)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-xs text-nodex-muted transition-colors hover:border-nodex-teal/30 hover:text-nodex-teal"
            >
              {truncateAddress(wallet)}
            </a>
          ))}
          {play.insiderWallets.length > 16 ? (
            <span className="px-2 py-1 text-xs text-nodex-muted">+{play.insiderWallets.length - 16} more</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function InsidersPage() {
  useSolanaTokenWatchlist()
  const [plays, setPlays] = useState<InsiderPlay[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<InsiderSortKey>('insiderScore')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [status, setStatus] = useState<InsiderStatus | ''>('')
  const [pattern, setPattern] = useState<InsiderPricePattern | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [nextUpdate, setNextUpdate] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const isViewed = useViewedTokens()
  const requestId = useRef(0)

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    api.insiders
      .list({ chain: 'solana', page, pageSize: PAGE_SIZE, sortBy, sortOrder, status: status || undefined, pattern: pattern || undefined })
      .then((result) => {
        if (id !== requestId.current) return
        setPlays(result.items ?? [])
        setTotal(result.total ?? 0)
        setMessage(result.message ?? null)
        setLastUpdated(result.lastUpdated ?? null)
        setNextUpdate(result.nextUpdate ?? null)
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return
        setError(err instanceof Error ? err.message : 'Failed to load insider plays')
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
  }, [page, sortBy, sortOrder, status, pattern])

  const onSort = (column: string) => {
    const key = column as InsiderSortKey
    if (key === sortBy) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    else {
      setSortBy(key)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const header = (label: string, column: InsiderSortKey, className?: string) => (
    <SortableHeader
      label={label}
      column={column}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      className={className}
    />
  )
  const plainHeader = (label: string) => (
    <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-widest text-nodex-muted">{label}</th>
  )

  return (
    <PageLayout>
      <Navbar variant="dashboard" />
      <main className="mx-auto flex w-full max-w-dashboard flex-1 flex-col px-4 pt-28 pb-16 md:px-8">
        <SubscriptionBanner />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-3xl font-bold md:text-4xl"
        >
          Insider Plays
        </motion.h1>
        <p className="mb-8 max-w-3xl text-sm text-nodex-muted">
          Tokens whose launch was bought by wallets under one person's control: buys co-signed in a single
          transaction, wallets funded by the same private wallet, and bags split into fresh wallets. Most insider
          launches go to zero. The setup worth watching is insiders still holding while price reclaims from its
          post-launch low.
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <FilterChips
            options={STATUS_FILTERS}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
          />
          <FilterChips
            options={PATTERN_FILTERS}
            value={pattern}
            onChange={(value) => {
              setPattern(value)
              setPage(1)
            }}
          />
        </div>

        {error ? <p className="mb-4 text-sm text-nodex-red">{error}</p> : null}

        {loading && plays.length === 0 ? (
          <TokenTableSkeleton />
        ) : (
          <GlassPanel variant="frosted" className="overflow-hidden">
            <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    <th className="w-8 px-4 py-4" />
                    {plainHeader('Token')}
                    {header('Insider score', 'insiderScore')}
                    {header('Insiders at launch', 'insiderAcquired')}
                    {header('Insiders hold now', 'insiderHolding')}
                    {plainHeader('Price shape')}
                    {header('Market cap', 'marketCap', MARKET_CAP_COLUMN)}
                    {header('First seen', 'firstSeenAt')}
                    {header('Peak since', 'peakMultiple')}
                    {header('Age', 'launchedAt')}
                  </tr>
                </thead>
                <tbody>
                  {plays.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-sm text-nodex-muted">
                        {message ??
                          'No insider launches found yet. New launches are analyzed on each data update.'}
                      </td>
                    </tr>
                  ) : null}
                  {plays.map((play) => {
                    const isOpen = expanded === play.contract
                    const viewed = isViewed('solana', play.contract)
                    const statusStyle = STATUS_STYLE[play.insiderStatus] ?? STATUS_STYLE.unknown
                    const patternStyle = PATTERN_STYLE[play.pricePattern] ?? PATTERN_STYLE.unknown
                    return (
                      <Fragment key={play.contract}>
                        <tr
                          onClick={() => setExpanded(isOpen ? null : play.contract)}
                          className={cn(
                            'group cursor-pointer border-b border-white/[0.06] transition-colors duration-200 hover:bg-white/[0.04]',
                            isOpen && 'bg-white/[0.03]',
                            viewed && VIEWED_ROW
                          )}
                        >
                          <td className="px-4 py-4 text-nodex-muted">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <TokenAvatar imageUrl={play.imageUrl} symbol={play.symbol} fallbackClassName="bg-purple-500" />
                              <div className="min-w-0 max-w-[12rem]">
                                <div className="truncate text-sm font-medium" title={play.name}>
                                  {play.name}
                                </div>
                                <div className="flex items-center gap-1">
                                  <a
                                    title={play.symbol}
                                    href={tokenUrl('solana', play.contract)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      markTokenViewed('solana', play.contract)
                                    }}
                                    onAuxClick={() => markTokenViewed('solana', play.contract)}
                                    className="min-w-0 truncate text-xs text-nodex-muted underline-offset-4 hover:text-nodex-teal hover:underline"
                                  >
                                    {play.symbol} · {truncateAddress(play.contract)}
                                  </a>
                                  {viewed ? <ViewedTokenIcon /> : null}
                                </div>
                              </div>
                              <TokenWatchlistButton token={play} chain="solana" />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className={cn('text-lg font-semibold tabular-nums', scoreClass(play.insiderScore))}>
                              {Math.round(play.insiderScore)}
                            </div>
                            <div className="text-[11px] text-nodex-muted">launch {Math.round(play.launchScore)}</div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="font-semibold tabular-nums">{formatPct(play.insiderAcquiredPct)}</div>
                            <div className="text-[11px] text-nodex-muted">
                              {play.linkedWallets} linked wallets · {play.clusters}{' '}
                              {play.clusters === 1 ? 'group' : 'groups'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="mb-1 font-semibold tabular-nums">{formatPct(play.insiderHoldingPct)}</div>
                            <span
                              title={statusStyle.hint}
                              className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', statusStyle.className)}
                            >
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div title={patternStyle.hint} className={cn('font-medium', patternStyle.className)}>
                              {patternStyle.label}
                            </div>
                            {play.pricePattern !== 'unknown' ? (
                              <div className="text-[11px] text-nodex-muted">
                                {formatCurrency(play.launchHighMc, true)} → {formatCurrency(play.postLaunchLowMc, true)}{' '}
                                → {formatCurrency(play.marketCap, true)}
                              </div>
                            ) : null}
                          </td>
                          <td className={cn('px-4 py-4 text-sm', MARKET_CAP_COLUMN)}>
                            <div className="tabular-nums">{formatCurrency(play.marketCap, true)}</div>
                            <div
                              className={cn(
                                'text-[11px] tabular-nums',
                                play.priceChange24h >= 0 ? 'text-nodex-green' : 'text-nodex-red'
                              )}
                            >
                              {play.priceChange24h >= 0 ? '+' : ''}
                              {play.priceChange24h.toFixed(1)}% 24h
                            </div>
                          </td>
                          <FirstSeenCell token={play} />
                          <PeakMultipleCell token={play} />
                          <td className="px-4 py-4 text-sm text-nodex-muted">{formatAge(play.launchedAt)}</td>
                        </tr>
                        {isOpen ? (
                          <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                            <td colSpan={10}>
                              <InsiderDetails play={play} />
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
        )}
        <LastUpdated value={lastUpdated} nextUpdate={nextUpdate} />
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
