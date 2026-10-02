import { Link } from 'react-router-dom'

const links = [
  { label: 'Tokens', to: '/tokens' },
  { label: 'Insiders', to: '/insiders' },
  { label: 'Scanner', to: '/scanner' },
  { label: 'Wallets', to: '/wallets' },
  { label: 'Watchlist', to: '/watchlist' },
]

export function DashboardFooter() {
  return (
    <footer className="mt-auto w-full border-t border-white/[0.06] px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-nodex-muted sm:flex-row sm:items-center sm:justify-between">
        <Link to="/tokens" className="text-sm font-semibold tracking-wide text-nodex-muted transition-colors hover:text-nodex-teal">
          NodeX
        </Link>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-nodex-muted">
              {link.label}
            </Link>
          ))}
        </div>
        <span>© {new Date().getFullYear()} NodeX</span>
      </div>
    </footer>
  )
}
