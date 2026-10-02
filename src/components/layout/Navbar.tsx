import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
// SUBSCRIPTIONS DISABLED — CreditCard is only used by the commented-out Billing menu item.
import { Wallet, Coins, Star, LogOut, Moon, Sun, ScanEye, ScanSearch /*, CreditCard */ } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

interface NavbarProps {
  variant?: 'public' | 'dashboard'
}

const navItems = [
  { label: 'Tokens', path: '/tokens', icon: Coins },
  { label: 'Insiders', path: '/insiders', icon: ScanEye },
  { label: 'Scanner', path: '/scanner', icon: ScanSearch },
  { label: 'Wallets', path: '/wallets', icon: Wallet },
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

function Logo() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2 pl-1">
      <motion.span
        whileHover={{ rotate: -8, scale: 1.06 }}
        transition={spring}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-nodex-accent to-nodex-blue text-sm font-bold text-[#ffffff]"
      >
        N
      </motion.span>
      <span className="hidden text-lg font-bold tracking-wide text-white transition-colors group-hover:text-nodex-teal sm:inline">
        NodeX
      </span>
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
          className="rounded-full outline-none ring-nodex-teal/40 focus-visible:ring-2"
          aria-label="Account menu"
        >
          <Avatar className="h-9 w-9 cursor-pointer border border-nodex-teal/20">
            <AvatarFallback>{userInitials(user.email, user.displayName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-nodex-line bg-nodex-surface text-white">
        <div className="px-3 py-2 text-xs text-nodex-muted truncate max-w-[200px]">{user.email}</div>
        {/* SUBSCRIPTIONS DISABLED — /billing is not routed while the paywall is off.
        <DropdownMenuItem asChild>
          <Link to="/billing" className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </Link>
        </DropdownMenuItem>
        */}
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-nodex-red">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null

  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-nodex-muted transition-colors hover:bg-nodex-raised hover:text-nodex-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nodex-teal/50"
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

  const textLink = 'rounded-full px-3.5 py-2 text-sm text-nodex-muted transition-colors hover:bg-nodex-raised hover:text-white'
  const pillLink =
    'rounded-full bg-nodex-accent px-5 py-2 text-sm font-medium text-nodex-on-accent transition-opacity hover:opacity-90'

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
                  'relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors sm:px-3.5',
                  active ? 'text-nodex-on-accent' : 'text-nodex-muted hover:text-white'
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-full bg-nodex-accent"
                  />
                ) : null}
                <Icon className="relative h-4 w-4" />
                <span className="relative hidden md:inline">{label}</span>
              </Link>
            )
          })}
        </div>
        <span className="mx-1 hidden h-5 w-px bg-nodex-line sm:block" />
        {themeToggle}
        {avatar}
      </>
    )
  } else if (variant === 'dashboard') {
    actions = (
      <>
        <Link to="/pricing" className={pillLink}>
          Pick a plan
        </Link>
        {themeToggle}
        {avatar}
      </>
    )
  } else if (isAuthenticated) {
    actions = (
      <>
        <Link to={hasActivePlan ? DASHBOARD_HOME_PATH : '/pricing'} className={pillLink}>
          {hasActivePlan ? 'Dashboard' : 'Pick a plan'}
        </Link>
        {themeToggle}
        {avatar}
      </>
    )
  } else {
    actions = (
      <>
        <Link to="/login" className={textLink}>
          Login
        </Link>
        <Link to="/signup" className={pillLink}>
          Sign up
        </Link>
        {themeToggle}
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
          'pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-nodex-line bg-nodex-surface p-2.5 transition-shadow duration-300',
          variant === 'public' ? 'w-full max-w-3xl justify-between' : 'w-fit',
          scrolled ? 'shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]' : 'shadow-[0_2px_10px_-6px_rgba(0,0,0,0.25)]'
        )}
      >
        <Logo />
        <div className="flex items-center gap-1">{actions}</div>
      </motion.nav>
    </motion.header>
  )
}
