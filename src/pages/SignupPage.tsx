import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/ui/icon-input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import { SELECT_PLAN_PATH, SELECT_PLAN_WELCOME_PATH } from '@/lib/subscription-routes'
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
        navigate('/wallets', { replace: true })
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
      <main className="flex items-center justify-center min-h-screen px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <h1 className="text-4xl font-bold text-center mb-4">Sign Up</h1>
          {isDemo ? (
            <p className="mb-10 text-center text-sm text-white/45">
              Demo mode — use any email and password to explore the app.
            </p>
          ) : (
            <p className="mb-10 text-center text-sm text-white/45">
              Create your account to start tracking on-chain activity.
            </p>
          )}
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
                <p className="text-nodex-teal text-sm">{info}</p>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link to="/login">Go to login</Link>
                </Button>
              </div>
            )}
            {error && <p className="text-nodex-red text-sm text-center">{error}</p>}
            {!info && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Get Started'}
              </Button>
            )}
          </form>
          <p className="text-center text-sm text-nodex-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-nodex-teal hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </main>
    </PageLayout>
  )
}
