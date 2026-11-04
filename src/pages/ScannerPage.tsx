import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CircleCheck,
  ExternalLink,
  History,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardFooter } from '@/components/layout/DashboardFooter'
import { GlassPanel } from '@/components/layout/GlassPanel'
import { ChainSelector, type Chain } from '@/components/dashboard/ChainSelector'
import { TokenAvatar } from '@/components/dashboard/TokenAvatar'
import { TokenWatchlistButton } from '@/components/dashboard/TokenWatchlistButton'
import { SubscriptionBanner } from '@/components/billing/SubscriptionBanner'
import { useChainTokenWatchlist } from '@/hooks/useSolanaTokenWatchlist'
import { api, type RiskSeverity, type ScanChain, type ScanResult } from '@/lib/api'
import { chainLabel, isChainId, walletUrl } from '@/lib/chains'
import {
  clearScanHistory,
  findScan,
  forgetScan,
  loadScanHistory,
  rememberScan,
  type ScanHistoryEntry,
} from '@/lib/scan-history'
import { cn, formatCurrency, truncateAddress } from '@/lib/utils'

const SEVERITY_STYLE: Record<RiskSeverity, string> = {
  critical: 'border-whalemo-red/40 bg-whalemo-red/15 text-whalemo-red',
  high: 'border-whalemo-red/30 bg-whalemo-red/10 text-whalemo-red',
  medium: 'border-whalemo-amber/30 bg-whalemo-amber/10 text-whalemo-amber',
  low: 'border-white/10 bg-white/[0.04] text-whalemo-muted',
}

const VERDICT_STYLE = {
  avoid: { label: 'Avoid', icon: ShieldAlert, className: 'border-whalemo-red/40 text-whalemo-red', blurb: 'Serious risks were found.' },
  caution: { label: 'Caution', icon: TriangleAlert, className: 'border-whalemo-amber/40 text-whalemo-amber', blurb: 'Tradeable, with risks to weigh.' },
  favorable: { label: 'Favorable', icon: ShieldCheck, className: 'border-whalemo-teal/40 text-whalemo-teal', blurb: 'None of the known traps were found.' },
} as const

const EVM_SCAN_CHAINS: ScanChain[] = ['bsc', 'robinhood']

/**
 * 0x addresses are EVM: the selected EVM chain is kept, and BNB Chain is the default. Everything
 * else is treated as Solana.
 */
function detectChain(address: string, current: ScanChain): ScanChain {
  if (!/^0x/i.test(address.trim())) return 'solana'
  return EVM_SCAN_CHAINS.includes(current) ? current : 'bsc'
}

/** A 0x address with no pools on its chain may belong to the other EVM chain. */
function otherEvmChain(chain: ScanChain): ScanChain | null {
  if (!EVM_SCAN_CHAINS.includes(chain)) return null
  return EVM_SCAN_CHAINS.find((candidate) => candidate !== chain) ?? null
}

function urlChain(value: string | null): ScanChain {
  return isChainId(value) ? value : 'solana'
}

function formatAge(hours: number | null): string {
  if (hours === null) return '—'
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`
  if (hours < 48) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}

function formatPrice(price: number | null): string {
  if (price === null) return '—'
  if (price >= 1) return `$${price.toFixed(2)}`
  const digits = Math.max(2, 1 - Math.floor(Math.log10(price)) + 2)
  return `$${price.toFixed(Math.min(digits, 12))}`
}

function pct(value: number | null, digits = 1): string {
  return value === null ? '—' : `${value.toFixed(digits)}%`
}

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const VERDICT_DOT = { avoid: 'bg-whalemo-red', caution: 'bg-whalemo-amber', favorable: 'bg-whalemo-accent' } as const

/** Past scans saved in this browser. Opening one shows the saved result without calling the API. */
function RecentScans({
  entries,
  activeAddress,
  onOpen,
  onForget,
  onClear,
}: {
  entries: ScanHistoryEntry[]
  activeAddress: string | null
  onOpen: (entry: ScanHistoryEntry) => void
  onForget: (entry: ScanHistoryEntry) => void
  onClear: () => void
}) {
  if (entries.length === 0) return null
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-whalemo-muted">
          <History className="h-3.5 w-3.5" /> Recent scans
        </h2>
        <button type="button" onClick={onClear} className="text-xs text-whalemo-muted hover:text-whalemo-red">
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => {
          const active = activeAddress?.toLowerCase() === entry.address.toLowerCase()
          return (
            <div
              key={`${entry.chain}:${entry.address}`}
              className={cn(
                'group flex max-w-[16rem] items-center gap-2 rounded-md border py-1 pl-1 pr-2 text-xs transition-colors',
                active ? 'border-whalemo-teal/40 bg-whalemo-teal/10' : 'border-white/10 bg-white/[0.03] hover:border-whalemo-teal/30'
              )}
            >
              <button
                type="button"
                onClick={() => onOpen(entry)}
                className="flex min-w-0 items-center gap-2"
                title={`${entry.name || entry.symbol} - ${entry.verdict} - scanned ${timeAgo(entry.scannedAt)}`}
              >
                <TokenAvatar imageUrl={entry.imageUrl} symbol={entry.symbol} fallbackClassName="bg-purple-500" className="h-6 w-6 text-[11px]" />
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', VERDICT_DOT[entry.verdict])} />
                <span className="truncate font-medium">{entry.symbol || entry.name || entry.address.slice(0, 6)}</span>
                <span className="shrink-0 text-whalemo-muted">{timeAgo(entry.scannedAt)}</span>
              </button>
              <button
                type="button"
                onClick={() => onForget(entry)}
                aria-label={`Remove ${entry.symbol} from recent scans`}
                className="shrink-0 text-whalemo-muted opacity-0 transition-opacity hover:text-whalemo-red group-hover:opacity-100 focus:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <GlassPanel variant="frosted" className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-whalemo-muted">{title}</h2>
        {aside}
      </div>
      {children}
    </GlassPanel>
  )
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-whalemo-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
      {sub ? <div className="text-xs text-whalemo-muted">{sub}</div> : null}
    </div>
  )
}

function Verdict({ scan }: { scan: ScanResult }) {
  const style = VERDICT_STYLE[scan.risk.verdict]
  const Icon = style.icon
  return (
    <Section title="Verdict" aside={<span className="text-xs text-whalemo-muted">Risk score {scan.risk.riskScore}/100</span>}>
      <div className={cn('mb-5 flex items-center gap-3 rounded-md border p-4', style.className)}>
        <Icon className="h-7 w-7 shrink-0" />
        <div>
          <div className="text-xl font-bold">{style.label}</div>
          <div className="text-sm opacity-80">{style.blurb}</div>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-semibold text-whalemo-muted">Red flags ({scan.risk.flags.length})</h3>
          {scan.risk.flags.length === 0 ? <p className="text-sm text-whalemo-muted">None found.</p> : null}
          <ul className="space-y-2">
            {scan.risk.flags.map((flag) => (
              <li key={flag.title} className="flex gap-2 text-sm">
                <span className={cn('mt-0.5 h-fit shrink-0 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase', SEVERITY_STYLE[flag.severity])}>
                  {flag.severity}
                </span>
                <span>
                  <span className="font-medium">{flag.title}.</span> <span className="text-whalemo-muted">{flag.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold text-whalemo-muted">In its favor ({scan.risk.positives.length})</h3>
          {scan.risk.positives.length === 0 ? <p className="text-sm text-whalemo-muted">Nothing notable.</p> : null}
          <ul className="space-y-2">
            {scan.risk.positives.map((item) => (
              <li key={item.title} className="flex gap-2 text-sm">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-whalemo-green" />
                <span>
                  <span className="font-medium">{item.title}.</span> <span className="text-whalemo-muted">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-5 text-[11px] text-whalemo-muted">
        Risk triage from on-chain data, not financial advice. A clean result means no known traps were found, not that the
        price will go up.
      </p>
    </Section>
  )
}

function SecurityRow({ label, ok, value }: { label: string; ok: boolean | null; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-2 text-sm last:border-0">
      <span className="text-whalemo-muted">{label}</span>
      <span className={cn('font-medium', ok === null ? 'text-whalemo-muted' : ok ? 'text-whalemo-green' : 'text-whalemo-red')}>{value}</span>
    </div>
  )
}

function Security({ scan }: { scan: ScanResult }) {
  const { security } = scan
  if (scan.chain === 'bsc') {
    const tax = security.transferFeeBps
    return (
      <Section title="Contract">
        <SecurityRow
          label="Honeypot"
          ok={security.honeypot === null ? null : !security.honeypot}
          value={security.honeypot === null ? 'Unknown' : security.honeypot ? 'Yes: cannot be sold' : 'No'}
        />
        <SecurityRow label="Mint function" ok={!security.mintAuthority} value={security.mintAuthority ? 'Present: supply can grow' : 'None'} />
        <SecurityRow
          label="Buy / sell tax"
          ok={tax === null ? null : tax === 0}
          value={tax === null ? 'Unknown' : tax === 0 ? 'None' : `Up to ${tax / 100}%`}
        />
        {security.transferFeeAuthority ? <SecurityRow label="Tax settings" ok={false} value="Owner can change them" /> : null}
        <SecurityRow
          label="Source code"
          ok={security.contractVerified}
          value={security.contractVerified === null ? 'Unknown' : security.contractVerified ? 'Verified' : 'Not verified'}
        />
        <p className="mt-3 text-xs text-whalemo-muted">From Birdeye's contract audit. The full code can be checked on BscScan.</p>
      </Section>
    )
  }
  if (scan.chain !== 'solana') {
    return (
      <Section title="Contract">
        <SecurityRow
          label="Source code"
          ok={security.contractVerified}
          value={security.contractVerified === null ? 'Unknown' : security.contractVerified ? 'Verified' : 'Not verified'}
        />
        <p className="mt-3 text-xs text-whalemo-muted">
          Mint, fee and pause functions are not read on Robinhood Chain yet. A verified contract can be checked on Blockscout.
        </p>
      </Section>
    )
  }
  const fee = security.transferFeeBps ?? 0
  return (
    <Section title="Token controls">
      <SecurityRow label="Mint authority" ok={!security.mintAuthority} value={security.mintAuthority ? 'Active: supply can grow' : 'Revoked'} />
      <SecurityRow label="Freeze authority" ok={!security.freezeAuthority} value={security.freezeAuthority ? 'Active: tokens can be frozen' : 'Revoked'} />
      <SecurityRow label="Transfer fee" ok={fee === 0} value={fee === 0 ? 'None' : `${fee / 100}% on every transfer`} />
      {fee > 0 || security.transferFeeAuthority ? (
        <SecurityRow label="Fee authority" ok={!security.transferFeeAuthority} value={security.transferFeeAuthority ? 'Active: fee can be raised' : 'Revoked'} />
      ) : null}
      <SecurityRow label="Permanent delegate" ok={!security.permanentDelegate} value={security.permanentDelegate ? 'Set: can move anyone’s tokens' : 'None'} />
    </Section>
  )
}

function Holders({ scan }: { scan: ScanResult }) {
  const native = scan.chain === 'solana' ? 'SOL' : scan.chain === 'bsc' ? 'BNB' : 'ETH'
  if (scan.holders.list.length === 0 && scan.chain === 'bsc') {
    return (
      <Section title="Top holders">
        <p className="text-sm text-whalemo-muted">
          {scan.holders.count !== null ? `${scan.holders.count.toLocaleString()} holders. ` : ''}
          The top-holder list is not available on BNB Chain yet. It can be checked on BscScan.
        </p>
      </Section>
    )
  }
  return (
    <Section
      title="Top holders"
      aside={
        <span className="text-xs text-whalemo-muted">
          {scan.holders.count !== null ? `${scan.holders.count.toLocaleString()} holders · ` : ''}top 10 wallets {pct(scan.holders.top10Pct)}
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-widest text-whalemo-muted">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Holder</th>
              <th className="py-2 pr-3">Share</th>
              <th className="py-2 pr-3">Value</th>
              <th className="py-2 pr-3">{native} balance</th>
              {scan.chain === 'solana' ? <th className="py-2 pr-3">Wallet net worth</th> : null}
            </tr>
          </thead>
          <tbody>
            {scan.holders.list.map((holder) => (
              <tr key={holder.address} className={cn('border-t border-white/[0.06]', holder.isPool && 'opacity-60')}>
                <td className="py-2 pr-3 text-whalemo-muted">{holder.rank}</td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={walletUrl(scan.chain, holder.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs underline-offset-4 hover:text-whalemo-teal hover:underline"
                    >
                      {truncateAddress(holder.address)}
                    </a>
                    {holder.label ? <Tag className="border-white/10 text-whalemo-muted">{holder.label}</Tag> : null}
                    {holder.isInsider ? <Tag className="border-whalemo-red/30 bg-whalemo-red/10 text-whalemo-red">Launch insider</Tag> : null}
                    {holder.fomoHandle ? <Tag className="border-whalemo-teal/30 bg-whalemo-teal/10 text-whalemo-teal">@{holder.fomoHandle}</Tag> : null}
                  </div>
                </td>
                <td className="py-2 pr-3 tabular-nums">{pct(holder.pctOfSupply, 2)}</td>
                <td className="py-2 pr-3 tabular-nums">{formatCurrency(holder.valueUsd, true)}</td>
                <td className="py-2 pr-3 tabular-nums text-whalemo-muted">
                  {holder.nativeBalance === null ? '—' : holder.nativeBalance.toFixed(holder.nativeBalance >= 100 ? 0 : 2)}
                </td>
                {scan.chain === 'solana' ? (
                  <td className="py-2 pr-3 tabular-nums text-whalemo-muted">
                    {holder.netWorthUsd === null ? '—' : formatCurrency(holder.netWorthUsd, true)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-whalemo-muted">
        Faded rows are pools and contracts, left out of concentration. Balances are shown for the 10 largest wallets.
      </p>
    </Section>
  )
}

function Tag({ className, children }: { className: string; children: ReactNode }) {
  return <span className={cn('rounded-sm border px-1.5 py-0.5 text-[11px] font-medium', className)}>{children}</span>
}

function Bundle({ scan, loading, error, onRun }: { scan: ScanResult; loading: boolean; error: string | null; onRun: () => void }) {
  if (!scan.bundleAvailable) {
    return (
      <Section title="Launch bundle">
        <p className="text-sm text-whalemo-muted">
          Bundle detection covers Solana launches. On {chainLabel(scan.chain)} every transaction has a single signer, so the co-signing
          signal it relies on does not exist.
        </p>
      </Section>
    )
  }
  const bundle = scan.bundle
  return (
    <Section
      title="Launch bundle"
      aside={
        !loading && (!bundle || bundle.clusters.length === 0) ? (
          <button type="button" onClick={onRun} className="text-xs font-medium text-whalemo-teal hover:underline">
            {bundle ? 'Re-run with wallet groups' : 'Analyze launch'}
          </button>
        ) : null
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-whalemo-muted">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Reading the launch transactions and who funded the first buyers. This takes up to a minute the first time.
        </div>
      ) : null}
      {error ? <p className="text-sm text-whalemo-red">{error}</p> : null}
      {!loading && !bundle && !error ? (
        <p className="text-sm text-whalemo-muted">Checks whether one person bought the launch through several wallets.</p>
      ) : null}
      {bundle ? (
        <div className={cn('space-y-4', loading && 'opacity-50')}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Insiders took" value={pct(bundle.insiderAcquiredPct)} sub={`${bundle.linkedWallets} linked wallets`} />
            <Stat
              label="Insiders hold now"
              value={bundle.insiderHoldingPct === null ? '—' : pct(bundle.insiderHoldingPct)}
              sub={bundle.insiderStatus === 'unknown' ? 'not measured' : bundle.insiderStatus}
            />
            <Stat label="Creation block" value={pct(bundle.creationBlockSupplyPct)} sub="bought in the first block" />
            <Stat label="Launch buyers" value={bundle.launchBuyers.toLocaleString()} sub="in the first 2 minutes" />
          </div>
          {bundle.evidence.length ? (
            <ul className="space-y-1.5 text-sm">
              {bundle.evidence.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-whalemo-accent" />
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-whalemo-muted">No linked wallets were found at launch.</p>
          )}
          {bundle.clusters.map((cluster, i) => (
            <div key={i} className="rounded-sm border border-white/[0.06] p-3">
              <div className="mb-2 text-xs text-whalemo-muted">
                Group {i + 1}: {cluster.wallets.length} wallets, {pct(cluster.boughtPct)} of supply ·{' '}
                {cluster.linkKinds.map((k) => k.replace('_', ' ')).join(', ')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cluster.wallets.slice(0, 12).map((wallet) => (
                  <a
                    key={wallet}
                    href={walletUrl('solana', wallet)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-whalemo-muted hover:text-whalemo-teal"
                  >
                    {truncateAddress(wallet)}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Section>
  )
}

function Activity({ scan }: { scan: ScanResult }) {
  const { trading } = scan
  const ratio = trading.buys24h && trading.sells24h ? trading.buys24h / trading.sells24h : null
  return (
    <Section title="Trading (24h)">
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Buys / sells" value={`${trading.buys24h?.toLocaleString() ?? '—'} / ${trading.sells24h?.toLocaleString() ?? '—'}`} sub={ratio ? `${ratio.toFixed(2)} buys per sell` : undefined} />
        <Stat
          label="Trader churn"
          value={trading.churn === null ? '—' : `${trading.churn.toFixed(2)}×`}
          sub={trading.uniqueWallets24h !== null ? `${trading.uniqueWallets24h.toLocaleString()} traders` : undefined}
        />
      </div>
      <p className="mt-3 text-[11px] text-whalemo-muted">
        Churn is traders in 24h divided by holders. Bot farms sit between 0.5× and 1.2×; organic tokens run above 1.5×.
      </p>
    </Section>
  )
}

function SmartMoney({ scan }: { scan: ScanResult }) {
  return (
    <Section title="Top traders buying (72h)">
      {scan.smartMoney.length === 0 ? (
        <p className="text-sm text-whalemo-muted">None of the tracked FOMO top traders are net buyers.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {scan.smartMoney.map((trader) => (
            <li key={trader.handle} className="flex justify-between gap-3">
              <span>
                {trader.displayName} <span className="text-whalemo-muted">@{trader.handle}</span>
              </span>
              <span className="tabular-nums text-whalemo-green">{formatCurrency(trader.netBuyUsd, true)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

export function ScannerPage() {
  const [params, setParams] = useSearchParams()
  const [input, setInput] = useState(params.get('address') ?? '')
  const [chain, setChain] = useState<Chain>(() => urlChain(params.get('chain')))
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bundleLoading, setBundleLoading] = useState(false)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [history, setHistory] = useState<ScanHistoryEntry[]>(() => loadScanHistory())
  /** True when the result on screen came from saved history rather than a fresh scan. */
  const [fromHistory, setFromHistory] = useState(false)
  const requestId = useRef(0)
  useChainTokenWatchlist(chain)

  const runBundle = useCallback((target: ScanChain, address: string, id: number) => {
    setBundleLoading(true)
    setBundleError(null)
    api.scanner
      .bundle(target, address)
      .then((result) => {
        if (id !== requestId.current) return
        setScan(result)
        setFromHistory(false)
        setHistory(rememberScan(result))
      })
      .catch((err: unknown) => {
        if (id === requestId.current) setBundleError(err instanceof Error ? err.message : 'Bundle analysis failed')
      })
      .finally(() => {
        if (id === requestId.current) setBundleLoading(false)
      })
  }, [])

  const runScan = useCallback(
    (target: ScanChain, address: string) => {
      const id = ++requestId.current
      setLoading(true)
      setError(null)
      setScan(null)
      setFromHistory(false)
      setBundleError(null)
      setBundleLoading(false)
      api.scanner
        .scan(target, address)
        .then(async (result) => {
          // Nothing trades there: try the other EVM chain once before reporting an empty scan.
          const fallback = result.poolCount === 0 ? otherEvmChain(target) : null
          if (fallback) {
            const other = await api.scanner.scan(fallback, address).catch(() => null)
            if (other && other.poolCount > 0) {
              result = other
              setChain(fallback)
              setParams({ chain: fallback, address })
            }
          }
          return result
        })
        .then((result) => {
          if (id !== requestId.current) return
          setScan(result)
          setHistory(rememberScan(result))
          // Run the slow launch analysis automatically when nothing is stored for this token.
          if (result.bundleAvailable && !result.bundle) runBundle(result.chain, address, id)
        })
        .catch((err: unknown) => {
          if (id === requestId.current) setError(err instanceof Error ? err.message : 'Scan failed')
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false)
        })
    },
    [runBundle, setParams]
  )

  /** Shows a saved scan without calling the API. */
  const openSaved = useCallback(
    (entry: ScanHistoryEntry) => {
      requestId.current++ // Ignore any scan still in flight.
      setScan(entry.result)
      setFromHistory(true)
      setLoading(false)
      setError(null)
      setBundleLoading(false)
      setBundleError(null)
      setChain(entry.chain)
      setInput(entry.address)
      setParams({ chain: entry.chain, address: entry.address })
    },
    [setParams]
  )

  // A scan in the URL (shared link or reload) opens on arrival: from history when this browser
  // has it, otherwise as a fresh scan. Later scans update the URL themselves, so this fires once.
  const scannedFromUrl = useRef(false)
  useEffect(() => {
    if (scannedFromUrl.current) return
    scannedFromUrl.current = true
    const address = params.get('address')
    if (!address) return
    const target = urlChain(params.get('chain'))
    const saved = findScan(target, address)
    if (saved) openSaved(saved)
    else runScan(target, address)
  }, [params, runScan, openSaved])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const address = input.trim()
    if (!address) return
    const target = detectChain(address, chain)
    setChain(target)
    setParams({ chain: target, address })
    runScan(target, address)
  }

  return (
    <PageLayout>
      <Navbar variant="dashboard" />
      <main className="mx-auto flex w-full max-w-dashboard flex-1 flex-col px-4 pt-28 pb-16 md:px-8">
        <SubscriptionBanner />
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-3 text-3xl font-bold md:text-4xl">
          Token Scanner
        </motion.h1>
        <p className="mb-6 max-w-3xl text-sm text-whalemo-muted">
          Paste a token contract address to check its liquidity, contract controls, holders and their wallets, launch bundles and
          top-trader activity, with a verdict on whether it is worth the risk.
        </p>

        <form onSubmit={onSubmit} className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 basis-full items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-2.5 focus-within:border-whalemo-teal/40 sm:basis-auto sm:flex-1">
            <Search className="h-4 w-4 shrink-0 text-whalemo-muted" />
            <input
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
                if (event.target.value.trim()) setChain(detectChain(event.target.value, chain))
              }}
              placeholder="Token contract address (Solana, or 0x… on BNB Chain or Robinhood Chain)"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-whalemo-muted"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <ChainSelector value={chain} onChange={setChain} />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex-1 rounded-md bg-whalemo-accent px-6 py-2.5 text-sm font-semibold text-whalemo-on-accent transition-opacity disabled:opacity-50 sm:flex-none"
          >
            {loading ? 'Scanning…' : 'Scan'}
          </button>
        </form>

        <RecentScans
          entries={history}
          activeAddress={scan?.address ?? null}
          onOpen={openSaved}
          onForget={(entry) => setHistory(forgetScan(entry.chain, entry.address))}
          onClear={() => setHistory(clearScanHistory())}
        />

        {error ? <p className="mb-6 text-sm text-whalemo-red">{error}</p> : null}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-whalemo-muted">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Checking market data, contract controls and holders…
          </div>
        ) : null}

        {scan ? (
          <div className="space-y-5">
            {fromHistory ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm">
                <span className="text-whalemo-muted">
                  Saved scan from {timeAgo(scan.scannedAt)}. Prices, holders and the verdict may have changed since.
                </span>
                <button
                  type="button"
                  onClick={() => runScan(scan.chain, scan.address)}
                  className="inline-flex items-center gap-1.5 font-medium text-whalemo-teal hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Rescan
                </button>
              </div>
            ) : null}
            <GlassPanel variant="frosted" className="p-5">
              <div className="flex flex-wrap items-center gap-4">
                <TokenAvatar imageUrl={scan.imageUrl} symbol={scan.symbol} fallbackClassName="bg-purple-500" className="h-12 w-12 text-base" />
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="max-w-[28rem] truncate text-xl font-bold" title={scan.name}>
                      {scan.name || 'Unknown token'}
                    </span>
                    <span className="max-w-[10rem] truncate text-sm text-whalemo-muted" title={scan.symbol}>
                      {scan.symbol}
                    </span>
                    <span className="group">
                      <TokenWatchlistButton token={{ contract: scan.address, name: scan.name, symbol: scan.symbol }} chain={scan.chain} />
                    </span>
                  </div>
                  <div className="font-mono text-xs text-whalemo-muted">{scan.address}</div>
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  {scan.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1 text-xs text-whalemo-muted hover:border-whalemo-teal/30 hover:text-whalemo-teal"
                    >
                      {link.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-6">
                <Stat label="Price" value={formatPrice(scan.priceUsd)} />
                <Stat
                  label="Market cap"
                  value={scan.marketCapUsd === null ? '—' : formatCurrency(scan.marketCapUsd, true)}
                />
                <Stat
                  label="Liquidity"
                  value={scan.liquidityUsd === null ? '—' : formatCurrency(scan.liquidityUsd, true)}
                  sub={`${scan.poolCount} ${scan.poolCount === 1 ? 'pool' : 'pools'}${scan.primaryDex ? ` · ${scan.primaryDex}` : ''}`}
                />
                <Stat label="Volume 24h" value={scan.volume24hUsd === null ? '—' : formatCurrency(scan.volume24hUsd, true)} />
                <Stat
                  label="Change 24h"
                  value={
                    <span className={cn((scan.priceChange24h ?? 0) >= 0 ? 'text-whalemo-green' : 'text-whalemo-red')}>
                      {scan.priceChange24h === null ? '—' : `${scan.priceChange24h >= 0 ? '+' : ''}${scan.priceChange24h.toFixed(1)}%`}
                    </span>
                  }
                />
                <Stat label="Pool age" value={formatAge(scan.ageHours)} />
              </div>
            </GlassPanel>

            <Verdict scan={scan} />

            <div className="grid gap-5 lg:grid-cols-3">
              <Security scan={scan} />
              <Activity scan={scan} />
              <SmartMoney scan={scan} />
            </div>

            <Bundle scan={scan} loading={bundleLoading} error={bundleError} onRun={() => runBundle(scan.chain, scan.address, requestId.current)} />
            <Holders scan={scan} />
            <p className="text-[11px] text-whalemo-muted">Scanned {new Date(scan.scannedAt).toLocaleString()}.</p>
          </div>
        ) : null}
      </main>
      <DashboardFooter />
    </PageLayout>
  )
}
