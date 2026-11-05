import { create } from 'zustand'

const ALERTS_KEY = 'nodex_early_alerts_v1'
const DESKTOP_KEY = 'whalemo_desktop_notifications_v1'

function loadEnabled(): boolean {
  try {
    return localStorage.getItem(ALERTS_KEY) !== 'off'
  } catch {
    return true
  }
}

function loadDesktop(): boolean {
  try {
    return localStorage.getItem(DESKTOP_KEY) === 'on'
  } catch {
    return false
  }
}

interface EarlySignalState {
  /** Sound and toast alerts for new early signals. On unless turned off in this browser. */
  alertsEnabled: boolean
  setAlertsEnabled: (enabled: boolean) => void
  /** Early signals the watcher has alerted on since the tab was last looked at. */
  unseen: number
  setUnseen: (count: number) => void
  /** Also show system notifications for alerts while WhaleMo is in the background. Per browser. */
  desktopEnabled: boolean
  setDesktopEnabled: (enabled: boolean) => void
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
  desktopEnabled: loadDesktop(),
  setDesktopEnabled: (desktopEnabled) => {
    try {
      localStorage.setItem(DESKTOP_KEY, desktopEnabled ? 'on' : 'off')
    } catch {
      // Storage unavailable. The setting lasts for this visit.
    }
    set({ desktopEnabled })
  },
}))
