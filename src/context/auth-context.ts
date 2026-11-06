import { useShallow } from 'zustand/react/shallow'
import type { UserProfile } from '@/lib/api'
import { isDemoMode } from '@/lib/demo-auth'
import { useAuthStore } from '@/stores/authStore'

export interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  isDemo: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (email: string, password: string, plan?: 'starter' | 'pro') => Promise<AuthResult>
  logout: () => void
  refreshUser: () => Promise<void>
  applyUserProfile: (profile: UserProfile) => void
}

export type AuthResult =
  | { type: 'success'; user: UserProfile }
  | { type: 'confirm_email'; message: string }

/** The session and subscription, from the auth store (stores/authStore). */
export function useAuth(): AuthContextValue {
  const state = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      loading: s.loading,
      login: s.login,
      signup: s.signup,
      logout: s.logout,
      refreshUser: s.refreshUser,
      applyUserProfile: s.applyUserProfile,
    }))
  )
  return { ...state, isAuthenticated: Boolean(state.user), isDemo: isDemoMode() }
}
