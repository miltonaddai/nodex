/**
 * Master switch for the subscription/paywall layer, mirroring the backend's
 * SUBSCRIPTIONS_ENABLED flag.
 *
 * Off by default: this is a personal-use deployment, so any logged-in user has full access.
 * None of the billing code has been deleted — the Stripe service, billing routes, pricing and
 * billing pages, guards and banner all still exist and still compile. To restore the paywall:
 *
 *   1. set VITE_SUBSCRIPTIONS_ENABLED=true in frontend/.env
 *   2. set SUBSCRIPTIONS_ENABLED=true in backend/.env
 *   3. un-comment the blocks marked "SUBSCRIPTIONS DISABLED" (routes, navbar links,
 *      backend billing router mount and Stripe webhook)
 */
export const SUBSCRIPTIONS_ENABLED = import.meta.env.VITE_SUBSCRIPTIONS_ENABLED === 'true'
