import { create } from 'zustand'
import { api } from '@/lib/api'
import { toast } from '@/stores/toastStore'

/**
 * The user's Telegram connection for alerts. Connecting opens the bot in Telegram with a one-time
 * code; this store then waits for the user to press Start there and picks up the link.
 */
interface TelegramState {
  loaded: boolean
  /** Telegram alerts are set up on the server (bot token configured). */
  configured: boolean
  botUsername: string | null
  linked: boolean
  username: string | null
  earlySignals: boolean
  /** A link was opened and we're waiting for the user to press Start in Telegram. */
  waiting: boolean
  /** The last link, in case the browser blocked the new tab. */
  pendingUrl: string | null
  load: () => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  setEarlySignals: (on: boolean) => Promise<void>
  reset: () => void
}

const WAIT_MS = 3 * 60 * 1000
const POLL_MS = 3000
let polling: number | undefined

const initial = {
  loaded: false,
  configured: false,
  botUsername: null,
  linked: false,
  username: null,
  earlySignals: true,
  waiting: false,
  pendingUrl: null,
}

export const useTelegramStore = create<TelegramState>((set, get) => ({
  ...initial,

  load: async () => {
    try {
      const status = await api.telegram.status()
      set({ ...status, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  connect: async () => {
    // Open the tab now, while the click still counts as the user's; the link fills it in after.
    const tab = window.open('', '_blank')
    try {
      const { url } = await api.telegram.link()
      if (tab) tab.location.href = url
      set({ waiting: true, pendingUrl: url })
    } catch (err) {
      tab?.close()
      toast({ title: 'Could not connect Telegram', description: err instanceof Error ? err.message : undefined, tone: 'error' })
      return
    }

    window.clearInterval(polling)
    const startedAt = Date.now()
    polling = window.setInterval(async () => {
      if (Date.now() - startedAt > WAIT_MS) {
        window.clearInterval(polling)
        set({ waiting: false })
        return
      }
      try {
        const status = await api.telegram.status()
        if (status.linked) {
          window.clearInterval(polling)
          set({ ...status, waiting: false, pendingUrl: null })
          toast({ title: 'Telegram connected', description: 'Your alerts will arrive there after each data update.', tone: 'success' })
        }
      } catch {
        // Keep waiting.
      }
    }, POLL_MS)
  },

  disconnect: async () => {
    try {
      await api.telegram.unlink()
      set({ linked: false, username: null, waiting: false })
    } catch (err) {
      toast({ title: 'Could not disconnect Telegram', description: err instanceof Error ? err.message : undefined, tone: 'error' })
    }
  },

  setEarlySignals: async (on) => {
    const previous = get().earlySignals
    set({ earlySignals: on })
    try {
      await api.telegram.settings({ earlySignals: on })
    } catch (err) {
      set({ earlySignals: previous })
      toast({ title: 'Could not update Telegram', description: err instanceof Error ? err.message : undefined, tone: 'error' })
    }
  },

  reset: () => {
    window.clearInterval(polling)
    set(initial)
  },
}))
