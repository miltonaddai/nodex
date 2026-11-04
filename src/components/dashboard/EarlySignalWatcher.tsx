import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { api, type SmartMoneyBuy } from '@/lib/api'
import { CHAIN_IDS, chainLabel } from '@/lib/chains'
import { playChime } from '@/lib/chime'
import { formatCurrency } from '@/lib/utils'
import { useEarlySignalStore } from '@/stores/earlySignalStore'
import { toast } from '@/stores/toastStore'

/**
 * Watches for new early signals while WhaleMo is open on any page, and announces each new one with
 * a chime and a toast. New data only lands once per pipeline run (every 2 hours), but checking
 * every few minutes catches a run soon after it finishes. Each check reads the API's cached
 * snapshot, so it costs no data-provider calls.
 */
const POLL_MS = 3 * 60 * 1000
const CHAINS = CHAIN_IDS
const SEEN_KEY = 'nodex_early_seen_v1'
const MAX_SEEN = 500

/** Contracts already announced, per chain. Null on a browser's first ever check. */
function loadSeen(): Record<string, string[]> | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : null
  } catch {
    return null
  }
}

function saveSeen(seen: Record<string, string[]>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
  } catch {
    // Storage unavailable. Signals may be announced again after a reload.
  }
}

async function fetchSignals(chain: string): Promise<SmartMoneyBuy[]> {
  const result = await api.smartMoney.buys({ chain, preset: 'early', pageSize: 100, sortBy: 'walletCount' })
  return result.items ?? []
}

export function EarlySignalWatcher() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const alertsEnabled = useEarlySignalStore((s) => s.alertsEnabled)
  const unseen = useEarlySignalStore((s) => s.unseen)
  const setUnseen = useEarlySignalStore((s) => s.setUnseen)
  const baseTitle = useRef(document.title)

  // Tab title shows a count while new signals wait to be looked at.
  useEffect(() => {
    document.title = unseen > 0 ? `(${unseen}) Early signal · ${baseTitle.current}` : baseTitle.current
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

  useEffect(() => {
    if (!isAuthenticated || !alertsEnabled) return
    let cancelled = false

    const check = async () => {
      const stored = loadSeen()
      const firstRun = stored === null
      const seen: Record<string, string[]> = stored ?? {}
      const fresh: Array<{ chain: string; token: SmartMoneyBuy }> = []

      for (const chain of CHAINS) {
        try {
          const signals = await fetchSignals(chain)
          const known = new Set(seen[chain] ?? [])
          for (const token of signals) if (!known.has(token.contract)) fresh.push({ chain, token })
          seen[chain] = [...new Set([...signals.map((t) => t.contract), ...(seen[chain] ?? [])])].slice(0, MAX_SEEN)
        } catch {
          // Offline or signed out mid-check. Try again next time.
        }
      }
      if (cancelled) return
      saveSeen(seen)
      // The first check in a browser only learns what is already listed, so it does not
      // announce every existing signal at once.
      if (firstRun || fresh.length === 0) return

      playChime()
      const first = fresh[0].token
      toast({
        title: fresh.length === 1 ? `Early signal: ${first.symbol || first.name}` : `${fresh.length} new early signals`,
        description:
          fresh.length === 1
            ? `${first.walletCount} top traders buying at ${formatCurrency(first.marketCap, true)} market cap${fresh[0].chain !== 'solana' ? ` on ${chainLabel(fresh[0].chain)}` : ''}.`
            : fresh.map((f) => f.token.symbol || f.token.name).slice(0, 4).join(', ') + (fresh.length > 4 ? '…' : ''),
        action: {
          label: 'View',
          onClick: () => navigate(`/wallets?preset=early&chain=${fresh[0].chain}`),
        },
        durationMs: 20_000,
      })
      if (!document.hasFocus()) setUnseen(useEarlySignalStore.getState().unseen + fresh.length)
    }

    void check()
    const timer = window.setInterval(() => void check(), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [isAuthenticated, alertsEnabled, navigate, setUnseen])

  return null
}
