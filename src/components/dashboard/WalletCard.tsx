import { useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Check, ExternalLink, Pencil, Trash2, X } from 'lucide-react'
import { type WatchlistWallet } from '@/lib/api'
import { cn, formatCurrency, formatPnl, truncateAddress } from '@/lib/utils'
import { walletUrl } from '@/lib/chains'

const AVATAR_COLORS = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
]

interface WalletCardProps {
  wallet: WatchlistWallet
  index: number
  onRename: (id: string, name: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export function WalletCard({ wallet, index, onRename, onRemove }: WalletCardProps) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(wallet.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [removing, setRemoving] = useState(false)

  // The wallet is still on the watchlist, we just have no analytics to show for it.
  const noData = wallet.analyticsUnavailable === true
  const tone =
    noData || wallet.pnl7d === null
      ? 'var(--color-nodex-teal)'
      : wallet.pnl7d >= 0
        ? 'var(--color-nodex-green)'
        : 'var(--color-nodex-red)'

  const cancelEditing = () => {
    setDraftName(wallet.name)
    setError(null)
    setEditing(false)
  }

  const saveName = async () => {
    const name = draftName.trim()
    if (!name || name === wallet.name) {
      cancelEditing()
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onRename(wallet.id, name)
      setEditing(false)
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : 'Failed to rename wallet')
    } finally {
      setSaving(false)
    }
  }

  const removeWallet = async () => {
    setRemoving(true)
    setError(null)
    try {
      await onRemove(wallet.id)
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Failed to remove wallet')
      setRemoving(false)
      setConfirmingRemove(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group watch-card rounded-2xl p-5"
      style={{ '--card-tone': tone } as CSSProperties}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {wallet.avatarUrl ? (
            <img src={wallet.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full bg-white/10 object-cover" loading="lazy" />
          ) : (
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#ffffff]',
                AVATAR_COLORS[index % AVATAR_COLORS.length]
              )}
            >
              {wallet.name[0] ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={draftName}
                  maxLength={64}
                  disabled={saving}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void saveName()
                    if (event.key === 'Escape') cancelEditing()
                  }}
                  aria-label="Wallet name"
                  className="h-7 w-32 rounded-md border border-white/10 bg-white/5 px-2 text-sm font-semibold outline-none focus:border-nodex-teal"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveName()}
                  aria-label="Save wallet name"
                  className="rounded p-1 text-nodex-teal hover:bg-white/10 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={cancelEditing}
                  aria-label="Cancel editing wallet name"
                  className="rounded p-1 text-nodex-muted hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="group/name flex items-center gap-1.5">
                <div className="truncate text-sm font-semibold">{wallet.name}</div>
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(wallet.name)
                    setEditing(true)
                  }}
                  aria-label={`Edit ${wallet.name}`}
                  className="rounded p-1 text-nodex-muted opacity-0 transition-opacity hover:bg-white/10 hover:text-nodex-teal focus:opacity-100 group-hover/name:opacity-100"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
            <a
              href={walletUrl(wallet.chain, wallet.address)}
              target="_blank"
              rel="noopener noreferrer"
              title="Open wallet in the block explorer"
              className="group/address flex w-fit items-center gap-1 text-xs text-nodex-muted underline-offset-4 hover:text-nodex-teal hover:underline focus-visible:text-nodex-teal focus-visible:underline focus-visible:outline-none"
            >
              {truncateAddress(wallet.address)}
              <ExternalLink
                aria-hidden="true"
                className="h-3 w-3 opacity-0 transition-opacity group-hover/address:opacity-100 group-focus-visible/address:opacity-100"
              />
            </a>
            {error ? <div className="mt-1 text-[11px] text-nodex-red">{error}</div> : null}
          </div>
        </div>
        {confirmingRemove ? (
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-[11px] uppercase tracking-widest text-nodex-muted">Remove?</span>
            <button
              type="button"
              disabled={removing}
              onClick={() => void removeWallet()}
              aria-label={`Confirm removing ${wallet.name}`}
              className="rounded p-1 text-nodex-red hover:bg-white/10 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={removing}
              onClick={() => setConfirmingRemove(false)}
              aria-label="Cancel removing wallet"
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
              aria-label={`Remove ${wallet.name} from watchlist`}
              className="rounded p-1 text-nodex-muted opacity-0 transition-opacity hover:bg-white/10 hover:text-nodex-red focus:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4 rounded-xl bg-nodex-raised px-3 py-3">
        <div>
          <div className="text-[11px] tracking-widest uppercase text-nodex-muted mb-1">Balance</div>
          <div className={cn('text-lg font-bold', noData && 'text-nodex-muted')}>
            {noData || wallet.balance === null ? '—' : formatCurrency(wallet.balance)}
          </div>
        </div>
        <div>
          <div className="text-[11px] tracking-widest uppercase text-nodex-muted mb-1">7D PNL</div>
          <div
            className={cn(
              'text-lg font-bold',
              noData || wallet.pnl7d === null
                ? 'text-nodex-muted'
                : wallet.pnl7d >= 0
                  ? 'text-nodex-green'
                  : 'text-nodex-red'
            )}
          >
            {noData || wallet.pnl7d === null ? '—' : formatPnl(wallet.pnl7d)}
          </div>
        </div>
        <div>
          <div className="text-[11px] tracking-widest uppercase text-nodex-muted mb-1">Win Rate</div>
          <div className={cn('text-lg font-bold', noData && 'text-nodex-muted')}>
            {noData || wallet.winRate === null ? '—' : `${wallet.winRate}%`}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-nodex-muted">
        <span>
          {noData
            ? 'No wallet data found'
            : [wallet.handle ? `@${wallet.handle}` : null, wallet.lastActive ? `active ${wallet.lastActive}` : null]
                .filter(Boolean)
                .join(' · ')}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-nodex-line bg-nodex-surface px-2 py-1">
          <span className={cn('w-1.5 h-1.5 rounded-full', noData ? 'bg-nodex-muted' : 'bg-nodex-green')} />
          {wallet.chain === 'solana' ? 'Solana' : 'Robinhood Chain'}
        </span>
      </div>
    </motion.div>
  )
}
