import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, CreditCard, ExternalLink } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { api, type BillingDetails } from '@/lib/api'
import { useAuth } from '@/context/auth-context'
import { formatRenewalDate, isActiveSubscription, PLANS } from '@/lib/plans'
import { SELECT_PLAN_PATH } from '@/lib/subscription-routes'
import { cn } from '@/lib/utils'

function formatCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}

function statusLabel(status: BillingDetails['status']) {
  switch (status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trial'
    case 'past_due':
      return 'Past due'
    default:
      return 'Canceled'
  }
}

function statusClass(status: BillingDetails['status']) {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'border-nodex-teal/30 bg-nodex-teal/10 text-nodex-teal'
    case 'past_due':
      return 'border-nodex-red/30 bg-nodex-red/10 text-nodex-red'
    default:
      return 'border-white/20 bg-white/5 text-white/50'
  }
}

export function BillingPage() {
  const { user, refreshUser } = useAuth()
  const [details, setDetails] = useState<BillingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  const hasActivePlan = isActiveSubscription(user)
  const planMeta = PLANS.find((plan) => plan.id === details?.plan)

  useEffect(() => {
    void refreshUser()
    api.billing
      .subscription()
      .then(setDetails)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load billing'))
      .finally(() => setLoading(false))
  }, [refreshUser])

  const handleManage = async () => {
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
      <Navbar variant={hasActivePlan ? 'dashboard' : 'public'} />
      <main className="mx-auto min-h-screen max-w-2xl px-4 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Billing</h1>
          <p className="mb-8 text-sm text-white/50">Manage your NodeX subscription and payment method.</p>

          {error && <p className="mb-6 text-sm text-nodex-red">{error}</p>}

          {loading ? (
            <GlassPanel className="p-8 text-center text-white/50" variant="solid">
              Loading billing details...
            </GlassPanel>
          ) : !hasActivePlan || !details ? (
            <GlassPanel className="space-y-6 p-8 text-center" variant="solid">
              <p className="text-white/60">You don&apos;t have an active subscription yet.</p>
              <Button asChild>
                <Link to={SELECT_PLAN_PATH}>Select a plan</Link>
              </Button>
            </GlassPanel>
          ) : (
            <GlassPanel className="space-y-8 p-8" variant="solid">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-white/40">Current plan</p>
                  <h2 className="text-2xl font-bold">{planMeta?.name ?? `NodeX ${details.plan}`}</h2>
                  <p className="mt-1 text-sm text-white/50">{planMeta?.description}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    statusClass(details.status)
                  )}
                >
                  {statusLabel(details.status)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-3 flex items-center gap-2 text-white/40">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Price</span>
                  </div>
                  <p className="text-2xl font-bold">
                    ${details.amount}
                    <span className="text-base font-normal text-white/40"> /{details.interval}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-3 flex items-center gap-2 text-white/40">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Next billing date</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {details.currentPeriodEnd
                      ? formatRenewalDate(details.currentPeriodEnd)
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2 text-white/40">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Payment method</span>
                </div>
                {details.paymentMethod ? (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {formatCardBrand(details.paymentMethod.brand)} •••• {details.paymentMethod.last4}
                      </p>
                      <p className="text-sm text-white/50">
                        Expires {String(details.paymentMethod.expMonth).padStart(2, '0')}/
                        {details.paymentMethod.expYear}
                      </p>
                    </div>
                    <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-bold uppercase text-white/60">
                      {details.paymentMethod.brand.slice(0, 4)}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/50">
                    No card on file. Add one in the billing portal.
                  </p>
                )}
              </div>

              <Button
                className="w-full"
                disabled={portalLoading || details.demo}
                onClick={() => void handleManage()}
              >
                <ExternalLink className="h-4 w-4" />
                {portalLoading ? 'Opening portal...' : 'Manage subscription'}
              </Button>

              {details.demo && (
                <p className="text-center text-xs text-white/40">
                  Billing portal is unavailable in demo mode.
                </p>
              )}
            </GlassPanel>
          )}
        </motion.div>
      </main>
    </PageLayout>
  )
}
