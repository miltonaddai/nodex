import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, CreditCard, KeyRound, LogOut, Moon, SlidersHorizontal, Sun, User, Volume2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { ChainSelector, type Chain } from '@/components/dashboard/ChainSelector'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { api, type BillingDetails } from '@/lib/api'
import { playChime } from '@/lib/chime'
import { formatRenewalDate, isActiveSubscription, PLANS } from '@/lib/plans'
import { SELECT_PLAN_PATH } from '@/lib/subscription-routes'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'
import { cn } from '@/lib/utils'
import { useDashboardPreferencesStore } from '@/stores/dashboardPreferencesStore'
import { useEarlySignalStore } from '@/stores/earlySignalStore'

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: KeyRound },
] as const

type SectionId = (typeof sections)[number]['id']

const button =
  'inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50'
const primaryButton = cn(button, 'bg-whalemo-accent text-whalemo-on-accent hover:brightness-110')
const secondaryButton = cn(button, 'border border-whalemo-line bg-whalemo-surface hover:border-whalemo-teal/50')

/** One setting: what it is on the left, the control on the right (stacked on phones). */
function Row({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-whalemo-line px-5 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        {description ? <div className="mt-1 max-w-md text-sm text-whalemo-muted">{description}</div> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <motion.section
      key={title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h2 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1 mb-6 text-sm text-whalemo-muted">{description}</p>
      <div className="border border-whalemo-line bg-whalemo-surface">{children}</div>
    </motion.section>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 border transition-colors',
        checked ? 'border-whalemo-accent bg-whalemo-accent' : 'border-whalemo-line bg-whalemo-raised'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 transition-all',
          checked ? 'left-[22px] bg-whalemo-on-accent' : 'left-0.5 bg-whalemo-muted'
        )}
      />
    </button>
  )
}

function Notice({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  return (
    <p className={cn('mt-2 text-xs', tone === 'ok' ? 'text-whalemo-teal' : 'text-whalemo-red')}>{children}</p>
  )
}

/* ---------- Sections ---------- */

function ProfileSection() {
  const { user, applyUserProfile } = useAuth()
  const [name, setName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const unchanged = name.trim() === (user?.displayName ?? '')

  const save = async () => {
    setSaving(true)
    setStatus(null)
    try {
      const profile = await api.auth.updateProfile({ displayName: name.trim() || null })
      applyUserProfile(profile)
      setStatus({ tone: 'ok', text: 'Saved.' })
    } catch (err) {
      setStatus({ tone: 'error', text: err instanceof Error ? err.message : 'Could not save your name' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel title="Profile" description="How you appear in WhaleMo.">
      <Row title="Email" description="The address you sign in with.">
        <span className="text-sm text-whalemo-muted">{user?.email}</span>
      </Row>
      <Row title="Display name" description="Shown on your account menu instead of your email initial.">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
          className="flex w-full flex-col gap-2 sm:w-auto"
        >
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="Your name"
              className="glass-input h-10 w-full min-w-0 px-3 text-sm sm:w-56"
            />
            <button type="submit" disabled={saving || unchanged} className={primaryButton}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
        </form>
      </Row>
    </Panel>
  )
}

function statusText(status: BillingDetails['status'] | undefined, active: boolean) {
  if (status === 'past_due') return 'Payment failed'
  if (!active) return 'Not active'
  return status === 'trialing' ? 'Trial' : 'Active'
}

function SubscriptionSection() {
  const { user, refreshUser } = useAuth()
  const [details, setDetails] = useState<BillingDetails | null>(null)
  const [loading, setLoading] = useState(SUBSCRIPTIONS_ENABLED)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState('')
  const plan = PLANS[0]

  useEffect(() => {
    if (!SUBSCRIPTIONS_ENABLED) return
    void refreshUser()
    api.billing
      .subscription()
      .then(setDetails)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your subscription'))
      .finally(() => setLoading(false))
  }, [refreshUser])

  const openPortal = async () => {
    setError('')
    setOpening(true)
    try {
      const { url } = await api.billing.portal()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the billing portal')
      setOpening(false)
    }
  }

  if (!SUBSCRIPTIONS_ENABLED) {
    return (
      <Panel title="Subscription" description="Your plan and billing.">
        <Row title="Plan" description="Every WhaleMo feature is included on your account.">
          <span className="border border-whalemo-teal/40 bg-whalemo-teal/10 px-2.5 py-1 text-xs font-semibold text-whalemo-teal">
            All access
          </span>
        </Row>
      </Panel>
    )
  }

  const active = isActiveSubscription(user) || details?.status === 'active' || details?.status === 'trialing'
  const card = details?.paymentMethod
  const renews = formatRenewalDate(details?.currentPeriodEnd ?? user?.subscription.currentPeriodEnd ?? null)

  return (
    <Panel title="Subscription" description="Your plan, payment method and invoices.">
      {loading ? (
        <div className="space-y-3 p-6">
          <div className="h-4 w-40 animate-pulse bg-whalemo-raised" />
          <div className="h-4 w-64 animate-pulse bg-whalemo-raised" />
        </div>
      ) : (
        <>
          <Row title="Plan" description={plan.description}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{plan.name}</span>
              <span
                className={cn(
                  'border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                  details?.status === 'past_due'
                    ? 'border-whalemo-red/40 bg-whalemo-red/10 text-whalemo-red'
                    : active
                      ? 'border-whalemo-teal/40 bg-whalemo-teal/10 text-whalemo-teal'
                      : 'border-whalemo-line text-whalemo-muted'
                )}
              >
                {statusText(details?.status, active)}
              </span>
            </div>
          </Row>
          <Row title="Price">
            <span className="text-sm tabular-nums">
              ${details?.amount ?? plan.price}
              <span className="text-whalemo-muted"> / {details?.interval ?? 'month'}</span>
            </span>
          </Row>
          {active && renews ? (
            <Row title="Renews" description="Your card is charged automatically on this date.">
              <span className="text-sm">{renews}</span>
            </Row>
          ) : null}
          {card ? (
            <Row title="Payment method">
              <span className="text-sm">
                {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• {card.last4}
                <span className="text-whalemo-muted">
                  {' '}
                  · expires {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                </span>
              </span>
            </Row>
          ) : null}
          <Row
            title={active ? 'Manage billing' : 'Subscribe'}
            description={
              active
                ? 'Update your card, download invoices or cancel. Opens Stripe’s secure billing portal.'
                : `Unlock every tool on every chain for $${plan.price}/month. Cancel anytime.`
            }
          >
            <div className="flex flex-col items-start gap-1 sm:items-end">
              {active ? (
                <button type="button" onClick={() => void openPortal()} disabled={opening || details?.demo} className={secondaryButton}>
                  <CreditCard className="h-4 w-4" />
                  {opening ? 'Opening…' : 'Open billing portal'}
                </button>
              ) : (
                <Link to={SELECT_PLAN_PATH} className={primaryButton}>
                  Subscribe for ${plan.price}/month
                </Link>
              )}
              {details?.demo && active ? <Notice tone="error">The billing portal is not available in demo mode.</Notice> : null}
            </div>
          </Row>
        </>
      )}
      {error ? <div className="border-t border-whalemo-line px-6 py-3"><Notice tone="error">{error}</Notice></div> : null}
    </Panel>
  )
}

function PreferencesSection() {
  const { theme, toggleTheme } = useTheme()
  const preferredChain = useDashboardPreferencesStore((s) => s.preferredChain)
  const setPreferredChain = useDashboardPreferencesStore((s) => s.setPreferredChain)

  const changeChain = (chain: Chain) => {
    setPreferredChain(chain)
    // Also saved to the account so it follows you to other devices. Best effort.
    api.auth.updateProfile({ defaultChain: chain }).catch(() => {})
  }

  return (
    <Panel title="Preferences" description="How the dashboard looks and what it opens on.">
      <Row title="Default chain" description="The chain Smart Wallets, Insiders and the scanner open on.">
        <ChainSelector value={preferredChain} onChange={changeChain} />
      </Row>
      <Row title="Theme" description="Saved in this browser.">
        <div className="flex border border-whalemo-line p-1">
          {(['light', 'dark'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={theme === option}
              onClick={() => theme !== option && toggleTheme()}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 text-sm capitalize transition-colors',
                theme === option ? 'bg-whalemo-accent text-whalemo-on-accent' : 'text-whalemo-muted hover:text-white'
              )}
            >
              {option === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {option}
            </button>
          ))}
        </div>
      </Row>
    </Panel>
  )
}

function NotificationsSection() {
  const alertsEnabled = useEarlySignalStore((s) => s.alertsEnabled)
  const setAlertsEnabled = useEarlySignalStore((s) => s.setAlertsEnabled)
  return (
    <Panel title="Notifications" description="Alerts while WhaleMo is open in this browser.">
      <Row
        title="Early-signal alerts"
        description="A chime and a notification when top traders pile into a small-cap token, on any WhaleMo page you leave open."
      >
        <Toggle
          label="Early-signal alerts"
          checked={alertsEnabled}
          onChange={(next) => {
            setAlertsEnabled(next)
            if (next) playChime()
          }}
        />
      </Row>
      <Row title="Alert sound" description="Hear what an early-signal alert sounds like.">
        <button type="button" onClick={playChime} className={secondaryButton}>
          <Volume2 className="h-4 w-4" />
          Play sound
        </button>
      </Row>
    </Panel>
  )
}

function SecuritySection() {
  const { user, isDemo, logout } = useAuth()
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const sendReset = async () => {
    if (!user) return
    setSending(true)
    setStatus(null)
    try {
      await api.auth.forgotPassword(user.email)
      setStatus({ tone: 'ok', text: `Reset link sent to ${user.email}.` })
    } catch (err) {
      setStatus({ tone: 'error', text: err instanceof Error ? err.message : 'Could not send the reset email' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Panel title="Security" description="Your password and session.">
      {!isDemo ? (
        <Row title="Password" description="We’ll email you a link to choose a new password.">
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <button type="button" onClick={() => void sendReset()} disabled={sending} className={secondaryButton}>
              <KeyRound className="h-4 w-4" />
              {sending ? 'Sending…' : 'Send reset link'}
            </button>
            {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
          </div>
        </Row>
      ) : null}
      <Row title="Log out" description="Sign out of WhaleMo in this browser.">
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/')
          }}
          className={cn(secondaryButton, 'text-whalemo-red hover:border-whalemo-red/50')}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </Row>
    </Panel>
  )
}

/* ---------- Page ---------- */

export function SettingsPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const active: SectionId = sections.some((s) => s.id === requested) ? (requested as SectionId) : 'profile'
  const select = (id: SectionId) => setParams({ tab: id }, { replace: true })

  return (
    <PageLayout>
      <Navbar variant={isActiveSubscription(user) ? 'dashboard' : 'public'} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16 md:px-8">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">Settings</h1>
        <p className="mt-2 mb-8 text-sm text-whalemo-muted">Manage your account, subscription and preferences.</p>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* Section nav: a scrolling strip on phones, a sticky list on wide screens. */}
          <nav
            aria-label="Settings sections"
            className="-mx-4 overflow-x-auto px-4 lg:sticky lg:top-28 lg:mx-0 lg:self-start lg:overflow-visible lg:px-0"
          >
            <ul className="flex gap-1 border-b border-whalemo-line lg:flex-col lg:border-b-0 lg:border-l">
              {sections.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => select(id)}
                    aria-current={active === id ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 whitespace-nowrap px-3 py-2.5 text-sm transition-colors lg:-ml-px lg:border-l-2',
                      '-mb-px border-b-2 lg:mb-0 lg:border-b-0',
                      active === id
                        ? 'border-whalemo-teal font-semibold text-whalemo-teal'
                        : 'border-transparent text-whalemo-muted hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0">
            {active === 'profile' ? <ProfileSection /> : null}
            {active === 'subscription' ? <SubscriptionSection /> : null}
            {active === 'preferences' ? <PreferencesSection /> : null}
            {active === 'notifications' ? <NotificationsSection /> : null}
            {active === 'security' ? <SecuritySection /> : null}
          </div>
        </div>
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
