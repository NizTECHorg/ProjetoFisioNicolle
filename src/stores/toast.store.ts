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
  timers: Record<string, number>
  push: (message: string, tone?: ToastTone, options?: { action?: ToastAction }) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  timers: {},
  push: (message, tone = 'info', options) => {
    const id = crypto.randomUUID()
    const action = options?.action
    
    const timerId = window.setTimeout(() => {
      get().dismiss(id)
    }, action ? 6000 : 4200)

    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, tone, action }],
      timers: { ...state.timers, [id]: timerId }
    }))
  },
  dismiss: (id) => {
    set((state) => {
      const timerId = state.timers[id]
      if (timerId) window.clearTimeout(timerId)
      
      const newTimers = { ...state.timers }
      delete newTimers[id]
      
      return { 
        toasts: state.toasts.filter((t) => t.id !== id),
        timers: newTimers
      }
    })
  },
}))

export function toast(
  message: string,
  tone: ToastTone = 'info',
  options?: { action?: ToastAction },
) {
  useToastStore.getState().push(message, tone, options)
}
