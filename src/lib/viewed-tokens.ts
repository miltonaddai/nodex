import { useCallback, useSyncExternalStore } from 'react'

/**
 * Tokens the user has opened on Dexscreener from a WhaleMo table, kept in this browser so tables
 * can mark rows already looked at. Capped so the list can't grow without bound.
 */

const STORAGE_KEY = 'nodex_viewed_tokens_v1'
const MAX_ENTRIES = 2000

function keyFor(chain: string, contract: string): string {
  // EVM addresses are case-insensitive; Solana mints are not, so only fold 0x addresses.
  return `${chain}:${contract.startsWith('0x') ? contract.toLowerCase() : contract}`
}

function load(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : []
  } catch {
    return []
  }
}

let viewed = new Set(load())
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Keep other open tabs in step.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    viewed = new Set(load())
    emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function getSnapshot() {
  return viewed
}

export function markTokenViewed(chain: string, contract: string) {
  const key = keyFor(chain, contract)
  if (viewed.has(key)) return
  // Newest last, so trimming drops the oldest.
  viewed = new Set([...viewed, key].slice(-MAX_ENTRIES))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...viewed]))
  } catch {
    // Storage full or blocked. The mark still holds for this session.
  }
  emit()
}

/** Returns a checker that re-renders the caller when the viewed list changes. */
export function useViewedTokens(): (chain: string, contract: string) => boolean {
  const set = useSyncExternalStore(subscribe, getSnapshot)
  return useCallback((chain: string, contract: string) => set.has(keyFor(chain, contract)), [set])
}
