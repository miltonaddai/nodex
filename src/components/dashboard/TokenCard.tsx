import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Trash2, X } from 'lucide-react'
import { TokenAvatar } from '@/components/dashboard/TokenAvatar'
import { type WatchlistToken } from '@/lib/api'
import { cn, formatCurrency, truncateAddress } from '@/lib/utils'

const AVATAR_COLORS = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
]

function formatTokenAge(launchedAt?: string, fallbackDays?: number): string | null {
  if (launchedAt) {
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(launchedAt)
    const normalized = hasTimezone ? launchedAt : `${launchedAt.replace(' ', 'T')}Z`
    const launchedAtMs = Date.parse(normalized)

    if (Number.isFinite(launchedAtMs)) {
      const ageMinutes = Math.max(0, Math.floor((Date.now() - launchedAtMs) / 60_000))
      if (ageMinutes < 1) return '<1m old'
      if (ageMinutes < 60) return `${ageMinutes}m old`

      const ageHours = Math.floor(ageMinutes / 60)
      if (ageHours < 24) return `${ageHours}h old`
      return `${Math.floor(ageHours / 24)}d old`
    }
  }

  return fallbackDays === undefined ? null : `${fallbackDays}d old`
}

interface TokenCardProps {
  token: WatchlistToken
  index: number
  onRemove: (id: string) => Promise<void>
}

export function TokenCard({ token, index, onRemove }: TokenCardProps) {
  const [error, setError] = useState<string | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [copied, setCopied] = useState(false)

  // The token is still on the watchlist, we just have no analytics to show for it. Tokens age
  // out of the recent-token window the tokens table ranks on, so this is expected over time.
  const noData = token.analyticsUnavailable === true
  const tokenAge = formatTokenAge(token.launchedAt, token.ageDays)

  const removeToken = async () => {
    setRemoving(true)
    setError(null)
    try {
      await onRemove(token.id)
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Failed to remove token')
      setRemoving(false)
      setConfirmingRemove(false)
    }
  }

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(token.contract)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <TokenAvatar
            imageUrl={token.imageUrl}
            symbol={token.symbol}
            fallbackClassName={AVATAR_COLORS[index % AVATAR_COLORS.length]}
            className="h-10 w-10 text-sm"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{token.symbol}</div>
            <div className="truncate text-xs text-nodex-muted">{token.name}</div>
            <div className="group/contract flex items-center gap-1.5 text-xs text-nodex-muted">
              <a
                href={`https://dexscreener.com/solana/${encodeURIComponent(token.contract)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open token in Dexscreener"
                className="underline-offset-4 hover:text-nodex-teal hover:underline focus-visible:text-nodex-teal focus-visible:underline focus-visible:outline-none"
              >
                {truncateAddress(token.contract)}
              </a>
              <button
                type="button"
                onClick={() => void copyContract()}
                aria-label={copied ? 'Contract address copied' : 'Copy contract address'}
                title={copied ? 'Copied' : 'Copy contract address'}
                className={cn(
                  'rounded p-0.5 opacity-0 transition-all group-hover/contract:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nodex-teal/50',
                  copied
                    ? 'text-nodex-green opacity-100'
                    : 'hover:bg-nodex-teal/10 hover:text-nodex-teal'
                )}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            {error ? <div className="mt-1 text-[10px] text-nodex-red">{error}</div> : null}
          </div>
        </div>
        {confirmingRemove ? (
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-[10px] uppercase tracking-widest text-nodex-muted">Remove?</span>
            <button
              type="button"
              disabled={removing}
              onClick={() => void removeToken()}
              aria-label={`Confirm removing ${token.symbol}`}
              className="rounded p-1 text-nodex-red hover:bg-white/10 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={removing}
              onClick={() => setConfirmingRemove(false)}
              aria-label="Cancel removing token"
              className="rounded p-1 text-nodex-muted hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setError(null)
                setConfirmingRemove(true)
              }}
              aria-label={`Remove ${token.symbol} from watchlist`}
              className="rounded p-1 text-nodex-muted opacity-0 transition-opacity hover:bg-white/10 hover:text-nodex-red focus:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <div className="text-[10px] tracking-widest uppercase text-nodex-muted mb-1">Price</div>
          <div className={cn('text-lg font-bold', noData && 'text-nodex-muted')}>
            {noData ? '—' : `$${token.price.toFixed(token.price < 0.01 ? 5 : 2)}`}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-widest uppercase text-nodex-muted mb-1">
            24H Change
          </div>
          <div
            className={cn(
              'text-lg font-bold',
              noData
                ? 'text-nodex-muted'
                : token.changePct >= 0
                  ? 'text-nodex-green'
                  : 'text-nodex-red'
            )}
          >
            {noData ? '—' : `${token.changePct >= 0 ? '+' : ''}${token.changePct.toFixed(1)}%`}
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-widest uppercase text-nodex-muted mb-1">Mkt Cap</div>
          <div className={cn('text-lg font-bold', noData && 'text-nodex-muted')}>
            {noData ? '—' : formatCurrency(token.marketCap, true)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-nodex-muted">
        <span>
          {noData
            ? 'No analytics data yet'
            : tokenAge
              ? `${tokenAge} · churn ${token.churn.toFixed(2)}`
              : `Churn ${token.churn.toFixed(2)}`}
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5">
          <span
            className={cn('w-1.5 h-1.5 rounded-full', noData ? 'bg-nodex-muted' : 'bg-nodex-green')}
          />
          {token.chain === 'solana' ? 'Solana' : 'Robinhood Chain'}
        </span>
      </div>
    </motion.div>
  )
}
