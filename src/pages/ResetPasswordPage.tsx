import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Seo } from '@/components/Seo'
import { Navbar } from '@/components/layout/Navbar'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/ui/icon-input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

/**
 * Supabase's reset email lands here with the recovery session in the URL hash
 * (#access_token=...&refresh_token=...&type=recovery), or an error if the link expired.
 */
function readRecoveryHash() {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  return {
    accessToken: hash.get('access_token') ?? '',
    refreshToken: hash.get('refresh_token') ?? '',
    error: hash.get('error_description')?.replace(/\+/g, ' ') ?? '',
  }
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [recovery] = useState(readRecoveryHash)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const linkProblem = recovery.error
    ? `${recovery.error}. Request a new reset link.`
    : !recovery.accessToken || !recovery.refreshToken
      ? 'This reset link is invalid. Request a new one.'
      : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const result = await api.auth.resetPassword({
        accessToken: recovery.accessToken,
        refreshToken: recovery.refreshToken,
        password,
      })
      navigate('/login', { replace: true, state: { info: result.message } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <Seo title="Set a new password" noindex />
      <Navbar />
      <AuthShell
        title="Set a new password"
        subtitle="Choose a new password for your WhaleMo account."
        footer={
          <Link to="/login" className="font-medium text-whalemo-teal hover:underline">
            Back to login
          </Link>
        }
      >
        {linkProblem ? (
          <div className="space-y-6 text-center">
            <p className="text-sm text-whalemo-red">{linkProblem}</p>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password">New password</Label>
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
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <IconInput
                id="confirm"
                icon={Lock}
                type="password"
                placeholder="Repeat the new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={6}
                required
              />
            </div>
            {error && <p className="text-whalemo-red text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        )}
      </AuthShell>
    </PageLayout>
  )
}
