import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
// SUBSCRIPTIONS DISABLED — CreditCard is only used by the commented-out Billing menu item.
import { Wallet, Coins, Star, LogOut, Moon, Sun /*, CreditCard */ } from 'lucide-react'
import { LiquidGlass } from './LiquidGlass'
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
  { label: 'Wallets', path: '/wallets', icon: Wallet },
  { label: 'Watchlist', path: '/watchlist', icon: Star },
]

function userInitials(email: string, displayName: string | null) {
  if (displayName?.trim()) {
    return displayName.trim().charAt(0).toUpperCase()
  }
  return email.charAt(0).toUpperCase()
}

export function Navbar({ variant = 'public' }: NavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const hasActivePlan = isActiveSubscription(user)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const avatar = user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-2 rounded-full outline-none ring-nodex-teal/40 focus-visible:ring-2"
          aria-label="Account menu"
        >
          <Avatar className="w-9 h-9 border border-nodex-teal/20 cursor-pointer">
            <AvatarFallback>{userInitials(user.email, user.displayName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-white/10 bg-nodex-bg/95 text-white">
        <div className="px-3 py-2 text-xs text-white/50 truncate max-w-[200px]">{user.email}</div>
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 transition-all duration-300 hover:border-nodex-teal/40 hover:bg-white/5 hover:text-nodex-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nodex-teal/50"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8"
    >
      <LiquidGlass
        className={cn('mx-auto rounded-2xl', variant === 'dashboard' ? 'max-w-7xl' : 'max-w-6xl')}
      >
        <nav
          className={cn(
            'flex items-center justify-between py-3',
            variant === 'dashboard' ? 'px-4 md:px-8' : 'px-6'
          )}
        >
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold text-white tracking-wide group-hover:text-nodex-teal transition-colors duration-300">
              NodeX
            </span>
          </Link>

          {variant === 'dashboard' && hasActivePlan ? (
            <div className="flex items-center gap-1 md:gap-2">
              {navItems.map(({ label, path, icon: Icon }) => {
                const active = location.pathname === path
                return (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all duration-300',
                      active
                        ? 'text-nodex-teal bg-nodex-teal/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                )
              })}
              {themeToggle}
              {avatar}
            </div>
          ) : variant === 'dashboard' ? (
            <div className="flex items-center gap-3">
              <Link
                to="/pricing"
                className="text-sm text-nodex-teal hover:text-nodex-teal/80 transition-colors duration-300"
              >
                Pick a plan
              </Link>
              {themeToggle}
              {avatar}
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to={hasActivePlan ? DASHBOARD_HOME_PATH : '/pricing'}
                className="text-sm text-white/80 hover:text-nodex-teal transition-colors duration-300"
              >
                {hasActivePlan ? 'Dashboard' : 'Pick a plan'}
              </Link>
              {themeToggle}
              {avatar}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm text-white/80 hover:text-nodex-teal transition-colors duration-300"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-sm text-nodex-teal hover:text-nodex-teal/80 transition-colors duration-300"
              >
                Sign up
              </Link>
              {themeToggle}
            </div>
          )}
        </nav>
      </LiquidGlass>
    </motion.header>
  )
}
