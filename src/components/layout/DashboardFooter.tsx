import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { XLink } from '@/components/layout/SocialLinks'

const links = [
  { label: 'Smart Wallets', to: '/wallets' },
  { label: 'Insiders', to: '/insiders' },
  { label: 'Scanner', to: '/scanner' },
  { label: 'Watchlist', to: '/watchlist' },
  { label: 'Alerts', to: '/alerts' },
]

export function DashboardFooter() {
  return (
    <footer className="mt-auto w-full border-t border-white/[0.06] px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-dashboard flex-col gap-4 text-xs text-whalemo-muted sm:flex-row sm:items-center sm:justify-between">
        <Link to="/wallets" aria-label="WhaleMo" className="text-whalemo-muted transition-colors hover:text-whalemo-teal">
          <BrandLogo className="h-5" />
        </Link>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-whalemo-muted">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <XLink className="hover:text-whalemo-teal hover:opacity-100" withHandle />
          <span>© {new Date().getFullYear()} WhaleMo</span>
        </div>
      </div>
    </footer>
  )
}
