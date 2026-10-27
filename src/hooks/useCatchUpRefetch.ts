import { useEffect, useRef, useState } from 'react'

/**
 * The worker's cron interval (backend/railway-worker.toml, TOKEN_SYNC_INTERVAL_MINUTES=120). The run that
 * produced the current data started this long before the recorded next run.
 */
const RUN_INTERVAL_MS = 120 * 60 * 1000
/** Data written this soon after a run starts still counts as that run's. */
const RUN_TOLERANCE_MS = 60 * 1000
const POLL_MS = 15 * 1000
/** Give up after this long behind (a run that failed to write), and fall back to the countdown. */
const MAX_CATCH_UP_MS = 20 * 60 * 1000

/**
 * Whether a response is older than the latest worker run.
 *
 * The API serves each view from a cached snapshot: when a run has happened since it was cached, the
 * first request still gets the old copy and only triggers a background refresh. So a response is
 * behind when its next run time has passed, or its data predates the run that last started.
 */
export function isBehindLatestRun(lastUpdated: string | null, nextUpdate: string | null, now = Date.now()): boolean {
  if (!lastUpdated || !nextUpdate) return false
  const next = Date.parse(nextUpdate)
  const last = Date.parse(lastUpdated)
  if (Number.isNaN(next) || Number.isNaN(last)) return false
  if (now >= next) return true
  return last < next - RUN_INTERVAL_MS - RUN_TOLERANCE_MS
}

/**
 * Quietly refetches while the shown data is behind the latest run, so a visitor gets the new data within
 * seconds instead of needing a reload. Also starts when the next-update countdown runs out on an open page.
 * `refetch` must not show a loading state.
 */
export function useCatchUpRefetch(lastUpdated: string | null, nextUpdate: string | null, refetch: () => void) {
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch
  const behindSince = useRef<number | null>(null)
  // Bumped when the countdown passes the next run on an idle page, to re-check
  const [wake, setWake] = useState(0)

  useEffect(() => {
    const now = Date.now()
    if (!isBehindLatestRun(lastUpdated, nextUpdate, now)) {
      behindSince.current = null
      const next = nextUpdate ? Date.parse(nextUpdate) : NaN
      if (Number.isNaN(next) || next <= now) return
      // setTimeout caps near 24.8 days; runs are hours apart
      const timer = setTimeout(() => setWake((n) => n + 1), Math.min(next - now + 1000, 2 ** 31 - 1))
      return () => clearTimeout(timer)
    }
    behindSince.current ??= now
    // An interval, not a timeout: a refetch that returns the same old values doesn't re-run this effect
    const timer = setInterval(() => {
      if (behindSince.current !== null && Date.now() - behindSince.current > MAX_CATCH_UP_MS) {
        clearInterval(timer)
        return
      }
      refetchRef.current()
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [lastUpdated, nextUpdate, wake])
}
