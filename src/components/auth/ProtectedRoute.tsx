import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { RouteLoading } from './RouteLoading'

/** Requires authentication only (no subscription). */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <RouteLoading />

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  }

  return children
}
