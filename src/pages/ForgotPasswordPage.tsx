import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Seo } from '@/components/Seo'
import { Navbar } from '@/components/layout/Navbar'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/button'
import { IconInput } from '@/components/ui/icon-input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.forgotPassword(email)
      setSent(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <Seo title="Reset your password" noindex />
      <Navbar />
      <AuthShell
        title="Reset your password"
        subtitle="Enter your account email and we'll send you a link to set a new password."
        footer={
          <>
            Remembered it?{' '}
            <Link to="/login" className="font-medium text-whalemo-teal hover:underline">
              Back to login
            </Link>
          </>
        }
      >
        {sent ? (
          <p className="rounded-md border border-whalemo-line bg-whalemo-raised px-4 py-5 text-center text-sm">
            {sent} Check your inbox and spam folder.
          </p>
        ) : (
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
            {error && <p className="text-whalemo-red text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        )}
      </AuthShell>
    </PageLayout>
  )
}
