import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { SIGNUPS_CLOSED_MESSAGE, SIGNUPS_ENABLED } from '@/lib/signups-enabled'
import { toast } from '@/stores/toastStore'

type SignupLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }

/** Opens the signup page, or shows a toast and stays put while signups are closed. */
export const SignupLink = forwardRef<HTMLAnchorElement, SignupLinkProps>(
  ({ to = '/signup', onClick, ...props }, ref) => {
    if (SIGNUPS_ENABLED) return <Link ref={ref} to={to} onClick={onClick} {...props} />
    return (
      <a
        ref={ref}
        href={to}
        onClick={(event) => {
          event.preventDefault()
          onClick?.(event)
          toast(SIGNUPS_CLOSED_MESSAGE)
        }}
        {...props}
      />
    )
  }
)
SignupLink.displayName = 'SignupLink'
