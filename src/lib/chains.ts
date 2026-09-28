/** Where a token or wallet on each chain can be looked at outside NodeX. */

export function tokenUrl(chain: string, contract: string): string {
  return `https://dexscreener.com/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}`
}

export function walletUrl(chain: string, address: string): string {
  return chain === 'robinhood'
    ? `https://robinhoodchain.blockscout.com/address/${encodeURIComponent(address)}`
    : `https://solscan.io/account/${encodeURIComponent(address)}`
}

export function chainLabel(chain: string): string {
  return chain === 'robinhood' ? 'Robinhood Chain' : 'Solana'
}
