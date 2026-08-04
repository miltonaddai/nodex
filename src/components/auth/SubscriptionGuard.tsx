import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import {
  matchesRoutePath,
  PUBLIC_PATHS,
  selectPlanRedirect,
  SUBSCRIPTION_EXEMPT_PATHS,
} from '@/lib/subscription-routes'
import { isActiveSubscription } from '@/lib/plans'
import { RouteLoading } from './RouteLoading'

/**
 * Global guard: logged-in users without a subscription may only access
 * subscription-exempt routes (pricing). All other paths redirect to select plan.
 */
export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <RouteLoading />

  if (!isAuthenticated) {
    if (matchesRoutePath(location.pathname, PUBLIC_PATHS)) return children
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  }

  if (user && !isActiveSubscription(user)) {
    if (matchesRoutePath(location.pathname, SUBSCRIPTION_EXEMPT_PATHS)) return children
    return <Navigate to={selectPlanRedirect(location.pathname)} replace />
  }

  return children
}
