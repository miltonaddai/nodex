import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, clearSessionTokens, storeSessionTokens, TOKEN_KEY, type AuthSuccess, type UserProfile } from '@/lib/api'
import { isDemoMode } from '@/lib/demo-auth'
import { AuthContext, type AuthResult } from '@/context/auth-context'

const USER_KEY = 'nodex_user'

function readCachedUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => readCachedUser())
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  const persistSession = useCallback((session: AuthSuccess) => {
    storeSessionTokens(session)
    localStorage.setItem(USER_KEY, JSON.stringify(session.user))
    setUser(session.user)
    setLoading(false)
  }, [])

  const clearSession = useCallback(() => {
    clearSessionTokens()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const profile = await api.auth.me()
      localStorage.setItem(USER_KEY, JSON.stringify(profile))
      setUser(profile)
    } catch (err) {
      // Log out only when the server rejects the session. If the backend is briefly unreachable,
      // keep the cached user rather than signing them out.
      if (err instanceof ApiError && err.status === 401) clearSession()
    } finally {
      setLoading(false)
    }
  }, [clearSession])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const result = await api.auth.login(email, password)
      if ('needsEmailConfirmation' in result) {
        return { type: 'confirm_email', message: result.message }
      }
      persistSession(result)
      return { type: 'success', user: result.user }
    },
    [persistSession]
  )

  const signup = useCallback(
    async (email: string, password: string, plan?: 'starter' | 'pro'): Promise<AuthResult> => {
      const result = await api.auth.signup(email, password, plan)
      if ('needsEmailConfirmation' in result) {
        return { type: 'confirm_email', message: result.message }
      }
      persistSession(result)
      return { type: 'success', user: result.user }
    },
    [persistSession]
  )

  const applyUserProfile = useCallback((profile: UserProfile) => {
    localStorage.setItem(USER_KEY, JSON.stringify(profile))
    setUser(profile)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    void import('@/stores/reset-dashboard-stores').then((m) => m.resetDashboardStores())
  }, [clearSession])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isDemo: isDemoMode(),
      login,
      signup,
      logout,
      refreshUser,
      applyUserProfile,
    }),
    [user, loading, login, signup, logout, refreshUser, applyUserProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { useAuth, type AuthResult } from '@/context/auth-context'
