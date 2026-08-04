import type { UserProfile } from '@/lib/api'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'

export const PLANS = [
  {
    id: 'starter' as const,
    name: 'NodeX Starter',
    shortName: 'Starter',
    price: 29,
    description: 'Get started with the essentials of on-chain trading data.',
    features: ['Top wallet rankings', 'Token analytics', '10 tracked wallets', 'Daily data refresh'],
    cta: 'Choose Starter',
    variant: 'outline' as const,
    popular: false,
  },
  {
    id: 'pro' as const,
    name: 'NodeX Pro',
    shortName: 'Pro',
    price: 49,
    description: 'Advanced tools and wallet tracking for serious traders.',
    features: [
      'Everything in Starter',
      'Unlimited watchlists',
      'Real-time wallet alerts',
      'Advanced filters',
      'Priority support',
    ],
    highlight: 'Unlimited watchlists',
    cta: 'Choose Pro',
    variant: 'default' as const,
    popular: true,
  },
] as const

export type PlanId = (typeof PLANS)[number]['id']

export function parsePlanId(value: string | null): PlanId | null {
  return value === 'starter' || value === 'pro' ? value : null
}

export function isActiveSubscription(profile: UserProfile | null) {
  if (!profile) return false
  // SUBSCRIPTIONS DISABLED — every guard, the navbar and the plan banner read entitlement through
  // this function, so bypassing it here disables the paywall app-wide without touching them.
  // Authentication is unaffected: a null profile still means "not entitled".
  if (!SUBSCRIPTIONS_ENABLED) return true
  const { status } = profile.subscription
  return status === 'active' || status === 'trialing'
}

/** True when the user must purchase a plan before accessing the app. */
export function requiresPlanSelection(profile: UserProfile | null) {
  return Boolean(profile) && !isActiveSubscription(profile)
}

export function planButtonLabel(
  planId: PlanId,
  profile: UserProfile | null,
  isActive: boolean
): string {
  if (profile && profile.subscription.plan === planId && isActive) {
    return 'Current plan'
  }

  if (profile && isActive) {
    if (planId === 'pro' && profile.subscription.plan === 'starter') {
      return 'Upgrade to Pro'
    }
    if (planId === 'starter' && profile.subscription.plan === 'pro') {
      return 'Switch to Starter'
    }
  }

  const plan = PLANS.find((entry) => entry.id === planId)
  return plan?.cta ?? 'Subscribe'
}

export function formatRenewalDate(iso: string | null) {
  if (!iso) return null
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso))
}
