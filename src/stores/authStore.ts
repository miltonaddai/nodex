import { create } from 'zustand'
import {
  api,
  ApiError,
  clearSessionTokens,
  storeSessionTokens,
  TOKEN_KEY,
  type AuthSuccess,
  type UserProfile,
} from '@/lib/api'
import type { AuthResult } from '@/context/auth-context'

/**
 * The signed-in user and their subscription, for the whole app. Route guards read the
 * subscription from here, so moving between dashboard pages needs no network call.
 *
 * The profile is cached in this browser (so a reload doesn't flash logged-out) and re-checked
 * with the API when the app opens, when the user returns to a stale tab, on a timer, and at once
 * if the API ever refuses a request for lack of a subscription. The API enforces the subscription
 * on every data request regardless; this keeps the screens in step with it.
 */

/** Same key as before the store existed, so nobody is signed out by the move. */
const USER_KEY = 'nodex_user'
/** A profile older than this is re-checked when the user comes back to the tab. */
export const PROFILE_STALE_MS = 5 * 60 * 1000

function readCachedUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

function writeCachedUser(user: UserProfile | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // Storage unavailable. The session still works for this visit.
  }
}

function hasToken(): boolean {
  try {
    return Boolean(localStorage.getItem(TOKEN_KEY))
  } catch {
    return false
  }
}

interface AuthState {
  user: UserProfile | null
  /** True until the first profile check finishes, when a session exists. */
  loading: boolean
  /** When the profile (and so the subscription) was last confirmed with the API. */
  checkedAt: number
  refreshUser: () => Promise<void>
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (email: string, password: string, plan?: 'starter' | 'pro') => Promise<AuthResult>
  logout: () => void
  applyUserProfile: (profile: UserProfile) => void
}

let refreshing: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set) => {
  const setUser = (user: UserProfile | null) => {
    writeCachedUser(user)
    set({ user, checkedAt: user ? Date.now() : 0 })
  }

  const persistSession = (session: AuthSuccess) => {
    storeSessionTokens(session)
    setUser(session.user)
    set({ loading: false })
  }

  const clearSession = () => {
    clearSessionTokens()
    setUser(null)
  }

  return {
    user: readCachedUser(),
    loading: hasToken(),
    checkedAt: 0,

    refreshUser: () => {
      // One check at a time; callers arriving meanwhile share it.
      refreshing ??= (async () => {
        if (!hasToken()) {
          setUser(null)
          set({ loading: false })
          return
        }
        try {
          setUser(await api.auth.me())
        } catch (err) {
          // Sign out only when the server rejects the session. If the API is briefly unreachable,
          // keep the cached user rather than signing them out.
          if (err instanceof ApiError && err.status === 401) clearSession()
        } finally {
          set({ loading: false })
          refreshing = null
        }
      })()
      return refreshing
    },

    login: async (email, password) => {
      const result = await api.auth.login(email, password)
      if ('needsEmailConfirmation' in result) return { type: 'confirm_email', message: result.message }
      persistSession(result)
      return { type: 'success', user: result.user }
    },

    signup: async (email, password, plan) => {
      const result = await api.auth.signup(email, password, plan)
      if ('needsEmailConfirmation' in result) return { type: 'confirm_email', message: result.message }
      persistSession(result)
      return { type: 'success', user: result.user }
    },

    logout: () => {
      clearSession()
      void import('@/stores/reset-dashboard-stores').then((m) => m.resetDashboardStores())
    },

    applyUserProfile: (profile) => setUser(profile),
  }
})
