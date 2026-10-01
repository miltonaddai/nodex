import type { ScanChain, ScanResult } from '@/lib/api'

/**
 * Recent token scans, kept in this browser so a past scan opens instantly without calling the
 * API again. Each entry stores the full result, about 20-60 KB, so the list is capped to stay
 * well inside localStorage's few-megabyte limit.
 */

const STORAGE_KEY = 'nodex_scan_history_v1'
const MAX_ENTRIES = 25

export interface ScanHistoryEntry {
  chain: ScanChain
  address: string
  name: string
  symbol: string
  imageUrl: string
  verdict: ScanResult['risk']['verdict']
  riskScore: number
  /** When the result was produced, not when it was saved. */
  scannedAt: string
  result: ScanResult
}

function sameToken(entry: { chain: string; address: string }, chain: string, address: string): boolean {
  return entry.chain === chain && entry.address.toLowerCase() === address.toLowerCase()
}

export function loadScanHistory(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as ScanHistoryEntry[]) : []
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.result && entry.address) : []
  } catch {
    return []
  }
}

function save(entries: ScanHistoryEntry[]): ScanHistoryEntry[] {
  // If storage is full, drop the oldest entries until it fits.
  for (let keep = entries.length; keep >= 0; keep--) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, keep)))
      return entries.slice(0, keep)
    } catch {
      // Quota exceeded or storage blocked. Try with fewer entries.
    }
  }
  return entries
}

/** Saves a scan as the most recent entry, replacing any earlier scan of the same token. */
export function rememberScan(result: ScanResult): ScanHistoryEntry[] {
  const entry: ScanHistoryEntry = {
    chain: result.chain,
    address: result.address,
    name: result.name,
    symbol: result.symbol,
    imageUrl: result.imageUrl,
    verdict: result.risk.verdict,
    riskScore: result.risk.riskScore,
    scannedAt: result.scannedAt,
    result,
  }
  const rest = loadScanHistory().filter((e) => !sameToken(e, result.chain, result.address))
  return save([entry, ...rest].slice(0, MAX_ENTRIES))
}

export function findScan(chain: string, address: string): ScanHistoryEntry | undefined {
  return loadScanHistory().find((e) => sameToken(e, chain, address))
}

export function forgetScan(chain: string, address: string): ScanHistoryEntry[] {
  return save(loadScanHistory().filter((e) => !sameToken(e, chain, address)))
}

export function clearScanHistory(): ScanHistoryEntry[] {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable. Nothing to clear.
  }
  return []
}
