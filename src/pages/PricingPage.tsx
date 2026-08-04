import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Check, CreditCard, Sparkles } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { api } from '@/lib/api'
import { useAuth } from '@/context/auth-context'
import {
  formatRenewalDate,
  isActiveSubscription,
  parsePlanId,
  planButtonLabel,
  PLANS,
  type PlanId,
} from '@/lib/plans'
import { cn } from '@/lib/utils'

export function PricingPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAuthenticated, loading: authLoading, refreshUser, applyUserProfile } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')
  const autoCheckoutRef = useRef(false)

  const preselectedPlan = parsePlanId(searchParams.get('plan'))
  const welcome = searchParams.get('welcome') === '1'
  const canceled = searchParams.get('canceled') === '1'
  const updated = searchParams.get('updated') === '1'
  const hasActiveSub = isActiveSubscription(user)
  const isPastDue = user?.subscription.status === 'past_due'

  const clearQueryFlag = useCallback(
    (key: string) => {
      const next = new URLSearchParams(searchParams)
      next.delete(key)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (isAuthenticated) {
      void refreshUser()
    }
  }, [isAuthenticated, refreshUser])

  const startCheckout = useCallback(
    async (planId: PlanId) => {
      setError('')

      if (!isAuthenticated) {
        navigate(`/signup?plan=${planId}`)
        return
      }

      setLoadingPlan(planId)
      try {
        const result = await api.billing.checkout(planId)

        if ('updated' in result && result.updated) {
          if (result.user) applyUserProfile(result.user)
          else await refreshUser()
          navigate('/pricing?updated=1', { replace: true })
          return
        }

        if (result.user) applyUserProfile(result.user)

        if (result.url.startsWith('http')) {
          window.location.href = result.url
          return
        }

        navigate(result.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to start checkout')
      } finally {
        setLoadingPlan(null)
      }
    },
    [applyUserProfile, isAuthenticated, navigate, refreshUser]
  )

  useEffect(() => {
    if (authLoading || !isAuthenticated || !preselectedPlan || autoCheckoutRef.current) return
    if (hasActiveSub) return

    autoCheckoutRef.current = true
    void startCheckout(preselectedPlan)
  }, [authLoading, hasActiveSub, isAuthenticated, preselectedPlan, startCheckout])

  useEffect(() => {
    if (!updated) return
    const timer = window.setTimeout(() => clearQueryFlag('updated'), 8000)
    return () => window.clearTimeout(timer)
  }, [clearQueryFlag, updated])

  const handleManageBilling = async () => {
    setError('')
    setPortalLoading(true)
    try {
      const { url } = await api.billing.portal()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open billing portal')
      setPortalLoading(false)
    }
  }

  return (
    <PageLayout>
      <Navbar variant={isAuthenticated ? 'dashboard' : 'public'} />
      <main className="min-h-screen px-4 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Select a Plan</h1>
          {welcome && !hasActiveSub && (
            <p className="text-nodex-teal text-sm mb-2">Account created — choose a plan to unlock your dashboard.</p>
          )}
          <p className="text-white/50 max-w-xl mx-auto">
            Subscribe securely with Stripe. Cancel or change your plan anytime from the billing portal.
          </p>

          {updated && (
            <div className="mx-auto mt-6 flex max-w-lg items-center justify-center gap-2 rounded-full border border-nodex-teal/30 bg-nodex-teal/10 px-4 py-2 text-sm text-nodex-teal">
              <Sparkles className="h-4 w-4 shrink-0" />
              Your plan is active. Welcome to NodeX.
            </div>
          )}

          {canceled && (
            <p className="mt-4 text-sm text-nodex-muted">Checkout was canceled. You can try again below.</p>
          )}

          {isPastDue && (
            <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-3 rounded-2xl border border-nodex-red/30 bg-nodex-red/10 px-5 py-4 text-sm text-nodex-red sm:flex-row sm:justify-center">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Your last payment failed. Update your payment method to restore access.</span>
              <Button
                variant="outline"
                size="sm"
                className="normal-case tracking-normal border-nodex-red/40 text-nodex-red hover:bg-nodex-red/10"
                disabled={portalLoading}
                onClick={() => void handleManageBilling()}
              >
                Update payment
              </Button>
            </div>
          )}

          {isAuthenticated && user && !hasActiveSub && !isPastDue && (
            <p className="mt-6 text-sm text-white/45">
              Choose a plan below to unlock your dashboard and watchlists.
            </p>
          )}

          {error && <p className="mt-4 text-sm text-nodex-red">{error}</p>}

          {user && hasActiveSub && (
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <span className="rounded-full border border-nodex-teal/30 bg-nodex-teal/10 px-4 py-1.5 text-sm text-nodex-teal">
                Current plan: {user.subscription.plan === 'pro' ? 'Pro' : 'Starter'}
                {user.subscription.currentPeriodEnd
                  ? ` · Renews ${formatRenewalDate(user.subscription.currentPeriodEnd)}`
                  : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="normal-case tracking-normal"
                disabled={portalLoading}
                onClick={() => void handleManageBilling()}
              >
                <CreditCard className="h-4 w-4" />
                {portalLoading ? 'Opening...' : 'Manage billing'}
              </Button>
            </div>
          )}
        </motion.div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {PLANS.map((plan, i) => {
            const isCurrent = user?.subscription.plan === plan.id && hasActiveSub
            const isHighlighted = preselectedPlan === plan.id
            const buttonLabel = planButtonLabel(plan.id, user, hasActiveSub)

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <GlassPanel
                  className={cn(
                    'relative flex h-full flex-col p-8 transition-shadow',
                    isHighlighted && 'ring-2 ring-nodex-teal/50'
                  )}
                  hover
                  variant="solid"
                  featured={plan.popular}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-nodex-teal text-nodex-bg text-xs font-bold tracking-wider uppercase">
                      Most Popular
                    </span>
                  )}
                  <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-nodex-muted"> /mo</span>
                  </div>
                  <p className="text-nodex-muted text-sm mb-8">{plan.description}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-nodex-teal shrink-0" />
                        <span
                          className={
                            // Only the Pro plan declares a `highlight`, so narrow before reading it.
                            'highlight' in plan && feature === plan.highlight
                              ? 'text-nodex-teal font-semibold'
                              : ''
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.variant}
                    className="w-full"
                    disabled={loadingPlan !== null || isCurrent || authLoading}
                    onClick={() => void startCheckout(plan.id)}
                  >
                    {loadingPlan === plan.id
                      ? hasActiveSub
                        ? 'Updating plan...'
                        : 'Redirecting to Stripe...'
                      : buttonLabel}
                  </Button>
                </GlassPanel>
              </motion.div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-sm text-white/40">
          {isAuthenticated ? (
            <>
              Questions about billing?{' '}
              <button
                type="button"
                onClick={() => void handleManageBilling()}
                className="text-nodex-teal hover:underline"
              >
                Open customer portal
              </button>
              {hasActiveSub && (
                <>
                  {' '}
                  ·{' '}
                  <Link to="/wallets" className="text-nodex-teal hover:underline">
                    Go to dashboard
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-nodex-teal hover:underline">
                Login
              </Link>
            </>
          )}
        </p>
      </main>
    </PageLayout>
  )
}
