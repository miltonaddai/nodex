import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { AuthShell } from '@/components/layout/AuthShell'
import { SignupLink } from '@/components/auth/SignupLink'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/ui/icon-input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import { isActiveSubscription } from '@/lib/plans'
import { DASHBOARD_HOME_PATH, SELECT_PLAN_WELCOME_PATH } from '@/lib/subscription-routes'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { login, isDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  // The reset password page sends users here with a confirmation to show.
  const [info, setInfo] = useState((location.state as { info?: string } | null)?.info ?? '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.type === 'confirm_email') {
        setInfo(result.message)
        return
      }

      const redirectParam = searchParams.get('redirect')
      const dashboardPaths = ['/wallets', '/insiders', '/scanner', '/watchlist', '/alerts']
      const hasPlan = isActiveSubscription(result.user)

      if (redirectParam && (!dashboardPaths.includes(redirectParam) || hasPlan)) {
        navigate(redirectParam, { replace: true })
        return
      }

      navigate(hasPlan ? DASHBOARD_HOME_PATH : SELECT_PLAN_WELCOME_PATH, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <Navbar />
      <AuthShell
        title="Welcome back"
        subtitle={isDemo ? 'Demo mode: use any email and password to explore the app.' : 'Sign in to your WhaleMo dashboard.'}
        footer={
          <>
            Don&apos;t have an account?{' '}
            <SignupLink className="font-medium text-whalemo-teal hover:underline">Sign up</SignupLink>
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
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="password" className="mb-0">Password</Label>
              {!isDemo && (
                <Link to="/forgot-password" className="text-xs font-medium text-whalemo-teal hover:underline">
                  Forgot password?
                </Link>
              )}
            </div>
            <IconInput
              id="password"
              icon={Lock}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {info && <p className="text-whalemo-teal text-sm text-center">{info}</p>}
          {error && <p className="text-whalemo-red text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </AuthShell>
    </PageLayout>
  )
}
