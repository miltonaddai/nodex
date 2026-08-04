import { motion } from 'framer-motion'
import { Check, LoaderCircle, Plus, Wallet } from 'lucide-react'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { WalletTableSkeleton } from '@/components/dashboard/WalletTableSkeleton'
import { SortableHeader, type SortOrder } from '@/components/dashboard/SortableHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { type WalletRow } from '@/lib/api'
import { cn, formatCurrency, formatPnl, truncateAddress } from '@/lib/utils'

const AVATAR_COLORS = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-cyan-500',
]

export type WalletSortKey = 'qualifiedTokens' | 'qualifiedProfit' | 'smartScore' | 'totalProfit' | 'balance' | 'winRate' | 'trades' | 'volume' | 'tokensHeld' | 'lastActive'

interface WalletTableProps {
  wallets: WalletRow[]
  loading?: boolean
  page: number
  pageSize: number
  total: number
  sortBy: WalletSortKey
  sortOrder: SortOrder
  onSort: (column: WalletSortKey) => void
  onPageChange: (page: number) => void
  watchedAddresses?: Set<string>
  addingAddress?: string | null
  onAddToWatchlist?: (wallet: WalletRow) => void
  onRowClick?: (wallet: WalletRow) => void
}

export function WalletTable({
  wallets,
  loading,
  page,
  pageSize,
  total,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  watchedAddresses = new Set(),
  addingAddress,
  onAddToWatchlist,
  onRowClick,
}: WalletTableProps) {
  const showInitialSkeleton = loading && wallets.length === 0

  if (showInitialSkeleton) {
    return <WalletTableSkeleton />
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
                <th className="px-4 py-4 text-left text-[10px] font-semibold tracking-widest uppercase text-nodex-muted">
                  #
                </th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold tracking-widest uppercase text-nodex-muted">
                  Wallet
                </th>
                <SortableHeader label="Wins / List Tokens" column="qualifiedTokens" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as WalletSortKey)} />
                <SortableHeader label="Balance" column="balance" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as WalletSortKey)} />
                <SortableHeader
                  label="Total Profit"
                  column="totalProfit"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(col) => onSort(col as WalletSortKey)}
                />
                <SortableHeader label="Win Rate" column="winRate" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as WalletSortKey)} />
                <SortableHeader label="Trades" column="trades" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as WalletSortKey)} />
                <SortableHeader label="Tokens Held" column="tokensHeld" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as WalletSortKey)} />
                <SortableHeader label="Volume" column="volume" sortBy={sortBy} sortOrder={sortOrder} onSort={(col) => onSort(col as WalletSortKey)} />
                <SortableHeader
                  label="Last Active"
                  column="lastActive"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(col) => onSort(col as WalletSortKey)}
                />
              </tr>
            </thead>
            <tbody>
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-nodex-muted">
                    No wallets match the current filters.
                  </td>
                </tr>
              ) : null}
              {wallets.map((wallet, i) => (
                <motion.tr
                  key={wallet.address}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  onClick={() => onRowClick?.(wallet)}
                  onKeyDown={(event) => {
                    if (event.currentTarget === event.target && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      onRowClick?.(wallet)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group cursor-pointer border-b border-white/[0.06] hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none transition-colors duration-200"
                >
                  <td className="px-4 py-4 text-sm text-nodex-muted">{wallet.rank}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                          AVATAR_COLORS[wallet.rank % AVATAR_COLORS.length]
                        )}
                      >
                        <Wallet className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <a
                        href={`https://solscan.io/account/${encodeURIComponent(wallet.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open wallet in Solscan"
                        onClick={(event) => event.stopPropagation()}
                        className="text-sm font-medium underline-offset-4 hover:text-nodex-teal hover:underline focus-visible:text-nodex-teal focus-visible:underline focus-visible:outline-none"
                      >
                        {truncateAddress(wallet.address)}
                      </a>
                      <button
                        type="button"
                        aria-label={
                          watchedAddresses.has(wallet.address)
                            ? 'Wallet is in your watchlist'
                            : 'Add wallet to watchlist'
                        }
                        title={
                          watchedAddresses.has(wallet.address)
                            ? 'Already in watchlist'
                            : 'Add to watchlist'
                        }
                        disabled={watchedAddresses.has(wallet.address) || addingAddress === wallet.address}
                        onClick={(event) => {
                          event.stopPropagation()
                          onAddToWatchlist?.(wallet)
                        }}
                        className={cn(
                          'ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all',
                          watchedAddresses.has(wallet.address)
                            ? 'text-nodex-teal opacity-100'
                            : 'text-nodex-muted opacity-0 hover:border-nodex-teal/40 hover:text-nodex-teal group-hover:opacity-100 focus:opacity-100',
                          addingAddress === wallet.address && 'opacity-100'
                        )}
                      >
                        {addingAddress === wallet.address ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : watchedAddresses.has(wallet.address) ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div
                      className="font-semibold text-nodex-green"
                      title="Tokens from the current list this wallet traded, and how many it profited on"
                    >
                      {wallet.qualifiedWins ?? 0}/{wallet.qualifiedTokens ?? 0}
                    </div>
                    {wallet.qualifiedProfitUsd !== undefined && (
                      <div className="text-[10px] text-nodex-muted">
                        {formatPnl(wallet.qualifiedProfitUsd)} on list
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm">{formatCurrency(wallet.balance)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-nodex-green">
                    {formatPnl(wallet.totalProfit)}
                  </td>
                  <td className="px-4 py-4 text-sm">{wallet.winRate}%</td>
                  <td className="px-4 py-4 text-sm text-nodex-muted">{wallet.trades}</td>
                  <td className="px-4 py-4 text-sm">{wallet.tokensHeld.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm">{formatCurrency(wallet.volume, true)}</td>
                  <td className="px-4 py-4 text-sm text-nodex-muted">{wallet.lastActive}</td>
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
