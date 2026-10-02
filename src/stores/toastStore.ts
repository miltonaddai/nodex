import { create } from 'zustand'

export type ToastTone = 'info' | 'error' | 'success'

export interface Toast {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface ToastState {
  toasts: Toast[]
  dismiss: (id: number) => void
}

const DURATION_MS = 4500
let nextId = 1

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

/**
 * Shows a toast for a few seconds. A toast with the same title as one already showing replaces
 * it, so repeated clicks restart the timer instead of stacking copies.
 */
export function toast(input: { title: string; description?: string; tone?: ToastTone }) {
  const item: Toast = { id: nextId++, tone: 'info', ...input }
  useToastStore.setState((state) => ({
    toasts: [...state.toasts.filter((t) => t.title !== item.title), item].slice(-3),
  }))
  window.setTimeout(() => useToastStore.getState().dismiss(item.id), DURATION_MS)
}
