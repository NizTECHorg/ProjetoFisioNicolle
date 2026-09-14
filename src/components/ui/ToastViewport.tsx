import { Link } from 'react-router-dom'
import { isSafeInternalPath } from '@/lib/security'
import { useToastStore } from '@/stores/toast.store'

const toneStyles = {
  success: 'border-success/30 bg-accent-soft text-forest',
  error: 'border-error/30 bg-error/10 text-error',
  info: 'border-accent/30 bg-accent-soft text-forest',
} as const

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[80] flex w-full max-w-sm flex-col gap-2 lg:bottom-4">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={[
            'pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur',
            toneStyles[item.tone],
          ].join(' ')}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm">{item.message}</p>
            {item.action && isSafeInternalPath(item.action.href) ? (
              <Link
                to={item.action.href}
                className="text-sm font-semibold text-forest"
                onClick={() => dismiss(item.id)}
              >
                {item.action.label}
              </Link>
            ) : null}
            <button
              type="button"
              className="text-xs opacity-60 hover:opacity-100"
              onClick={() => dismiss(item.id)}
            >
              Fechar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
