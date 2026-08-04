import { createDemoSession, isDemoMode } from './demo-auth'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export type AuthSuccess = { token: string; user: UserProfile }
export type AuthConfirmEmail = { needsEmailConfirmation: true; message: string }
export type AuthResponse = AuthSuccess | AuthConfirmEmail

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('nodex_token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error(
      'Unable to reach the server. Make sure the backend is running (npm run dev in /backend).'
    )
  }

  const data = await res.json().catch(() => ({ message: res.statusText }))

  if (!res.ok) {
    throw new Error(data.message || 'Request failed')
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
  message?: string
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

export interface TokenRow {
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
  balance: number
  pnl7d: number
  winRate: number
  lastActive: string
  chain: string
  /** No wallet_analytics row backs this wallet — the metrics above are placeholders. */
  analyticsUnavailable?: boolean
}
