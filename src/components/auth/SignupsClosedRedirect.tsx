import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { SIGNUPS_CLOSED_MESSAGE } from '@/lib/signups-enabled'
import { toast } from '@/stores/toastStore'

/** Stands in for the signup page while signups are closed: explains why, then goes to login. */
export function SignupsClosedRedirect() {
  useEffect(() => {
    toast(SIGNUPS_CLOSED_MESSAGE)
  }, [])
  return <Navigate to="/login" replace />
}
