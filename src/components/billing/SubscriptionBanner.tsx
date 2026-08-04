import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { isActiveSubscription } from '@/lib/plans'

export function SubscriptionBanner() {
  const { user } = useAuth()

  if (!user || isActiveSubscription(user) || user.subscription.status === 'past_due') {
    return null
  }

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-nodex-teal/20 bg-nodex-teal/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 text-sm text-white/70">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-nodex-teal" />
        <p>Subscribe to a plan to unlock full access to rankings, analytics, and watchlists.</p>
      </div>
      <Button asChild size="sm" className="shrink-0 normal-case tracking-normal">
        <Link to="/pricing">Choose a plan</Link>
      </Button>
    </div>
  )
}
