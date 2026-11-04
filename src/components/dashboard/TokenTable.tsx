import { motion } from 'framer-motion'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { TokenTableSkeleton } from '@/components/dashboard/TokenTableSkeleton'
import { SortableHeader, type SortOrder } from '@/components/dashboard/SortableHeader'
import { FirstSeenCell, PeakMultipleCell } from '@/components/dashboard/SightingCells'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { TokenWatchlistButton } from '@/components/dashboard/TokenWatchlistButton'
import { TokenAvatar } from '@/components/dashboard/TokenAvatar'
import { type TokenRow } from '@/lib/api'
import { cn, formatCurrency, formatPercent, MARKET_CAP_COLUMN, truncateAddress } from '@/lib/utils'
import { tokenUrl } from '@/lib/chains'
import { markTokenViewed, useViewedTokens } from '@/lib/viewed-tokens'
import { VIEWED_ROW, ViewedTokenIcon } from '@/components/dashboard/ViewedTokenIcon'

const AVATAR_COLORS = [
  'bg-green-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-cyan-500',
]

function formatTokenAge(launchedAt?: string, fallbackDays?: number): string {
  if (launchedAt) {
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(launchedAt)
    const normalized = hasTimezone ? launchedAt : `${launchedAt.replace(' ', 'T')}Z`
    const launchedAtMs = Date.parse(normalized)
    if (Number.isFinite(launchedAtMs)) {
      const ageHours = Math.max(0, Math.floor((Date.now() - launchedAtMs) / 3_600_000))
      if (ageHours < 1) return '<1h'
      if (ageHours < 24) return `${ageHours}h`
      return `${Math.floor(ageHours / 24)}d`
    }
  }
  return fallbackDays === undefined ? '—' : `${fallbackDays}d`
}

function ContractCell({ contract, chain, viewed }: { contract: string; chain: string; viewed: boolean }) {
  const [copied, setCopied] = useState(false)

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(contract)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="group/contract flex items-center gap-2">
      <a
        href={tokenUrl(chain, contract)}
        target="_blank"
        rel="noopener noreferrer"
        title="Open token in Dexscreener"
        onClick={() => markTokenViewed(chain, contract)}
        onAuxClick={() => markTokenViewed(chain, contract)}
        className="underline-offset-4 hover:text-whalemo-teal hover:underline focus-visible:text-whalemo-teal focus-visible:underline focus-visible:outline-none"
      >
        {truncateAddress(contract)}
      </a>
      {viewed ? <ViewedTokenIcon /> : null}
      <button
        type="button"
        onClick={() => void copyContract()}
        aria-label={copied ? 'Contract address copied' : 'Copy contract address'}
        title={copied ? 'Copied' : 'Copy contract address'}
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent opacity-0 transition-all duration-200 group-hover/contract:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whalemo-teal/50',
          copied
            ? 'text-whalemo-green opacity-100'
            : 'text-whalemo-muted hover:border-whalemo-teal/30 hover:bg-whalemo-teal/10 hover:text-whalemo-teal'
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export type TokenSortKey = 'churn' | 'alphaScore' | 'marketCap' | 'price' | 'changePct' | 'volume' | 'holders' | 'liquidity' | 'launchedAt' | 'name' | 'firstSeenAt' | 'peakMultiple'

interface TokenTableProps {
  tokens: TokenRow[]
  /** Chain the rows belong to — needed to file a tracked token under the right chain. */
  chain: string
  loading?: boolean
  page: number
  pageSize: number
  total: number
  sortBy: TokenSortKey
  sortOrder: SortOrder
  changeColumnLabel: string
  onSort: (column: TokenSortKey) => void
  onPageChange: (page: number) => void
}

export function TokenTable({
  tokens,
  chain,
  loading,
  page,
  pageSize,
  total,
  sortBy,
  sortOrder,
  changeColumnLabel,
  onSort,
  onPageChange,
}: TokenTableProps) {
  const isViewed = useViewedTokens()
  const showInitialSkeleton = loading && tokens.length === 0

  if (showInitialSkeleton) {
    return <TokenTableSkeleton />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <GlassPanel variant="frosted" className="overflow-hidden">
        <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="px-4 py-4 text-left text-[11px] font-semibold tracking-widest uppercase text-whalemo-muted">
                  #
                </th>
                <SortableHeader label="Token" column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as TokenSortKey)} />
                <SortableHeader label="Trader Churn" column="churn" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as TokenSortKey)} />
                <th className="px-4 py-4 text-left text-[11px] font-semibold tracking-widest uppercase text-whalemo-muted">
                  Contract
                </th>
                <SortableHeader label="Price" column="price" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as TokenSortKey)} />
                <SortableHeader
                  label="Market Cap"
                  column="marketCap"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(col) => onSort(col as TokenSortKey)}
                  className={MARKET_CAP_COLUMN}
                />
                <SortableHeader
                  label={changeColumnLabel}
                  column="changePct"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(col) => onSort(col as TokenSortKey)}
                />
                <SortableHeader label="First seen" column="firstSeenAt" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as TokenSortKey)} />
                <SortableHeader label="Peak since" column="peakMultiple" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as TokenSortKey)} />
                <SortableHeader label="Volume" column="volume" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as TokenSortKey)} />
                <SortableHeader label="Liquidity" column="liquidity" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as TokenSortKey)} />
                <SortableHeader label="Age" column="launchedAt" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as TokenSortKey)} />
              </tr>
            </thead>
            <tbody>
              {tokens.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-whalemo-muted">
                    No tokens match the current filters.
                  </td>
                </tr>
              ) : null}
              {tokens.map((token, i) => (
                <motion.tr
                  key={token.contract}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={cn(
                    'group border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors duration-200',
                    isViewed(chain, token.contract) && VIEWED_ROW
                  )}
                >
                  <td className="px-4 py-4 text-sm text-whalemo-muted">{token.rank}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <TokenAvatar
                        imageUrl={token.imageUrl}
                        symbol={token.symbol}
                        fallbackClassName={AVATAR_COLORS[token.rank % AVATAR_COLORS.length]}
                      />
                      <div className="min-w-0 max-w-[7.5rem] sm:max-w-[12rem]">
                        <div className="truncate text-sm font-medium" title={token.name}>
                          {token.name}
                        </div>
                        <div className="truncate text-xs text-whalemo-muted" title={token.symbol}>
                          {token.symbol}
                        </div>
                      </div>
                      <TokenWatchlistButton token={token} chain={chain} />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div
                      className="font-semibold text-whalemo-green"
                      title="Unique wallets trading in 24h ÷ holders. Bot farms sit near 1.0; organic tokens run higher."
                    >
                      {(token.churn ?? 0).toFixed(2)}×
                    </div>
                    {token.uniqueWallet24h !== undefined && (
                      <div className="text-[11px] text-whalemo-muted">
                        {token.uniqueWallet24h.toLocaleString()} traders ·{' '}
                        {(token.holders ?? 0).toLocaleString()} holders
                      </div>
                    )}
                    {token.riskFlags && token.riskFlags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {token.riskFlags.slice(0, 2).map((flag) => (
                          <span
                            key={flag}
                            title={flag.replace(/_/g, ' ')}
                            className="rounded-none bg-amber-500/15 px-1.5 py-0.5 text-[9px] tracking-wide text-amber-300/90"
                          >
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-whalemo-muted">
                    <ContractCell contract={token.contract} chain={chain} viewed={isViewed(chain, token.contract)} />
                  </td>
                  <td className="px-4 py-4 text-sm">${token.price.toFixed(token.price < 0.01 ? 5 : 2)}</td>
                  <td className={cn('px-4 py-4 text-sm', MARKET_CAP_COLUMN)}>{formatCurrency(token.marketCap, true)}</td>
                  <td
                    className={cn(
                      'px-4 py-4 text-sm font-semibold',
                      token.changePct >= 0 ? 'text-whalemo-green' : 'text-whalemo-red'
                    )}
                  >
                    {formatPercent(token.changePct)}
                  </td>
                  <FirstSeenCell token={token} />
                  <PeakMultipleCell token={token} />
                  <td className="px-4 py-4 text-sm">{formatCurrency(token.volume, true)}</td>
                  <td className="px-4 py-4 text-sm">{formatCurrency(token.liquidity ?? 0, true)}</td>
                  <td className="px-4 py-4 text-sm text-whalemo-muted">
                    {formatTokenAge(token.launchedAt, token.ageDays)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          disabled={loading}
        />
      </GlassPanel>
    </motion.div>
  )
}
