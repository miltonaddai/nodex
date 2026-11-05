import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Wallet, Star, LogOut, Moon, Sun, ScanEye, ScanSearch, Settings, Bell } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BrandLogo } from '@/components/layout/BrandLogo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { isActiveSubscription } from '@/lib/plans'
import { DASHBOARD_HOME_PATH } from '@/lib/subscription-routes'
import { cn } from '@/lib/utils'
import { SignupLink } from '@/components/auth/SignupLink'
import { useEarlySignalStore } from '@/stores/earlySignalStore'

interface NavbarProps {
  variant?: 'public' | 'dashboard'
}

const navItems = [
  // TOKENS PAGE DISABLED — { label: 'Tokens', path: '/tokens', icon: Coins },
  { label: 'Smart Wallets', path: '/wallets', icon: Wallet },
  { label: 'Insiders', path: '/insiders', icon: ScanEye },
  { label: 'Scanner', path: '/scanner', icon: ScanSearch },
  { label: 'Watchlist', path: '/watchlist', icon: Star },
]

/** Every page renders its own Navbar, so the drop-in plays once per visit, not on every route. */
let hasEntered = false

const spring = { type: 'spring', stiffness: 380, damping: 32 } as const

function userInitials(email: string, displayName: string | null) {
  if (displayName?.trim()) {
    return displayName.trim().charAt(0).toUpperCase()
  }
  return email.charAt(0).toUpperCase()
}

/**
 * The full wordmark from 360px up; `sizeClass` shrinks it on phones to fit beside the actions.
 * Narrower screens (older small phones) only have room for the whale.
 */
function Logo({ linked, sizeClass }: { linked: boolean; sizeClass: string }) {
  const marks = (
    <>
      <BrandLogo variant="icon" className="h-6 min-[360px]:hidden" />
      <BrandLogo className={cn('hidden min-[360px]:inline-block', sizeClass)} />
    </>
  )
  // Logged-in users stay in the app: the logo is a plain mark, not a link back to the landing page.
  if (!linked) {
    return <span className="flex shrink-0 items-center pl-1 text-whalemo-teal">{marks}</span>
  }
  return (
    <Link to="/" aria-label="WhaleMo home" className="group flex shrink-0 items-center pl-1 text-whalemo-teal">
      <motion.span whileHover={{ scale: 1.04 }} transition={spring} className="flex items-center">
        {marks}
      </motion.span>
    </Link>
  )
}

export function Navbar({ variant = 'public' }: NavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const hasActivePlan = isActiveSubscription(user)
  const [scrolled, setScrolled] = useState(false)
  const [animateIn] = useState(() => !hasEntered)
  const unseenAlerts = useEarlySignalStore((s) => s.unseen)

  useEffect(() => {
    hasEntered = true
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const avatar = user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none ring-whalemo-teal/40 focus-visible:ring-2"
          aria-label="Account menu"
        >
          <Avatar className="h-9 w-9 cursor-pointer border border-whalemo-teal/20">
            <AvatarFallback>{userInitials(user.email, user.displayName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-whalemo-line bg-whalemo-surface text-white">
        <div className="px-3 py-2 text-xs text-whalemo-muted truncate max-w-[200px]">{user.email}</div>
        <DropdownMenuItem asChild>
          <Link to="/alerts" className="cursor-pointer">
            <Bell className="mr-2 h-4 w-4" />
            Alerts
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer sm:hidden">
          {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-whalemo-red">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null

  const themeToggle = (className?: string) => (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md text-whalemo-muted transition-colors hover:bg-whalemo-raised hover:text-whalemo-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whalemo-teal/50',
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 14, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )

  const textLink = 'whitespace-nowrap rounded-md px-3.5 py-2 text-sm text-whalemo-muted transition-colors hover:bg-whalemo-raised hover:text-white'
  const pillLink =
    'whitespace-nowrap rounded-md bg-whalemo-accent px-5 py-2 text-sm font-medium text-whalemo-on-accent transition-opacity hover:opacity-90'

  let actions
  if (variant === 'dashboard' && hasActivePlan) {
    actions = (
      <>
        <div className="flex items-center">
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                title={label}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-sm px-2.5 py-2 text-sm transition-colors sm:px-3.5',
                  active ? 'text-whalemo-on-accent' : 'text-whalemo-muted hover:text-white'
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-sm bg-whalemo-accent"
                  />
                ) : null}
                <Icon className="relative h-4 w-4" />
                <span className="relative hidden md:inline">{label}</span>
              </Link>
            )
          })}
        </div>
        <span className="mx-1 hidden h-5 w-px bg-whalemo-line sm:block" />
        {/* Alerts: the count of new ones since the tab was last looked at. On phones it's in the account menu. */}
        <Link
          to="/alerts"
          title="Alerts"
          aria-label={unseenAlerts ? `Alerts, ${unseenAlerts} new` : 'Alerts'}
          className={cn(
            'relative hidden h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-whalemo-raised hover:text-whalemo-teal sm:flex',
            location.pathname === '/alerts' ? 'text-whalemo-teal' : 'text-whalemo-muted'
          )}
        >
          <Bell className="h-4 w-4" />
          {unseenAlerts ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 bg-whalemo-amber px-1 text-center text-[10px] leading-4 font-bold text-[#111]">
              {unseenAlerts > 9 ? '9+' : unseenAlerts}
            </span>
          ) : null}
        </Link>
        {/* On phones the toggle lives in the account menu, to leave room for the wordmark. */}
        {themeToggle(user ? 'hidden sm:flex' : undefined)}
        {avatar}
      </>
    )
  } else if (variant === 'dashboard') {
    actions = (
      <>
        <Link to="/pricing" className={pillLink}>
          Pick a plan
        </Link>
        {themeToggle()}
        {avatar}
      </>
    )
  } else if (isAuthenticated) {
    actions = (
      <>
        <Link to={hasActivePlan ? DASHBOARD_HOME_PATH : '/pricing'} className={pillLink}>
          {hasActivePlan ? 'Dashboard' : 'Pick a plan'}
        </Link>
        {themeToggle()}
        {avatar}
      </>
    )
  } else {
    actions = (
      <>
        <Link to="/login" className={textLink}>
          Login
        </Link>
        <SignupLink className={pillLink}>Sign up</SignupLink>
        {themeToggle()}
      </>
    )
  }

  return (
    <motion.header
      initial={animateIn ? { opacity: 0, y: -24 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:pt-4"
    >
      <motion.nav
        layout
        transition={spring}
        className={cn(
          'pointer-events-auto flex max-w-full items-center gap-3 rounded-md border border-whalemo-line bg-whalemo-surface p-2.5 transition-shadow duration-300',
          variant === 'public' ? 'w-full max-w-3xl justify-between' : 'w-full max-w-6xl justify-between',
          scrolled ? 'shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]' : 'shadow-[0_2px_10px_-6px_rgba(0,0,0,0.25)]'
        )}
      >
        <Logo
          linked={!isAuthenticated}
          sizeClass={variant === 'dashboard' && hasActivePlan ? 'h-5 sm:h-7' : 'h-[22px] sm:h-7'}
        />
        <div className="flex items-center gap-1">{actions}</div>
      </motion.nav>
    </motion.header>
  )
}
