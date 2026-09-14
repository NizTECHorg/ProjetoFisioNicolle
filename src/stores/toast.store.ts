import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  href: string
}

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
  action?: ToastAction
}

interface ToastState {
  toasts: ToastItem[]
  push: (message: string, tone?: ToastTone, options?: { action?: ToastAction }) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'info', options) => {
    const id = crypto.randomUUID()
    const action = options?.action
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, tone, action }],
    }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, action ? 6000 : 4200)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function toast(
  message: string,
  tone: ToastTone = 'info',
  options?: { action?: ToastAction },
) {
  useToastStore.getState().push(message, tone, options)
}
