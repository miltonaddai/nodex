/** Where a token or wallet on each chain can be looked at outside NodeX. */

/** Chains NodeX covers, in selector order. */
export const CHAIN_IDS = ['solana', 'robinhood', 'bsc'] as const

export function isChainId(value: string | null | undefined): value is (typeof CHAIN_IDS)[number] {
  return (CHAIN_IDS as readonly string[]).includes(value ?? '')
}

export function tokenUrl(chain: string, contract: string): string {
  return `https://dexscreener.com/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}`
}

export function walletUrl(chain: string, address: string): string {
  if (chain === 'robinhood') return `https://robinhoodchain.blockscout.com/address/${encodeURIComponent(address)}`
  if (chain === 'bsc') return `https://bscscan.com/address/${encodeURIComponent(address)}`
  return `https://solscan.io/account/${encodeURIComponent(address)}`
}

export function chainLabel(chain: string): string {
  if (chain === 'robinhood') return 'Robinhood Chain'
  if (chain === 'bsc') return 'BNB Chain'
  return 'Solana'
}
