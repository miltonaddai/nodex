import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/auth-context'
import { isActiveSubscription } from '@/lib/plans'

export function PricingSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const sessionId = searchParams.get('session_id')
  const [message, setMessage] = useState('Confirming your subscription...')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!sessionId) {
      setError('Missing checkout session. Your payment may still have succeeded.')
      return
    }

    api.billing
      .verifySession(sessionId)
      .then(async ({ profile }) => {
        await refreshUser()
        setVerified(true)
        setMessage(
          `You're on NodeX ${profile.subscription.plan === 'pro' ? 'Pro' : 'Starter'}. Welcome aboard.`
        )
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to verify subscription')
      })
  }, [authLoading, sessionId, refreshUser])

  const hasActivePlan = isActiveSubscription(user) || verified

  return (
    <PageLayout>
      <Navbar variant={hasActivePlan ? 'dashboard' : 'public'} />
      <main className="flex min-h-screen items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          {authLoading || (!error && !verified && sessionId) ? (
            <>
              <Loader2 className="mx-auto mb-6 h-16 w-16 animate-spin text-nodex-teal" />
              <h1 className="mb-4 text-3xl font-bold">Payment successful</h1>
              <p className="mb-8 text-white/60">{message}</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-nodex-teal" />
              <h1 className="mb-4 text-3xl font-bold">Payment successful</h1>
              {error ? (
                <p className="mb-8 text-sm text-nodex-red">{error}</p>
              ) : (
                <p className="mb-8 text-white/60">{message}</p>
              )}
              <Button
                className="w-full"
                onClick={() => navigate(hasActivePlan ? '/wallets' : '/pricing')}
              >
                {hasActivePlan ? 'Go to dashboard' : 'Back to plans'}
              </Button>
              {error && (
                <Button asChild variant="outline" className="mt-3 w-full">
                  <Link to="/billing">View billing</Link>
                </Button>
              )}
            </>
          )}
        </motion.div>
      </main>
    </PageLayout>
  )
}
