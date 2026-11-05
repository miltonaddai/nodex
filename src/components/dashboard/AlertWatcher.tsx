import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { api, type SmartMoneyBuy } from '@/lib/api'
import { CHAIN_IDS, chainLabel } from '@/lib/chains'
import { playChime } from '@/lib/chime'
import type { SavedFilter } from '@/lib/custom-filters'
import { formatCurrency } from '@/lib/utils'
import { useEarlySignalStore } from '@/stores/earlySignalStore'
import { useSavedFiltersStore } from '@/stores/savedFiltersStore'
import { toast } from '@/stores/toastStore'

/**
 * Watches for alerts while WhaleMo is open on any page:
 *   - early signals (the built-in preset), switched on or off on the Smart Wallets page;
 *   - custom alerts, one per saved filter with its alert on, on the chains it covers.
 * Each new token is announced with a chime and a toast, and a system notification when enabled
 * and WhaleMo is in the background. New data lands once per pipeline run (every 2 hours); checking
 * every few minutes catches a run soon after it finishes. Each check reads the API's cached
 * snapshot, so it costs no data-provider calls.
 */
const POLL_MS = 3 * 60 * 1000
const EARLY_SEEN_KEY = 'nodex_early_seen_v1'
const CUSTOM_SEEN_KEY = 'whalemo_alert_seen_v1'
const MAX_SEEN = 500

type SeenByChain = Record<string, string[]>

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable. Tokens may be announced again after a reload.
  }
}

/** Contracts in `items` not yet in `seen`, and `seen` updated to include them. */
function diff(items: SmartMoneyBuy[], seen: string[] | undefined) {
  const known = new Set(seen ?? [])
  return {
    fresh: items.filter((token) => !known.has(token.contract)),
    seen: [...new Set([...items.map((token) => token.contract), ...(seen ?? [])])].slice(0, MAX_SEEN),
  }
}

/** A system notification, only when allowed and WhaleMo isn't the tab being looked at. */
function notifyDesktop(title: string, body: string, onClick: () => void) {
  if (!useEarlySignalStore.getState().desktopEnabled) return
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible' && document.hasFocus()) return
  try {
    const notification = new Notification(title, { body, icon: '/whalemo-icon.svg', tag: title })
    notification.onclick = () => {
      window.focus()
      onClick()
      notification.close()
    }
  } catch {
    // Some browsers only allow notifications from a service worker. The toast still shows.
  }
}

function summary(fresh: Array<{ chain: string; token: SmartMoneyBuy }>) {
  const first = fresh[0]
  if (fresh.length === 1) {
    const where = first.chain !== 'solana' ? ` on ${chainLabel(first.chain)}` : ''
    return `${first.token.symbol || first.token.name}: ${first.token.walletCount} top traders at ${formatCurrency(first.token.marketCap, true)} market cap${where}.`
  }
  return fresh.map((f) => f.token.symbol || f.token.name).slice(0, 4).join(', ') + (fresh.length > 4 ? '…' : '')
}

export function AlertWatcher() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const earlyEnabled = useEarlySignalStore((s) => s.alertsEnabled)
  const unseen = useEarlySignalStore((s) => s.unseen)
  const setUnseen = useEarlySignalStore((s) => s.setUnseen)
  const filters = useSavedFiltersStore((s) => s.list)
  const baseTitle = useRef(document.title)

  // Alerts come from saved filters, so load them once signed in.
  useEffect(() => {
    if (isAuthenticated) void useSavedFiltersStore.getState().load()
  }, [isAuthenticated])

  // Tab title shows a count while new alerts wait to be looked at.
  useEffect(() => {
    document.title = unseen > 0 ? `(${unseen}) New alerts · ${baseTitle.current}` : baseTitle.current
  }, [unseen])

  useEffect(() => {
    const clear = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) setUnseen(0)
    }
    window.addEventListener('focus', clear)
    document.addEventListener('visibilitychange', clear)
    return () => {
      window.removeEventListener('focus', clear)
      document.removeEventListener('visibilitychange', clear)
    }
  }, [setUnseen])

  // Which custom alerts are on, as a stable key, so edits elsewhere don't restart the timer.
  const alertFilters = filters.filter((filter) => filter.alert && filter.rules.length > 0)
  const alertKey = JSON.stringify(alertFilters.map((f) => [f.id, f.rules, f.alertChains]))

  useEffect(() => {
    if (!isAuthenticated || (!earlyEnabled && alertFilters.length === 0)) return
    let cancelled = false
    const watched: SavedFilter[] = JSON.parse(JSON.stringify(alertFilters))

    const announce = (title: string, fresh: Array<{ chain: string; token: SmartMoneyBuy }>, viewPath: string) => {
      playChime()
      const description = summary(fresh)
      toast({ title, description, action: { label: 'View', onClick: () => navigate(viewPath) }, durationMs: 20_000 })
      notifyDesktop(title, description, () => navigate(viewPath))
      if (!document.hasFocus()) setUnseen(useEarlySignalStore.getState().unseen + fresh.length)
    }

    const checkEarly = async () => {
      const stored = read<SeenByChain>(EARLY_SEEN_KEY)
      const seen: SeenByChain = stored ?? {}
      const fresh: Array<{ chain: string; token: SmartMoneyBuy }> = []
      for (const chain of CHAIN_IDS) {
        try {
          const { items } = await api.smartMoney.buys({ chain, preset: 'early', pageSize: 100, sortBy: 'walletCount' })
          const result = diff(items ?? [], seen[chain])
          fresh.push(...result.fresh.map((token) => ({ chain, token })))
          seen[chain] = result.seen
        } catch {
          // Offline or signed out mid-check. Try again next time.
        }
      }
      if (cancelled) return
      write(EARLY_SEEN_KEY, seen)
      // The first check in a browser only learns what is already listed.
      if (stored === null || fresh.length === 0) return
      const first = fresh[0].token
      announce(
        fresh.length === 1 ? `Early signal: ${first.symbol || first.name}` : `${fresh.length} new early signals`,
        fresh,
        `/wallets?preset=early&chain=${fresh[0].chain}`
      )
    }

    const checkCustom = async () => {
      const seenAll = read<Record<string, SeenByChain>>(CUSTOM_SEEN_KEY) ?? {}
      const next: Record<string, SeenByChain> = {}
      for (const filter of watched) {
        const firstRun = !(filter.id in seenAll)
        const seen: SeenByChain = { ...(seenAll[filter.id] ?? {}) }
        const fresh: Array<{ chain: string; token: SmartMoneyBuy }> = []
        for (const chain of filter.alertChains?.length ? filter.alertChains : CHAIN_IDS) {
          try {
            const { items } = await api.smartMoney.buys({
              chain,
              pageSize: 100,
              sortBy: 'walletCount',
              rules: JSON.stringify(filter.rules),
            })
            const result = diff(items ?? [], seen[chain])
            fresh.push(...result.fresh.map((token) => ({ chain, token })))
            seen[chain] = result.seen
          } catch {
            // Try again next time.
          }
        }
        if (cancelled) return
        next[filter.id] = seen
        // A newly switched-on alert first learns what already matches, so it doesn't announce it all.
        if (!firstRun && fresh.length > 0) {
          announce(`Alert: ${filter.name}`, fresh, `/wallets?filter=${filter.id}&chain=${fresh[0].chain}`)
        }
      }
      // Filters that were deleted or switched off drop out, so switching one back on starts fresh.
      write(CUSTOM_SEEN_KEY, next)
    }

    const check = async () => {
      if (earlyEnabled) await checkEarly()
      if (!cancelled && watched.length) await checkCustom()
    }

    void check()
    const timer = window.setInterval(() => void check(), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
    // alertKey stands in for alertFilters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, earlyEnabled, alertKey, navigate, setUnseen])

  return null
}
