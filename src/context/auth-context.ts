import { createContext, useContext } from 'react'
import type { UserProfile } from '@/lib/api'

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

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
