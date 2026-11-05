/**
 * New accounts are open unless VITE_SIGNUPS_ENABLED is 'false'. Closed, signup links stay visible
 * but show a toast instead of opening the form, and /signup redirects to login.
 *
 * Open by default so a deploy that never sets the variable (Vite reads it at build time, from the
 * host's settings, not the git-ignored .env) still takes signups.
 *
 * This only gates the frontend. The backend's /api/auth/signup still accepts direct requests.
 */
export const SIGNUPS_ENABLED = import.meta.env.VITE_SIGNUPS_ENABLED !== 'false'

export const SIGNUPS_CLOSED_MESSAGE = {
  title: 'Signups are closed',
  description: 'WhaleMo is not accepting new accounts right now. Existing users can still log in.',
}
