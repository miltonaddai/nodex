import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Plus, Wallet } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { ChainSelector, type ChainFilter } from '@/components/dashboard/ChainSelector'
import { WalletCard } from '@/components/dashboard/WalletCard'
import { TokenCard } from '@/components/dashboard/TokenCard'
import { WatchlistGridSkeleton } from '@/components/dashboard/WatchlistGridSkeleton'
import { Button } from '@/components/ui/button'
import { SubscriptionBanner } from '@/components/billing/SubscriptionBanner'
import { useWatchlistPageInit } from '@/hooks/useWatchlistPageInit'
import { useWatchlistDashboard } from '@/stores/watchlistStore'
import { useTokenWatchlistDashboard } from '@/stores/tokenWatchlistStore'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'
import { cn } from '@/lib/utils'

type WatchlistTab = 'wallets' | 'tokens'

const TABS = [
  { id: 'tokens' as const, label: 'Tokens', icon: Coins },
  { id: 'wallets' as const, label: 'Wallets', icon: Wallet },
]

export function WatchlistPage() {
  useWatchlistPageInit()
  const [tab, setTab] = useState<WatchlistTab>('tokens')

  const { wallets, loading, error, chain, setChain, renameWallet, removeWallet } =
    useWatchlistDashboard()
  const {
    tokens,
    loading: tokensLoading,
    error: tokensError,
    setChain: setTokensChain,
    removeToken,
  } = useTokenWatchlistDashboard()

  // Both lists are chain-scoped, so the single selector has to drive both stores or the
  // inactive tab would still be showing the previous chain when you switch back to it.
  const handleChainChange = (next: ChainFilter) => {
    useDashboardPreferencesStore.getState().setWatchlistChain(next)
    setChain(next)
    setTokensChain(next)
  }

  const activeError = tab === 'wallets' ? error : tokensError
  // A refresh keeps the cards already on screen; the skeleton is only for an empty list.
  const activeLoading = tab === 'wallets' ? loading && wallets.length === 0 : tokensLoading && tokens.length === 0

  return (
    <PageLayout>
      <Navbar variant="dashboard" />
      <main className="mx-auto flex w-full max-w-dashboard flex-1 flex-col px-4 pt-28 pb-16 md:px-8">
        <SubscriptionBanner />
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold"
          >
            Watchlist
          </motion.h1>
          <div className="flex items-center gap-3">
            <ChainSelector<ChainFilter> value={chain} onChange={handleChainChange} includeAll />
            {tab === 'wallets' ? (
              <Button variant="dark" size="sm" className="rounded-md normal-case tracking-normal">
                <Plus className="w-4 h-4" />
                Add Wallet
              </Button>
            ) : null}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Watchlist type"
          className="mb-8 flex w-fit items-center gap-1 rounded-md border border-white/10 bg-white/5 p-1"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            const count = id === 'wallets' ? wallets.length : tokens.length
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-2 rounded-sm px-4 py-2 text-sm transition-all duration-300',
                  active
                    ? 'bg-whalemo-teal/10 text-whalemo-teal'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span
                  className={cn(
                    'rounded-sm px-1.5 py-0.5 text-[11px]',
                    active ? 'bg-whalemo-teal/15' : 'bg-white/10'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {activeError ? <p className="mb-4 text-sm text-whalemo-red">{activeError}</p> : null}

        {activeLoading ? (
          <WatchlistGridSkeleton />
        ) : tab === 'wallets' && wallets.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/5 px-6 py-12 text-center">
            <Wallet className="mx-auto mb-3 h-8 w-8 text-whalemo-muted" />
            <p className="text-sm text-white/70">No wallets tracked yet.</p>
            <p className="mt-1 text-xs text-whalemo-muted">
              Add wallets from the Smart Wallets page to start tracking them here.
            </p>
          </div>
        ) : tab === 'wallets' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.map((wallet, i) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                index={i}
                onRename={renameWallet}
                onRemove={removeWallet}
              />
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/5 px-6 py-12 text-center">
            <Coins className="mx-auto mb-3 h-8 w-8 text-whalemo-muted" />
            <p className="text-sm text-white/70">No tokens tracked yet.</p>
            <p className="mt-1 text-xs text-whalemo-muted">
              Add tokens with the star button on the Smart Wallets, Insiders or Scanner page.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token, i) => (
              <TokenCard key={token.id} token={token} index={i} onRemove={removeToken} />
            ))}
          </div>
        )}
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
