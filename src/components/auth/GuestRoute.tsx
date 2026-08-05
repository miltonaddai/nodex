import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { isActiveSubscription } from '@/lib/plans'
import { DASHBOARD_HOME_PATH, SELECT_PLAN_PATH } from '@/lib/subscription-routes'
import { RouteLoading } from './RouteLoading'

/** Redirects authenticated users away from login/signup. */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) return <RouteLoading />

  if (isAuthenticated) {
    const destination = user && isActiveSubscription(user) ? DASHBOARD_HOME_PATH : SELECT_PLAN_PATH
    return <Navigate to={destination} replace />
  }

  return children
}
