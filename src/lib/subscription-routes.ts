/** Where users without an active plan are sent to purchase a subscription. */
export const SELECT_PLAN_PATH = '/pricing'
export const SELECT_PLAN_WELCOME_PATH = '/pricing?welcome=1'
export const DASHBOARD_HOME_PATH = '/tokens'

/** No authentication required. */
export const PUBLIC_PATHS = ['/', '/login', '/signup'] as const

/** Authenticated users may access these without an active subscription. */
export const SUBSCRIPTION_EXEMPT_PATHS = ['/pricing', '/pricing/success', '/billing'] as const

/** Dashboard routes that require an active subscription. */
export const SUBSCRIPTION_REQUIRED_PATHS = ['/wallets', '/tokens', '/insiders', '/watchlist'] as const

export function matchesRoutePath(pathname: string, paths: readonly string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export function selectPlanRedirect(from?: string) {
  if (!from || from === SELECT_PLAN_PATH) return SELECT_PLAN_WELCOME_PATH
  return `${SELECT_PLAN_PATH}?welcome=1&redirect=${encodeURIComponent(from)}`
}
