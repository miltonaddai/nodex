import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { XLink } from '@/components/layout/SocialLinks'
import { SignupLink } from '@/components/auth/SignupLink'
import { SUBSCRIPTIONS_ENABLED } from '@/lib/subscriptions-enabled'

const linkClass = 'transition-colors hover:text-whalemo-teal'

/**
 * Footer for the public and onboarding pages (landing, login, signup, password reset, pricing).
 * The landing page passes its own section links; every other page gets the default set.
 */
export function PublicFooter({ links }: { links?: ReactNode }) {
  return (
    <footer className="border-t border-whalemo-line px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-whalemo-muted sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" aria-label="WhaleMo home" className="text-whalemo-teal">
          <BrandLogo className="h-7" />
        </Link>
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          {links ?? (
            <>
              <Link to="/" className={linkClass}>Home</Link>
              {SUBSCRIPTIONS_ENABLED ? (
                <Link to="/pricing" className={linkClass}>Pricing</Link>
              ) : null}
              <Link to="/login" className={linkClass}>Login</Link>
              <SignupLink className={linkClass}>Sign up</SignupLink>
            </>
          )}
        </div>
        <div className="flex items-center gap-5">
          <XLink className="text-whalemo-muted hover:text-whalemo-teal hover:opacity-100" withHandle />
          <span>© {new Date().getFullYear()} WhaleMo</span>
        </div>
      </div>
    </footer>
  )
}
