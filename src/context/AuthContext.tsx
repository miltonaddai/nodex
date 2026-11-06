import { useEffect, type ReactNode } from 'react'
import { SUBSCRIPTION_REQUIRED_EVENT } from '@/lib/api'
import { PROFILE_STALE_MS, useAuthStore } from '@/stores/authStore'

/** How often an open tab re-checks the subscription with the API. */
const RECHECK_MS = 10 * 60 * 1000
/** A burst of refused requests (several tables loading at once) causes one re-check, not one each. */
const REFUSED_RECHECK_GAP_MS = 15 * 1000

/**
 * Keeps the auth store's profile, and so the subscription, current. The state itself lives in
 * the zustand store (stores/authStore); this only decides when to re-check it:
 *   - when the app opens;
 *   - when the user comes back to the tab and the last check is over 5 minutes old;
 *   - every 10 minutes while the tab is open;
 *   - at once when the API refuses a request for lack of a subscription, so a cancelled or failed
 *     plan sends the user to pricing straight away rather than leaving tables erroring.
 * Route guards react to the updated profile on their own.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { refreshUser } = useAuthStore.getState()
    void refreshUser()

    const recheckIfStale = () => {
      const { user, checkedAt } = useAuthStore.getState()
      if (user && document.visibilityState === 'visible' && Date.now() - checkedAt > PROFILE_STALE_MS) {
        void refreshUser()
      }
    }
    // Inside the gap, one re-check is queued for when it ends rather than dropped.
    let queued: number | undefined
    const onRefused = () => {
      if (queued !== undefined) return
      const wait = REFUSED_RECHECK_GAP_MS - (Date.now() - useAuthStore.getState().checkedAt)
      if (wait <= 0) {
        void refreshUser()
        return
      }
      queued = window.setTimeout(() => {
        queued = undefined
        void refreshUser()
      }, wait)
    }
    const timer = window.setInterval(() => {
      if (useAuthStore.getState().user && document.visibilityState === 'visible') void refreshUser()
    }, RECHECK_MS)

    window.addEventListener('focus', recheckIfStale)
    document.addEventListener('visibilitychange', recheckIfStale)
    window.addEventListener(SUBSCRIPTION_REQUIRED_EVENT, onRefused)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(queued)
      window.removeEventListener('focus', recheckIfStale)
      document.removeEventListener('visibilitychange', recheckIfStale)
      window.removeEventListener(SUBSCRIPTION_REQUIRED_EVENT, onRefused)
    }
  }, [])

  return children
}
