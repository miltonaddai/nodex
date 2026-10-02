/**
 * New accounts are closed unless VITE_SIGNUPS_ENABLED is 'true'. Signup links stay visible but
 * show a toast instead of opening the form, and /signup redirects to login.
 *
 * This only gates the frontend. The backend's /api/auth/signup still accepts direct requests.
 */
export const SIGNUPS_ENABLED = import.meta.env.VITE_SIGNUPS_ENABLED === 'true'

export const SIGNUPS_CLOSED_MESSAGE = {
  title: 'Signups are closed',
  description: 'NodeX is not accepting new accounts right now. Existing users can still log in.',
}
