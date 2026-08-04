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
import { isActiveSubscription } from '@/lib/plans'
import { SELECT_PLAN_WELCOME_PATH } from '@/lib/subscription-routes'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isDemo } = useAuth()
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
      const result = await login(email, password)
      if (result.type === 'confirm_email') {
        setInfo(result.message)
        return
      }

      const redirectParam = searchParams.get('redirect')
      const dashboardPaths = ['/wallets', '/tokens', '/watchlist']
      const hasPlan = isActiveSubscription(result.user)

      if (redirectParam && (!dashboardPaths.includes(redirectParam) || hasPlan)) {
        navigate(redirectParam, { replace: true })
        return
      }

      navigate(hasPlan ? '/wallets' : SELECT_PLAN_WELCOME_PATH, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
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
          <h1 className="text-4xl font-bold text-center mb-4">Login</h1>
          {isDemo ? (
            <p className="mb-10 text-center text-sm text-white/45">
              Demo mode — use any email and password to explore the app.
            </p>
          ) : (
            <p className="mb-10 text-center text-sm text-white/45">
              Sign in to access your NodeX dashboard.
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {info && <p className="text-nodex-teal text-sm text-center">{info}</p>}
            {error && <p className="text-nodex-red text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <p className="text-center text-sm text-nodex-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-nodex-teal hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </main>
    </PageLayout>
  )
}
