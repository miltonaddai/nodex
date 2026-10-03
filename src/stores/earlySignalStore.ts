import { create } from 'zustand'

const ALERTS_KEY = 'nodex_early_alerts_v1'

function loadEnabled(): boolean {
  try {
    return localStorage.getItem(ALERTS_KEY) !== 'off'
  } catch {
    return true
  }
}

interface EarlySignalState {
  /** Sound and toast alerts for new early signals. On unless turned off in this browser. */
  alertsEnabled: boolean
  setAlertsEnabled: (enabled: boolean) => void
  /** Early signals the watcher has alerted on since the tab was last looked at. */
  unseen: number
  setUnseen: (count: number) => void
}

export const useEarlySignalStore = create<EarlySignalState>((set) => ({
  alertsEnabled: loadEnabled(),
  setAlertsEnabled: (alertsEnabled) => {
    try {
      localStorage.setItem(ALERTS_KEY, alertsEnabled ? 'on' : 'off')
    } catch {
      // Storage unavailable. The setting lasts for this visit.
    }
    set({ alertsEnabled })
  },
  unseen: 0,
  setUnseen: (unseen) => set({ unseen }),
}))
