/**
 * Master switch for the subscription/paywall layer, mirroring the backend's
 * SUBSCRIPTIONS_ENABLED flag. Set both to the same value: VITE_SUBSCRIPTIONS_ENABLED in
 * frontend/.env and SUBSCRIPTIONS_ENABLED in backend/.env.
 *
 * Off, any logged-in user has full access and the pricing and billing pages are not routed.
 */
export const SUBSCRIPTIONS_ENABLED = import.meta.env.VITE_SUBSCRIPTIONS_ENABLED === 'true'
