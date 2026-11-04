import { motion } from 'framer-motion'
import { BellRing, Check, TriangleAlert, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Well-known Solana tokens for the product mocks. Logos live in public/tokens. Figures are samples. */
export const TOKENS = {
  pengu: { symbol: 'PENGU', name: 'Pudgy Penguins', logo: '/tokens/pengu.png' },
  wif: { symbol: 'WIF', name: 'dogwifhat', logo: '/tokens/wif.jpg' },
  moodeng: { symbol: 'MOODENG', name: 'Moo Deng', logo: '/tokens/moodeng.jpg' },
  popcat: { symbol: 'POPCAT', name: 'Popcat', logo: '/tokens/popcat.jpg' },
  bonk: { symbol: 'BONK', name: 'Bonk', logo: '/tokens/bonk.jpg' },
  jup: { symbol: 'JUP', name: 'Jupiter', logo: '/tokens/jup.png' },
} as const

type TokenKey = keyof typeof TOKENS

export function TokenLogo({ token, className }: { token: TokenKey; className?: string }) {
  const { logo, symbol } = TOKENS[token]
  return (
    <img
      src={logo}
      alt={`${symbol} logo`}
      width={64}
      height={64}
      loading="lazy"
      className={cn('shrink-0 rounded-full object-cover ring-1 ring-whalemo-line', className)}
    />
  )
}

/** A full-width rule with small square markers at each end, like a drafting line. */
export function Rule({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('relative h-px w-full bg-whalemo-line', className)}>
      <span className="absolute top-1/2 left-0 h-1.5 w-1.5 -translate-y-1/2 bg-whalemo-teal" />
      <span className="absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 bg-whalemo-teal" />
    </div>
  )
}

/** "+" marks in each corner of a panel. The parent must be positioned. */
export function Crosshairs({ className }: { className?: string }) {
  const mark = cn('absolute text-sm leading-none select-none', className)
  return (
    <>
      <span aria-hidden className={cn(mark, 'top-3 left-3')}>+</span>
      <span aria-hidden className={cn(mark, 'top-3 right-3')}>+</span>
      <span aria-hidden className={cn(mark, 'bottom-3 left-3')}>+</span>
      <span aria-hidden className={cn(mark, 'right-3 bottom-3')}>+</span>
    </>
  )
}

const avatarColors = ['bg-whalemo-accent', 'bg-whalemo-blue', 'bg-whalemo-sky', 'bg-whalemo-green']

function AvatarStack({ count }: { count: number }) {
  return (
    <span className="hidden -space-x-1.5 sm:flex">
      {avatarColors.slice(0, Math.min(count, 4)).map((color) => (
        <span key={color} className={cn('h-5 w-5 rounded-full border-2 border-whalemo-surface', color)} />
      ))}
    </span>
  )
}

const productRows: { token: TokenKey; traders: number; net: string; change: string; up: boolean; early?: boolean }[] = [
  { token: 'pengu', traders: 14, net: '$412K', change: '+18.2%', up: true },
  { token: 'wif', traders: 11, net: '$268K', change: '+6.4%', up: true },
  { token: 'moodeng', traders: 9, net: '$96K', change: '+41.0%', up: true, early: true },
  { token: 'popcat', traders: 7, net: '$54K', change: '-3.1%', up: false },
  { token: 'bonk', traders: 6, net: '$38K', change: '+2.2%', up: true },
]

/** The Smart Wallets screen, drawn as a static mock with sample figures. */
export function ProductWindow() {
  return (
    <div className="overflow-hidden rounded-xl border border-whalemo-line bg-whalemo-surface text-left shadow-[0_40px_120px_-50px_rgba(0,0,0,0.7)]">
      <div className="flex items-center gap-2 border-b border-whalemo-line px-4 py-3 sm:px-5">
        <span className="h-2.5 w-2.5 rounded-full bg-whalemo-red/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-whalemo-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-whalemo-green/70" />
        <span className="ml-3 text-sm font-semibold">Smart Wallets</span>
        <span className="ml-auto rounded-none border border-whalemo-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-whalemo-muted">
          Sample data
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-whalemo-line px-4 py-2 text-[10px] uppercase tracking-widest text-whalemo-muted sm:grid-cols-[1fr_auto_auto_auto] sm:gap-8 sm:px-5">
        <span>Token</span>
        <span>Top traders</span>
        <span className="hidden sm:block">Net bought</span>
        <span className="w-14 text-right">24h</span>
      </div>
      {productRows.map((row, index) => {
        const token = TOKENS[row.token]
        return (
          <motion.div
            key={row.token}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.07 }}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-whalemo-line px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-8 sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <TokenLogo token={row.token} className="h-8 w-8" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  {token.symbol}
                  {row.early ? (
                    <span className="inline-flex items-center gap-0.5 rounded-sm bg-whalemo-amber/15 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-whalemo-amber">
                      <Zap className="h-2.5 w-2.5" />
                      Early
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-whalemo-muted">{token.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AvatarStack count={row.traders} />
              <span className="text-base font-semibold tabular-nums text-whalemo-teal">{row.traders}</span>
            </div>
            <span className="hidden text-sm font-medium tabular-nums sm:block">{row.net}</span>
            <span className={cn('w-14 text-right text-sm font-medium tabular-nums', row.up ? 'text-whalemo-green' : 'text-whalemo-red')}>
              {row.change}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ---------- Scroll-story visuals: one per step ---------- */

export function SmartWalletsStep() {
  return (
    <div className="w-full space-y-2.5">
      {productRows.slice(0, 4).map((row, index) => (
        <div key={row.token} className="flex items-center gap-3 border border-whalemo-line bg-whalemo-surface px-3 py-2.5">
          <TokenLogo token={row.token} className="h-7 w-7" />
          <span className="w-16 text-sm font-semibold">{TOKENS[row.token].symbol}</span>
          <span className="h-1.5 flex-1 bg-whalemo-line">
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: `${(row.traders / 14) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeOut' }}
              className="block h-full bg-whalemo-teal"
            />
          </span>
          <span className="w-8 text-right text-sm font-semibold tabular-nums text-whalemo-teal">{row.traders}</span>
        </div>
      ))}
    </div>
  )
}

export function AlertStep() {
  return (
    <div className="w-full space-y-3">
      {[
        { token: 'moodeng' as const, line: '9 top traders in at $480K market cap', fresh: true },
        { token: 'popcat' as const, line: '4 top traders in at $820K market cap', fresh: false },
      ].map((alert, index) => (
        <motion.div
          key={alert.token}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: alert.fresh ? 1 : 0.55, x: 0 }}
          transition={{ duration: 0.45, delay: index * 0.15 }}
          className="flex items-center gap-3 border border-whalemo-line bg-whalemo-surface p-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-whalemo-amber/15 text-whalemo-amber">
            <BellRing className="h-4 w-4" />
          </span>
          <TokenLogo token={alert.token} className="h-8 w-8" />
          <div className="min-w-0 text-xs leading-5">
            <div className="font-semibold">Early signal · {TOKENS[alert.token].symbol}</div>
            <div className="text-whalemo-muted sm:truncate">{alert.line}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function ScannerStep() {
  const checks = [
    { label: 'Mint authority revoked', ok: true },
    { label: 'Freeze authority revoked', ok: true },
    { label: 'Fee can be raised to 25%', ok: false },
    { label: 'Top 10 wallets hold 61%', ok: false },
  ]
  return (
    <div className="w-full border border-whalemo-line bg-whalemo-surface">
      <div className="flex items-center justify-between border-b border-whalemo-line px-4 py-3">
        <span className="font-mono text-xs text-whalemo-muted">7xKX…q9Fp</span>
        <span className="bg-whalemo-red/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-whalemo-red">Avoid</span>
      </div>
      <ul className="divide-y divide-whalemo-line text-sm">
        {checks.map((check, index) => (
          <motion.li
            key={check.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + index * 0.12 }}
            className="flex items-center gap-2.5 px-4 py-2.5"
          >
            {check.ok ? (
              <Check className="h-4 w-4 text-whalemo-green" />
            ) : (
              <TriangleAlert className="h-4 w-4 text-whalemo-red" />
            )}
            <span className={check.ok ? 'text-whalemo-muted' : ''}>{check.label}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

/** One funder splitting a launch across many wallets. */
export function InsidersStep() {
  const nodes = [
    [40, 30], [120, 18], [200, 30], [26, 110], [214, 110], [52, 186], [188, 186], [120, 202],
  ]
  return (
    <svg viewBox="0 0 240 220" className="w-full max-w-xs" aria-hidden>
      {nodes.map(([x, y], index) => (
        <motion.line
          key={`l${index}`}
          x1={120} y1={110} x2={x} y2={y}
          className="stroke-whalemo-amber"
          strokeOpacity={0.55}
          strokeWidth={1.25}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: index * 0.06 }}
        />
      ))}
      {nodes.map(([x, y], index) => (
        <rect key={`n${index}`} x={x - 7} y={y - 7} width={14} height={14} className="fill-whalemo-surface stroke-whalemo-amber" strokeWidth={1.5} />
      ))}
      <rect x={104} y={94} width={32} height={32} className="fill-whalemo-amber" />
      <text x={120} y={150} textAnchor="middle" className="fill-whalemo-muted text-[10px]">
        1 funder · 8 wallets
      </text>
    </svg>
  )
}

export function WatchlistStep() {
  return (
    <div className="w-full border border-whalemo-line bg-whalemo-surface p-5">
      <div className="flex items-center gap-3">
        <TokenLogo token="wif" className="h-10 w-10" />
        <div>
          <div className="font-semibold">dogwifhat</div>
          <div className="text-xs text-whalemo-muted">WIF · watchlist</div>
        </div>
        <span className="ml-auto text-sm font-semibold text-whalemo-green">+12.4%</span>
      </div>
      <svg viewBox="0 0 240 80" className="mt-5 h-24 w-full" preserveAspectRatio="none" aria-hidden>
        <motion.path
          d="M0 66 L20 60 L36 64 L58 50 L76 54 L98 40 L118 44 L140 28 L160 33 L184 18 L206 22 L240 6"
          fill="none"
          className="stroke-whalemo-teal"
          strokeWidth={2.5}
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-whalemo-line pt-3 text-xs">
        <div>
          <div className="text-whalemo-muted">Price</div>
          <div className="font-semibold tabular-nums">$1.84</div>
        </div>
        <div>
          <div className="text-whalemo-muted">Top traders</div>
          <div className="font-semibold tabular-nums">11</div>
        </div>
        <div>
          <div className="text-whalemo-muted">Alerts</div>
          <div className="font-semibold text-whalemo-teal">On</div>
        </div>
      </div>
    </div>
  )
}
