import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { isActiveSubscription } from '@/lib/plans'
import { selectPlanRedirect } from '@/lib/subscription-routes'
import { RouteLoading } from './RouteLoading'

/**
 * Requires authentication and an active subscription (active or trialing).
 * Users without a plan are redirected to the select-plan page.
 */
export function SubscriptionRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth()
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

  if (!user || !isActiveSubscription(user)) {
    return <Navigate to={selectPlanRedirect(location.pathname)} replace />
  }

  return children
}
