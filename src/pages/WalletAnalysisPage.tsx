import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Copy, LoaderCircle, Plus, ShieldAlert } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SubscriptionBanner } from '@/components/billing/SubscriptionBanner'
import { LastUpdated } from '@/components/dashboard/TablePagination'
import { TimeframeFilter, type Period } from '@/components/dashboard/TimeframeFilter'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { Navbar } from '@/components/layout/Navbar'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { api, type WalletDetailResponse } from '@/lib/api'
import { cn, formatCurrency, formatPercent, formatPnl, truncateAddress } from '@/lib/utils'
import { useWatchlistStore } from '@/stores/watchlistStore'

const PERIODS: Period[] = ['24H', '7D', '30D', 'All']

function isPeriod(value: string | null): value is Period {
  return Boolean(value && PERIODS.includes(value as Period))
}

function Stat({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <GlassPanel variant="frosted" className="p-5">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-nodex-muted">{label}</p>
      <p className={cn('mt-2 text-xl font-bold', className)}>{value}</p>
    </GlassPanel>
  )
}

export function WalletAnalysisPage() {
  const { address = '' } = useParams<{ address: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const chain = searchParams.get('chain') === 'robinhood' ? 'robinhood' : 'solana'
  const periodParam = searchParams.get('period')
  const period: Period = isPeriod(periodParam) ? periodParam : '7D'
  const [detail, setDetail] = useState<WalletDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const watchlistWallets = useWatchlistStore((state) => state.wallets)
  const isWatched = useMemo(
    () => watchlistWallets.some((wallet) => wallet.address === address && wallet.chain === chain),
    [watchlistWallets, address, chain]
  )

  useEffect(() => {
    const watchlist = useWatchlistStore.getState()
    if (watchlist.chain !== chain) watchlist.setChain(chain)
    else watchlist.fetchIfNeeded()
  }, [chain])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    api.wallets
      .detail(address, { chain, period })
      .then((response) => {
        if (active) setDetail(response)
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Failed to load wallet')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [address, chain, period])

  function changePeriod(nextPeriod: Period) {
    setSearchParams({ chain, period: nextPeriod })
  }

  async function addToWatchlist() {
    if (isWatched || adding) return
    setAdding(true)
    setError(null)
    try {
      await useWatchlistStore
        .getState()
        .addWallet(address, `Wallet ${truncateAddress(address)}`, chain)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to add wallet')
    } finally {
      setAdding(false)
    }
  }

  const summary = detail?.summary

  return (
    <PageLayout>
      <Navbar variant="dashboard" />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-28 pb-16 md:px-8">
        <SubscriptionBanner />
        <button
          type="button"
          onClick={() => navigate('/wallets')}
          className="mb-6 inline-flex w-fit items-center gap-2 text-sm text-nodex-muted transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to smart wallets
        </button>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold md:text-4xl"
            >
              Wallet Analysis
            </motion.h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-nodex-muted">
              <span className="font-mono">{truncateAddress(address, 8)}</span>
              <button
                type="button"
                title="Copy wallet address"
                onClick={() => void navigator.clipboard.writeText(address)}
                className="rounded p-1 transition-colors hover:bg-white/5 hover:text-nodex-teal"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Button
            variant={isWatched ? 'outline' : 'default'}
            disabled={isWatched || adding}
            onClick={() => void addToWatchlist()}
            className="rounded-full"
          >
            {adding ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : isWatched ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isWatched ? 'In watchlist' : 'Add to watchlist'}
          </Button>
        </div>

        <div className="mb-8">
          <TimeframeFilter value={period} onChange={changePeriod} />
        </div>

        {error ? <p className="mb-5 text-sm text-nodex-red">{error}</p> : null}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : summary && detail ? (
          <>
            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat
                label={`${period} Profit`}
                value={formatPnl(summary.totalProfit)}
                className={summary.totalProfit >= 0 ? 'text-nodex-green' : 'text-nodex-red'}
              />
              <Stat label="Win Rate" value={`${summary.winRate ?? 0}%`} />
              <Stat label="Alpha Tokens" value={String(summary.youngTokenTrades ?? detail.positions.length)} />
              <Stat label="Realized PnL" value={formatPnl(summary.realizedProfit ?? 0)} />
              <Stat label="Unrealized PnL" value={formatPnl(summary.unrealizedProfit ?? 0)} />
              <Stat label="Trading Volume" value={formatCurrency(summary.volume ?? 0, true)} />
              <Stat label="Trades" value={String(summary.trades ?? 0)} />
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <GlassPanel variant="frosted" className="p-6">
                <h2 className="text-lg font-bold">Trading profile</h2>
                <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                  <div>
                    <p className="text-nodex-muted">Portfolio balance</p>
                    <p className="mt-1 font-semibold">{formatCurrency(summary.balance ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-nodex-muted">Tokens currently held</p>
                    <p className="mt-1 font-semibold">{summary.tokensHeld ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-nodex-muted">Median launch ROI</p>
                    <p className="mt-1 font-semibold">{formatPercent(summary.medianRoiPct ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-nodex-muted">Average entry after launch</p>
                    <p className="mt-1 font-semibold">{Math.round(summary.avgEntryDelayMinutes ?? 0)} min</p>
                  </div>
                  <div>
                    <p className="text-nodex-muted">Capital concentration</p>
                    <p className="mt-1 font-semibold">{(summary.concentrationPct ?? 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-nodex-muted">Last active</p>
                    <p className="mt-1 font-semibold">{summary.lastActive ?? 'Unknown'}</p>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel variant="frosted" className="p-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-nodex-teal" />
                  <h2 className="text-lg font-bold">Risk review</h2>
                </div>
                {(summary.riskFlags?.length ?? 0) > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {summary.riskFlags?.map((flag) => (
                      <span key={flag} className="rounded-full border border-nodex-red/20 bg-nodex-red/10 px-3 py-1 text-xs text-nodex-red">
                        {flag.replaceAll('_', ' ')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-nodex-muted">
                    No concentration or suspicious-activity flags were detected in this period.
                  </p>
                )}
                <p className="mt-5 text-xs leading-relaxed text-nodex-muted">
                  Analysis covers trading activity on recently launched alpha tokens, not the wallet&apos;s complete lifetime history.
                </p>
              </GlassPanel>
            </section>

            <section className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold">Alpha token performance</h2>
                <p className="mt-1 text-sm text-nodex-muted">
                  Token-level entries, exits and period PnL used to calculate this wallet&apos;s score.
                </p>
              </div>
              <GlassPanel variant="frosted" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.04] text-left text-[11px] font-semibold tracking-widest uppercase text-nodex-muted">
                        <th className="px-4 py-4">Token</th>
                        <th className="px-4 py-4">Alpha</th>
                        <th className="px-4 py-4">Position</th>
                        <th className="px-4 py-4">Bought</th>
                        <th className="px-4 py-4">PnL</th>
                        <th className="px-4 py-4">ROI</th>
                        <th className="px-4 py-4">Entry</th>
                        <th className="px-4 py-4">Trades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.positions.map((position) => {
                        const pnl = position.realizedPnl + position.unrealizedPnl
                        return (
                          <tr key={position.contract || position.symbol} className="border-b border-white/[0.06]">
                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold">{position.symbol}</p>
                              <p className="text-xs text-nodex-muted">
                                {position.contract ? truncateAddress(position.contract) : 'Contract unavailable'}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-sm text-nodex-teal">{position.alphaScore.toFixed(1)}</td>
                            <td className="px-4 py-4">
                              <span className={cn('rounded-full px-2 py-1 text-xs', position.isOpen ? 'bg-nodex-teal/10 text-nodex-teal' : 'bg-white/5 text-nodex-muted')}>
                                {position.isOpen ? 'Open' : 'Closed'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">{formatCurrency(position.buyUsd, true)}</td>
                            <td className={cn('px-4 py-4 text-sm font-semibold', pnl >= 0 ? 'text-nodex-green' : 'text-nodex-red')}>
                              {formatPnl(pnl)}
                            </td>
                            <td className={cn('px-4 py-4 text-sm', position.roiPct >= 0 ? 'text-nodex-green' : 'text-nodex-red')}>
                              {formatPercent(Number(position.roiPct.toFixed(1)))}
                            </td>
                            <td className="px-4 py-4 text-sm text-nodex-muted">{position.entryDelayMinutes}m</td>
                            <td className="px-4 py-4 text-sm">{position.tradeCount}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {detail.positions.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-nodex-muted">No token positions for this period.</p>
                ) : null}
              </GlassPanel>
            </section>
            <LastUpdated value={detail.lastUpdated} />
          </>
        ) : null}
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
