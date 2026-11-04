import { createDemoSession, isDemoMode } from './demo-auth'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export type AuthSuccess = {
  token: string
  /** Absent in demo mode, whose tokens never expire. */
  refreshToken?: string
  /** Unix seconds when `token` expires. */
  expiresAt?: number | null
  user: UserProfile
}
export type AuthConfirmEmail = { needsEmailConfirmation: true; message: string }
export type AuthResponse = AuthSuccess | AuthConfirmEmail

export const TOKEN_KEY = 'nodex_token'
export const REFRESH_TOKEN_KEY = 'nodex_refresh_token'
export const TOKEN_EXPIRES_AT_KEY = 'nodex_token_expires_at'

/** An error response from the API. `status` lets callers tell a rejected session from an outage. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function storeSessionTokens(session: { token: string; refreshToken?: string; expiresAt?: number | null }) {
  localStorage.setItem(TOKEN_KEY, session.token)
  if (session.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  if (session.expiresAt) localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(session.expiresAt))
}

export function clearSessionTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
}

/** Renew a minute early so a request never goes out with a token about to lapse. */
const REFRESH_MARGIN_SECONDS = 60
let refreshing: Promise<boolean> | null = null

/**
 * Swaps the stored refresh token for a new access token. Refresh tokens are single-use, so
 * concurrent callers share one in-flight refresh rather than each spending the token.
 */
function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return Promise.resolve(false)
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) {
        // Only a definite rejection ends the session. A server error leaves it for a retry.
        if (res.status === 400 || res.status === 401) clearSessionTokens()
        return false
      }
      storeSessionTokens(await res.json())
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

function tokenNeedsRefresh(): boolean {
  const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY))
  return Boolean(expiresAt) && Date.now() / 1000 >= expiresAt - REFRESH_MARGIN_SECONDS
}

async function send(path: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  }
  try {
    return await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error(
      'Unable to reach the server. Make sure the backend is running (npm run dev in /backend).'
    )
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (tokenNeedsRefresh()) await refreshSession()

  let res = await send(path, options)
  // The token can still be rejected, e.g. after the computer slept past its expiry mid-request.
  // Renew once and retry before treating the session as over.
  if (res.status === 401 && localStorage.getItem(REFRESH_TOKEN_KEY) && (await refreshSession())) {
    res = await send(path, options)
  }

  const data = await res.json().catch(() => ({ message: res.statusText }))

  if (!res.ok) {
    throw new ApiError(data.message || 'Request failed', res.status)
  }

  return data as T
}

export interface UserSubscription {
  plan: 'starter' | 'pro'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd: string | null
}

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  defaultChain: string
  subscription: UserSubscription
}

export type CheckoutResponse =
  | { url: string; updated?: boolean; demo?: boolean; user?: UserProfile }
  | { updated: true; user: UserProfile }

export interface BillingPaymentMethod {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export interface BillingDetails {
  plan: 'starter' | 'pro'
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd: string | null
  amount: number
  interval: 'month'
  paymentMethod: BillingPaymentMethod | null
  demo?: boolean
}

function demoProfile(email: string, plan: 'starter' | 'pro' = 'starter'): UserProfile {
  return {
    id: `demo:${email}`,
    email,
    displayName: null,
    defaultChain: 'solana',
    subscription: { plan, status: 'canceled', currentPeriodEnd: null },
  }
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      try {
        return await request<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
      } catch (error) {
        if (!isDemoMode()) throw error
        const session = createDemoSession(email)
        return { token: session.token, user: demoProfile(email) }
      }
    },
    signup: async (email: string, password: string, plan?: 'starter' | 'pro'): Promise<AuthResponse> => {
      try {
        return await request<AuthResponse>('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, plan }),
        })
      } catch (error) {
        if (!isDemoMode()) throw error
        const session = createDemoSession(email)
        return { token: session.token, user: demoProfile(email, plan ?? 'starter') }
      }
    },
    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (params: { accessToken: string; refreshToken: string; password: string }) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    me: () => request<UserProfile>('/auth/me'),
    updateProfile: (updates: {
      displayName?: string | null
      defaultChain?: string
      plan?: 'starter' | 'pro'
    }) =>
      request<UserProfile>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
  },
  wallets: {
    top: (params: {
      chain?: string
      period?: string
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    } & WalletTableFilters) => {
      const q = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
      return request<PaginatedResponse<WalletRow>>(`/wallets/top?${q}`)
    },
    detail: (address: string, params: { chain?: string; period?: string }) => {
      const q = new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString()
      return request<WalletDetailResponse>(`/wallets/${encodeURIComponent(address)}?${q}`)
    },
  },
  tokens: {
    top: (params: {
      chain?: string
      period?: string
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    } & TokenTableFilters) => {
      const q = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
      return request<PaginatedTokensResponse>(`/tokens/top?${q}`)
    },
  },
  scanner: {
    scan: (chain: ScanChain, address: string) =>
      request<ScanResult>(`/scanner/${chain}/${encodeURIComponent(address)}`),
    /** Solana only. Takes up to a minute the first time a token is analyzed. */
    bundle: (chain: ScanChain, address: string) =>
      request<ScanResult>(`/scanner/${chain}/${encodeURIComponent(address)}/bundle`),
  },
  smartMoney: {
    buys: (params: {
      chain?: string
      page?: number
      pageSize?: number
      sortBy?: SmartMoneySortKey
      sortOrder?: 'asc' | 'desc'
      maxMarketCap?: number | null
      minWalletCount?: number | null
      /** 'early': only tokens meeting the early-signal preset. */
      preset?: 'early'
    }) => {
      const q = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      ).toString()
      return request<SmartMoneyBuysResponse>(`/smart-money/buys?${q}`)
    },
    wallets: (chain = 'solana') =>
      request<{ items: SmartMoneyWallet[]; lastUpdated: string | null }>(`/smart-money/wallets?chain=${chain}`),
  },
  insiders: {
    list: (params: {
      chain?: string
      page?: number
      pageSize?: number
      sortBy?: InsiderSortKey
      sortOrder?: 'asc' | 'desc'
      status?: InsiderStatus
      pattern?: InsiderPricePattern
    }) => {
      const q = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      ).toString()
      return request<PaginatedResponse<InsiderPlay>>(`/insiders?${q}`)
    },
  },
  billing: {
    subscription: () => request<BillingDetails>('/billing/subscription'),
    checkout: (plan: 'starter' | 'pro') =>
      request<CheckoutResponse>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),
    portal: () =>
      request<{ url: string }>('/billing/portal', {
        method: 'POST',
      }),
    verifySession: (sessionId: string) =>
      request<{ profile: UserProfile; demo?: boolean }>(`/billing/session/${sessionId}`),
  },
  watchlist: {
    list: (chain?: string) => {
      const q = chain ? `?chain=${chain}` : ''
      return request<WatchlistWallet[]>(`/watchlist${q}`)
    },
    add: (address: string, name: string, chain: string) =>
      request<WatchlistWallet>('/watchlist', {
        method: 'POST',
        body: JSON.stringify({ address, name, chain }),
      }),
    rename: (id: string, name: string, chain: string) =>
      request<{ id: string; name: string }>(`/watchlist/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, chain }),
      }),
    remove: (id: string, chain: string) =>
      request<{ success: boolean }>(`/watchlist/${id}?chain=${chain}`, { method: 'DELETE' }),

    tokens: {
      list: (chain?: string) => {
        const q = chain ? `?chain=${chain}` : ''
        return request<WatchlistToken[]>(`/watchlist/tokens${q}`)
      },
      add: (token: { contract: string; name: string; symbol: string; chain: string }) =>
        request<WatchlistToken>('/watchlist/tokens', {
          method: 'POST',
          body: JSON.stringify(token),
        }),
      remove: (id: string, chain: string) =>
        request<{ success: boolean }>(`/watchlist/tokens/${id}?chain=${chain}`, {
          method: 'DELETE',
        }),
    },
  },
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  lastUpdated: string | null
  nextUpdate?: string | null
  message?: string
}

export type ScanChain = 'solana' | 'robinhood' | 'bsc'
export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface ScanHolder {
  rank: number
  address: string
  amount: number
  pctOfSupply: number
  valueUsd: number
  nativeBalance: number | null
  netWorthUsd: number | null
  isPool: boolean
  label: string | null
  fomoHandle: string | null
  isInsider: boolean
}

export interface ScanBundle {
  launchBuyers: number
  insiderWallets: string[]
  insiderAcquiredPct: number
  insiderHoldingPct: number | null
  insiderStatus: string
  linkedWallets: number
  clusters: Array<{ wallets: string[]; boughtPct: number; linkKinds: string[] }>
  creationBlockSupplyPct: number
  launchScore: number
  evidence: string[]
  launchedAt: string
}

/** Everything the scanner found about one token, with a buy-or-avoid verdict. */
export interface ScanResult {
  chain: ScanChain
  address: string
  name: string
  symbol: string
  imageUrl: string
  priceUsd: number | null
  marketCapUsd: number | null
  liquidityUsd: number | null
  volume24hUsd: number | null
  priceChange24h: number | null
  ageHours: number | null
  poolCount: number
  primaryDex: string | null
  links: Array<{ label: string; url: string }>
  security: {
    mintAuthority: string | null
    freezeAuthority: string | null
    transferFeeBps: number | null
    transferFeeAuthority: string | null
    permanentDelegate: string | null
    contractVerified: boolean | null
    /** BNB Chain contract audit: the token cannot be sold. Null where not checked. */
    honeypot: boolean | null
  }
  holders: { count: number | null; top10Pct: number | null; largestHolderPct: number | null; list: ScanHolder[] }
  trading: { buys24h: number | null; sells24h: number | null; uniqueWallets24h: number | null; churn: number | null }
  smartMoney: Array<{ handle: string; displayName: string; netBuyUsd: number }>
  bundle: ScanBundle | null
  bundleAvailable: boolean
  risk: {
    verdict: 'avoid' | 'caution' | 'favorable'
    riskScore: number
    flags: Array<{ severity: RiskSeverity; title: string; detail: string }>
    positives: Array<{ title: string; detail: string }>
  }
  scannedAt: string
}

/** Added to every token row by the API: when WhaleMo first listed it and its peak multiple since. */
export interface SightingFields {
  firstSeenAt?: string | null
  firstSeenMc?: number | null
  peakMc?: number | null
  peakMultiple?: number | null
}

export type SmartMoneySortKey =
  | 'walletCount'
  | 'netBuyUsd'
  | 'marketCap'
  | 'lastBuyAt'
  | 'priceChange24h'
  | 'buyerProfit'
  | 'firstSeenAt'
  | 'peakMultiple'

/** A top FOMO trader's wallet that the smart money feed follows. */
export interface SmartMoneyWallet {
  address: string
  rank: number
  /** FOMO's 30-day PnL. Zero for traders listed from the 7-day, all-time or 24-hour boards. */
  pnl30d: number
  realizedPnl30d: number
  volume30d: number
  trades30d: number
  handle: string | null
  displayName: string | null
  avatarUrl: string | null
  followers: number
}

/** A token the tracked wallets are net buying. */
export interface SmartMoneyBuy extends SightingFields {
  /** Meets the early-signal preset: under $100K, 2+ top traders, heavy volume, traders holding. */
  earlySignal?: boolean
  rank: number
  contract: string
  symbol: string
  name: string
  imageUrl: string
  walletCount: number
  buyUsd: number
  sellUsd: number
  netBuyUsd: number
  buyCount: number
  firstBuyAt: string
  lastBuyAt: string
  price: number
  marketCap: number
  liquidity: number
  volume24h: number
  priceChange24h: number
  /** Combined 30-day realized profit of the wallets buying. */
  buyerRealizedPnl30d: number
  wallets: Array<{
    address: string
    netBuyUsd: number
    lastBuyAt: string | null
    rank: number | null
    realizedPnl30d: number | null
    handle: string | null
    displayName: string | null
    avatarUrl: string | null
  }>
}

export interface SmartMoneyBuysResponse extends PaginatedResponse<SmartMoneyBuy> {
  /** Early signals in the whole snapshot, whatever filters are applied. */
  earlySignalCount?: number
  trackedWallets: number
  windowHours: number
}

export type InsiderStatus = 'holding' | 'distributing' | 'exited' | 'unknown'
export type InsiderPricePattern = 'reclaiming' | 'retracing' | 'new_highs' | 'ranging' | 'unknown'
export type InsiderSortKey =
  | 'insiderScore'
  | 'launchScore'
  | 'insiderHolding'
  | 'insiderAcquired'
  | 'marketCap'
  | 'launchedAt'
  | 'firstSeenAt'
  | 'peakMultiple'

/** A token whose launch was bought by wallets under common control. */
export interface InsiderPlay extends SightingFields {
  rank: number
  contract: string
  name: string
  symbol: string
  imageUrl: string
  launchedAt: string
  launchBuyers: number
  creationBlockSupplyPct: number
  linkedWallets: number
  linkedSupplyPct: number
  clusters: number
  largestClusterSupplyPct: number
  insiderWallets: string[]
  /** Share of supply the insider wallets held at the end of the launch window. */
  insiderAcquiredPct: number
  /** Share of supply the same wallets hold now. */
  insiderHoldingPct: number
  insiderStatus: InsiderStatus
  launchScore: number
  insiderScore: number
  evidence: string[]
  price: number
  marketCap: number
  liquidity: number
  volume24h: number
  priceChange24h: number
  holders: number
  launchHighMc: number
  postLaunchLowMc: number
  athMc: number
  pricePattern: InsiderPricePattern
}

export interface PaginatedTokensResponse extends PaginatedResponse<TokenRow> {
  changeColumnLabel: string
}

export interface WalletRow {
  rank: number
  address: string
  balance: number
  totalProfit: number
  winRate: number
  trades: number
  volume: number
  tokensHeld: number
  lastActive: string
  smartScore?: number
  qualifiedTokens?: number
  qualifiedWins?: number
  qualifiedProfitUsd?: number
  qualifiedWinRate?: number
  youngTokenTrades?: number
  youngTokenWins?: number
  medianRoiPct?: number
  avgEntryDelayMinutes?: number
  realizedProfit?: number
  unrealizedProfit?: number
  concentrationPct?: number
  riskFlags?: string[]
}

export interface WalletTableFilters {
  minBalance?: number
  maxBalance?: number
  minTotalProfit?: number
  maxTotalProfit?: number
  minWinRate?: number
  maxWinRate?: number
  minTrades?: number
  maxTrades?: number
  minTokensHeld?: number
  maxTokensHeld?: number
  minVolume?: number
  maxVolume?: number
  minQualifiedTokens?: number
  maxQualifiedTokens?: number
  minQualifiedWins?: number
  maxQualifiedWins?: number
  minQualifiedProfit?: number
  maxQualifiedProfit?: number
  activeWithinDays?: number
}

export interface WalletPosition {
  contract: string
  name: string
  symbol: string
  launchedAt: string
  firstBuyAt: string
  lastTradeAt: string
  entryDelayMinutes: number
  buyUsd: number
  sellUsd: number
  boughtAmount: number
  soldAmount: number
  remainingAmount: number
  realizedPnl: number
  unrealizedPnl: number
  roiPct: number
  tradeCount: number
  suspiciousTradeCount: number
  currentPrice: number
  marketCap: number
  liquidity: number
  alphaScore: number
  isOpen: boolean
}

export interface WalletPeriodSummary {
  periodDays: number
  smartScore: number
  totalProfit: number
  realizedProfit: number
  unrealizedProfit: number
  winRate: number
  trades: number
}

export interface WalletDetailResponse {
  address: string
  chain: string
  period: string
  lastUpdated: string | null
  summary: Omit<WalletRow, 'rank'> & {
    rank: number | null
    dataCoverage: 'full' | 'positions_only'
  }
  periods: WalletPeriodSummary[]
  positions: WalletPosition[]
}

export interface TokenRow extends SightingFields {
  rank: number
  name: string
  symbol: string
  imageUrl?: string
  contract: string
  price: number
  marketCap: number
  changePct: number
  volume: number
  holders: number
  liquidity?: number
  launchedAt?: string
  ageDays?: number
  alphaScore?: number
  smartWalletBuyers?: number
  smartMoneyNetFlow?: number
  buyAcceleration?: number
  qualifiedWalletBuyers?: number
  freshWalletBuyers?: number
  freshWalletShare?: number
  evidenceTier?: 'verified' | 'partial' | 'unverified'
  realBuyers?: number
  independentBuyers?: number
  netInflowUsd?: number
  retentionRate?: number
  demandPersistence?: number
  sniperShare?: number
  topBuyerShare?: number
  washRatio?: number
  churn?: number
  uniqueWallet24h?: number
  buySellRatio?: number
  wealthyHolders?: number
  medianHolderWealthUsd?: number
  enrichedHolders?: number
  riskFlags?: string[]
}

export interface TokenTableFilters {
  minChurn?: number
  maxChurn?: number
  minPrice?: number
  maxPrice?: number
  minMarketCap?: number
  maxMarketCap?: number
  minChangePct?: number
  maxChangePct?: number
  minVolume?: number
  maxVolume?: number
  minLiquidity?: number
  maxLiquidity?: number
  minAgeDays?: number
  maxAgeDays?: number
  minHolders?: number
  maxHolders?: number
}

export interface WatchlistToken {
  id: string
  contract: string
  name: string
  symbol: string
  imageUrl?: string
  chain: string
  price: number
  marketCap: number
  changePct: number
  volume: number
  liquidity: number
  churn: number
  launchedAt?: string
  ageDays?: number
  /** No token_analytics row backs this token — the metrics above are placeholders. */
  analyticsUnavailable?: boolean
}

export interface WatchlistWallet {
  id: string
  name: string
  address: string
  /** USD. Null when it could not be measured. */
  balance: number | null
  pnl7d: number | null
  /** Percent. Null on Robinhood Chain, where per-wallet trade history is unavailable. */
  winRate: number | null
  lastActive: string | null
  chain: string
  /** Set when the wallet belongs to a tracked FOMO trader. */
  handle?: string | null
  displayName?: string | null
  avatarUrl?: string | null
  /** Nothing could be measured for this wallet — the metrics above are empty. */
  analyticsUnavailable?: boolean
}
