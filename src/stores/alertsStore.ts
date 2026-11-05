import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Alert } from '@/lib/custom-filters'
import { toast } from '@/stores/toastStore'

/**
 * The user's alerts: background watches on the Smart Wallets data, kept on the account. Shared by
 * the Alerts page and the alert watcher, which checks the switched-on ones while WhaleMo is open.
 */
interface AlertsState {
  list: Alert[]
  loaded: boolean
  /** The account copy could not be loaded, so alerts can't be shown or changed right now. */
  failed: boolean
  load: () => Promise<void>
  create: (alert: Omit<Alert, 'id'>) => Promise<boolean>
  update: (id: string, changes: Partial<Omit<Alert, 'id'>>) => Promise<boolean>
  remove: (id: string) => Promise<void>
  reset: () => void
}

const failure = (title: string, err: unknown) =>
  toast({ title, description: err instanceof Error ? err.message : undefined, tone: 'error' })

let loading: Promise<void> | null = null

export const useAlertsStore = create<AlertsState>((set, get) => ({
  list: [],
  loaded: false,
  failed: false,

  load: () => {
    loading ??= api.alerts
      .list()
      .then((list) => set({ list, loaded: true, failed: false }))
      .catch(() => set({ loaded: true, failed: true }))
      .finally(() => {
        loading = null
      })
    return loading
  },

  create: async (alert) => {
    try {
      const created = await api.alerts.create(alert)
      set({ list: [...get().list, created] })
      toast({ title: 'Alert created', description: `"${created.name}" is watching in the background.`, tone: 'success' })
      return true
    } catch (err) {
      failure('Could not create the alert', err)
      return false
    }
  },

  update: async (id, changes) => {
    const previous = get().list
    set({ list: previous.map((alert) => (alert.id === id ? { ...alert, ...changes } : alert)) })
    try {
      const updated = await api.alerts.update(id, changes)
      set({ list: get().list.map((alert) => (alert.id === id ? updated : alert)) })
      return true
    } catch (err) {
      set({ list: previous })
      failure('Could not update the alert', err)
      return false
    }
  },

  remove: async (id) => {
    const previous = get().list
    set({ list: previous.filter((alert) => alert.id !== id) })
    try {
      await api.alerts.remove(id)
    } catch (err) {
      set({ list: previous })
      failure('Could not delete the alert', err)
    }
  },

  reset: () => set({ list: [], loaded: false, failed: false }),
}))
