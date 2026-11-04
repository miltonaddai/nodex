import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/ui/icon-input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import {
  DASHBOARD_HOME_PATH,
  SELECT_PLAN_PATH,
  SELECT_PLAN_WELCOME_PATH,
} from '@/lib/subscription-routes'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'

export function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signup, isDemo } = useAuth()
  const selectedPlan = searchParams.get('plan')
  const plan = selectedPlan === 'starter' || selectedPlan === 'pro' ? selectedPlan : undefined
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const result = await signup(email, password, plan)
      if (result.type === 'confirm_email') {
        setInfo(result.message)
        return
      }
      // SUBSCRIPTIONS DISABLED — there is no plan to pick, so go straight to the dashboard.
      // The paywall path below is restored by flipping VITE_SUBSCRIPTIONS_ENABLED back on.
      if (!SUBSCRIPTIONS_ENABLED) {
        navigate(DASHBOARD_HOME_PATH, { replace: true })
        return
      }

      navigate(
        plan ? `${SELECT_PLAN_PATH}?plan=${plan}&welcome=1` : SELECT_PLAN_WELCOME_PATH,
        { replace: true }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <Navbar />
      <AuthShell
        title="Create your account"
        subtitle={isDemo ? 'Demo mode: use any email and password to explore the app.' : 'Start tracking on-chain activity in under a minute.'}
        footer={
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-whalemo-teal hover:underline">
              Login
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <IconInput
              id="email"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <IconInput
              id="password"
              icon={Lock}
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {info && (
            <div className="space-y-3 text-center">
              <p className="text-whalemo-teal text-sm">{info}</p>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link to="/login">Go to login</Link>
              </Button>
            </div>
          )}
          {error && <p className="text-whalemo-red text-sm text-center">{error}</p>}
          {!info && (
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Get Started'}
            </Button>
          )}
        </form>
      </AuthShell>
    </PageLayout>
  )
}
